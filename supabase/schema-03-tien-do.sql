-- DailyEng — schema bước 3: nhật ký học để tính chuỗi ngày và thống kê.
-- Chạy SAU schema-02-flashcard.sql. File này chạy lại nhiều lần được.

-- ---------------------------------------------------------------------------
-- review_log: mỗi lượt trả lời một dòng, chỉ ghi thêm không sửa.
--
-- Vì sao cần bảng riêng: word_progress chỉ giữ lần ôn GẦN NHẤT của mỗi từ,
-- nên không dựng lại được "hôm nào đã học" — thứ mà chuỗi ngày và biểu đồ cần.
-- ---------------------------------------------------------------------------
create table if not exists public.review_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  -- Ngày theo giờ VN, do ứng dụng truyền xuống chứ không lấy current_date của
  -- Postgres (chạy theo UTC, lệch 7 tiếng nên học lúc nửa đêm sẽ sai ngày).
  day date not null,
  remembered boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists review_log_user_day_idx
  on public.review_log (user_id, day);

alter table public.review_log enable row level security;

drop policy if exists "Doc nhat ky cua minh" on public.review_log;
create policy "Doc nhat ky cua minh"
  on public.review_log for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Ghi nhat ky cua minh" on public.review_log;
create policy "Ghi nhat ky cua minh"
  on public.review_log for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Cố tình không mở UPDATE/DELETE: nhật ký chỉ ghi thêm.

-- ---------------------------------------------------------------------------
-- study_days: gộp nhật ký theo ngày.
--
-- security_invoker = on để view chạy dưới quyền người gọi, nhờ vậy RLS của
-- review_log vẫn có hiệu lực. Thiếu cờ này là ai cũng đọc được số liệu của
-- người khác.
-- ---------------------------------------------------------------------------
drop view if exists public.study_days;
create view public.study_days
with (security_invoker = on) as
select
  user_id,
  day,
  count(*)::integer as reviews,
  count(*) filter (where remembered)::integer as correct,
  count(distinct word_id)::integer as words
from public.review_log
group by user_id, day;

grant select, insert on public.review_log to authenticated;
grant select on public.study_days to authenticated;