-- DailyEng — schema bước 10: bảng góp ý từ trang /gioi-thieu/gop-y.
-- Chạy SAU schema-09. File này chạy lại nhiều lần được.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  -- null nếu người gửi chưa đăng nhập
  user_id uuid references auth.users (id) on delete set null,
  email text,
  message text not null check (char_length(message) between 5 and 2000),
  page text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Ai cũng gửi được (kể cả chưa đăng nhập); không ai đọc qua API — tác giả
-- xem trong Supabase Dashboard.
drop policy if exists "Gui gop y" on public.feedback;
create policy "Gui gop y"
  on public.feedback for insert
  to anon, authenticated
  with check (
    user_id is null or user_id = (select auth.uid())
  );

grant insert on public.feedback to anon, authenticated;
