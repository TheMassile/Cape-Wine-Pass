-- Sponsored "featured" slots for Cape Wine Pass
--
-- What this does, in plain English:
--   Adds a "featured" list for paid spots wine farms can book:
--     - farm_of_week   "Wine farm of the week", shown on the website home page
--                      and at the top of the app's Explore tab
--     - red_of_region  "Red of the region", shown alongside it, and on that
--                      region's page in the app
--   Each spot has a start and end date. Everyone sees only the spots running
--   today; only admins can add, change or remove spots (from /admin/featured).
--
-- Safe to run more than once.

create table if not exists public.featured (
  id         uuid primary key default gen_random_uuid(),
  slot       text not null check (slot in ('farm_of_week', 'red_of_region')),
  estate_id  text not null,
  region     text,
  wine_name  text,                 -- e.g. "2021 Cabernet Sauvignon" (mainly for Red of the region)
  blurb      text check (blurb is null or char_length(blurb) <= 280),
  link_url   text,                 -- optional: the farm's booking or shop page
  starts_on  date not null,
  ends_on    date not null,
  created_at timestamptz not null default now(),
  constraint featured_dates check (ends_on >= starts_on)
);

create index if not exists featured_dates_idx on public.featured (starts_on, ends_on);

alter table public.featured enable row level security;

drop policy if exists "Anyone sees spots running today" on public.featured;
drop policy if exists "Admins add spots"                on public.featured;
drop policy if exists "Admins change spots"             on public.featured;
drop policy if exists "Admins remove spots"             on public.featured;

-- South African dates, so a spot starts and ends at local midnight.
create policy "Anyone sees spots running today"
  on public.featured for select to anon, authenticated
  using (
    public.is_admin()
    or (now() at time zone 'Africa/Johannesburg')::date between starts_on and ends_on
  );

create policy "Admins add spots"
  on public.featured for insert to authenticated
  with check (public.is_admin());

create policy "Admins change spots"
  on public.featured for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins remove spots"
  on public.featured for delete to authenticated
  using (public.is_admin());
