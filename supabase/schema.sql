-- DailyEng — schema bước 1: hồ sơ người dùng.
-- Chạy file này trong Supabase dashboard → SQL Editor → New query.
-- Bảng từ vựng / tiến độ học sẽ thêm ở bước làm tính năng flashcard.

-- ---------------------------------------------------------------------------
-- profiles: mỗi user trong auth.users có đúng một hàng ở đây
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  daily_goal smallint not null default 10 check (daily_goal between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Hồ sơ và cài đặt học tập của từng người dùng.';

-- ---------------------------------------------------------------------------
-- Row Level Security: mỗi người chỉ đọc/sửa được hồ sơ của chính mình
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Doc ho so cua chinh minh" on public.profiles;
create policy "Doc ho so cua chinh minh"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Sua ho so cua chinh minh" on public.profiles;
create policy "Sua ho so cua chinh minh"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Không mở policy INSERT: hàng profile do trigger bên dưới tạo tự động.

-- ---------------------------------------------------------------------------
-- Tự tạo profile ngay khi có user mới đăng ký
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Tự cập nhật updated_at mỗi lần sửa
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
