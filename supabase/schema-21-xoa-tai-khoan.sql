-- DailyEng — schema bước 21: người dùng tự xóa tài khoản.
-- Chạy SAU schema-20-hoi-ai.sql. File này chạy lại nhiều lần được.
--
-- Anon key không xóa được dòng trong auth.users, nên cần hàm security
-- definer chạy với quyền chủ sở hữu. Mọi bảng dữ liệu học đều khai báo
-- `on delete cascade` tới auth.users, nên xóa một dòng là sạch toàn bộ
-- (profiles, review_state, review_log, decks riêng, push, nhiệm vụ, AI log...).
-- Ảnh trong bucket "avatars" do app xóa bằng Storage API trước khi gọi hàm.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Chưa đăng nhập';
  end if;
  -- Admin không tự xóa qua app, tránh xóa nhầm tài khoản quản trị.
  if exists (select 1 from public.profiles where id = uid and is_admin) then
    raise exception 'Tài khoản quản trị không tự xóa được';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
