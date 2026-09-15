-- DailyEng — schema bước 19: XP chậm lại, chống lạm phát cấp độ.
-- Chạy SAU schema-18-ho-so-cong-khai.sql. File này chạy lại nhiều lần được.
--
-- Công thức mới (giống lib/xp.ts — đổi một bên phải đổi bên kia):
--   mỗi lượt: nhớ +5, quên +1
--   trần 300 XP/ngày cho phần trả lời (tính theo từng ngày, từng người)
--   XP thưởng (task_completions) không áp trần
-- Cấp độ tính ở app: xpToReach(L) = 100·(L−1)·L.

-- ---------------------------------------------------------------------------
-- answer_xp_by_day: XP trả lời của mỗi (người, ngày) đã áp trần. Dùng chung.
-- security invoker: mỗi người chỉ thấy hàng của mình theo RLS của review_log;
-- các hàm security definer bên dưới thấy tất cả.
-- ---------------------------------------------------------------------------
drop view if exists public.answer_xp_by_day;
create view public.answer_xp_by_day
with (security_invoker = on) as
select
  user_id,
  day,
  least(
    300,
    (count(*) filter (where remembered)) * 5
      + (count(*) filter (where not remembered)) * 1
  )::integer as xp
from public.review_log
group by user_id, day;

grant select on public.answer_xp_by_day to authenticated;

-- ---------------------------------------------------------------------------
-- leaderboard
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
    select a.user_id, sum(a.xp) as xp
    from public.answer_xp_by_day a, since
    where a.day >= since.day
    group by a.user_id
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
-- public_profile
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
      coalesce((select sum(a.xp) from public.answer_xp_by_day a where a.user_id = p.id), 0)
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

-- ---------------------------------------------------------------------------
-- admin_users: cột xp cũng theo công thức mới (trả lời áp trần + thưởng).
-- ---------------------------------------------------------------------------
create or replace function public.admin_users(top_n integer default 100)
returns table (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  last_day date,
  reviews bigint,
  xp bigint,
  is_admin boolean,
  hide_rank boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Chi admin moi xem duoc' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    p.display_name,
    u.created_at,
    s.last_day,
    coalesce(s.reviews, 0),
    coalesce(a.xp, 0) + coalesce(t.xp, 0),
    coalesce(p.is_admin, false),
    coalesce(p.hide_rank, false)
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join lateral (
    select max(r.day) as last_day, count(*) as reviews
    from public.review_log r
    where r.user_id = u.id
  ) s on true
  left join lateral (
    select sum(x.xp)::bigint as xp
    from public.answer_xp_by_day x
    where x.user_id = u.id
  ) a on true
  left join lateral (
    select sum(tc.xp)::bigint as xp
    from public.task_completions tc
    where tc.user_id = u.id
  ) t on true
  order by u.created_at desc
  limit top_n;
end;
$$;
