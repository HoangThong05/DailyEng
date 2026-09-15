-- DailyEng — schema bước 12: hàm số liệu cho khu quản trị.
-- Chạy SAU schema-11-admin.sql. File này chạy lại nhiều lần được.
--
-- Mọi hàm đều security definer (đọc được auth.users, review_log của mọi
-- người) nhưng dòng đầu tiên luôn kiểm tra public.is_admin(); không phải
-- admin thì ném lỗi, không trả gì.

-- Tổng quan: người dùng, hoạt động, nội dung, góp ý.
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
    (select count(*) from auth.users)::integer,
    (select count(*) from auth.users where created_at >= now() - interval '7 days')::integer,
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

-- Người dùng đăng ký theo ngày, 30 ngày gần nhất (vẽ biểu đồ).
create or replace function public.admin_signups_daily(days integer default 30)
returns table (day date, signups integer, active integer)
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
    d::date as day,
    (select count(*) from auth.users u
       where (u.created_at at time zone 'Asia/Ho_Chi_Minh')::date = d::date)::integer,
    (select count(distinct r.user_id) from public.review_log r where r.day = d::date)::integer
  from generate_series(today - (days - 1), today, interval '1 day') as d
  order by d;
end;
$$;

-- Danh sách người dùng kèm email, XP, lần học gần nhất.
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
    coalesce(s.xp, 0),
    coalesce(p.is_admin, false),
    coalesce(p.hide_rank, false)
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join lateral (
    select
      max(r.day) as last_day,
      count(*) as reviews,
      (count(*) filter (where r.remembered)) * 10 + (count(*) filter (where not r.remembered)) * 3 as xp
    from public.review_log r
    where r.user_id = u.id
  ) s on true
  order by u.created_at desc
  limit top_n;
end;
$$;

-- Bật/tắt admin cho người khác. Không cho tự hạ chính mình để không khoá cửa.
create or replace function public.admin_set_admin(target uuid, flag boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Chi admin moi lam duoc' using errcode = '42501';
  end if;
  if target = auth.uid() and not flag then
    raise exception 'Khong the tu bo quyen admin cua chinh minh';
  end if;
  update public.profiles set is_admin = flag where id = target;
end;
$$;

-- Nội dung: từng bộ công khai kèm số từ và số người đã học.
create or replace function public.admin_decks()
returns table (
  id uuid,
  slug text,
  name text,
  category text,
  words integer,
  learners integer
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
    d.id,
    d.slug,
    d.name,
    d.category::text,
    (select count(*) from public.words w where w.deck_id = d.id)::integer,
    (select count(distinct wp.user_id)
       from public.word_progress wp
       join public.words w on w.id = wp.word_id
      where w.deck_id = d.id)::integer
  from public.decks d
  where d.owner_id is null
  order by d.category, d.position;
end;
$$;

revoke all on function public.admin_overview() from public;
revoke all on function public.admin_signups_daily(integer) from public;
revoke all on function public.admin_users(integer) from public;
revoke all on function public.admin_set_admin(uuid, boolean) from public;
revoke all on function public.admin_decks() from public;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_signups_daily(integer) to authenticated;
grant execute on function public.admin_users(integer) to authenticated;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;
grant execute on function public.admin_decks() to authenticated;
