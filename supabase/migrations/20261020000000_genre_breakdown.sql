-- Listening habits: turns a user's listening history into a genre breakdown
-- like "50% Hip-Hop, 30% R&B, 20% Pop" for the Profile tab.
-- To run: open the Supabase SQL Editor, start a new query, paste this file, and click Run.
-- Run it once, after the earlier migrations.

-- listening_history rows default to the logged-in user, so the app only sends the track.
alter table public.listening_history alter column user_id set default auth.uid();

-- Runs as the caller (security invoker), so the existing RLS rules still limit it to
-- the logged-in user's own history. Pass p_days to only count recent plays, or leave it
-- out for all time. Uses the track's genre, then the artist's genre, then "Other".
create function public.get_genre_breakdown(p_days integer default null)
returns table (genre text, plays bigint, percent numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with recent as (
    select coalesce(t.genre, a.genre, 'Other') as genre
    from public.listening_history h
    join public.tracks t on t.id = h.track_id
    left join public.artists a on a.id = t.artist_id
    where h.user_id = (select auth.uid())
      and (p_days is null or h.played_at >= now() - make_interval(days => p_days))
  )
  select genre,
         count(*) as plays,
         round(100.0 * count(*) / sum(count(*)) over (), 1) as percent
  from recent
  group by genre
  order by plays desc, genre;
$$;

revoke execute on function public.get_genre_breakdown(integer) from public, anon;
grant execute on function public.get_genre_breakdown(integer) to authenticated;
