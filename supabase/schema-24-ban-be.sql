-- DailyEng — schema bước 24: bạn bè.
-- Chạy SAU schema-23-cua-hang.sql. File này chạy lại nhiều lần được.
--
-- Kết bạn hai chiều có xác nhận: A gửi lời mời (pending), B đồng ý thì thành
-- accepted. Không có tìm kiếm theo tên — chỉ kết bạn từ trang cá nhân hoặc
-- link chia sẻ, nên không ai dò được danh sách người dùng.

create table if not exists public.friendships (
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (requester, addressee),
  constraint friendships_khac_nhau check (requester <> addressee)
);

create index if not exists friendships_addressee_idx on public.friendships (addressee, status);

alter table public.friendships enable row level security;

-- Chỉ hai người trong quan hệ thấy dòng này.
drop policy if exists "friendships: xem của mình" on public.friendships;
create policy "friendships: xem của mình"
  on public.friendships for select
  using ((select auth.uid()) in (requester, addressee));

-- Gửi lời mời: chỉ tự gửi dưới tên mình.
drop policy if exists "friendships: gửi lời mời" on public.friendships;
create policy "friendships: gửi lời mời"
  on public.friendships for insert
  to authenticated
  with check ((select auth.uid()) = requester and status = 'pending');

-- Đồng ý: chỉ người nhận đổi được trạng thái.
drop policy if exists "friendships: đồng ý" on public.friendships;
create policy "friendships: đồng ý"
  on public.friendships for update
  to authenticated
  using ((select auth.uid()) = addressee)
  with check ((select auth.uid()) = addressee);

-- Từ chối / huỷ lời mời / huỷ kết bạn: cả hai bên đều xoá được.
drop policy if exists "friendships: xoá" on public.friendships;
create policy "friendships: xoá"
  on public.friendships for delete
  to authenticated
  using ((select auth.uid()) in (requester, addressee));

grant select, insert, update, delete on public.friendships to authenticated;

-- ---------------------------------------------------------------------------
-- friend_list: bạn bè đã đồng ý + lời mời đang chờ (cả gửi lẫn nhận).
-- security definer để đọc được profile của bạn bè (RLS của profiles chỉ cho
-- xem hàng của chính mình).
-- ---------------------------------------------------------------------------
drop function if exists public.friend_list();
create function public.friend_list()
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  frame text,
  title text,
  badges jsonb,
  xp integer,
  streak_days integer,
  studied_today boolean,
  -- 'ban' = đã là bạn, 'den' = họ mời mình, 'di' = mình đã mời họ
  kind text,
  since timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  with me as (select auth.uid() as id),
  rel as (
    select
      case when f.requester = me.id then f.addressee else f.requester end as other,
      case
        when f.status = 'accepted' then 'ban'
        when f.addressee = me.id then 'den'
        else 'di'
      end as kind,
      f.created_at as since
    from public.friendships f, me
    where me.id in (f.requester, f.addressee)
  )
  select
    rel.other as user_id,
    coalesce(nullif(trim(p.display_name), ''), 'Người học ẩn danh') as display_name,
    p.avatar_url,
    p.frame,
    p.title,
    coalesce(p.badges, '[]'::jsonb) as badges,
    (
      coalesce((select sum(a.xp) from public.answer_xp_by_day a where a.user_id = rel.other), 0)
      + coalesce((select sum(t.xp) from public.task_completions t where t.user_id = rel.other), 0)
    )::integer as xp,
    (
      select count(*)::integer
      from (
        select distinct r.day
        from public.review_log r
        where r.user_id = rel.other
          and r.day >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date - 60)
      ) d
    ) as streak_days,
    exists (
      select 1 from public.review_log r
      where r.user_id = rel.other and r.day = (now() at time zone 'Asia/Ho_Chi_Minh')::date
    ) as studied_today,
    rel.kind,
    rel.since
  from rel
  join public.profiles p on p.id = rel.other
  order by (rel.kind <> 'den'), rel.since desc;
$$;
revoke all on function public.friend_list() from public;
grant execute on function public.friend_list() to authenticated;

-- ---------------------------------------------------------------------------
-- friend_leaderboard: xếp hạng XP trong nhóm bạn bè (kể cả mình).
-- Bỏ qua hide_rank: đã đồng ý kết bạn thì thấy nhau.
-- ---------------------------------------------------------------------------
drop function if exists public.friend_leaderboard(text);
create function public.friend_leaderboard(period text default 'week')
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
  with me as (select auth.uid() as id),
  circle as (
    select me.id as uid from me
    union
    select case when f.requester = me.id then f.addressee else f.requester end
    from public.friendships f, me
    where f.status = 'accepted' and me.id in (f.requester, f.addressee)
  ),
  since as (
    select case
      when period = 'week' then (now() at time zone 'Asia/Ho_Chi_Minh')::date - 6
      else date '1970-01-01'
    end as day
  ),
  scored as (
    select
      c.uid,
      (
        coalesce((select sum(a.xp) from public.answer_xp_by_day a, since
                  where a.user_id = c.uid and a.day >= since.day), 0)
        + coalesce((select sum(t.xp) from public.task_completions t, since
                    where t.user_id = c.uid and t.day >= since.day), 0)
      )::integer as xp
    from circle c
  )
  select
    s.uid as user_id,
    coalesce(nullif(trim(p.display_name), ''), 'Người học ẩn danh') as display_name,
    p.avatar_url,
    s.xp,
    rank() over (order by s.xp desc)::integer as rank,
    s.uid = auth.uid() as is_me,
    coalesce(p.badges, '[]'::jsonb) as badges,
    p.frame,
    p.title
  from scored s
  join public.profiles p on p.id = s.uid
  order by rank, display_name;
$$;
revoke all on function public.friend_leaderboard(text) from public;
grant execute on function public.friend_leaderboard(text) to authenticated;

-- ---------------------------------------------------------------------------
-- friend_status: quan hệ giữa mình và một người, cho nút trên trang cá nhân.
-- Trả 'khong' | 'ban' | 'den' | 'di'.
-- ---------------------------------------------------------------------------
drop function if exists public.friend_status(uuid);
create function public.friend_status(target uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select case
        when f.status = 'accepted' then 'ban'
        when f.addressee = auth.uid() then 'den'
        else 'di'
      end
      from public.friendships f
      where (f.requester = auth.uid() and f.addressee = target)
         or (f.requester = target and f.addressee = auth.uid())
      limit 1
    ),
    'khong'
  );
$$;
revoke all on function public.friend_status(uuid) from public;
grant execute on function public.friend_status(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- accept_friend: đồng ý lời mời của target (chỉ người nhận gọi được).
-- ---------------------------------------------------------------------------
create or replace function public.accept_friend(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Chưa đăng nhập'; end if;
  update public.friendships
  set status = 'accepted', responded_at = now()
  where requester = target and addressee = uid and status = 'pending';
  if not found then raise exception 'Không có lời mời nào để đồng ý'; end if;
end;
$$;
revoke all on function public.accept_friend(uuid) from public;
grant execute on function public.accept_friend(uuid) to authenticated;
