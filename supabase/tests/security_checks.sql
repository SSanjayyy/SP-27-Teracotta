-- Security checks for the pet companion tables (run after 20261110000000_pet_companion.sql).
-- To run: open the Supabase SQL Editor, start a new query, paste this file, and click Run.
--
-- Safe to run on the shared project: everything happens inside one transaction that is rolled
-- back at the end, so the two test users and their data disappear afterwards.
--
-- How it works: it creates two fake users, A and B, then pretends to be each of them the same
-- way the app does (role "authenticated" plus a JWT whose "sub" is the user id), and tries
-- things that should and shouldn't work.
--   * If every check passes, the last result says "ALL SECURITY CHECKS PASSED".
--   * If one fails, the run stops with an error starting with "FAIL" that says what went wrong.
--     After any FAIL, run   rollback;   in the SQL Editor before running anything else, so the
--     half-finished test transaction (and its test users) is thrown away.
--
-- What it proves:
--   1-4   A can adopt and check in (the pet takes A's mood), and checking in twice on one day
--         changes nothing
--   5-7   A can't write growth / stage / streak / check-ins directly, or read Spotify tokens
--   8-13  B can't see or change A's pet, check-ins, summaries, prefs or Spotify connection
--   14    logged-out (anon) users can't read anything or call the functions
--   15-18 streak rules: skip day used automatically, skip day earned at 7, reset after a long
--         gap, egg hatches at 3 days, keepsake at 7 days given only once, fake dates rejected
--   19    disconnecting Spotify deletes all Spotify data (and resets the pet's genre color)
--   20    the 8-week retention purge blanks old Spotify data but keeps moods and notes
--   21    deleting the account removes every row the user had
--   22    no "claim yesterday, today and tomorrow" in one real day
--   23    backfilling dates after a real gap doesn't keep the streak (honest late check-ins do)
--   24    one Spotify account can't be linked twice; summaries are only saved while connected;
--         reminder prefs keep their own updated_at

begin;

-- Test users. Fixed ids so the checks below are easy to read.
--   A = aaaaaaaa-0000-4000-8000-000000000001
--   B = bbbbbbbb-0000-4000-8000-000000000002
-- The sign-up trigger creates their profiles (and Discovered playlists) automatically.
insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'security-test-a@example.com', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'security-test-b@example.com', 'authenticated', 'authenticated');

-- A Spotify connection and a daily summary for A, written the way the edge functions do
-- (with full database rights, not as the app).
insert into public.spotify_connections
  (user_id, spotify_user_id, display_name, scopes, access_token, refresh_token, expires_at)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'test-spotify-a', 'Test Listener A',
   'user-read-recently-played user-top-read', 'fake-access-token', 'fake-refresh-token',
   now() + interval '1 hour');

insert into public.daily_summaries (user_id, summary_date, track_count, top_genre, top_artist)
values ('aaaaaaaa-0000-4000-8000-000000000001', (now() at time zone 'utc')::date, 12, 'pop', 'Test Artist');


-- ===== Pretend to be user A =====================================================================
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_song  jsonb := '{"spotify_track_id":"test-track-1","track_name":"Test Song","artist_name":"Test Artist","genre":"atl hip hop"}';
  r       jsonb;
begin
  -- 1. Adopt
  r := public.adopt_pet('Testy');
  if r -> 'pet' ->> 'stage' <> 'egg' or r -> 'pet' ->> 'mood' <> 'calm' then
    raise exception 'FAIL 1: a new pet should be a calm egg, got %', r;
  end if;

  -- 2. A second pet is refused
  begin
    perform public.adopt_pet('Second');
    raise exception 'FAIL 2: A adopted a second pet';
  exception when unique_violation then null;
  end;

  -- 3. First check-in, feeling thoughtful -> the pet is thoughtful too
  r := public.do_daily_check_in(v_song, v_today, 'thoughtful', 'Rainy day, good song.');
  if (r -> 'streak' ->> 'current')::int <> 1 or (r -> 'pet' ->> 'growth')::int <> 1
     or r -> 'pet' ->> 'mood' <> 'thoughtful' or r -> 'pet' ->> 'color_key' <> 'gold'
     or not exists (select 1 from public.check_ins
                    where mood_tag = 'thoughtful' and note = 'Rainy day, good song.') then
    raise exception 'FAIL 3: first check-in gave the wrong result: %', r;
  end if;

  -- Unknown moods and long notes are refused
  begin
    perform public.do_daily_check_in(v_song, v_today, 'furious');
    raise exception 'FAIL 3: an unknown mood was accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.do_daily_check_in(v_song, v_today, 'calm', repeat('x', 141));
    raise exception 'FAIL 3: a 141-character note was accepted';
  exception when invalid_parameter_value then null;
  end;

  -- 4. Same day again: nothing changes
  r := public.do_daily_check_in(v_song, v_today, 'joyful');
  if not (r ->> 'already_checked_in')::boolean
     or (r -> 'pet' ->> 'growth')::int <> 1 or r -> 'pet' ->> 'mood' <> 'thoughtful'
     or (select count(*) from public.check_ins) <> 1 then
    raise exception 'FAIL 4: checking in twice on one day changed something: %', r;
  end if;

  -- A can see their own things
  if (select count(*) from public.pets) <> 1
     or (select count(*) from public.daily_summaries) <> 1
     or not (select connected from public.get_my_spotify_status()) then
    raise exception 'FAIL: A can''t see their own pet, summary or Spotify status';
  end if;

  -- 5. No cheating: direct writes to the pet are refused
  begin
    update public.pets set growth = 9999, stage = 'grown', current_streak = 365;
    raise exception 'FAIL 5: A changed growth/stage/streak directly';
  exception when insufficient_privilege then null;
  end;

  -- 6. No fake check-ins written directly
  begin
    insert into public.check_ins (user_id, check_in_date, track_name)
    values ('aaaaaaaa-0000-4000-8000-000000000001', v_today - 1, 'Fake');
    raise exception 'FAIL 6: A inserted a check-in directly';
  exception when insufficient_privilege then null;
  end;

  -- 7. Tokens are never readable by the app, not even your own
  begin
    perform access_token from public.spotify_connections;
    raise exception 'FAIL 7: A could read the spotify_connections table';
  exception when insufficient_privilege then null;
  end;

  -- A saves reminder prefs (allowed: not a pet stat)
  insert into public.notification_prefs (reminder_hour, timezone) values (20, 'America/New_York');
  update public.notification_prefs set reminder_hour = 21, updated_at = '2000-01-01';
  if (select updated_at from public.notification_prefs) <> now() then
    raise exception 'FAIL 24: notification_prefs.updated_at should be set by the database';
  end if;
end $$;


-- ===== Pretend to be user B =====================================================================
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);

do $$
declare
  v_a uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  n   integer;
begin
  -- 8. B sees none of A's rows
  if (select count(*) from public.pets) <> 0
     or (select count(*) from public.check_ins) <> 0
     or (select count(*) from public.daily_summaries) <> 0
     or (select count(*) from public.keepsakes) <> 0
     or (select count(*) from public.notification_prefs) <> 0 then
    raise exception 'FAIL 8: B can see A''s pet, check-ins, summaries, keepsakes or prefs';
  end if;

  -- 9. ...even when asking for A by id
  if exists (select 1 from public.pets where user_id = v_a)
     or exists (select 1 from public.check_ins where user_id = v_a) then
    raise exception 'FAIL 9: B can read A''s rows by user id';
  end if;

  -- 10. B can't read A's tokens
  begin
    perform access_token from public.spotify_connections where user_id = v_a;
    raise exception 'FAIL 10: B could read the spotify_connections table';
  exception when insufficient_privilege then null;
  end;

  -- 11. The functions only ever show B's own (empty) state
  if public.get_my_pet() is not null or (select connected from public.get_my_spotify_status()) then
    raise exception 'FAIL 11: get_my_pet / get_my_spotify_status showed B someone else''s data';
  end if;

  -- 12. B can't change A's pet or prefs
  begin
    update public.pets set name = 'Hacked' where user_id = v_a;
    raise exception 'FAIL 12: B ran an update on pets';
  exception when insufficient_privilege then null;
  end;
  update public.notification_prefs set enabled = false where user_id = v_a;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FAIL 12: B changed A''s notification prefs';
  end if;
  begin
    perform public.rename_pet('Hacked');
    raise exception 'FAIL 12: rename_pet worked for B, who has no pet';
  exception when no_data_found then null;
  end;

  -- 13. B can't create prefs for A
  begin
    insert into public.notification_prefs (user_id, reminder_hour) values (v_a, 3);
    raise exception 'FAIL 13: B created notification prefs for A';
  exception when insufficient_privilege then null;
  end;
end $$;


-- ===== Pretend to be logged out (anon) ==========================================================
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
begin
  -- 14. anon can't read tables or call the functions
  begin
    perform 1 from public.pets;
    raise exception 'FAIL 14: anon could read pets';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.get_my_pet();
    raise exception 'FAIL 14: anon could call get_my_pet';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.do_daily_check_in('{"spotify_track_id":"x","track_name":"x"}', (now() at time zone 'utc')::date);
    raise exception 'FAIL 14: anon could call do_daily_check_in';
  exception when insufficient_privilege then null;
  end;
end $$;


-- ===== Streak rules =============================================================================
-- Each test moves A's pet back in time with full rights (reset role), then checks in as A.

-- (Every setup below also moves A's earlier check-ins 3 days into the past. Inside one
-- transaction now() never moves, so otherwise they'd all look "just now" to the 20-hour rule.)

-- 15. Missed exactly one day with a skip day available -> skip day used, streak continues.
reset role;
update public.check_ins set created_at = now() - interval '3 days'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.check_ins set created_at = now() - interval '2 days' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.pets set last_check_in_date = (now() at time zone 'utc')::date - 2,
                       current_streak = 5, skip_days_available = 1
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.check_ins set check_in_date = (now() at time zone 'utc')::date - 2
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare
  v_today date := (now() at time zone 'utc')::date;
  r jsonb;
begin
  -- Before checking in: the pet is sleepy after a missed day, and the streak shows as safe
  r := public.get_my_pet(v_today);
  if (r -> 'streak' ->> 'current')::int <> 5 or not (r -> 'streak' ->> 'skip_day_pending')::boolean
     or r -> 'pet' ->> 'mood' <> 'sleepy' or (r -> 'pet' ->> 'missed_days')::int <> 1 then
    raise exception 'FAIL 15: pet before the skip-day check-in looks wrong: %', r;
  end if;

  r := public.do_daily_check_in('{"spotify_track_id":"test-track-2","track_name":"Song Two","genre":"pop"}',
                                v_today, 'joyful');
  if not (r ->> 'used_skip_day')::boolean or (r -> 'streak' ->> 'current')::int <> 6
     or (r -> 'streak' ->> 'skip_days_available')::int <> 0 or r -> 'pet' ->> 'mood' <> 'joyful'
     or not exists (select 1 from public.check_ins where check_in_date = v_today - 1 and was_skip_day) then
    raise exception 'FAIL 15: skip day wasn''t used correctly: %', r;
  end if;
  -- 2 days together so far (skip days don't count), so still an egg (hatches at 3)
  if r -> 'pet' ->> 'stage' <> 'egg' or (r -> 'pet' ->> 'growth')::int <> 2 then
    raise exception 'FAIL 15: skip days shouldn''t count as days together: %', r;
  end if;
end $$;

-- 16. Reaching 7 days of streak earns a skip day; the 3rd day together hatches the egg.
reset role;
update public.check_ins set created_at = now() - interval '3 days'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
delete from public.check_ins
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' and check_in_date = (now() at time zone 'utc')::date;
update public.check_ins set created_at = now() - interval '1 day' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.pets set last_check_in_date = (now() at time zone 'utc')::date - 1, current_streak = 6
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare
  r jsonb;
begin
  r := public.do_daily_check_in('{"spotify_track_id":"test-track-3","track_name":"Song Three","genre":"pop"}',
                                (now() at time zone 'utc')::date, 'fired_up');
  if (r -> 'streak' ->> 'current')::int <> 7 or (r -> 'streak' ->> 'skip_days_available')::int <> 1 then
    raise exception 'FAIL 16: a 7-day streak should earn a skip day: %', r;
  end if;
  if r -> 'pet' ->> 'stage' <> 'baby' or not (r ->> 'stage_changed')::boolean
     or (r -> 'pet' ->> 'growth')::int <> 3 then
    raise exception 'FAIL 16: the egg should hatch at 3 days together: %', r;
  end if;
end $$;

-- 17. A long gap resets the streak to 1, keeps the skip day, and never hurts the pet.
--     (Growth is wound to 6 here so this check-in is day 7 and unlocks the first keepsake.)
reset role;
update public.check_ins set created_at = now() - interval '3 days'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
delete from public.check_ins
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' and check_in_date = (now() at time zone 'utc')::date;
update public.pets set last_check_in_date = (now() at time zone 'utc')::date - 6, growth = 6
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare
  v_today date := (now() at time zone 'utc')::date;
  r jsonb;
begin
  r := public.get_my_pet(v_today);
  if r -> 'pet' ->> 'mood' <> 'sleepy' or (r -> 'streak' ->> 'current')::int <> 0 then
    raise exception 'FAIL 17: after 6 days away the pet should be sleepy with streak 0: %', r;
  end if;

  r := public.do_daily_check_in('{"spotify_track_id":"test-track-4","track_name":"Song Four","genre":"pop"}',
                                v_today, 'calm');
  if (r -> 'streak' ->> 'current')::int <> 1 or not (r ->> 'streak_reset')::boolean
     or (r -> 'streak' ->> 'longest')::int <> 7 or (r -> 'streak' ->> 'skip_days_available')::int <> 1
     or r -> 'pet' ->> 'mood' <> 'calm' or r -> 'pet' ->> 'stage' <> 'baby' then
    raise exception 'FAIL 17: reset after a long gap looks wrong: %', r;
  end if;

  -- Day 7 together unlocks the first keepsake, and the app can't add keepsakes itself
  if r -> 'new_keepsakes' <> '["week_together"]'::jsonb
     or (select count(*) from public.keepsakes) <> 1 then
    raise exception 'FAIL 17: day 7 should unlock week_together: %', r;
  end if;
  begin
    insert into public.keepsakes (user_id, keepsake_key)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'month_together');
    raise exception 'FAIL 17: A inserted a keepsake directly';
  exception when insufficient_privilege then null;
  end;

  -- 18. Fake dates are refused: far future is an error; an earlier date right after a
  --     check-in just gets the friendly "already checked in" answer and changes nothing.
  begin
    perform public.do_daily_check_in('{"spotify_track_id":"x","track_name":"x"}', v_today + 5);
    raise exception 'FAIL 18: a check-in 5 days in the future was accepted';
  exception when invalid_parameter_value then null;
  end;
  r := public.do_daily_check_in('{"spotify_track_id":"x","track_name":"x"}', v_today - 1);
  if not (r ->> 'already_checked_in')::boolean or (r -> 'pet' ->> 'growth')::int <> 7
     or exists (select 1 from public.check_ins where check_in_date = v_today - 1 and not was_skip_day) then
    raise exception 'FAIL 18: a check-in before the last one counted: %', r;
  end if;
end $$;

-- 18b. An earlier date long after the last check-in (no 20-hour cover) is an error.
reset role;
delete from public.check_ins
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' and was_skip_day;   -- so yesterday isn't already covered
update public.check_ins set created_at = now() - interval '1 day'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
begin
  begin
    perform public.do_daily_check_in('{"spotify_track_id":"x","track_name":"x"}',
                                     (now() at time zone 'utc')::date - 1);
    raise exception 'FAIL 18: a check-in before the last one was accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- Keepsakes are only ever given once: wind A back so the next check-in is day 7 again.
reset role;
update public.check_ins set created_at = now() - interval '3 days'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
delete from public.check_ins
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' and check_in_date = (now() at time zone 'utc')::date;
update public.check_ins set created_at = now() - interval '1 day' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.pets set last_check_in_date = (now() at time zone 'utc')::date - 1, growth = 6
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);

do $$
declare
  r jsonb;
begin
  r := public.do_daily_check_in('{"spotify_track_id":"test-track-5","track_name":"Song Five","genre":"pop"}',
                                (now() at time zone 'utc')::date, 'joyful');
  if r -> 'new_keepsakes' <> '[]'::jsonb or (select count(*) from public.keepsakes) <> 1 then
    raise exception 'FAIL 17: a keepsake was given twice: %', r;
  end if;

  -- 19. Disconnect Spotify: every Spotify-derived row or field is gone
  perform public.disconnect_spotify();
  if (select connected from public.get_my_spotify_status())
     or exists (select 1 from public.daily_summaries)
     or exists (select 1 from public.check_ins
                where spotify_track_id is not null or track_name is not null or artist_name is not null
                   or album_art_url is not null or genre is not null)
     or (select genre_key from public.pets) <> 'other'
     or (select color_key from public.pets) <> 'green' then
    raise exception 'FAIL 19: disconnect left Spotify data behind';
  end if;
  -- ...but the pet and the user's own words are fine
  if (select stage from public.pets) <> 'baby'
     or not exists (select 1 from public.check_ins where mood_tag = 'thoughtful' and note is not null) then
    raise exception 'FAIL 19: disconnect should keep the pet and the user''s own mood tags and notes';
  end if;
end $$;


-- ===== 20. 8-week retention =====================================================================
-- Old Spotify fields are blanked and old summaries deleted; the user's own words stay.
reset role;
insert into public.check_ins (user_id, check_in_date, spotify_track_id, track_name, artist_name, genre, mood_tag, note)
values
  ('bbbbbbbb-0000-4000-8000-000000000002', (now() at time zone 'utc')::date - 60, 'old-track', 'Old Song', 'Old Artist', 'rock', 'thoughtful', 'Long ago'),
  ('bbbbbbbb-0000-4000-8000-000000000002', (now() at time zone 'utc')::date - 10, 'new-track', 'New Song', 'New Artist', 'rock', 'joyful', null);
insert into public.daily_summaries (user_id, summary_date, track_count)
values
  ('bbbbbbbb-0000-4000-8000-000000000002', (now() at time zone 'utc')::date - 60, 5),
  ('bbbbbbbb-0000-4000-8000-000000000002', (now() at time zone 'utc')::date - 10, 5);

select public.purge_old_spotify_data();
select public.save_daily_summary('aaaaaaaa-0000-4000-8000-000000000001', (now() at time zone 'utc')::date, 3, 'pop', 'Test Artist');

do $$
declare
  v_b uuid := 'bbbbbbbb-0000-4000-8000-000000000002';
begin
  if exists (select 1 from public.check_ins where user_id = v_b and note = 'Long ago'
             and (track_name is not null or spotify_track_id is not null or artist_name is not null or genre is not null))
     or not exists (select 1 from public.check_ins where user_id = v_b and note = 'Long ago' and mood_tag = 'thoughtful')
     or not exists (select 1 from public.check_ins where user_id = v_b and track_name = 'New Song')
     or (select count(*) from public.daily_summaries where user_id = v_b) <> 1 then
    raise exception 'FAIL 20: the 8-week purge removed too much or too little';
  end if;
  if exists (select 1 from public.daily_summaries where user_id = 'aaaaaaaa-0000-4000-8000-000000000001') then
    raise exception 'FAIL 24: a daily summary was saved after Spotify was disconnected';
  end if;
end $$;

-- The app can't run the purge itself
set local role authenticated;
do $$
begin
  begin
    perform public.purge_old_spotify_data();
    raise exception 'FAIL 20: a logged-in user could run purge_old_spotify_data';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.save_daily_summary(gen_random_uuid(), current_date, 1, null, null);
    raise exception 'FAIL 24: a logged-in user could run save_daily_summary';
  exception when insufficient_privilege then null;
  end;
end $$;


-- ===== 22. No triple claims in one real day ==================================================
-- B adopts and tries yesterday, today and tomorrow (all inside the ±1 day timezone window).
-- B has no Spotify connection, so the song details aren't kept either.
-- (B's old check-ins from check 20 are moved into the past so they don't count as recent.)
reset role;
update public.check_ins set created_at = now() - interval '10 days'
where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);

do $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_song  jsonb := '{"spotify_track_id":"test-track-b","track_name":"B Song","artist_name":"B Artist","genre":"rock"}';
  r       jsonb;
begin
  perform public.adopt_pet('Bee');
  r := public.do_daily_check_in(v_song, v_today - 1, 'calm');
  if (r ->> 'already_checked_in')::boolean or (r -> 'pet' ->> 'growth')::int <> 1 then
    raise exception 'FAIL 22: B''s first check-in should count: %', r;
  end if;
  r := public.do_daily_check_in(v_song, v_today, 'calm');
  if not (r ->> 'already_checked_in')::boolean or (r -> 'pet' ->> 'growth')::int <> 1 then
    raise exception 'FAIL 22: a second claim in the same real day counted: %', r;
  end if;
  r := public.do_daily_check_in(v_song, v_today + 1, 'calm');
  if not (r ->> 'already_checked_in')::boolean or (r -> 'pet' ->> 'growth')::int <> 1
     or (select count(*) from public.check_ins where not was_skip_day and check_in_date >= v_today - 1) <> 1 then
    raise exception 'FAIL 22: a third claim in the same real day counted: %', r;
  end if;
  -- No Spotify connection -> the song details weren't saved, the mood was
  if exists (select 1 from public.check_ins where check_in_date = v_today - 1
             and (track_name is not null or spotify_track_id is not null or genre is not null))
     or not exists (select 1 from public.check_ins where check_in_date = v_today - 1 and mood_tag = 'calm') then
    raise exception 'FAIL 22: song details were saved without a Spotify connection';
  end if;
end $$;

-- ===== 23. Backfilling after a real gap =======================================================
-- Honest late check-in first: B's last check-in was 26 real hours ago, dated yesterday.
reset role;
update public.check_ins set check_in_date = (now() at time zone 'utc')::date - 1,
                            created_at = now() - interval '26 hours'
where user_id = 'bbbbbbbb-0000-4000-8000-000000000002' and check_in_date = (now() at time zone 'utc')::date - 1;
update public.pets set last_check_in_date = (now() at time zone 'utc')::date - 1, current_streak = 5
where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);

do $$
declare
  r jsonb;
begin
  r := public.do_daily_check_in('{"spotify_track_id":"x","track_name":"x"}', (now() at time zone 'utc')::date, 'joyful');
  if (r -> 'streak' ->> 'current')::int <> 6 or (r ->> 'streak_reset')::boolean then
    raise exception 'FAIL 23: an honest check-in 26 hours later should keep the streak: %', r;
  end if;
end $$;

-- Now the trick: B "claimed" yesterday's date, but the last real check-in was 3 days ago
-- (claiming one day ahead, then skipping real days). The streak must not survive.
reset role;
delete from public.check_ins
where user_id = 'bbbbbbbb-0000-4000-8000-000000000002' and check_in_date = (now() at time zone 'utc')::date;
update public.check_ins set created_at = now() - interval '3 days' where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';
update public.pets set last_check_in_date = (now() at time zone 'utc')::date - 1, current_streak = 5
where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);

do $$
declare
  r jsonb;
begin
  r := public.do_daily_check_in('{"spotify_track_id":"x","track_name":"x"}', (now() at time zone 'utc')::date, 'joyful');
  if (r -> 'streak' ->> 'current')::int <> 1 or not (r ->> 'streak_reset')::boolean then
    raise exception 'FAIL 23: backfilled dates kept the streak after a 3-day real gap: %', r;
  end if;
end $$;

-- ===== 24. One Spotify account, one SYNCD account ===============================================
reset role;
insert into public.spotify_connections (user_id, spotify_user_id, access_token, expires_at)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'test-spotify-shared', 'fake', now());

do $$
begin
  begin
    insert into public.spotify_connections (user_id, spotify_user_id, access_token, expires_at)
    values ('bbbbbbbb-0000-4000-8000-000000000002', 'test-spotify-shared', 'fake', now());
    raise exception 'FAIL 24: one Spotify account was linked to two SYNCD accounts';
  exception when unique_violation then null;
  end;
end $$;

delete from public.spotify_connections where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';


-- ===== 21. Delete account =======================================================================
-- The delete-account edge function deletes the auth user; everything else is removed by
-- "on delete cascade". Do the same here and check nothing of A's is left.
reset role;
insert into public.spotify_connections (user_id, spotify_user_id, access_token, expires_at)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'test-spotify-a', 'fake', now());
select public.save_daily_summary('aaaaaaaa-0000-4000-8000-000000000001', (now() at time zone 'utc')::date, 3, 'pop', 'Test Artist');

do $$
begin
  if not exists (select 1 from public.daily_summaries where user_id = 'aaaaaaaa-0000-4000-8000-000000000001') then
    raise exception 'FAIL 24: save_daily_summary didn''t save while Spotify was connected';
  end if;
end $$;

delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';

do $$
declare
  v_a uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
begin
  if exists (select 1 from public.profiles               where id = v_a)
     or exists (select 1 from public.pets                where user_id = v_a)
     or exists (select 1 from public.check_ins           where user_id = v_a)
     or exists (select 1 from public.daily_summaries     where user_id = v_a)
     or exists (select 1 from public.keepsakes           where user_id = v_a)
     or exists (select 1 from public.notification_prefs  where user_id = v_a)
     or exists (select 1 from public.spotify_connections where user_id = v_a)
     or exists (select 1 from public.playlists           where user_id = v_a) then
    raise exception 'FAIL 21: deleting the account left some of A''s rows behind';
  end if;
  if not exists (select 1 from public.profiles where id = 'bbbbbbbb-0000-4000-8000-000000000002') then
    raise exception 'FAIL 21: deleting A also removed B';
  end if;
end $$;

select 'ALL SECURITY CHECKS PASSED' as result;

-- Undo everything above (test users, pets, check-ins).
rollback;
