-- Following, the activity feed and cheers for Cape Wine Pass
--
-- What this does, in plain English:
--   1. "follows": people can follow each other, like Strava.
--        - Following a PUBLIC profile happens straight away.
--        - Following a "followers only" profile sends a request that person
--          must approve.
--        - PRIVATE profiles can't be followed at all.
--   2. Check-ins become visible to others, based on the owner's setting:
--        - public          -> anyone signed in can see them
--        - followers only  -> only approved followers
--        - private         -> only you
--   3. "cheers": a one-tap "nice one!" on someone's check-in (like Strava kudos).
--   4. People can find each other by name or handle (except private profiles).
--
-- Safe to run more than once.

-- 1) Follows -------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references auth.users (id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);

create index if not exists follows_followee_idx on public.follows (followee_id, status);

-- A person's profile setting, read safely (profiles have their own rules).
-- No profile row yet counts as public, matching the default.
create or replace function public.profile_visibility(target uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select visibility from public.profiles where user_id = target), 'public');
$$;

-- Can the signed-in person see this user's activity?
create or replace function public.can_see_user(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target = auth.uid()
    or public.profile_visibility(target) = 'public'
    or (
      public.profile_visibility(target) = 'friends'
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.followee_id = target and f.status = 'accepted'
      )
    );
$$;

revoke all on function public.profile_visibility(uuid) from public;
revoke all on function public.can_see_user(uuid) from public;
grant execute on function public.profile_visibility(uuid) to authenticated;
grant execute on function public.can_see_user(uuid) to authenticated;

-- Decide the status of a new follow; nobody can approve their own request.
create or replace function public.follows_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  vis text;
begin
  if tg_op = 'INSERT' then
    vis := public.profile_visibility(new.followee_id);
    if vis = 'private' then
      raise exception 'This profile is private and can''t be followed.';
    end if;
    new.status := case when vis = 'public' then 'accepted' else 'pending' end;
    new.created_at := now();
  else
    -- Updates may only approve a request; who follows whom never changes.
    new.follower_id := old.follower_id;
    new.followee_id := old.followee_id;
    new.created_at  := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists follows_before_write on public.follows;
create trigger follows_before_write
  before insert or update on public.follows
  for each row execute function public.follows_before_write();

alter table public.follows enable row level security;

drop policy if exists "See follows you're part of"   on public.follows;
drop policy if exists "Follow someone"               on public.follows;
drop policy if exists "Approve requests to follow you" on public.follows;
drop policy if exists "Unfollow or remove a follower" on public.follows;

create policy "See follows you're part of"
  on public.follows for select to authenticated
  using (follower_id = auth.uid() or followee_id = auth.uid());

create policy "Follow someone"
  on public.follows for insert to authenticated
  with check (follower_id = auth.uid());

create policy "Approve requests to follow you"
  on public.follows for update to authenticated
  using (followee_id = auth.uid())
  with check (followee_id = auth.uid());

create policy "Unfollow or remove a follower"
  on public.follows for delete to authenticated
  using (follower_id = auth.uid() or followee_id = auth.uid());

-- 2) Who can see check-ins --------------------------------------------------------
-- (Adds to the existing "see your own" rule.)
drop policy if exists "People can see check-ins they're allowed to" on public.checkins;
create policy "People can see check-ins they're allowed to"
  on public.checkins for select to authenticated
  using (public.can_see_user(user_id));

-- 3) Finding people ----------------------------------------------------------------
drop policy if exists "Signed-in people can find non-private profiles" on public.profiles;
create policy "Signed-in people can find non-private profiles"
  on public.profiles for select to authenticated
  using (visibility <> 'private' or user_id = auth.uid());

-- 4) Cheers ------------------------------------------------------------------------
create table if not exists public.cheers (
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (checkin_id, user_id)
);

alter table public.cheers enable row level security;

drop policy if exists "See cheers on check-ins you can see" on public.cheers;
drop policy if exists "Cheer a check-in you can see"        on public.cheers;
drop policy if exists "Take back your cheer"                on public.cheers;

-- The check-in lookups below follow the check-in rules above, so you can only
-- see or cheer check-ins you're allowed to see.
create policy "See cheers on check-ins you can see"
  on public.cheers for select to authenticated
  using (exists (select 1 from public.checkins c where c.id = checkin_id));

create policy "Cheer a check-in you can see"
  on public.cheers for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.checkins c where c.id = checkin_id));

create policy "Take back your cheer"
  on public.cheers for delete to authenticated
  using (user_id = auth.uid());
