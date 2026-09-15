-- DailyEng — schema bước 18: trang cá nhân công khai.
-- Chạy SAU schema-17-huy-hieu.sql. File này chạy lại nhiều lần được.

-- ---------------------------------------------------------------------------
-- leaderboard: thêm user_id để bấm vào tên xem trang cá nhân. Id là uuid ngẫu
-- nhiên, không lộ email; mọi dữ liệu khác vẫn do RLS / hàm dưới kiểm soát.
-- ---------------------------------------------------------------------------
drop function if exists public.leaderboard(text, integer);
create function public.leaderboard(period text default 'week', top_n integer default 20)
returns table (
  user_id uuid,
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
    ranked.user_id,
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

-- ---------------------------------------------------------------------------
-- public_profile(target): những gì ai cũng xem được của một người học.
-- Người ẩn khỏi bảng xếp hạng (hide_rank) hoặc admin thì không trả gì.
-- Không có email, không có nhật ký chi tiết — chỉ số tổng và huy hiệu.
-- recent_days: các ngày có học trong 400 ngày gần nhất, để app tính chuỗi.
-- ---------------------------------------------------------------------------
drop function if exists public.public_profile(uuid);
create function public.public_profile(target uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  cover text,
  bio text,
  badges jsonb,
  xp integer,
  words_seen integer,
  words_mastered integer,
  reviews integer,
  recent_days date[],
  joined_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id as user_id,
    coalesce(nullif(trim(p.display_name), ''), 'Người học ẩn danh') as display_name,
    p.avatar_url,
    p.cover,
    p.bio,
    coalesce(p.badges, '[]'::jsonb) as badges,
    (
      coalesce((select (count(*) filter (where r.remembered)) * 10
                     + (count(*) filter (where not r.remembered)) * 3
                from public.review_log r where r.user_id = p.id), 0)
      + coalesce((select sum(t.xp) from public.task_completions t where t.user_id = p.id), 0)
    )::integer as xp,
    (select count(*) from public.word_progress w where w.user_id = p.id)::integer as words_seen,
    (select count(*) from public.word_progress w where w.user_id = p.id and w.box = 5)::integer as words_mastered,
    (select count(*) from public.review_log r where r.user_id = p.id)::integer as reviews,
    (
      select coalesce(array_agg(d.day order by d.day), '{}'::date[])
      from (
        select distinct r.day
        from public.review_log r
        where r.user_id = p.id
          and r.day >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date - 400)
      ) d
    ) as recent_days,
    p.created_at as joined_at
  from public.profiles p
  where p.id = target
    and coalesce(p.hide_rank, false) = false
    and coalesce(p.is_admin, false) = false;
$$;

revoke all on function public.public_profile(uuid) from public;
grant execute on function public.public_profile(uuid) to authenticated;
