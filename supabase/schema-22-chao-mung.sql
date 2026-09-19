-- DailyEng — schema bước 22: màn chào mừng cho người mới.
-- Chạy SAU schema-21-xoa-tai-khoan.sql. File này chạy lại nhiều lần được.
--
-- profiles.onboarded_at: null = chưa qua màn chào mừng (/chao-mung) → app đưa
-- tới đó ngay sau khi đăng nhập. Tài khoản có sẵn coi như đã qua, để không
-- bắt người đang dùng làm lại.
alter table public.profiles
  add column if not exists onboarded_at timestamptz;

update public.profiles
set onboarded_at = created_at
where onboarded_at is null;
