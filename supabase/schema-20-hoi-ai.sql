-- DailyEng — schema bước 20: nhật ký "Hỏi AI" để giới hạn số tin mỗi ngày.
-- Chạy SAU schema-19-xp-cham-lai.sql. File này chạy lại nhiều lần được.
--
-- Mỗi câu hỏi gửi tới AI là một dòng; app đếm số dòng trong ngày (giờ VN) để
-- chặn khi vượt hạn mức. Không lưu nội dung hội thoại — chỉ số token để theo
-- dõi chi phí.
create table if not exists public.ai_chat_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_log_user_day_idx on public.ai_chat_log (user_id, day);

alter table public.ai_chat_log enable row level security;

drop policy if exists "ai_chat_log: xem của mình" on public.ai_chat_log;
create policy "ai_chat_log: xem của mình"
  on public.ai_chat_log for select
  using ((select auth.uid()) = user_id);

drop policy if exists "ai_chat_log: ghi của mình" on public.ai_chat_log;
create policy "ai_chat_log: ghi của mình"
  on public.ai_chat_log for insert
  with check ((select auth.uid()) = user_id);

grant select, insert on public.ai_chat_log to authenticated;
