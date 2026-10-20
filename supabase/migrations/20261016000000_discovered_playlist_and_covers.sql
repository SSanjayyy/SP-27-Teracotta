-- Adds the "Discovered" playlist (where the Identify feature saves songs) and album cover art.
-- To run: open the Supabase SQL Editor, start a new query, paste this file, and click Run.
-- Run it once, after the initial schema.

-- Album cover art so the app's cards and rows have an image to show.
alter table public.albums add column cover_url text;

-- Playlists fill in their owner automatically, so the app only has to send a name.
alter table public.playlists alter column user_id set default auth.uid();

-- Every user gets exactly one "Discovered" playlist.
alter table public.playlists add column is_discovered boolean not null default false;
create unique index playlists_one_discovered_per_user
  on public.playlists (user_id) where is_discovered;

-- Users can name and rename their own playlists, but can't set is_discovered or move a
-- playlist to someone else.
revoke insert, update on public.playlists from authenticated;
grant insert (name), update (name) on public.playlists to authenticated;

-- Same ownership rules as before, except the Discovered playlist can't be deleted.
drop policy "Own playlists" on public.playlists;

create policy "Read own playlists" on public.playlists
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own playlists" on public.playlists
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Rename own playlists" on public.playlists
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Delete own playlists except Discovered" on public.playlists
  for delete to authenticated
  using ((select auth.uid()) = user_id and not is_discovered);

-- New sign-ups now get a profile and an empty Discovered playlist.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');

  insert into public.playlists (user_id, name, is_discovered)
  values (new.id, 'Discovered', true);

  return new;
end;
$$;

-- Give anyone who signed up before this file ran their Discovered playlist too.
insert into public.playlists (user_id, name, is_discovered)
select p.id, 'Discovered', true
from public.profiles p
where not exists (
  select 1 from public.playlists pl where pl.user_id = p.id and pl.is_discovered
);
