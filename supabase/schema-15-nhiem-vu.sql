-- DailyEng — schema bước 15: nhiệm vụ hằng ngày.
-- Chạy SAU schema-14-ho-so.sql. File này chạy lại nhiều lần được.

-- ---------------------------------------------------------------------------
-- review_log.source: lượt trả lời đến từ đâu, để đếm "chơi 8 câu", "chép 3 câu"…
--   hoc        học theo chặng / ôn tập
--   game       các trò chơi (quiz, ghép cặp, mưa từ, nghe gõ, nghe chọn hình)
--   chep-cau   nghe chép câu
--   shadowing  nói theo
-- ---------------------------------------------------------------------------
alter table public.review_log
  add column if not exists source text not null default 'hoc'
    check (source in ('hoc', 'game', 'chep-cau', 'shadowing'));

create index if not exists review_log_user_day_idx
  on public.review_log (user_id, day);

-- ---------------------------------------------------------------------------
-- task_completions: mỗi nhiệm vụ hoàn thành trong ngày một dòng, kèm XP thưởng.
-- Khoá chính chặn cộng trùng; chỉ ghi thêm, không sửa/xoá.
-- ---------------------------------------------------------------------------
create table if not exists public.task_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  task_key text not null,
  xp integer not null check (xp between 0 and 200),
  created_at timestamptz not null default now(),
  primary key (user_id, day, task_key)
);

alter table public.task_completions enable row level security;

drop policy if exists "task_completions: xem của mình" on public.task_completions;
create policy "task_completions: xem của mình"
  on public.task_completions for select
  using ((select auth.uid()) = user_id);

drop policy if exists "task_completions: ghi của mình" on public.task_completions;
create policy "task_completions: ghi của mình"
  on public.task_completions for insert
  with check ((select auth.uid()) = user_id);

grant select, insert on public.task_completions to authenticated;

-- ---------------------------------------------------------------------------
-- leaderboard: XP = lượt trả lời (+10/+3) + XP thưởng nhiệm vụ.
-- ---------------------------------------------------------------------------
drop function if exists public.leaderboard(text, integer);
create function public.leaderboard(period text default 'week', top_n integer default 20)
returns table (
  display_name text,
  avatar_url text,
  xp integer,
  rank integer,
  is_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with since as (
    select case
      when period = 'week' then (now() at time zone 'Asia/Ho_Chi_Minh')::date - 6
      else date '1970-01-01'
    end as day
  ),
  review_xp as (
    select
      r.user_id,
      (count(*) filter (where r.remembered)) * 10
        + (count(*) filter (where not r.remembered)) * 3 as xp
    from public.review_log r, since
    where r.day >= since.day
    group by r.user_id
  ),
  task_xp as (
    select t.user_id, sum(t.xp) as xp
    from public.task_completions t, since
    where t.day >= since.day
    group by t.user_id
  ),
  scored as (
    select
      coalesce(r.user_id, t.user_id) as user_id,
      coalesce(r.xp, 0) + coalesce(t.xp, 0) as xp
    from review_xp r
    full outer join task_xp t on t.user_id = r.user_id
  ),
  ranked as (
    select
      s.user_id,
      coalesce(nullif(trim(p.display_name), ''), 'Người học ẩn danh') as display_name,
      p.avatar_url,
      s.xp::integer as xp,
      rank() over (order by s.xp desc)::integer as rank
    from scored s
    left join public.profiles p on p.id = s.user_id
    where coalesce(p.hide_rank, false) = false
      and coalesce(p.is_admin, false) = false
  )
  select
    ranked.display_name,
    ranked.avatar_url,
    ranked.xp,
    ranked.rank,
    ranked.user_id = auth.uid() as is_me
  from ranked
  where ranked.rank <= top_n or ranked.user_id = auth.uid()
  order by ranked.rank, ranked.display_name;
$$;

revoke all on function public.leaderboard(text, integer) from public;
grant execute on function public.leaderboard(text, integer) to authenticated;
