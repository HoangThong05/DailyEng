-- DailyEng — schema bước 5: nhắc học hằng ngày qua Web Push.
-- Chạy SAU schema-04-ten-tu-google.sql. File này chạy lại nhiều lần được.

-- ---------------------------------------------------------------------------
-- push_subscriptions: mỗi thiết bị đã bật nhắc là một hàng.
-- endpoint là URL do trình duyệt cấp, đã duy nhất nên dùng làm khoá luôn.
-- Có hàng = thiết bị đó đang bật nhắc; tắt nhắc là xoá hàng.
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

comment on table public.push_subscriptions is
  'Thiết bị đã đồng ý nhận thông báo nhắc học. Cron đọc bằng service role.';

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Doc subscription cua minh" on public.push_subscriptions;
create policy "Doc subscription cua minh"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Them subscription cua minh" on public.push_subscriptions;
create policy "Them subscription cua minh"
  on public.push_subscriptions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Sua subscription cua minh" on public.push_subscriptions;
create policy "Sua subscription cua minh"
  on public.push_subscriptions for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Xoa subscription cua minh" on public.push_subscriptions;
create policy "Xoa subscription cua minh"
  on public.push_subscriptions for delete
  to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.push_subscriptions to authenticated;
