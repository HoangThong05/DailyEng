-- DailyEng — schema bước 4: lấy đúng tên người dùng khi đăng nhập bằng Google.
-- Chạy SAU schema.sql. File này chạy lại nhiều lần được.

-- Google trả tên trong raw_user_meta_data dưới khoá 'full_name' hoặc 'name',
-- không phải 'display_name'. Trigger cũ chỉ đọc 'display_name' nên người đăng
-- nhập bằng Google bị lấy tạm phần trước @ của email.
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
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;