-- DailyEng — schema bước 14: hồ sơ cá nhân (ảnh đại diện, tiểu sử, ảnh bìa).
-- Chạy SAU schema-13. File này chạy lại nhiều lần được.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists bio text,
  -- Tên gradient có sẵn ("sky", "sunset"…) hoặc "url:<link ảnh đã tải lên>".
  add column if not exists cover text not null default 'sky';

alter table public.profiles
  drop constraint if exists profiles_bio_len;
alter table public.profiles
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 160);

-- ---------------------------------------------------------------------------
-- Bucket "avatars": ảnh đại diện và ảnh bìa. Đọc công khai (hiện ở bảng xếp
-- hạng), mỗi người chỉ ghi được vào thư mục mang id của mình.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar doc cong khai" on storage.objects;
create policy "Avatar doc cong khai"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Avatar ghi thu muc cua minh" on storage.objects;
create policy "Avatar ghi thu muc cua minh"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Avatar sua thu muc cua minh" on storage.objects;
create policy "Avatar sua thu muc cua minh"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Avatar xoa thu muc cua minh" on storage.objects;
create policy "Avatar xoa thu muc cua minh"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Bảng xếp hạng kèm ảnh đại diện.
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
