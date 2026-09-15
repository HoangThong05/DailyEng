-- DailyEng — schema bước 11: tài khoản quản trị và trang xem góp ý.
-- Chạy SAU schema-10-gop-y.sql. File này chạy lại nhiều lần được.

-- Cờ admin trên profile. Chỉ đặt bằng SQL, app không có nút bật.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Hàm kiểm tra admin, security definer để dùng được trong policy của bảng
-- khác mà không vướng RLS của profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Góp ý: thêm trạng thái đã xử lý; admin đọc và cập nhật được.
alter table public.feedback
  add column if not exists handled boolean not null default false;

drop policy if exists "Admin doc gop y" on public.feedback;
create policy "Admin doc gop y"
  on public.feedback for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admin sua gop y" on public.feedback;
create policy "Admin sua gop y"
  on public.feedback for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update on public.feedback to authenticated;

-- Gán admin: KHÔNG để email trong repo (repo public). Chạy tay một lần trong
-- SQL Editor, thay <email> bằng tài khoản đã đăng nhập app ít nhất một lần:
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = '<email>');
