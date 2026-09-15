-- DailyEng — schema bước 16: kết quả kiểm tra đầu vào.
-- Chạy SAU schema-15-nhiem-vu.sql. File này chạy lại nhiều lần được.

-- profiles.placement: { level, goal, score, byLevel, takenAt } — xem lib/placement.ts.
-- Lưu trong hồ sơ (một người một kết quả mới nhất) để trang Học gợi ý bộ phù hợp.
alter table public.profiles
  add column if not exists placement jsonb;
