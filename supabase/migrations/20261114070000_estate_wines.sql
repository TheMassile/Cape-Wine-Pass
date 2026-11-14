-- Favourite wines from a list, for Cape Wine Pass
--
-- What this does, in plain English:
--   1. "wines": a shared list of wines for each estate, split into
--      red / white / rosé & other. It starts with every favourite wine people
--      have already typed on the website. Anyone signed in can add a missing
--      wine, and it then shows up for everybody. Admins can tidy or delete.
--   2. Each check-in can now carry the favourite red, white and rosé/other
--      from that trip, so they show on the feed and on share cards.
--   3. Picking favourites on a check-in also updates the "favourite wines"
--      the website shows for that estate, and any new name typed on the
--      website is added to the shared list. Everything stays in step.
--
-- Safe to run more than once.

-- 1) The shared wine list ---------------------------------------------------------
create table if not exists public.wines (
  id          uuid primary key default gen_random_uuid(),
  estate_id   text not null,
  colour      text not null check (colour in ('red', 'white', 'rose_other')),
  name        text not null check (char_length(btrim(name)) between 2 and 80),
  added_by    uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

-- One entry per wine name per estate and colour, ignoring capitals and spaces.
create unique index if not exists wines_unique_name
  on public.wines (estate_id, colour, lower(btrim(name)));

alter table public.wines enable row level security;

drop policy if exists "Anyone can read the wine list"       on public.wines;
drop policy if exists "Signed-in people can add a wine"     on public.wines;
drop policy if exists "Admins can change wines"             on public.wines;
drop policy if exists "Admins can delete wines"             on public.wines;

create policy "Anyone can read the wine list"
  on public.wines for select to anon, authenticated
  using (true);

create policy "Signed-in people can add a wine"
  on public.wines for insert to authenticated
  with check (added_by = auth.uid());

create policy "Admins can change wines"
  on public.wines for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete wines"
  on public.wines for delete to authenticated
  using (public.is_admin());

-- Add a wine to the list if it isn't there yet (used by the triggers below).
create or replace function public.remember_wine(p_estate text, p_colour text, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_name is null or char_length(btrim(p_name)) not between 2 and 80 then
    return;
  end if;
  insert into public.wines (estate_id, colour, name, added_by)
  values (p_estate, p_colour, btrim(p_name), null)
  on conflict (estate_id, colour, lower(btrim(name))) do nothing;
end;
$$;

revoke all on function public.remember_wine(text, text, text) from public, anon, authenticated;

-- 2) Favourite wines on each check-in ---------------------------------------------
alter table public.checkins add column if not exists fav_red   text;
alter table public.checkins add column if not exists fav_white text;
alter table public.checkins add column if not exists fav_rose  text;

alter table public.checkins drop constraint if exists checkins_fav_lengths;
alter table public.checkins add constraint checkins_fav_lengths check (
  coalesce(char_length(fav_red), 0)   <= 80 and
  coalesce(char_length(fav_white), 0) <= 80 and
  coalesce(char_length(fav_rose), 0)  <= 80
);

-- 3) Keep everything in step ------------------------------------------------------
-- Check-in favourites -> the estate's favourites on the website.
-- (Runs after "checkins_mark_visited", which makes sure the visit row exists.)
create or replace function public.checkin_favourites_to_visit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fav_red is null and new.fav_white is null and new.fav_rose is null then
    return new;
  end if;
  update public.visits v
     set favorite_red   = coalesce(nullif(btrim(new.fav_red), ''),   v.favorite_red),
         favorite_white = coalesce(nullif(btrim(new.fav_white), ''), v.favorite_white),
         favorite_rose  = coalesce(nullif(btrim(new.fav_rose), ''),  v.favorite_rose)
   where v.user_id = new.user_id and v.estate_id = new.estate_id;
  return new;
end;
$$;

drop trigger if exists checkins_sync_favourite_wines on public.checkins;
create trigger checkins_sync_favourite_wines
  after insert or update of fav_red, fav_white, fav_rose on public.checkins
  for each row execute function public.checkin_favourites_to_visit();

-- Any favourite saved on a visit (website or app) -> the shared wine list.
create or replace function public.visit_favourites_to_wines()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.remember_wine(new.estate_id::text, 'red',        new.favorite_red);
  perform public.remember_wine(new.estate_id::text, 'white',      new.favorite_white);
  perform public.remember_wine(new.estate_id::text, 'rose_other', new.favorite_rose);
  return new;
end;
$$;

drop trigger if exists visits_remember_wines on public.visits;
create trigger visits_remember_wines
  after insert or update of favorite_red, favorite_white, favorite_rose on public.visits
  for each row execute function public.visit_favourites_to_wines();

-- 4) Start the list with everything already typed on the website ------------------
do $$
declare v record;
begin
  for v in select estate_id, favorite_red, favorite_white, favorite_rose from public.visits loop
    perform public.remember_wine(v.estate_id::text, 'red',        v.favorite_red);
    perform public.remember_wine(v.estate_id::text, 'white',      v.favorite_white);
    perform public.remember_wine(v.estate_id::text, 'rose_other', v.favorite_rose);
  end loop;
end;
$$;

-- Check: how many wines are on the list now, by colour.
select colour, count(*) as wines from public.wines group by colour order by colour;
