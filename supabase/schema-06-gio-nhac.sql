-- DailyEng — schema bước 6: cho người dùng chọn giờ nhắc học.
-- Chạy SAU schema-05-nhac-hoc.sql. File này chạy lại nhiều lần được.
--
-- Vercel gói Hobby chỉ cho cron chạy 1 lần/ngày, không đủ để nhắc theo giờ
-- người dùng chọn. Nên lịch chuyển sang pg_cron ngay trong Postgres: mỗi giờ
-- gọi /api/cron/nhac-hoc một lần, route tự lọc ai chọn giờ đó.
--
-- TRƯỚC KHI CHẠY FILE NÀY, chạy riêng 2 lệnh sau (điền giá trị thật, KHÔNG
-- lưu vào git):
--
--   select vault.create_secret('https://daily-eng-omega.vercel.app', 'dailyeng_site_url');
--   select vault.create_secret('<CRON_SECRET trong .env.local>',     'dailyeng_cron_secret');
--
-- Đổi giá trị sau này: select vault.update_secret(id, '<mới>') from vault.secrets where name = '...';

-- ---------------------------------------------------------------------------
-- profiles.reminder_hour: giờ nhắc theo giờ VN (0–23). Giao diện chỉ đưa ra
-- vài mốc, nhưng cột nhận mọi giờ để sau mở rộng không phải đổi schema.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists reminder_hour smallint not null default 20;

alter table public.profiles
  drop constraint if exists profiles_reminder_hour_check;
alter table public.profiles
  add constraint profiles_reminder_hour_check
  check (reminder_hour between 0 and 23);

comment on column public.profiles.reminder_hour is 'Giờ nhắc học theo giờ Việt Nam.';

-- ---------------------------------------------------------------------------
-- pg_cron + pg_net: lịch chạy trong Postgres, gọi HTTP ra ngoài.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Gỡ job cũ (nếu có) rồi tạo lại, để file chạy lại không nhân đôi job.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'dailyeng-nhac-hoc') then
    perform cron.unschedule('dailyeng-nhac-hoc');
  end if;
end
$$;

-- Mỗi giờ đúng phút 0 (pg_cron chạy theo UTC; phút 0 UTC cũng là phút 0 VN).
select cron.schedule(
  'dailyeng-nhac-hoc',
  '0 * * * *',
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'dailyeng_site_url')
           || '/api/cron/nhac-hoc',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'dailyeng_cron_secret')
    ),
    timeout_milliseconds := 30000
  );
  $$
);

-- Xem job đã chạy chưa: select * from cron.job_run_details order by start_time desc limit 10;
-- Xem phản hồi HTTP:    select * from net._http_response order by created desc limit 10;
