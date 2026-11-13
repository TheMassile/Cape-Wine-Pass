-- Admin lockdown for Cape Wine Pass
--
-- What this does, in plain English:
--   1. Creates an "admins" list. Only people on it can edit estates.
--      Nobody can add themselves to it from the website or app; it can only be
--      changed here in the Supabase SQL editor.
--   2. Resets the security rules on the "estates" table so that:
--        - anyone (signed in or not) can READ estates, as today
--        - only admins can ADD, CHANGE or DELETE estates
--
-- Safe to run more than once.
-- Supabase will warn about a "destructive operation" because old rules on the
-- estates table are dropped and replaced. That is expected.

-- 1) The admins list --------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- A signed-in person may check whether THEY are an admin, nothing more.
drop policy if exists "Admins can see their own row" on public.admins;
create policy "Admins can see their own row"
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- Helper used by the rules below.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 2) Estates security rules -------------------------------------------------
alter table public.estates enable row level security;

-- Remove every existing rule on estates, whatever it was called,
-- so an old "anyone can update" rule can't linger.
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'estates'
  loop
    execute format('drop policy %I on public.estates', p.policyname);
  end loop;
end $$;

create policy "Anyone can read estates"
  on public.estates
  for select
  to anon, authenticated
  using (true);

create policy "Admins can add estates"
  on public.estates
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can change estates"
  on public.estates
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete estates"
  on public.estates
  for delete
  to authenticated
  using (public.is_admin());

-- 3) Make yourself an admin -------------------------------------------------
-- Run this separately, replacing the email with the one you sign in to
-- Cape Wine Pass with:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
