-- DailyEng — schema bước 17: huy hiệu.
-- Chạy SAU schema-16-dau-vao.sql. File này chạy lại nhiều lần được.

-- profiles.badges: mảng khoá huy hiệu đã đạt (xem lib/badges.ts). App tự tính
-- và cập nhật khi người dùng mở trang chủ / Cá nhân; lưu lại để bảng xếp hạng
-- và trang cá nhân người khác hiện được mà không cần đọc dữ liệu học của họ.
alter table public.profiles
  add column if not exists badges jsonb not null default '[]'::jsonb;

-- leaderboard: thêm cột badges.
drop function if exists public.leaderboard(text, integer);
create function public.leaderboard(period text default 'week', top_n integer default 20)
returns table (
  display_name text,
  avatar_url text,
  xp integer,
  rank integer,
  is_me boolean,
  badges jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  with since as (
    select case
      when period = 'week' then (now() at time zone 'Asia/Ho_Chi_Minh')::date - 6
      else date '1970-01-01'
    end as day
  ),
  review_xp as (
    select
      r.user_id,
      (count(*) filter (where r.remembered)) * 10
        + (count(*) filter (where not r.remembered)) * 3 as xp
    from public.review_log r, since
    where r.day >= since.day
    group by r.user_id
  ),
  task_xp as (
    select t.user_id, sum(t.xp) as xp
    from public.task_completions t, since
    where t.day >= since.day
    group by t.user_id
  ),
  scored as (
    select
      coalesce(r.user_id, t.user_id) as user_id,
      coalesce(r.xp, 0) + coalesce(t.xp, 0) as xp
    from review_xp r
    full outer join task_xp t on t.user_id = r.user_id
  ),
  ranked as (
    select
      s.user_id,
      coalesce(nullif(trim(p.display_name), ''), 'Người học ẩn danh') as display_name,
      p.avatar_url,
      s.xp::integer as xp,
      rank() over (order by s.xp desc)::integer as rank,
      coalesce(p.badges, '[]'::jsonb) as badges
    from scored s
    left join public.profiles p on p.id = s.user_id
    where coalesce(p.hide_rank, false) = false
      and coalesce(p.is_admin, false) = false
  )
  select
    ranked.display_name,
    ranked.avatar_url,
    ranked.xp,
    ranked.rank,
    ranked.user_id = auth.uid() as is_me,
    ranked.badges
  from ranked
  where ranked.rank <= top_n or ranked.user_id = auth.uid()
  order by ranked.rank, ranked.display_name;
$$;

revoke all on function public.leaderboard(text, integer) from public;
grant execute on function public.leaderboard(text, integer) to authenticated;
