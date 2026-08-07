-- DailyEng — schema bước 2: bộ thẻ, từ vựng, tiến độ ôn tập Leitner.
-- Chạy SAU schema.sql, trong Supabase dashboard → SQL Editor → New query.
-- File này chạy lại nhiều lần được (idempotent), không sinh dữ liệu trùng.

-- ---------------------------------------------------------------------------
-- decks: bộ thẻ.
--   owner_id IS NULL  → bộ công khai, ai cũng học được
--   owner_id = user   → bộ riêng của người đó
-- ---------------------------------------------------------------------------
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  slug text unique,
  name text not null check (length(trim(name)) > 0),
  description text,
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

comment on column public.decks.owner_id is 'NULL nghĩa là bộ công khai do hệ thống nạp.';
comment on column public.decks.slug is 'Chỉ bộ công khai mới đặt slug, dùng để seed idempotent.';

create index if not exists decks_owner_id_idx on public.decks (owner_id);

-- ---------------------------------------------------------------------------
-- words: từ trong bộ thẻ
-- ---------------------------------------------------------------------------
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  term text not null check (length(trim(term)) > 0),
  phonetic text,
  meaning_vi text not null check (length(trim(meaning_vi)) > 0),
  example_en text,
  example_vi text,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  -- Cùng một bộ không cho lặp từ; cũng là chốt để seed chạy lại không nhân đôi.
  unique (deck_id, term)
);

create index if not exists words_deck_id_idx on public.words (deck_id);

-- ---------------------------------------------------------------------------
-- word_progress: tiến độ theo hệ Leitner 5 hộp.
--   box 1..5, trả lời đúng thì lên hộp, sai thì rơi về hộp 1.
--   due_on quyết định hôm nay từ đó có xuất hiện hay không.
-- ---------------------------------------------------------------------------
create table if not exists public.word_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  box smallint not null default 1 check (box between 1 and 5),
  due_on date not null default current_date,
  review_count integer not null default 0,
  correct_count integer not null default 0,
  last_reviewed_at timestamptz,
  primary key (user_id, word_id)
);

-- Truy vấn nóng nhất: "từ nào của tôi đến hạn hôm nay".
create index if not exists word_progress_due_idx
  on public.word_progress (user_id, due_on);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.decks enable row level security;
alter table public.words enable row level security;
alter table public.word_progress enable row level security;

-- decks: đọc được bộ công khai và bộ của mình; chỉ sửa được bộ của mình.
drop policy if exists "Doc bo cong khai va bo cua minh" on public.decks;
create policy "Doc bo cong khai va bo cua minh"
  on public.decks for select
  to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));

drop policy if exists "Tao bo cua minh" on public.decks;
create policy "Tao bo cua minh"
  on public.decks for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Sua bo cua minh" on public.decks;
create policy "Sua bo cua minh"
  on public.decks for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Xoa bo cua minh" on public.decks;
create policy "Xoa bo cua minh"
  on public.decks for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- words: quyền theo đúng quyền của bộ chứa nó.
drop policy if exists "Doc tu trong bo nhin thay duoc" on public.words;
create policy "Doc tu trong bo nhin thay duoc"
  on public.words for select
  to authenticated
  using (
    exists (
      select 1 from public.decks d
      where d.id = words.deck_id
        and (d.owner_id is null or d.owner_id = (select auth.uid()))
    )
  );

drop policy if exists "Them tu vao bo cua minh" on public.words;
create policy "Them tu vao bo cua minh"
  on public.words for insert
  to authenticated
  with check (
    exists (
      select 1 from public.decks d
      where d.id = words.deck_id and d.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Sua tu trong bo cua minh" on public.words;
create policy "Sua tu trong bo cua minh"
  on public.words for update
  to authenticated
  using (
    exists (
      select 1 from public.decks d
      where d.id = words.deck_id and d.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.decks d
      where d.id = words.deck_id and d.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Xoa tu trong bo cua minh" on public.words;
create policy "Xoa tu trong bo cua minh"
  on public.words for delete
  to authenticated
  using (
    exists (
      select 1 from public.decks d
      where d.id = words.deck_id and d.owner_id = (select auth.uid())
    )
  );

-- word_progress: hoàn toàn riêng tư.
drop policy if exists "Doc tien do cua minh" on public.word_progress;
create policy "Doc tien do cua minh"
  on public.word_progress for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Ghi tien do cua minh" on public.word_progress;
create policy "Ghi tien do cua minh"
  on public.word_progress for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Cap nhat tien do cua minh" on public.word_progress;
create policy "Cap nhat tien do cua minh"
  on public.word_progress for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Seed: 3 bộ công khai
-- ---------------------------------------------------------------------------
insert into public.decks (slug, name, description, level, position) values
  ('giao-tiep-hang-ngay', 'Giao tiếp hằng ngày', 'Từ dùng nhiều nhất khi nói chuyện thường ngày', 'beginner', 1),
  ('cong-viec-van-phong', 'Công việc & văn phòng', 'Từ vựng nơi làm việc', 'intermediate', 2),
  ('toeic-co-ban', 'TOEIC cơ bản', 'Từ hay gặp trong phần đọc TOEIC', 'intermediate', 3)
on conflict (slug) do nothing;

insert into public.words (deck_id, term, phonetic, meaning_vi, example_en, example_vi, position)
select d.id, w.term, w.phonetic, w.meaning_vi, w.example_en, w.example_vi, w.position
from public.decks d
join (values
  ('greet',     '/ɡriːt/',       'chào hỏi',        'She greeted me with a smile.',            'Cô ấy chào tôi bằng một nụ cười.',        1),
  ('borrow',    '/ˈbɒrəʊ/',      'mượn',            'Can I borrow your pen?',                  'Tôi mượn bút của bạn được không?',       2),
  ('neighbour', '/ˈneɪbər/',     'hàng xóm',        'My neighbour has a big dog.',             'Hàng xóm của tôi có một con chó to.',    3),
  ('weather',   '/ˈweðər/',      'thời tiết',       'The weather is nice today.',              'Hôm nay thời tiết đẹp.',                 4),
  ('crowded',   '/ˈkraʊdɪd/',    'đông đúc',        'The bus was very crowded.',               'Xe buýt rất đông.',                      5),
  ('hurry',     '/ˈhʌri/',       'vội, gấp',        'We need to hurry or we will be late.',    'Ta phải nhanh lên không thì trễ.',       6),
  ('afford',    '/əˈfɔːd/',      'đủ tiền mua',     'I cannot afford a new laptop.',           'Tôi không đủ tiền mua laptop mới.',      7),
  ('polite',    '/pəˈlaɪt/',     'lịch sự',         'He is always polite to customers.',       'Anh ấy luôn lịch sự với khách.',         8),
  ('suggest',   '/səˈdʒest/',    'gợi ý, đề nghị',  'Can you suggest a good restaurant?',      'Bạn gợi ý giúp một quán ăn ngon nhé?',   9),
  ('tired',     '/ˈtaɪəd/',      'mệt',             'I feel tired after work.',                'Tôi thấy mệt sau giờ làm.',              10),
  ('favourite', '/ˈfeɪvərɪt/',   'yêu thích nhất',  'Green is my favourite colour.',           'Xanh lá là màu tôi thích nhất.',         11),
  ('remember',  '/rɪˈmembər/',   'nhớ',             'Remember to lock the door.',              'Nhớ khoá cửa nhé.',                      12)
) as w(term, phonetic, meaning_vi, example_en, example_vi, position) on true
where d.slug = 'giao-tiep-hang-ngay'
on conflict (deck_id, term) do nothing;

insert into public.words (deck_id, term, phonetic, meaning_vi, example_en, example_vi, position)
select d.id, w.term, w.phonetic, w.meaning_vi, w.example_en, w.example_vi, w.position
from public.decks d
join (values
  ('deadline',  '/ˈdedlaɪn/',    'hạn chót',           'The deadline is next Friday.',            'Hạn chót là thứ Sáu tuần sau.',          1),
  ('schedule',  '/ˈʃedjuːl/',    'lịch trình',         'Please check the schedule.',              'Xem giúp lịch trình nhé.',               2),
  ('colleague', '/ˈkɒliːɡ/',     'đồng nghiệp',        'My colleague helped me a lot.',           'Đồng nghiệp giúp tôi rất nhiều.',        3),
  ('deliver',   '/dɪˈlɪvər/',    'giao, bàn giao',     'We delivered the report on time.',        'Chúng tôi nộp báo cáo đúng hạn.',        4),
  ('negotiate', '/nəˈɡəʊʃieɪt/', 'đàm phán',           'They negotiated a better price.',         'Họ đàm phán được giá tốt hơn.',          5),
  ('approve',   '/əˈpruːv/',     'phê duyệt',          'The manager approved my request.',        'Quản lý đã duyệt đề nghị của tôi.',      6),
  ('budget',    '/ˈbʌdʒɪt/',     'ngân sách',          'The project is over budget.',             'Dự án vượt ngân sách.',                  7),
  ('promote',   '/prəˈməʊt/',    'thăng chức',         'She was promoted last month.',            'Cô ấy được thăng chức tháng trước.',     8),
  ('resign',    '/rɪˈzaɪn/',     'từ chức, nghỉ việc', 'He resigned after five years.',           'Anh ấy nghỉ việc sau năm năm.',          9),
  ('overtime',  '/ˈəʊvətaɪm/',   'làm thêm giờ',       'We worked overtime all week.',            'Cả tuần chúng tôi làm thêm giờ.',        10),
  ('feedback',  '/ˈfiːdbæk/',    'phản hồi, góp ý',    'Thanks for your feedback.',               'Cảm ơn góp ý của bạn.',                  11),
  ('urgent',    '/ˈɜːdʒənt/',    'khẩn cấp',           'This is an urgent matter.',               'Đây là việc khẩn.',                      12)
) as w(term, phonetic, meaning_vi, example_en, example_vi, position) on true
where d.slug = 'cong-viec-van-phong'
on conflict (deck_id, term) do nothing;

insert into public.words (deck_id, term, phonetic, meaning_vi, example_en, example_vi, position)
select d.id, w.term, w.phonetic, w.meaning_vi, w.example_en, w.example_vi, w.position
from public.decks d
join (values
  ('invoice',   '/ˈɪnvɔɪs/',     'hoá đơn',        'Please send the invoice by email.',       'Gửi hoá đơn qua email giúp tôi.',        1),
  ('warehouse', '/ˈweəhaʊs/',    'nhà kho',        'The goods are in the warehouse.',         'Hàng đang ở trong kho.',                 2),
  ('shipment',  '/ˈʃɪpmənt/',    'lô hàng',        'The shipment arrives on Monday.',         'Lô hàng tới vào thứ Hai.',               3),
  ('refund',    '/ˈriːfʌnd/',    'hoàn tiền',      'You can ask for a refund.',               'Bạn có thể yêu cầu hoàn tiền.',          4),
  ('warranty',  '/ˈwɒrənti/',    'bảo hành',       'The warranty lasts two years.',           'Bảo hành kéo dài hai năm.',              5),
  ('purchase',  '/ˈpɜːtʃəs/',    'mua, sự mua',    'Keep the receipt for your purchase.',     'Giữ biên lai cho món bạn mua.',          6),
  ('supplier',  '/səˈplaɪər/',   'nhà cung cấp',   'We changed our supplier last year.',      'Năm ngoái chúng tôi đổi nhà cung cấp.',  7),
  ('inventory', '/ˈɪnvəntri/',   'hàng tồn kho',   'They check inventory every month.',       'Họ kiểm kho hằng tháng.',                8),
  ('receipt',   '/rɪˈsiːt/',     'biên lai',       'I lost the receipt.',                     'Tôi làm mất biên lai.',                  9),
  ('discount',  '/ˈdɪskaʊnt/',   'giảm giá',       'Members get a ten percent discount.',     'Thành viên được giảm mười phần trăm.',   10),
  ('contract',  '/ˈkɒntrækt/',   'hợp đồng',       'Read the contract before you sign.',      'Đọc hợp đồng trước khi ký.',             11),
  ('estimate',  '/ˈestɪmət/',    'ước tính',       'Can you give me an estimate?',            'Bạn ước tính giúp tôi được không?',      12)
) as w(term, phonetic, meaning_vi, example_en, example_vi, position) on true
where d.slug = 'toeic-co-ban'
on conflict (deck_id, term) do nothing;