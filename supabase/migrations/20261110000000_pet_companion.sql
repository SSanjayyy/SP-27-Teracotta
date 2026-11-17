-- Pet companion: the "pocket buddy" that sits next to Spotify.
-- To run: open the Supabase SQL Editor, start a new query, paste this file, and click Run.
-- Run it once, after the earlier migrations.
--
-- What it adds:
--   * spotify_connections  - each user's Spotify login tokens. The app can NEVER read this table;
--                            only edge functions (service_role) touch it. The app asks
--                            get_my_spotify_status() instead, which never returns tokens.
--   * pets                 - one pet per user, plus the streak (current, longest, skip days).
--   * check_ins            - one "song of the day" per user per day, with the user's mood tag and
--                            an optional note (and rows for the days a skip day covered).
--   * daily_summaries      - a display-only recap of a day's listening for the "My Week" tab.
--                            Written by the spotify-data edge function (via save_daily_summary,
--                            only while Spotify is connected). NEVER affects the pet.
--   * keepsakes            - mementos unlocked at 7, 14 and 30 days together.
--   * notification_prefs   - the one friendly reminder a day (time, quiet hours, push token).
--   * purge_old_spotify_data() + a daily pg_cron job: Spotify data is kept for 8 weeks only.
--
-- Safe to run on the live project: this file only ADDS tables and functions. It doesn't drop or
-- change any existing table.
--
-- Ground rules (from the Spotify Developer Policy review):
--   * This is a companion, not a game: no xp, points, levels or scores. The pet "grows up"
--     (egg -> baby -> grown) and "growth" is simply the number of days you've checked in together.
--   * Pet stats change ONLY through do_daily_check_in(). Nothing here looks at how much or how
--     long someone streams, so there's no reward for extra plays.
--   * The pet's mood mirrors the mood the user picks at check-in. Not Spotify data.
--   * Genre -> color is a simple per-user lookup. No cross-user totals, no AI on Spotify data.
--   * Disconnecting Spotify deletes everything that came from Spotify (see disconnect_spotify).
--   * The pet never dies. Missing days only makes it sleepy; the next check-in wakes it up.
--
-- Cheating: the app can only READ pets, check_ins, daily_summaries and keepsakes. It can't write
-- growth, stage or streak itself. Every change goes through the security definer functions
-- below, which only ever act on the logged-in user (auth.uid()).


-- ============================================================================================
-- 1. Pet rules. Change the numbers HERE (and the matching PET_RULES in syncd-app/lib/pet.ts).
-- ============================================================================================
--   baby_at          3   days together (real check-ins) to hatch from egg to baby
--   grown_at        14   days together to grow from baby to grown
--   skip_day_every   7   every 7 days of streak earns 1 automatic skip day...
--   max_skip_days    2   ...and you can hold at most 2
--   keepsakes  7/14/30   days together to unlock week_together / two_weeks_together / month_together
-- Skip days are "streak freezes": if you miss exactly one day and have one, it's used
-- automatically on your next check-in and your streak keeps going. Skip days don't count as
-- days together.
create function public.pet_rules()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'baby_at', 3,
    'grown_at', 14,
    'skip_day_every', 7,
    'max_skip_days', 2,
    'keepsakes', jsonb_build_object('week_together', 7, 'two_weeks_together', 14, 'month_together', 30)
  );
$$;

-- Which stage a pet is at after this many days together.
create function public.pet_stage_for(p_days_together integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_days_together >= (public.pet_rules() ->> 'grown_at')::int then 'grown'
    when p_days_together >= (public.pet_rules() ->> 'baby_at')::int  then 'baby'
    else 'egg'
  end;
$$;


-- ============================================================================================
-- 2. Genre -> color. Keep in sync with genreKeyFor / COLOR_FOR_GENRE in syncd-app/lib/pet.ts
--    and supabase/functions/_shared/genres.ts.
-- ============================================================================================
-- Turns any genre text (Spotify's "atl hip hop", "dance pop", our catalog's "R&B"...) into one of
-- 11 genre keys: hip-hop, pop, rock, r&b, jazz, electronic, latin, country, classical, indie, other.
-- Order matters: "pop rap" counts as hip-hop, "indie rock" as indie, "dance pop" as pop.
-- Spotify no longer returns genres for many artists, so blank or unknown -> 'other'.
create function public.genre_key_for(p_genre text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when g is null or g = '' then 'other'
    when g ~ '(hip.?hop|\mrap|trap\M|drill|grime)' then 'hip-hop'
    when g ~ '(r&b|\mrnb\M|\mr ?n ?b\M|soul|funk|motown)' then 'r&b'
    when g ~ '(latin|reggaeton|salsa|bachata|cumbia|banda|corrido|urbano|samba|bossa)' then 'latin'
    when g ~ '(country|bluegrass|americana)' then 'country'
    when g ~ '(jazz|swing|bebop)' then 'jazz'
    when g ~ '(classical|orchestra|baroque|opera|symphon|soundtrack)' then 'classical'
    when g ~ '(indie|alternative|\malt[ -]|lo.?fi|bedroom)' then 'indie'
    when g ~ '(rock|metal|punk|grunge|\memo\M|hardcore)' then 'rock'
    when g ~ '(edm|house|techno|electro|trance|dubstep|drum and bass|\mdnb\M|ambient|synth)' then 'electronic'
    when g ~ 'pop' then 'pop'
    when g ~ '(dance|disco)' then 'electronic'
    else 'other'
  end
  from (select lower(trim(p_genre)) as g) as x;
$$;

-- The pet's color for a genre key. 6 base colors (placeholders until Donalthea's art is final):
--   pink   = pop, latin          gold   = hip-hop, country
--   red    = rock                purple = r&b/soul, jazz
--   blue   = electronic, classical
--   green  = indie, other (the default)
create function public.color_key_for_genre(p_genre_key text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_genre_key
    when 'pop'        then 'pink'
    when 'latin'      then 'pink'
    when 'hip-hop'    then 'gold'
    when 'country'    then 'gold'
    when 'rock'       then 'red'
    when 'r&b'        then 'purple'
    when 'jazz'       then 'purple'
    when 'electronic' then 'blue'
    when 'classical'  then 'blue'
    else 'green'      -- indie, other, anything unexpected
  end;
$$;


-- ============================================================================================
-- 3. Tables
-- ============================================================================================

-- Spotify login for each user. Holds tokens, so the app must never see it.
-- The tokens are also ENCRYPTED by the edge functions before they're saved (AES-GCM with the
-- TOKEN_ENCRYPTION_KEY function secret, stored as base64(iv || ciphertext)), so even someone
-- reading this table in the dashboard can't use them.
-- One Spotify account can only be linked to one SYNCD account (unique spotify_user_id).
create table public.spotify_connections (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  spotify_user_id text not null,
  display_name    text,
  scopes          text not null default '',      -- space-separated, as Spotify returns them
  access_token    text not null,                 -- encrypted: base64(iv || AES-GCM ciphertext)
  refresh_token   text,                          -- encrypted the same way
  expires_at      timestamptz not null,
  connected_at    timestamptz not null default now(),
  last_synced_at  timestamptz
);

create unique index spotify_connections_one_link_per_spotify_account
  on public.spotify_connections (spotify_user_id);

comment on column public.spotify_connections.access_token is
  'Encrypted by the edge functions: base64(12-byte iv || AES-GCM ciphertext), key = TOKEN_ENCRYPTION_KEY secret.';
comment on column public.spotify_connections.refresh_token is
  'Encrypted by the edge functions: base64(12-byte iv || AES-GCM ciphertext), key = TOKEN_ENCRYPTION_KEY secret.';

-- One pet per user. The streak lives here too, so one row has everything the Pet tab needs.
-- Moods are the same five the user picks from at check-in; 'sleepy' is also how the pet looks
-- after missed days.
create table public.pets (
  id                  bigint generated always as identity primary key,
  user_id             uuid not null unique references public.profiles (id) on delete cascade,
  name                text not null check (char_length(name) between 1 and 24),
  stage               text not null default 'egg'
                      check (stage in ('egg', 'baby', 'grown')),
  mood                text not null default 'calm'     -- the mood picked at the last check-in
                      check (mood in ('joyful', 'calm', 'sleepy', 'fired_up', 'thoughtful')),
  color_key           text not null default 'green'
                      check (color_key in ('pink', 'gold', 'red', 'purple', 'blue', 'green')),
  genre_key           text not null default 'other',
  growth              integer not null default 0 check (growth >= 0),  -- days together (real check-ins)
  adopted_at          timestamptz not null default now(),
  accessories         jsonb not null default '[]'::jsonb check (jsonb_typeof(accessories) = 'array'),
  -- Streak
  current_streak      integer not null default 0 check (current_streak >= 0),
  longest_streak      integer not null default 0 check (longest_streak >= 0),
  last_check_in_date  date,
  skip_days_available smallint not null default 0 check (skip_days_available between 0 and 2)
);

-- One row per day: the song of the day, or a skip day that kept the streak alive.
-- The song fields are Spotify data, so disconnect_spotify() and the 8-week purge blank them.
-- mood_tag and note are the user's own words and stay.
create table public.check_ins (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  check_in_date    date not null,                 -- the user's local date
  spotify_track_id text,
  track_name       text,
  artist_name      text,
  album_art_url    text,
  genre            text,                          -- a genre key, see genre_key_for()
  mood_tag         text check (mood_tag in ('joyful', 'calm', 'sleepy', 'fired_up', 'thoughtful')),
  note             text check (char_length(note) <= 140),
  was_skip_day     boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (user_id, check_in_date)
);

-- Display-only recap of one day of listening, for "My Week". Written by the spotify-data edge
-- function. Never used for pet stats (Spotify Developer Policy bans rewarding plays).
create table public.daily_summaries (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  summary_date date not null,
  track_count  integer not null default 0 check (track_count >= 0),
  top_genre    text,
  top_artist   text,
  updated_at   timestamptz not null default now(),
  unique (user_id, summary_date)
);

-- Keepsakes: little mementos for time spent together (7, 14 and 30 days, see pet_rules).
-- Given out only by do_daily_check_in, once each.
create table public.keepsakes (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  keepsake_key text not null,
  unlocked_at  timestamptz not null default now(),
  check_in_id  bigint references public.check_ins (id) on delete set null,  -- the check-in that unlocked it
  unique (user_id, keepsake_key)
);

-- The one friendly reminder a day. Hours are 0-23 in the user's own timezone.
-- Not a pet stat, so the app may write its own row directly.
create table public.notification_prefs (
  user_id         uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  enabled         boolean not null default true,
  reminder_hour   smallint not null default 19 check (reminder_hour between 0 and 23),
  quiet_start     smallint not null default 22 check (quiet_start between 0 and 23),
  quiet_end       smallint not null default 8  check (quiet_end between 0 and 23),
  timezone        text not null default 'UTC',   -- IANA name, e.g. 'America/New_York'
  expo_push_token text,
  updated_at      timestamptz not null default now()
);

-- A pet's color follows its genre. Set on adoption, and whenever the genre changes to a real
-- genre (a check-in whose songs are all 'other' doesn't wash the color out).
-- disconnect_spotify() resets both genre and color to the defaults itself.
create function public.pets_set_color()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.genre_key <> 'other' then
    new.color_key := public.color_key_for_genre(new.genre_key);
  end if;
  return new;
end;
$$;

create trigger pets_set_color
  before insert or update of genre_key on public.pets
  for each row execute function public.pets_set_color();

-- notification_prefs.updated_at is kept current by the database, whatever the app sends.
create function public.notification_prefs_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger notification_prefs_touch
  before update on public.notification_prefs
  for each row execute function public.notification_prefs_touch();


-- ============================================================================================
-- 4. Security rules
-- ============================================================================================
alter table public.spotify_connections enable row level security;
alter table public.pets                enable row level security;
alter table public.check_ins           enable row level security;
alter table public.daily_summaries     enable row level security;
alter table public.keepsakes           enable row level security;
alter table public.notification_prefs  enable row level security;

-- Supabase gives anon/authenticated full table rights by default. Take them all away, then hand
-- back only what each table needs.
revoke all on public.spotify_connections, public.pets, public.check_ins,
              public.daily_summaries, public.keepsakes, public.notification_prefs
  from anon, authenticated;
grant all on public.spotify_connections, public.pets, public.check_ins,
             public.daily_summaries, public.keepsakes, public.notification_prefs
  to service_role;

-- spotify_connections: NO policies and NO grants, so the app can't read or write it at all.
-- Only service_role (edge functions) and the security definer functions below touch it.

-- pets, check_ins, daily_summaries, keepsakes: read your own rows only. Writes go through the
-- functions (or, for daily_summaries, the spotify-data edge function).
grant select on public.pets, public.check_ins, public.daily_summaries, public.keepsakes to authenticated;

create policy "Read own pet" on public.pets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own check-ins" on public.check_ins
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own daily summaries" on public.daily_summaries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own keepsakes" on public.keepsakes
  for select to authenticated using ((select auth.uid()) = user_id);

-- notification_prefs: read, create and change your own row. Nothing here can be cheated.
grant select on public.notification_prefs to authenticated;
grant insert (enabled, reminder_hour, quiet_start, quiet_end, timezone, expo_push_token),
      update (enabled, reminder_hour, quiet_start, quiet_end, timezone, expo_push_token, updated_at)
  on public.notification_prefs to authenticated;

create policy "Read own notification prefs" on public.notification_prefs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own notification prefs" on public.notification_prefs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own notification prefs" on public.notification_prefs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index on public.check_ins (user_id, check_in_date desc);
create index on public.daily_summaries (user_id, summary_date desc);
create index on public.keepsakes (check_in_id);


-- ============================================================================================
-- 5. Functions the app calls (supabase.rpc). All act only on the logged-in user.
-- ============================================================================================

-- Spotify status without the tokens: always returns exactly one row.
create function public.get_my_spotify_status()
returns table (connected boolean, display_name text, connected_at timestamptz, last_synced_at timestamptz)
language sql
stable
security definer set search_path = ''
as $$
  select c.user_id is not null, c.display_name, c.connected_at, c.last_synced_at
  from (select (select auth.uid()) as uid) as me
  left join public.spotify_connections c on c.user_id = me.uid;
$$;

-- Internal: the pet as the app sees it on a given day.
--   mood:   the mood picked at the last check-in, or 'sleepy' once a day has been missed
--           (2+ days since the last check-in, or since adoption if there's none yet)
--   streak: shown as 0 once it can't be saved (2+ days missed, or 1 missed with no skip day)
create function public.pet_state_json(p_pet public.pets, p_today date)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'pet', jsonb_build_object(
      'id', p_pet.id,
      'name', p_pet.name,
      'stage', p_pet.stage,
      'mood', case when d.since_last >= 2 then 'sleepy' else p_pet.mood end,
      'missed_days', greatest(0, d.since_last - 1),
      'color_key', p_pet.color_key,
      'genre_key', p_pet.genre_key,
      'growth', p_pet.growth,
      'adopted_at', p_pet.adopted_at,
      'accessories', p_pet.accessories,
      'checked_in_today', coalesce(p_pet.last_check_in_date >= p_today, false),
      'next_stage_at', case p_pet.stage
                         when 'egg'  then (public.pet_rules() ->> 'baby_at')::int
                         when 'baby' then (public.pet_rules() ->> 'grown_at')::int
                       end
    ),
    'streak', jsonb_build_object(
      'current', case
                   when d.since_check_in <= 1 then p_pet.current_streak
                   when d.since_check_in = 2 and p_pet.skip_days_available > 0 then p_pet.current_streak
                   else 0
                 end,
      'longest', p_pet.longest_streak,
      'last_check_in_date', p_pet.last_check_in_date,
      'skip_days_available', p_pet.skip_days_available,
      -- true when yesterday was missed and a skip day will cover it at the next check-in
      'skip_day_pending', d.since_check_in = 2 and p_pet.skip_days_available > 0
    )
  )
  from (
    select coalesce(p_today - p_pet.last_check_in_date, 999) as since_check_in,
           greatest(0, coalesce(p_today - p_pet.last_check_in_date,
                                p_today - (p_pet.adopted_at at time zone 'utc')::date)) as since_last
  ) as d;
$$;

-- The logged-in user's pet (and streak), or null if they haven't adopted yet.
-- Pass the phone's local date (YYYY-MM-DD) so the mood matches the user's day.
create function public.get_my_pet(p_local_date date default null)
returns jsonb
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  v_pet public.pets;
begin
  select * into v_pet from public.pets where user_id = (select auth.uid());
  if not found then
    return null;
  end if;
  return public.pet_state_json(v_pet, coalesce(p_local_date, (now() at time zone 'utc')::date));
end;
$$;

-- Adopt an egg. One pet per user.
create function public.adopt_pet(p_name text, p_local_date date default null)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_name text := btrim(p_name);
  v_pet  public.pets;
begin
  if v_uid is null then
    raise exception 'Please log in first.' using errcode = '28000';
  end if;
  if v_name is null or char_length(v_name) not between 1 and 24 then
    raise exception 'Pet names need 1 to 24 characters.' using errcode = '22023';
  end if;
  if exists (select 1 from public.pets where user_id = v_uid) then
    raise exception 'You already have a pet.' using errcode = '23505';
  end if;

  insert into public.pets (user_id, name) values (v_uid, v_name)
  returning * into v_pet;

  return public.pet_state_json(v_pet, coalesce(p_local_date, (now() at time zone 'utc')::date));
end;
$$;

create function public.rename_pet(p_name text, p_local_date date default null)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_name text := btrim(p_name);
  v_pet  public.pets;
begin
  if v_name is null or char_length(v_name) not between 1 and 24 then
    raise exception 'Pet names need 1 to 24 characters.' using errcode = '22023';
  end if;

  update public.pets set name = v_name
  where user_id = (select auth.uid())
  returning * into v_pet;
  if not found then
    raise exception 'Adopt your pet first.' using errcode = 'P0002';
  end if;

  return public.pet_state_json(v_pet, coalesce(p_local_date, (now() at time zone 'utc')::date));
end;
$$;

-- The daily check-in: pick a song of the day and how you feel. This is the ONLY thing that
-- changes the pet. Safe to call twice: a second call on the same day (or within 20 hours of the
-- last real check-in) changes nothing and returns already_checked_in = true.
-- The song is only saved while Spotify is connected; otherwise the check-in keeps just the mood
-- and note.
--
-- p_track:      { "spotify_track_id", "track_name", "artist_name", "album_art_url", "genre" }
-- p_local_date: the phone's local date. Must be within a day of today in UTC (covers every
--               timezone), and can't be before the last check-in, so dates can't be faked to
--               build a streak.
-- p_mood:       joyful, calm, sleepy, fired_up or thoughtful. The pet takes on this mood.
--               Optional; leaving it out counts as calm.
-- p_note:       an optional note, up to 140 characters.
--
-- Each check-in adds 1 to growth (days together). The pet hatches at 3 and grows up at 14.
-- Streak rules:
--   * checked in yesterday                -> streak + 1
--   * missed exactly one day, skip day     -> uses the skip day automatically (saved as a
--     available                              was_skip_day row for the missed date), streak + 1
--   * missed more (or no skip day)         -> streak starts again at 1. Nothing else is lost.
--   * every 7 days of streak earns a skip day (max 2 held).
-- Keepsakes unlock at 7, 14 and 30 days together (each only once, even if called again).
-- Returns { already_checked_in, used_skip_day, streak_reset, stage_changed, new_keepsakes,
--           pet, streak } (pet and streak are the same shape as get_my_pet).
create function public.do_daily_check_in(
  p_track      jsonb,
  p_local_date date,
  p_mood       text default null,
  p_note       text default null
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid            uuid := (select auth.uid());
  v_utc_today      date := (now() at time zone 'utc')::date;
  v_rules          jsonb := public.pet_rules();
  v_pet            public.pets;
  v_old_stage      text;
  v_gap            integer;
  v_streak         integer;
  v_skips          integer;
  v_used_skip      boolean := false;
  v_reset          boolean := false;
  v_track_id       text := left(nullif(btrim(p_track ->> 'spotify_track_id'), ''), 64);
  v_track_name     text := left(nullif(btrim(p_track ->> 'track_name'), ''), 300);
  v_artist_name    text := left(nullif(btrim(p_track ->> 'artist_name'), ''), 300);
  v_album_art      text := left(nullif(btrim(p_track ->> 'album_art_url'), ''), 1000);
  v_genre          text := public.genre_key_for(p_track ->> 'genre');
  v_mood           text := coalesce(p_mood, 'calm');
  v_note           text := nullif(btrim(p_note), '');
  v_top_genre      text;
  v_check_in_id    bigint;
  v_new_keepsakes  jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'Please log in first.' using errcode = '28000';
  end if;
  if p_local_date is null or p_local_date not between v_utc_today - 1 and v_utc_today + 1 then
    raise exception 'That date doesn''t look like today. Check your phone''s date and time.'
      using errcode = '22023';
  end if;
  if v_track_id is null or v_track_name is null then
    raise exception 'Pick a song of the day first.' using errcode = '22023';
  end if;
  if v_mood not in ('joyful', 'calm', 'sleepy', 'fired_up', 'thoughtful') then
    raise exception 'Pick one of the moods.' using errcode = '22023';
  end if;
  if char_length(v_note) > 140 then
    raise exception 'Notes can be up to 140 characters.' using errcode = '22023';
  end if;

  -- Lock the pet row so two taps at once can't both count.
  select * into v_pet from public.pets where user_id = v_uid for update;
  if not found then
    raise exception 'Adopt your pet before checking in.' using errcode = 'P0002';
  end if;

  -- Already checked in: return the pet as it is (a friendly result, not an error) when
  --   * this date is already checked in, or
  --   * there was a real check-in in the last 20 hours. The ±1 day date window is there for
  --     timezones, and without this rule someone could claim yesterday, today and tomorrow in
  --     one real day.
  if v_pet.last_check_in_date = p_local_date
     or exists (select 1 from public.check_ins
                where user_id = v_uid and check_in_date = p_local_date)
     or exists (select 1 from public.check_ins
                where user_id = v_uid and not was_skip_day
                  and created_at > now() - interval '20 hours') then
    return jsonb_build_object(
      'already_checked_in', true, 'used_skip_day', false, 'streak_reset', false,
      'stage_changed', false, 'new_keepsakes', '[]'::jsonb
    ) || public.pet_state_json(v_pet, p_local_date);
  end if;
  if v_pet.last_check_in_date > p_local_date then
    raise exception 'You already checked in for a later day.' using errcode = '22023';
  end if;

  -- Song details are Spotify data: only keep them while Spotify is connected (so nothing comes
  -- back after a disconnect).
  if not exists (select 1 from public.spotify_connections where user_id = v_uid) then
    v_track_id := null; v_track_name := null; v_artist_name := null;
    v_album_art := null; v_genre := null;
  end if;

  -- Work out the new streak. The gap is the bigger of
  --   * the gap between the dates the phone sent, and
  --   * the whole days of REAL time since the last real check-in.
  -- For honest users the real-time gap is never bigger than the date gap (two times on days
  -- d1 and d2 are less than (d2 - d1 + 1) * 24 hours apart). It stops "claim tomorrow every
  -- day, then backfill" tricks from hiding missed days.
  v_gap := p_local_date - v_pet.last_check_in_date;   -- null on the very first check-in
  if v_gap is not null then
    select greatest(v_gap, floor(extract(epoch from now() - max(created_at)) / 86400)::int)
      into v_gap
    from public.check_ins
    where user_id = v_uid and not was_skip_day;
    v_gap := coalesce(v_gap, p_local_date - v_pet.last_check_in_date);
  end if;
  v_skips := v_pet.skip_days_available;
  if v_gap is null then
    v_streak := 1;
  elsif v_gap = 1 then
    v_streak := v_pet.current_streak + 1;
  elsif v_gap = 2 and v_skips > 0 then
    v_skips     := v_skips - 1;
    v_used_skip := true;
    v_streak    := v_pet.current_streak + 1;
    insert into public.check_ins (user_id, check_in_date, was_skip_day)
    values (v_uid, p_local_date - 1, true)
    on conflict (user_id, check_in_date) do nothing;
  else
    v_streak := 1;
    v_reset  := v_pet.current_streak > 0;
  end if;

  -- Every 7 days of streak earns a skip day (max 2).
  if v_streak % (v_rules ->> 'skip_day_every')::int = 0 then
    v_skips := least((v_rules ->> 'max_skip_days')::int, v_skips + 1);
  end if;

  insert into public.check_ins
    (user_id, check_in_date, spotify_track_id, track_name, artist_name, album_art_url, genre, mood_tag, note)
  values
    (v_uid, p_local_date, v_track_id, v_track_name, v_artist_name, v_album_art, v_genre, v_mood, v_note)
  returning id into v_check_in_id;

  -- The pet's genre = the most common genre among this user's last 14 songs of the day
  -- (ignoring 'other'). Only their own check-ins, never how much they stream.
  select c.genre into v_top_genre
  from (
    select genre, check_in_date from public.check_ins
    where user_id = v_uid and not was_skip_day
    order by check_in_date desc
    limit 14
  ) as c
  where c.genre is not null and c.genre <> 'other'
  group by c.genre
  order by count(*) desc, max(c.check_in_date) desc
  limit 1;

  v_old_stage := v_pet.stage;

  update public.pets set
    growth              = growth + 1,
    stage               = public.pet_stage_for(growth + 1),
    mood                = v_mood,
    current_streak      = v_streak,
    longest_streak      = greatest(longest_streak, v_streak),
    last_check_in_date  = p_local_date,
    skip_days_available = v_skips,
    genre_key           = coalesce(v_top_genre, genre_key)
  where user_id = v_uid
  returning * into v_pet;

  -- Keepsakes reached by this check-in. The unique (user_id, keepsake_key) rule plus
  -- "on conflict do nothing" means each one is only ever given once.
  with added as (
    insert into public.keepsakes (user_id, keepsake_key, check_in_id)
    select v_uid, k.key, v_check_in_id
    from jsonb_each_text(v_rules -> 'keepsakes') as k (key, value)
    where v_pet.growth >= k.value::int
    on conflict (user_id, keepsake_key) do nothing
    returning keepsake_key
  )
  select coalesce(jsonb_agg(keepsake_key), '[]'::jsonb) into v_new_keepsakes from added;

  return jsonb_build_object(
    'already_checked_in', false,
    'used_skip_day', v_used_skip,
    'streak_reset', v_reset,
    'stage_changed', v_pet.stage <> v_old_stage,
    'new_keepsakes', v_new_keepsakes
  ) || public.pet_state_json(v_pet, p_local_date);
end;
$$;

-- Disconnect Spotify. Spotify's Developer Terms require deleting Spotify data within 5 days of a
-- user disconnecting; we do it right away. This removes:
--   * the spotify_connections row (tokens)
--   * all daily_summaries (made from Spotify listening data)
--   * the Spotify fields on check_ins (song id, name, artist, art, genre). The rows stay, with the
--     user's own mood tag and note, so the streak calendar still shows which days were checked in.
--   * the pet's genre and color, back to the defaults ('other' / 'green'), since both came from
--     Spotify genres. The pet keeps its name, growth, stage, streak and keepsakes.
-- Note: Spotify has no "revoke token" endpoint. Deleting the tokens means we can't use them again;
-- users can also remove the app at spotify.com/account/apps.
create function public.disconnect_spotify()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Please log in first.' using errcode = '28000';
  end if;

  delete from public.spotify_connections where user_id = v_uid;
  delete from public.daily_summaries where user_id = v_uid;
  update public.check_ins
    set spotify_track_id = null, track_name = null, artist_name = null,
        album_art_url = null, genre = null
    where user_id = v_uid;
  update public.pets set genre_key = 'other', color_key = 'green' where user_id = v_uid;
end;
$$;


-- Saves the display-only daily summary for a user. Called by the spotify-data edge function
-- (service_role only). It only writes while the user still has a Spotify connection, checked in
-- the same statement, so a summary can't sneak in after a disconnect.
create function public.save_daily_summary(
  p_user_id     uuid,
  p_date        date,
  p_track_count integer,
  p_top_genre   text,
  p_top_artist  text
)
returns void
language sql
security definer set search_path = ''
as $$
  insert into public.daily_summaries (user_id, summary_date, track_count, top_genre, top_artist, updated_at)
  select p_user_id, p_date, greatest(p_track_count, 0), p_top_genre, left(p_top_artist, 300), now()
  where exists (select 1 from public.spotify_connections c where c.user_id = p_user_id)
  on conflict (user_id, summary_date) do update
    set track_count = excluded.track_count,
        top_genre   = excluded.top_genre,
        top_artist  = excluded.top_artist,
        updated_at  = excluded.updated_at;
$$;


-- ============================================================================================
-- 6. 8-week retention for Spotify data
-- ============================================================================================
-- We only keep Spotify-derived data for 8 weeks (56 days); the "My Week" tab and weekly pet
-- diary never need more. Every day this:
--   * blanks the Spotify fields (song id, name, artist, art, genre) on check-ins older than 56 days.
--     The row itself stays, with the user's own mood_tag and note, so the streak history and
--     keepsakes still make sense.
--   * deletes daily_summaries older than 56 days.
-- Runs with full rights for every user, so only the database itself (pg_cron) and service_role
-- may call it.
create function public.purge_old_spotify_data()
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_cutoff date := (now() at time zone 'utc')::date - 56;
begin
  update public.check_ins
    set spotify_track_id = null, track_name = null, artist_name = null,
        album_art_url = null, genre = null
    where check_in_date < v_cutoff
      and (spotify_track_id is not null or track_name is not null or artist_name is not null
           or album_art_url is not null or genre is not null);

  delete from public.daily_summaries where summary_date < v_cutoff;
end;
$$;


-- ============================================================================================
-- 7. Who may call what
-- ============================================================================================
-- Supabase lets everyone (even logged-out "anon") run new functions by default, so lock them all
-- down first.
revoke execute on function public.pet_rules()                         from public, anon;
revoke execute on function public.pet_stage_for(integer)              from public, anon;
revoke execute on function public.genre_key_for(text)                 from public, anon;
revoke execute on function public.color_key_for_genre(text)           from public, anon;
revoke execute on function public.pets_set_color()                    from public, anon, authenticated;
revoke execute on function public.pet_state_json(public.pets, date)   from public, anon, authenticated;
revoke execute on function public.get_my_spotify_status()             from public, anon;
revoke execute on function public.get_my_pet(date)                    from public, anon;
revoke execute on function public.adopt_pet(text, date)               from public, anon;
revoke execute on function public.rename_pet(text, date)              from public, anon;
revoke execute on function public.do_daily_check_in(jsonb, date, text, text) from public, anon;
revoke execute on function public.disconnect_spotify()                from public, anon;
revoke execute on function public.purge_old_spotify_data()            from public, anon, authenticated;
revoke execute on function public.save_daily_summary(uuid, date, integer, text, text) from public, anon, authenticated;
revoke execute on function public.notification_prefs_touch()          from public, anon, authenticated;

-- The small lookup helpers are harmless; the app and edge functions may use them.
grant execute on function public.pet_rules()               to authenticated, service_role;
grant execute on function public.pet_stage_for(integer)    to authenticated, service_role;
grant execute on function public.genre_key_for(text)       to authenticated, service_role;
grant execute on function public.color_key_for_genre(text) to authenticated, service_role;

grant execute on function public.get_my_spotify_status()                    to authenticated;
grant execute on function public.get_my_pet(date)                           to authenticated;
grant execute on function public.adopt_pet(text, date)                      to authenticated;
grant execute on function public.rename_pet(text, date)                     to authenticated;
grant execute on function public.do_daily_check_in(jsonb, date, text, text) to authenticated;
grant execute on function public.disconnect_spotify()                       to authenticated;
grant execute on function public.purge_old_spotify_data()                   to service_role;
grant execute on function public.save_daily_summary(uuid, date, integer, text, text) to service_role;


-- ============================================================================================
-- 8. Run the 8-week purge every day at 03:17 UTC with pg_cron
-- ============================================================================================
-- If pg_cron isn't available, this prints a notice instead of failing the whole file. Turn it on
-- under Database -> Extensions -> pg_cron and run just this block again. Scheduling with the same
-- job name again just updates the job.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('purge-old-spotify-data', '17 3 * * *', 'select public.purge_old_spotify_data()');
exception when others then
  raise notice 'pg_cron is not enabled, so purge_old_spotify_data() was not scheduled (%). '
               'Enable pg_cron and run this block again.', sqlerrm;
end;
$$;
