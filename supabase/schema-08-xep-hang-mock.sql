-- DailyEng — schema bước 8: bảng xếp hạng XP và lưu kết quả mock test.
-- Chạy SAU schema-07-nhom-bo-tu.sql. File này chạy lại nhiều lần được.

-- ---------------------------------------------------------------------------
-- leaderboard(period, top_n): top người dùng theo XP + hàng của chính mình.
--
-- XP tính từ review_log giống lib/xp.ts: nhớ +10, quên +3 — đổi ở đây thì
-- phải đổi cả bên đó. security definer để đọc được nhật ký của mọi người
-- (RLS chỉ cho xem của mình); hàm chỉ trả tên hiển thị và điểm, không lộ
-- email hay id của người khác.
-- ---------------------------------------------------------------------------
create or replace function public.leaderboard(period text default 'week', top_n integer default 20)
returns table (
  display_name text,
  xp integer,
  rank integer,
  is_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with scored as (
    select
      r.user_id,
      (count(*) filter (where r.remembered)) * 10
        + (count(*) filter (where not r.remembered)) * 3 as xp
    from public.review_log r
    where period <> 'week'
       or r.day >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date - 6)
    group by r.user_id
  ),
  ranked as (
    select
      s.user_id,
      coalesce(nullif(trim(p.display_name), ''), 'Người học ẩn danh') as display_name,
      s.xp::integer as xp,
      rank() over (order by s.xp desc)::integer as rank
    from scored s
    left join public.profiles p on p.id = s.user_id
  )
  select
    ranked.display_name,
    ranked.xp,
    ranked.rank,
    ranked.user_id = auth.uid() as is_me
  from ranked
  where ranked.rank <= top_n or ranked.user_id = auth.uid()
  order by ranked.rank, ranked.display_name;
$$;

revoke all on function public.leaderboard(text, integer) from public;
grant execute on function public.leaderboard(text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- mock_results: mỗi lần làm mock test một dòng, để hiện lịch sử và điểm cao nhất.
-- ---------------------------------------------------------------------------
create table if not exists public.mock_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'toeic-part5',
  score smallint not null,
  total smallint not null,
  seconds integer not null,
  created_at timestamptz not null default now()
);

create index if not exists mock_results_user_idx
  on public.mock_results (user_id, created_at desc);

alter table public.mock_results enable row level security;

drop policy if exists "Doc ket qua cua minh" on public.mock_results;
create policy "Doc ket qua cua minh"
  on public.mock_results for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Ghi ket qua cua minh" on public.mock_results;
create policy "Ghi ket qua cua minh"
  on public.mock_results for insert
  to authenticated
  with check (user_id = (select auth.uid()));

grant select, insert on public.mock_results to authenticated;
