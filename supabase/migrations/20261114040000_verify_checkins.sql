-- GPS-verified check-ins for Cape Wine Pass
--
-- What this does, in plain English:
--   When someone checks in from the app, the database itself now checks the
--   phone's location against the estate's map pin. If they were within 500 m,
--   and the check-in is for "now" (not backdated), it's marked verified.
--   Leaderboards only count verified visits, so nobody can top them from home.
--
--   People still can't mark a check-in verified themselves: the database decides.
--
-- Safe to run more than once.

-- Distance in metres between two map points.
create or replace function public.distance_metres(lat1 double precision, lon1 double precision,
                                                  lat2 double precision, lon2 double precision)
returns double precision
language sql
immutable
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

create or replace function public.protect_checkin_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  e_lat double precision;
  e_lon double precision;
begin
  -- The server's own tools may set verified directly.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Editing a note or rating never changes verified, and location can't be swapped later.
    new.verified  := old.verified;
    new.latitude  := old.latitude;
    new.longitude := old.longitude;
    new.visited_at := old.visited_at;
    return new;
  end if;

  new.verified := false;
  if new.latitude is not null and new.longitude is not null
     and abs(extract(epoch from (now() - new.visited_at))) < 15 * 60 then
    select latitude, longitude into e_lat, e_lon
    from public.estates where "Estate ID" = new.estate_id;
    if e_lat is not null and e_lon is not null
       and public.distance_metres(new.latitude, new.longitude, e_lat, e_lon) <= 500 then
      new.verified := true;
    end if;
  end if;
  return new;
end;
$$;

-- (The trigger itself already exists from the check-ins script; this makes sure.)
drop trigger if exists checkins_protect_verified on public.checkins;
create trigger checkins_protect_verified
  before insert or update on public.checkins
  for each row execute function public.protect_checkin_verified();
