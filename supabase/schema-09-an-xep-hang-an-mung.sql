-- DailyEng — schema bước 9: ẩn khỏi bảng xếp hạng + nhớ mốc đã ăn mừng.
-- Chạy SAU schema-08-xep-hang-mock.sql. File này chạy lại nhiều lần được.

-- Ẩn khỏi bảng xếp hạng (mặc định hiện). Người ẩn vẫn có XP, chỉ không lên bảng.
alter table public.profiles
  add column if not exists hide_rank boolean not null default false;

-- Mốc đã ăn mừng, lưu server để đổi máy không ăn mừng lại:
--   celebrated_goal_on: ngày (giờ VN) gần nhất đã bung pháo "đạt mục tiêu"
--   celebrated_level : cấp cao nhất đã bung pháo "lên cấp"
alter table public.profiles
  add column if not exists celebrated_goal_on date,
  add column if not exists celebrated_level smallint not null default 0;

-- Bảng xếp hạng: bỏ người chọn ẩn. Người ẩn không thấy hàng của mình luôn
-- (trang Cá nhân báo "đang ẩn").
create or replace function public.leaderboard(period text default 'week', top_n integer default 20)
returns table (
  display_name text,
  xp integer,
  rank integer,
  is_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with scored as (
    select
      r.user_id,
      (count(*) filter (where r.remembered)) * 10
        + (count(*) filter (where not r.remembered)) * 3 as xp
    from public.review_log r
    where period <> 'week'
       or r.day >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date - 6)
    group by r.user_id
  ),
  ranked as (
    select
      s.user_id,
      coalesce(nullif(trim(p.display_name), ''), 'Người học ẩn danh') as display_name,
      s.xp::integer as xp,
      rank() over (order by s.xp desc)::integer as rank
    from scored s
    left join public.profiles p on p.id = s.user_id
    where coalesce(p.hide_rank, false) = false
  )
  select
    ranked.display_name,
    ranked.xp,
    ranked.rank,
    ranked.user_id = auth.uid() as is_me
  from ranked
  where ranked.rank <= top_n or ranked.user_id = auth.uid()
  order by ranked.rank, ranked.display_name;
$$;

revoke all on function public.leaderboard(text, integer) from public;
grant execute on function public.leaderboard(text, integer) to authenticated;
