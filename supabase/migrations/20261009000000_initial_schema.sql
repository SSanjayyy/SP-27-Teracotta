-- SYNCD initial schema (from SP27-SYNC-Design, section 4.2 Data Design)
-- Run in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Changes from the design doc because we use Supabase Auth instead of Node/Express + JWT:
--   * "User" is split: auth.users (managed by Supabase, holds email + hashed password)
--     and public.profiles (our app fields). We never store password_hash ourselves.
--   * user_id columns are uuid and point at auth.users / profiles.
--   * Row Level Security (RLS) replaces backend checks like "users may only modify
--     playlists they own".

-- Profiles (design doc: User)
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  display_name      text,
  spotify_user_id   text unique,               -- only set if the user links Spotify
  subscription_tier text not null default 'free'
                    check (subscription_tier in ('free', 'premium')),
  created_at        timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up through Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Catalog: artists, albums, tracks (shared, read-only for users)
create table public.artists (
  id    bigint generated always as identity primary key,
  name  text not null,
  genre text
);

create table public.albums (
  id        bigint generated always as identity primary key,
  name      text not null,
  artist_id bigint not null references public.artists (id) on delete cascade
);

create table public.tracks (
  id               bigint generated always as identity primary key,
  artist_id        bigint not null references public.artists (id) on delete cascade,
  album_id         bigint references public.albums (id) on delete set null,
  title            text not null,
  audio_file_url   text,                       -- where the licensed audio file is hosted
  genre            text,
  duration_seconds integer check (duration_seconds >= 0),
  spotify_id       text unique                 -- links to Spotify metadata / cover art
);

-- Playlists
create table public.playlists (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.playlist_tracks (
  playlist_id bigint not null references public.playlists (id) on delete cascade,
  track_id    bigint not null references public.tracks (id) on delete cascade,
  position    integer not null check (position >= 0),
  primary key (playlist_id, track_id)
);

-- Per-user activity
create table public.listening_history (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  track_id  bigint not null references public.tracks (id) on delete cascade,
  played_at timestamptz not null default now()
);

create table public.ad_impressions (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references public.profiles (id) on delete cascade,
  shown_at timestamptz not null default now()
);

create table public.identify_logs (
  id                  bigint generated always as identity primary key,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  recognized_track_id bigint references public.tracks (id) on delete set null,
  identified_at       timestamptz not null default now()
);

-- Indexes on foreign keys we filter by
create index on public.albums (artist_id);
create index on public.tracks (artist_id);
create index on public.tracks (album_id);
create index on public.playlists (user_id);
create index on public.playlist_tracks (track_id);
create index on public.listening_history (user_id, played_at desc);
create index on public.ad_impressions (user_id);
create index on public.identify_logs (user_id);

-- Row Level Security
alter table public.profiles          enable row level security;
alter table public.artists           enable row level security;
alter table public.albums            enable row level security;
alter table public.tracks            enable row level security;
alter table public.playlists         enable row level security;
alter table public.playlist_tracks   enable row level security;
alter table public.listening_history enable row level security;
alter table public.ad_impressions    enable row level security;
alter table public.identify_logs     enable row level security;

-- Profiles: see and edit only your own row.
create policy "Read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Users must not be able to upgrade themselves to premium, so only these columns are editable.
revoke update on public.profiles from authenticated;
grant update (display_name, spotify_user_id) on public.profiles to authenticated;

-- Catalog: any logged-in user can read. No write policies, so only the dashboard /
-- service_role can add songs.
create policy "Catalog readable" on public.artists for select to authenticated using (true);
create policy "Catalog readable" on public.albums  for select to authenticated using (true);
create policy "Catalog readable" on public.tracks  for select to authenticated using (true);

-- Playlists: full control over your own playlists only.
create policy "Own playlists" on public.playlists
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Playlist tracks: allowed if the parent playlist is yours.
create policy "Tracks in own playlists" on public.playlist_tracks
  for all to authenticated
  using (exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = (select auth.uid())
  ));

-- Activity logs: read and add your own rows. No update/delete.
create policy "Read own history" on public.listening_history
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Add own history" on public.listening_history
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Read own ad impressions" on public.ad_impressions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Add own ad impressions" on public.ad_impressions
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Read own identify logs" on public.identify_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Add own identify logs" on public.identify_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
