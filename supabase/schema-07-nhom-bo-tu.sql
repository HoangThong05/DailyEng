-- DailyEng — schema bước 7: nhóm bộ từ + đếm tiến độ bằng SQL.
-- Chạy SAU schema-06-gio-nhac.sql. File này chạy lại nhiều lần được.

-- ---------------------------------------------------------------------------
-- decks.category: nhóm hiển thị ở tab Học (mỗi nhóm một hàng).
--   giao-tiep  Giao tiếp       cong-viec  Công việc & kinh doanh
--   toeic      TOEIC           cot-loi    Từ vựng cốt lõi
--   hoc-thuat  Học thuật       khac       (mặc định, bộ tự tạo)
-- ---------------------------------------------------------------------------
alter table public.decks
  add column if not exists category text not null default 'khac';

alter table public.decks drop constraint if exists decks_category_check;
alter table public.decks add constraint decks_category_check
  check (category in ('giao-tiep', 'cong-viec', 'toeic', 'cot-loi', 'hoc-thuat', 'khac'));

create index if not exists decks_category_position_idx
  on public.decks (category, position);

update public.decks set category = 'giao-tiep' where slug = 'giao-tiep-hang-ngay';
update public.decks set category = 'cong-viec' where slug = 'cong-viec-van-phong';
update public.decks set category = 'toeic'     where slug = 'toeic-co-ban';

-- ---------------------------------------------------------------------------
-- deck_summaries(today): mỗi bộ một hàng kèm tổng từ / đã học / đến hạn của
-- người đang gọi. Trước đây app tải toàn bộ bảng words rồi đếm ở JS — với
-- vài nghìn từ thì quá nặng cho mỗi lần mở tab Học.
--
-- security invoker: chạy dưới quyền người gọi nên RLS của decks / words /
-- word_progress vẫn áp dụng y như truy vấn thường.
-- ---------------------------------------------------------------------------
create or replace function public.deck_summaries(today date)
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  level text,
  category text,
  -- "position" là từ khoá SQL, phải đặt trong ngoặc kép khi khai báo cột.
  "position" smallint,
  is_own boolean,
  word_count integer,
  learned_count integer,
  due_count integer
)
language sql
security invoker
stable
set search_path = ''
as $$
  select
    d.id,
    d.slug,
    d.name,
    d.description,
    d.level,
    d.category,
    d.position,
    d.owner_id is not null as is_own,
    count(w.id)::integer as word_count,
    count(p.word_id)::integer as learned_count,
    -- Chưa có tiến độ = từ mới, luôn tính là đến hạn.
    count(w.id) filter (where p.word_id is null or p.due_on <= today)::integer as due_count
  from public.decks d
  left join public.words w on w.deck_id = d.id
  left join public.word_progress p
    on p.word_id = w.id and p.user_id = (select auth.uid())
  group by d.id
  order by d.category, d.position, d.created_at;
$$;

grant execute on function public.deck_summaries(date) to authenticated;
