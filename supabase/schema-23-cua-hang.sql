-- DailyEng — schema bước 23: Hạt 🌾 (tiền trong app), cửa hàng, kho đồ,
-- khung avatar, danh hiệu, đóng băng chuỗi.
-- Chạy SAU schema-22-chao-mung.sql. File này chạy lại nhiều lần được.
--
-- Chống gian lận: người dùng KHÔNG ghi được vào sổ Hạt hay kho đồ. Mọi cộng /
-- trừ đi qua hàm security definer: claim_seeds() tự suy Hạt từ dữ liệu học
-- (điểm danh, nhiệm vụ, mốc chuỗi, huy hiệu, mục tiêu ngày, số lượt học) — không nhận tham
-- số nên không bịa được; buy_item() lấy giá từ bảng shop_items.

-- ---------------------------------------------------------------------------
-- Bảng
-- ---------------------------------------------------------------------------
create table if not exists public.shop_items (
  key text primary key,
  kind text not null check (kind in ('khung', 'bia', 'danh-hieu', 'dong-bang')),
  name text not null,
  price integer not null check (price >= 0),
  limited_until date
);

insert into public.shop_items (key, kind, name, price, limited_until) values
  ('khung-vang', 'khung', 'Viền vàng', 800, null),
  ('khung-lua', 'khung', 'Viền lửa', 1200, null),
  ('khung-bang', 'khung', 'Viền băng', 1200, null),
  ('khung-cau-vong', 'khung', 'Cầu vồng', 2000, null),
  ('khung-tot-nghiep', 'khung', 'Tốt nghiệp', 1500, null),
  ('khung-trung-thu', 'khung', 'Trung thu', 400, date '2026-10-15'),
  ('khung-halloween', 'khung', 'Halloween', 400, date '2026-11-05'),
  ('khung-giang-sinh', 'khung', 'Giáng sinh', 400, date '2026-12-31'),
  ('khung-tet', 'khung', 'Tết', 400, date '2027-02-28'),
  ('bia-trung-thu', 'bia', 'Đêm trăng rằm', 300, date '2026-10-15'),
  ('bia-halloween', 'bia', 'Đêm Halloween', 300, date '2026-11-05'),
  ('bia-giang-sinh', 'bia', 'Giáng sinh', 300, date '2026-12-31'),
  ('bia-tet', 'bia', 'Tết', 300, date '2027-02-28'),
  ('bia-toeic-990', 'bia', 'TOEIC 990', 1200, null),
  ('bia-ha-noi', 'bia', 'Hà Nội', 900, null),
  ('bia-sai-gon', 'bia', 'Sài Gòn', 900, null),
  ('bia-vu-tru', 'bia', 'Vũ trụ', 1500, null),
  ('bia-bien', 'bia', 'Biển', 600, null),
  ('dh-cu-dem', 'danh-hieu', 'Cú đêm', 1000, null),
  ('dh-mot-tu', 'danh-hieu', 'Mọt từ', 1000, null),
  ('dh-chien-binh', 'danh-hieu', 'Chiến binh TOEIC', 1500, null),
  ('dh-vit-vang', 'danh-hieu', 'Vịt vàng', 3000, null),
  ('dong-bang', 'dong-bang', 'Đóng băng chuỗi', 300, null)
on conflict (key) do update set
  kind = excluded.kind, name = excluded.name, price = excluded.price,
  limited_until = excluded.limited_until;

alter table public.shop_items enable row level security;
drop policy if exists "shop_items: ai cũng xem" on public.shop_items;
create policy "shop_items: ai cũng xem" on public.shop_items for select to authenticated using (true);
grant select on public.shop_items to authenticated;

-- Sổ cái Hạt: mỗi lần cộng/trừ một dòng; số dư = tổng. ref duy nhất theo
-- người để cộng lặp không thành cộng đôi.
create table if not exists public.seed_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  reason text not null,
  ref text not null,
  created_at timestamptz not null default now(),
  unique (user_id, ref)
);
create index if not exists seed_ledger_user_idx on public.seed_ledger (user_id);

alter table public.seed_ledger enable row level security;
drop policy if exists "seed_ledger: xem của mình" on public.seed_ledger;
create policy "seed_ledger: xem của mình" on public.seed_ledger for select using ((select auth.uid()) = user_id);
grant select on public.seed_ledger to authenticated;

-- Kho đồ: mỗi vật phẩm một lần (đóng băng chuỗi không vào đây — đếm ở sổ cái).
create table if not exists public.inventory (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_key text not null references public.shop_items (key),
  bought_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.inventory enable row level security;
drop policy if exists "inventory: xem của mình" on public.inventory;
create policy "inventory: xem của mình" on public.inventory for select using ((select auth.uid()) = user_id);
grant select on public.inventory to authenticated;

-- Ngày được "đóng băng" cứu: tính như ngày có học khi đếm chuỗi.
create table if not exists public.streak_shields (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

alter table public.streak_shields enable row level security;
drop policy if exists "streak_shields: xem của mình" on public.streak_shields;
create policy "streak_shields: xem của mình" on public.streak_shields for select using ((select auth.uid()) = user_id);
grant select on public.streak_shields to authenticated;

-- Đang trang bị gì. Cột ghi được theo RLS của profiles, nhưng equip_item()
-- kiểm quyền sở hữu; ai sửa tay thì cũng chỉ hại chính hồ sơ mình (app chỉ vẽ
-- khung/danh hiệu có trong danh mục).
alter table public.profiles
  add column if not exists frame text,
  add column if not exists title text;

-- ---------------------------------------------------------------------------
-- Số dư
-- ---------------------------------------------------------------------------
create or replace function public.seed_balance()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(amount), 0)::integer from public.seed_ledger where user_id = auth.uid();
$$;
revoke all on function public.seed_balance() from public;
grant execute on function public.seed_balance() to authenticated;

-- ---------------------------------------------------------------------------
-- claim_seeds: suy Hạt chưa cộng từ dữ liệu học của chính người gọi.
-- Trả về số Hạt vừa cộng thêm (0 nếu không có gì mới).
-- ---------------------------------------------------------------------------
create or replace function public.claim_seeds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  added integer := 0;
  n integer;
begin
  if uid is null then return 0; end if;

  -- Điểm danh: +5, ngày thứ 7 (xp >= 50) +20
  insert into public.seed_ledger (user_id, amount, reason, ref)
  select uid, case when t.xp >= 50 then 20 else 5 end, 'Điểm danh', 'checkin:' || t.day
  from public.task_completions t
  where t.user_id = uid and t.task_key = 'diem-danh'
  on conflict (user_id, ref) do nothing;
  get diagnostics n = row_count; added := added + n;

  -- Xong đủ nhiệm vụ ngày: +10
  insert into public.seed_ledger (user_id, amount, reason, ref)
  select uid, 10, 'Xong nhiệm vụ ngày', 'tasks:' || t.day
  from public.task_completions t
  where t.user_id = uid and t.task_key = 'hoan-thanh'
  on conflict (user_id, ref) do nothing;
  get diagnostics n = row_count; added := added + n;

  -- Mốc chuỗi: chuoi-3/7/14/30/60/100
  insert into public.seed_ledger (user_id, amount, reason, ref)
  select uid,
    case substring(t.task_key from 7)::integer
      when 3 then 20 when 7 then 50 when 14 then 100
      when 30 then 200 when 60 then 400 when 100 then 700 else 0 end,
    'Mốc chuỗi ' || substring(t.task_key from 7) || ' ngày',
    t.task_key
  from public.task_completions t
  where t.user_id = uid and t.task_key like 'chuoi-%'
  on conflict (user_id, ref) do nothing;
  get diagnostics n = row_count; added := added + n;

  -- Huy hiệu: +30 mỗi cái
  insert into public.seed_ledger (user_id, amount, reason, ref)
  select uid, 30, 'Huy hiệu mới', 'badge:' || b
  from public.profiles p, jsonb_array_elements_text(coalesce(p.badges, '[]'::jsonb)) b
  where p.id = uid
  on conflict (user_id, ref) do nothing;
  get diagnostics n = row_count; added := added + n;

  -- Đạt mục tiêu từ trong ngày: +5
  insert into public.seed_ledger (user_id, amount, reason, ref)
  select uid, 5, 'Đạt mục tiêu ngày', 'goal:' || d.day
  from public.study_days d, public.profiles p
  where d.user_id = uid and p.id = uid and d.words >= p.daily_goal
  on conflict (user_id, ref) do nothing;
  get diagnostics n = row_count; added := added + n;

  -- Nhiệm vụ tuần (lib/weekly.ts): tuan-hoc-5-ngay-<thứ Hai> +50, tuan-200-luot-<thứ Hai> +30
  insert into public.seed_ledger (user_id, amount, reason, ref)
  select uid,
    case when t.task_key like 'tuan-hoc-5-ngay-%' then 50 else 30 end,
    case when t.task_key like 'tuan-hoc-5-ngay-%' then 'Nhiệm vụ tuần: học 5 ngày' else 'Nhiệm vụ tuần: 200 lượt' end,
    t.task_key
  from public.task_completions t
  where t.user_id = uid and t.task_key like 'tuan-%'
  on conflict (user_id, ref) do nothing;
  get diagnostics n = row_count; added := added + n;

  -- Khối lượng học: mỗi 20 lượt trả lời trong ngày +2, tối đa 3 lần/ngày (+6).
  -- Theo tổng lượt, không theo từng câu → bấm bừa 500 lượt vẫn chỉ +6.
  insert into public.seed_ledger (user_id, amount, reason, ref)
  select uid, 2, 'Học ' || (k * 20) || ' lượt', 'reviews:' || d.day || ':' || k
  from public.study_days d
  cross join generate_series(1, 3) as k
  where d.user_id = uid and d.reviews >= k * 20
  on conflict (user_id, ref) do nothing;
  get diagnostics n = row_count; added := added + n;

  return added;
end;
$$;
revoke all on function public.claim_seeds() from public;
grant execute on function public.claim_seeds() to authenticated;

-- ---------------------------------------------------------------------------
-- Số Đóng băng chuỗi đang có = đã mua − đã dùng
-- ---------------------------------------------------------------------------
create or replace function public.freeze_count(target uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select (
    (select count(*) from public.seed_ledger where user_id = target and ref like 'buy:dong-bang:%')
    - (select count(*) from public.streak_shields where user_id = target)
  )::integer;
$$;
revoke all on function public.freeze_count(uuid) from public;

-- ---------------------------------------------------------------------------
-- buy_item: trừ Hạt, thêm vào kho. Ném lỗi tiếng Việt khi không mua được.
-- ---------------------------------------------------------------------------
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
  if item.limited_until is not null and today > item.limited_until then
    raise exception 'Vật phẩm này đã hết mùa';
  end if;

  if item.kind = 'dong-bang' then
    if public.freeze_count(uid) >= 2 then raise exception 'Bạn đã giữ tối đa 2 Đóng băng chuỗi'; end if;
  elsif exists (select 1 from public.inventory where user_id = uid and item_key = p_key) then
    raise exception 'Bạn đã có vật phẩm này rồi';
  end if;

  -- Khoá hàng sổ cái của người này để hai lần mua đồng thời không vượt số dư.
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
-- equip_item: trang bị khung / bìa / danh hiệu đã mua; p_key null = tháo.
-- ---------------------------------------------------------------------------
create or replace function public.equip_item(p_kind text, p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Chưa đăng nhập'; end if;
  if p_key is not null and not exists (
    select 1 from public.inventory i join public.shop_items s on s.key = i.item_key
    where i.user_id = uid and i.item_key = p_key and s.kind = p_kind
  ) then
    raise exception 'Bạn chưa có vật phẩm này';
  end if;

  if p_kind = 'khung' then
    update public.profiles set frame = p_key where id = uid;
  elsif p_kind = 'danh-hieu' then
    update public.profiles set title = p_key where id = uid;
  elsif p_kind = 'bia' then
    update public.profiles set cover = coalesce(p_key, 'sky') where id = uid;
  else
    raise exception 'Loại vật phẩm không hợp lệ';
  end if;
end;
$$;
revoke all on function public.equip_item(text, text) from public;
grant execute on function public.equip_item(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- use_streak_freeze: hôm qua không học mà hôm kia có (hoặc được cứu) và còn
-- Đóng băng → ghi hôm qua vào streak_shields. Trả true nếu vừa cứu.
-- ---------------------------------------------------------------------------
create or replace function public.use_streak_freeze()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  yesterday date := (now() at time zone 'Asia/Ho_Chi_Minh')::date - 1;
  before date := (now() at time zone 'Asia/Ho_Chi_Minh')::date - 2;
begin
  if uid is null then return false; end if;
  if exists (select 1 from public.review_log where user_id = uid and day = yesterday)
     or exists (select 1 from public.streak_shields where user_id = uid and day = yesterday) then
    return false;
  end if;
  if not exists (select 1 from public.review_log where user_id = uid and day = before)
     and not exists (select 1 from public.streak_shields where user_id = uid and day = before) then
    return false; -- không có chuỗi để cứu
  end if;
  if public.freeze_count(uid) <= 0 then return false; end if;

  insert into public.streak_shields (user_id, day) values (uid, yesterday)
  on conflict do nothing;
  return true;
end;
$$;
revoke all on function public.use_streak_freeze() from public;
grant execute on function public.use_streak_freeze() to authenticated;

-- ---------------------------------------------------------------------------
-- my_freezes: số Đóng băng đang giữ của người gọi
-- ---------------------------------------------------------------------------
create or replace function public.my_freezes()
returns integer
language sql
security definer
set search_path = public
stable
as $$ select public.freeze_count(auth.uid()); $$;
revoke all on function public.my_freezes() from public;
grant execute on function public.my_freezes() to authenticated;

-- ---------------------------------------------------------------------------
-- leaderboard / public_profile: thêm frame, title (giữ nguyên phần còn lại
-- của schema-19).
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
  badges jsonb,
  frame text,
  title text
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
      coalesce(p.badges, '[]'::jsonb) as badges,
      p.frame,
      p.title
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
    ranked.badges,
    ranked.frame,
    ranked.title
  from ranked
  where ranked.rank <= top_n or ranked.user_id = auth.uid()
  order by ranked.rank, ranked.display_name;
$$;
revoke all on function public.leaderboard(text, integer) from public;
grant execute on function public.leaderboard(text, integer) to authenticated;

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
  joined_at timestamptz,
  frame text,
  title text
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
    p.created_at as joined_at,
    p.frame,
    p.title
  from public.profiles p
  where p.id = target
    and coalesce(p.hide_rank, false) = false
    and coalesce(p.is_admin, false) = false;
$$;
revoke all on function public.public_profile(uuid) from public;
grant execute on function public.public_profile(uuid) to authenticated;
