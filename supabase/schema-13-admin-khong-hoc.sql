-- DailyEng — schema bước 13: admin không phải người học.
-- Chạy SAU schema-12-quan-tri.sql. File này chạy lại nhiều lần được.
--
-- Admin bị loại khỏi bảng xếp hạng và không tính vào số "người dùng" ở khu
-- quản trị, để số liệu phản ánh đúng người học thật.

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
      and coalesce(p.is_admin, false) = false
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

create or replace function public.admin_overview()
returns table (
  users_total integer,
  users_new_7d integer,
  users_active_7d integer,
  users_active_today integer,
  reviews_total bigint,
  reviews_7d bigint,
  mock_tests_total integer,
  feedback_pending integer,
  decks_public integer,
  words_public integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if not public.is_admin() then
    raise exception 'Chi admin moi xem duoc' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from auth.users u
       left join public.profiles p on p.id = u.id
      where coalesce(p.is_admin, false) = false)::integer,
    (select count(*) from auth.users u
       left join public.profiles p on p.id = u.id
      where coalesce(p.is_admin, false) = false
        and u.created_at >= now() - interval '7 days')::integer,
    (select count(distinct user_id) from public.review_log where day >= today - 6)::integer,
    (select count(distinct user_id) from public.review_log where day = today)::integer,
    (select count(*) from public.review_log),
    (select count(*) from public.review_log where day >= today - 6),
    (select count(*) from public.mock_results)::integer,
    (select count(*) from public.feedback where not handled)::integer,
    (select count(*) from public.decks where owner_id is null)::integer,
    (select count(*) from public.words w join public.decks d on d.id = w.deck_id where d.owner_id is null)::integer;
end;
$$;
