-- GPS coordinates for estates
--
-- Adds latitude and longitude to every estate, for the map, "near me" and
-- GPS-verified check-ins. They start empty; the geocoding script
-- (scripts/geocode-estates.mjs) produces the numbers to fill them in, and the
-- admin page lets you correct any estate by hand.
--
-- Safe to run more than once.

alter table public.estates add column if not exists latitude  double precision;
alter table public.estates add column if not exists longitude double precision;

-- Keep coordinates inside the Western Cape (roughly), so a typo can't put an
-- estate in the sea or another country.
alter table public.estates drop constraint if exists estates_coordinates_in_western_cape;
alter table public.estates add constraint estates_coordinates_in_western_cape check (
  (latitude is null and longitude is null)
  or (latitude between -35.0 and -30.0 and longitude between 17.0 and 24.5)
);
