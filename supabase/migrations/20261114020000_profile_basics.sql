-- Profile basics for Cape Wine Pass
--
-- What this does, in plain English:
--   Adds the profile details the app needs: a display name, a photo, a short
--   bio, a home region, who can see your profile, and a record that you
--   confirmed you're 18 or older.
--   Creates a storage folder ("avatars") for profile photos, where each person
--   can only upload or replace their own photo.
--   Makes sure people can edit their own profile (and only their own).
--
-- Existing profiles keep their handle; the new fields start empty.
-- Safe to run more than once.

-- 1) New profile fields --------------------------------------------------------
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url   text;
alter table public.profiles add column if not exists bio          text;
alter table public.profiles add column if not exists home_region  text;
alter table public.profiles add column if not exists visibility   text not null default 'public';
alter table public.profiles add column if not exists confirmed_adult_at timestamptz;
alter table public.profiles add column if not exists created_at   timestamptz not null default now();

-- Who can see your profile:
--   public  = anyone can see your name, photo, counts and badges
--   friends = only people you've accepted as friends
--   private = only you
alter table public.profiles drop constraint if exists profiles_visibility_check;
alter table public.profiles add constraint profiles_visibility_check
  check (visibility in ('public', 'friends', 'private'));

alter table public.profiles drop constraint if exists profiles_display_name_length;
alter table public.profiles add constraint profiles_display_name_length
  check (display_name is null or char_length(display_name) between 1 and 50);

alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles add constraint profiles_bio_length
  check (bio is null or char_length(bio) <= 280);

-- 2) People can edit their own profile ---------------------------------------
-- (Added alongside any rules that already exist; nothing is removed.)
alter table public.profiles enable row level security;

drop policy if exists "People can update their own profile" on public.profiles;
create policy "People can update their own profile"
  on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "People can read their own profile" on public.profiles;
create policy "People can read their own profile"
  on public.profiles for select to authenticated
  using (user_id = auth.uid());

-- 3) Profile photos ------------------------------------------------------------
-- Photos live at avatars/<user id>/<file name>. Anyone can view them (they're
-- shown on profiles); only the owner can add, replace or delete theirs.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view profile photos"        on storage.objects;
drop policy if exists "People can upload their own photo"     on storage.objects;
drop policy if exists "People can replace their own photo"    on storage.objects;
drop policy if exists "People can delete their own photo"     on storage.objects;

create policy "Anyone can view profile photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');

create policy "People can upload their own photo"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "People can replace their own photo"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "People can delete their own photo"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
