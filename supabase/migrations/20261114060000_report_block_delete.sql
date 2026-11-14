-- Report, block and delete account for Cape Wine Pass
-- (Apple and Google require all three for apps where people see each other's posts.)
--
-- What this does, in plain English:
--   1. Reports: anyone can report a person or a check-in. Only admins can read
--      reports (in Supabase: Table Editor -> reports).
--   2. Blocks: blocking someone removes any follow between you, stops them
--      following you again, and hides each of you from the other (profile,
--      check-ins and search).
--   3. Delete account: people can delete their own account from the app. This
--      removes their login, profile, visits, check-ins, follows and cheers.
--
-- Run AFTER follows_feed_cheers.sql. Safe to run more than once.

-- 1) Reports ---------------------------------------------------------------------
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reported_user_id uuid references auth.users (id) on delete cascade,
  checkin_id       uuid references public.checkins (id) on delete set null,
  reason           text not null check (char_length(reason) between 1 and 500),
  created_at       timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "Anyone signed in can report" on public.reports;
drop policy if exists "Admins read reports"         on public.reports;
drop policy if exists "Admins clear reports"        on public.reports;

create policy "Anyone signed in can report"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

create policy "Admins read reports"
  on public.reports for select to authenticated
  using (public.is_admin());

create policy "Admins clear reports"
  on public.reports for delete to authenticated
  using (public.is_admin());

-- 2) Blocks ----------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "See your own blocks" on public.blocks;
drop policy if exists "Block someone"       on public.blocks;
drop policy if exists "Unblock someone"     on public.blocks;

create policy "See your own blocks"
  on public.blocks for select to authenticated
  using (blocker_id = auth.uid());

create policy "Block someone"
  on public.blocks for insert to authenticated
  with check (blocker_id = auth.uid());

create policy "Unblock someone"
  on public.blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- Is there a block either way between the signed-in person and this user?
create or replace function public.is_blocked_with(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = target)
       or (blocker_id = target and blocked_id = auth.uid())
  );
$$;

revoke all on function public.is_blocked_with(uuid) from public;
grant execute on function public.is_blocked_with(uuid) to authenticated;

-- Blocking removes follows both ways.
create or replace function public.blocks_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and followee_id = new.blocked_id)
     or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  return new;
end;
$$;

drop trigger if exists blocks_after_insert on public.blocks;
create trigger blocks_after_insert
  after insert on public.blocks
  for each row execute function public.blocks_after_insert();

-- Can't follow across a block (adds to the rules from follows_feed_cheers.sql).
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
    if exists (
      select 1 from public.blocks
      where (blocker_id = new.follower_id and blocked_id = new.followee_id)
         or (blocker_id = new.followee_id and blocked_id = new.follower_id)
    ) then
      raise exception 'You can''t follow this person.';
    end if;
    vis := public.profile_visibility(new.followee_id);
    if vis = 'private' then
      raise exception 'This profile is private and can''t be followed.';
    end if;
    new.status := case when vis = 'public' then 'accepted' else 'pending' end;
    new.created_at := now();
  else
    new.follower_id := old.follower_id;
    new.followee_id := old.followee_id;
    new.created_at  := old.created_at;
  end if;
  return new;
end;
$$;

-- Hide check-ins across a block.
create or replace function public.can_see_user(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target = auth.uid()
    or (
      not public.is_blocked_with(target)
      and (
        public.profile_visibility(target) = 'public'
        or (
          public.profile_visibility(target) = 'friends'
          and exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid() and f.followee_id = target and f.status = 'accepted'
          )
        )
      )
    );
$$;

-- Hide profiles across a block.
drop policy if exists "Signed-in people can find non-private profiles" on public.profiles;
create policy "Signed-in people can find non-private profiles"
  on public.profiles for select to authenticated
  using (user_id = auth.uid() or (visibility <> 'private' and not public.is_blocked_with(user_id)));

-- 3) Delete my account -------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in.';
  end if;
  delete from public.visits   where user_id = me;
  delete from public.checkins where user_id = me;
  delete from public.profiles where user_id = me;
  -- Everything else (follows, cheers, blocks, reports, admin rights) goes with the login.
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
