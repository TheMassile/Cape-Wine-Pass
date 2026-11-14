-- Account deletion: also remove kid-friendly votes
--
-- What this does, in plain English:
--   "Delete my account" already removes your visits, check-ins, profile and login
--   (and with the login: follows, cheers, blocks and reports). This also removes
--   your kid-friendly votes, so the privacy policy's promise is complete.
--   Profile photos are removed by the app and website just before this runs.
--   Wines you added to an estate's list stay, without your name.
--
-- Safe to run more than once.

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
  if to_regclass('public.estate_kid_friendly_votes') is not null then
    execute 'delete from public.estate_kid_friendly_votes where user_id = $1' using me;
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
