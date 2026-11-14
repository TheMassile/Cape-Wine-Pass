-- Tag where each wine on the shared list came from
--
-- What this does, in plain English:
--   Adds a "source" label to every wine on the list:
--     - 'member'  -> added by someone in the app (the default)
--     - 'website' -> typed as a favourite on the old website
--     - 'import'  -> found on the estate's own website by the import script
--   So a bad import can be removed in one go if ever needed:
--     delete from public.wines where source = 'import';
--
-- Safe to run more than once.

alter table public.wines add column if not exists source text not null default 'member';

alter table public.wines drop constraint if exists wines_source_check;
alter table public.wines add constraint wines_source_check check (source in ('member', 'website', 'import'));

-- Wines copied from website favourites so far have no "added by" person.
update public.wines set source = 'website' where added_by is null and source = 'member';

-- From now on, favourites typed on the website are labelled too.
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
  insert into public.wines (estate_id, colour, name, added_by, source)
  values (p_estate, p_colour, btrim(p_name), null, 'website')
  on conflict (estate_id, colour, lower(btrim(name))) do nothing;
end;
$$;

revoke all on function public.remember_wine(text, text, text) from public, anon, authenticated;

-- People adding a wine in the app can only label it 'member'.
drop policy if exists "Signed-in people can add a wine" on public.wines;
create policy "Signed-in people can add a wine"
  on public.wines for insert to authenticated
  with check (added_by = auth.uid() and source = 'member');

select source, count(*) as wines from public.wines group by source order by source;
