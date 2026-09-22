-- DailyEng — schema bước 25: mùa giải tuần cho bảng xếp hạng.
-- Chạy SAU schema-24-ban-be.sql. File này chạy lại nhiều lần được.
--
-- Mỗi tuần (thứ Hai → Chủ nhật, giờ VN) là một mùa. Hết Chủ nhật, top được
-- thưởng Hạt; hạng nhất thêm danh hiệu "Quán quân tuần" (không bán ở cửa hàng).
-- Trao thưởng chạy khi có người mở app (close_last_week), chống trao trùng
-- bằng khoá ref trong sổ Hạt và khoá chính của season_awards.

-- ---------------------------------------------------------------------------
-- Vật phẩm chỉ được trao, không bán
-- ---------------------------------------------------------------------------
alter table public.shop_items
  add column if not exists purchasable boolean not null default true;

insert into public.shop_items (key, kind, name, price, limited_until, purchasable) values
  ('dh-quan-quan', 'danh-hieu', 'Quán quân tuần', 0, null, false)
on conflict (key) do update set
  kind = excluded.kind, name = excluded.name, price = excluded.price,
  limited_until = excluded.limited_until, purchasable = excluded.purchasable;

-- buy_item: chặn mua vật phẩm chỉ-trao.
create or replace function public.buy_item(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item public.shop_items%rowtype;
  balance integer;
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  if uid is null then raise exception 'Chưa đăng nhập'; end if;
  select * into item from public.shop_items where key = p_key;
  if not found then raise exception 'Không có vật phẩm này'; end if;
  if not item.purchasable then raise exception 'Vật phẩm này chỉ nhận được khi đạt thành tích'; end if;
  if item.limited_until is not null and today > item.limited_until then
    raise exception 'Vật phẩm này đã hết mùa';
  end if;

  if item.kind = 'dong-bang' then
    if public.freeze_count(uid) >= 2 then raise exception 'Bạn đã giữ tối đa 2 Đóng băng chuỗi'; end if;
  elsif exists (select 1 from public.inventory where user_id = uid and item_key = p_key) then
    raise exception 'Bạn đã có vật phẩm này rồi';
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text));
  select coalesce(sum(amount), 0) into balance from public.seed_ledger where user_id = uid;
  if balance < item.price then raise exception 'Chưa đủ Hạt (còn thiếu %)', item.price - balance; end if;

  insert into public.seed_ledger (user_id, amount, reason, ref)
  values (uid, -item.price, 'Mua ' || item.name, 'buy:' || p_key || ':' || extract(epoch from clock_timestamp())::text);

  if item.kind <> 'dong-bang' then
    insert into public.inventory (user_id, item_key) values (uid, p_key);
  end if;
end;
$$;
revoke all on function public.buy_item(text) from public;
grant execute on function public.buy_item(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Kết quả mùa đã trao thưởng
-- ---------------------------------------------------------------------------
create table if not exists public.season_awards (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  rank integer not null,
  xp integer not null,
  seeds integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.season_awards enable row level security;
drop policy if exists "season_awards: ai cũng xem" on public.season_awards;
create policy "season_awards: ai cũng xem"
  on public.season_awards for select to authenticated using (true);
grant select on public.season_awards to authenticated;

-- ---------------------------------------------------------------------------
-- week_leaderboard: xếp hạng XP trong một tuần cố định (thứ Hai → Chủ nhật).
-- Khác leaderboard(): kia là 7 ngày gần nhất trượt theo hôm nay.
-- ---------------------------------------------------------------------------
drop function if exists public.week_leaderboard(date, integer);
create function public.week_leaderboard(p_week_start date, top_n integer default 20)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  xp integer,
  rank integer,
  is_me boolean,
  badges jsonb,
  frame text,
  title text
)
language sql
security definer
set search_path = public
stable
as $$
  with bounds as (select p_week_start as d1, p_week_start + 6 as d2),
  review_xp as (
    select a.user_id, sum(a.xp) as xp
    from public.answer_xp_by_day a, bounds
    where a.day between bounds.d1 and bounds.d2
    group by a.user_id
  ),
  task_xp as (
    select t.user_id, sum(t.xp) as xp
    from public.task_completions t, bounds
    where t.day between bounds.d1 and bounds.d2
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
      coalesce(p.badges, '[]'::jsonb) as badges,
      p.frame,
      p.title
    from scored s
    join public.profiles p on p.id = s.user_id
    where coalesce(p.hide_rank, false) = false
      and coalesce(p.is_admin, false) = false
      and s.xp > 0
  )
  select
    ranked.user_id, ranked.display_name, ranked.avatar_url, ranked.xp, ranked.rank,
    ranked.user_id = auth.uid() as is_me, ranked.badges, ranked.frame, ranked.title
  from ranked
  where ranked.rank <= top_n or ranked.user_id = auth.uid()
  order by ranked.rank, ranked.display_name;
$$;
revoke all on function public.week_leaderboard(date, integer) from public;
grant execute on function public.week_leaderboard(date, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- season_prize: Hạt thưởng theo hạng. Đổi ở đây thì đổi cả lib/season.ts.
-- ---------------------------------------------------------------------------
create or replace function public.season_prize(p_rank integer)
returns integer
language sql
immutable
as $$
  select case
    when p_rank = 1 then 300
    when p_rank = 2 then 200
    when p_rank = 3 then 150
    when p_rank <= 10 then 50
    else 0
  end;
$$;

-- ---------------------------------------------------------------------------
-- close_last_week: trao thưởng cho tuần vừa kết thúc. Chạy lại vô hại.
-- Gọi khi người dùng mở app (lib/season.ts), nên không cần cron.
-- ---------------------------------------------------------------------------
create or replace function public.close_last_week()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  this_monday date := today - ((extract(isodow from today)::integer) - 1);
  last_monday date := this_monday - 7;
  awarded integer := 0;
  n integer;
begin
  if auth.uid() is null then return 0; end if;
  -- Tuần trước đã trao rồi thì thôi.
  if exists (select 1 from public.season_awards where week_start = last_monday) then
    return 0;
  end if;

  -- Khoá theo tuần để hai người mở app cùng lúc không trao hai lần.
  perform pg_advisory_xact_lock(hashtext('season:' || last_monday::text));

  insert into public.season_awards (user_id, week_start, rank, xp, seeds)
  select w.user_id, last_monday, w.rank, w.xp, public.season_prize(w.rank)
  from public.week_leaderboard(last_monday, 10) w
  where public.season_prize(w.rank) > 0
  on conflict (user_id, week_start) do nothing;
  get diagnostics n = row_count; awarded := n;

  -- Hạt thưởng vào sổ cái, ref theo tuần nên không cộng đôi.
  insert into public.seed_ledger (user_id, amount, reason, ref)
  select a.user_id, a.seeds, 'Hạng ' || a.rank || ' tuần ' || to_char(a.week_start, 'DD/MM'),
         'season:' || a.week_start::text
  from public.season_awards a
  where a.week_start = last_monday and a.seeds > 0
  on conflict (user_id, ref) do nothing;

  -- Hạng nhất nhận danh hiệu "Quán quân tuần".
  insert into public.inventory (user_id, item_key)
  select a.user_id, 'dh-quan-quan'
  from public.season_awards a
  where a.week_start = last_monday and a.rank = 1
  on conflict do nothing;

  return awarded;
end;
$$;
revoke all on function public.close_last_week() from public;
grant execute on function public.close_last_week() to authenticated;

-- ---------------------------------------------------------------------------
-- my_season_awards: thành tích mùa của người gọi (mới nhất trước).
-- ---------------------------------------------------------------------------
create or replace function public.my_season_awards(limit_n integer default 8)
returns table (week_start date, rank integer, xp integer, seeds integer)
language sql
security definer
set search_path = public
stable
as $$
  select a.week_start, a.rank, a.xp, a.seeds
  from public.season_awards a
  where a.user_id = auth.uid()
  order by a.week_start desc
  limit limit_n;
$$;
revoke all on function public.my_season_awards(integer) from public;
grant execute on function public.my_season_awards(integer) to authenticated;
