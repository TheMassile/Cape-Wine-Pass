-- Repeat visits ("check-ins") for Cape Wine Pass
--
-- What this does, in plain English:
--   Today the "visits" table holds ONE row per person per estate: "I've been here",
--   plus favourite wines, notes and the favourite heart. That stays exactly as it is,
--   so the website keeps working unchanged.
--
--   This adds a new "checkins" table: ONE row per trip. Going to the same estate
--   three times gives three check-ins. The app, the activity feed, streaks and
--   leaderboards will all be built on check-ins.
--
--   The two tables keep each other in step automatically:
--     - Ticking "Mark visited" on the website also records a check-in.
--     - Un-ticking it on the website removes that estate's check-ins too.
--     - A check-in from the app also ticks the estate as visited.
--   Every existing visit is copied in as a first check-in.
--
--   "verified" (checked by GPS at the estate) can only be set by the server,
--   never by a user's phone, so nobody can fake it.
--
-- Safe to run more than once.

-- 1) The table --------------------------------------------------------------
create table if not exists public.checkins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  estate_id   text not null,
  visited_at  timestamptz not null default now(),
  rating      smallint check (rating between 1 and 5),
  note        text,
  photo_url   text,
  latitude    double precision,
  longitude   double precision,
  verified    boolean not null default false,
  source      text not null default 'website' check (source in ('website', 'app', 'import')),
  created_at  timestamptz not null default now()
);

create index if not exists checkins_user_time_idx on public.checkins (user_id, visited_at desc);
create index if not exists checkins_estate_idx   on public.checkins (estate_id);

-- 2) Who can do what ----------------------------------------------------------
-- For now people only see their own check-ins. Friends' check-ins come with the
-- friends feature.
alter table public.checkins enable row level security;

drop policy if exists "People can see their own check-ins"    on public.checkins;
drop policy if exists "People can add their own check-ins"    on public.checkins;
drop policy if exists "People can change their own check-ins" on public.checkins;
drop policy if exists "People can delete their own check-ins" on public.checkins;

create policy "People can see their own check-ins"
  on public.checkins for select to authenticated
  using (user_id = auth.uid());

create policy "People can add their own check-ins"
  on public.checkins for insert to authenticated
  with check (user_id = auth.uid());

create policy "People can change their own check-ins"
  on public.checkins for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "People can delete their own check-ins"
  on public.checkins for delete to authenticated
  using (user_id = auth.uid());

-- 3) Only the server can mark a check-in as GPS-verified ----------------------
create or replace function public.protect_checkin_verified()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.verified := false;
    else
      new.verified := old.verified;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists checkins_protect_verified on public.checkins;
create trigger checkins_protect_verified
  before insert or update on public.checkins
  for each row execute function public.protect_checkin_verified();

-- 4) Keep "visits" and "checkins" in step ------------------------------------
-- Website ticks an estate -> record a check-in.
-- (pg_trigger_depth() = 1 stops this firing when the row came from a check-in.)
create or replace function public.visit_added_make_checkin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() = 1 then
    insert into public.checkins (user_id, estate_id, visited_at, source)
    values (new.user_id, new.estate_id, coalesce(new.visited_at, now()), 'website');
  end if;
  return new;
end;
$$;

drop trigger if exists visits_make_checkin on public.visits;
create trigger visits_make_checkin
  after insert on public.visits
  for each row execute function public.visit_added_make_checkin();

-- Website un-ticks an estate -> remove its check-ins.
create or replace function public.visit_removed_drop_checkins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.checkins
  where user_id = old.user_id and estate_id = old.estate_id;
  return old;
end;
$$;

drop trigger if exists visits_drop_checkins on public.visits;
create trigger visits_drop_checkins
  after delete on public.visits
  for each row execute function public.visit_removed_drop_checkins();

-- App adds a check-in -> make sure the estate is ticked as visited.
create or replace function public.checkin_added_mark_visited()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.visits (user_id, estate_id, visited_at)
  values (new.user_id, new.estate_id, new.visited_at)
  on conflict (user_id, estate_id) do nothing;
  return new;
end;
$$;

drop trigger if exists checkins_mark_visited on public.checkins;
create trigger checkins_mark_visited
  after insert on public.checkins
  for each row execute function public.checkin_added_mark_visited();

-- 5) Copy every existing visit in as a first check-in -------------------------
insert into public.checkins (user_id, estate_id, visited_at, source)
select v.user_id, v.estate_id, coalesce(v.visited_at, now()), 'import'
from public.visits v
where not exists (
  select 1 from public.checkins c
  where c.user_id = v.user_id and c.estate_id = v.estate_id
);
