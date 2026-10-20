-- Sample songs so the app has something to show. Run after both migration files.
-- To run: open the Supabase SQL Editor, start a new query, paste this file, and click Run. Run it once.
--
-- To add more songs, copy the pattern below for each artist, album and track (aim for 15 to 20 songs).
-- Albums and tracks find their artist/album by name, so spell names exactly the same each time.
-- Genres should use the same words as the app's Search categories: Pop, Hip-Hop, Rock, R&B.
-- cover_url can be any image link. The picsum ones are placeholders; a real album cover link is better.

-- 1. Artists
insert into public.artists (name, genre) values
  ('Drake', 'Hip-Hop'),
  ('SZA', 'R&B'),
  ('Taylor Swift', 'Pop');

-- 2. Albums (one row per album, pointing at its artist)
insert into public.albums (name, artist_id, cover_url)
select v.album, a.id, v.cover_url
from (values
  ('Scorpion', 'Drake', 'https://picsum.photos/300?101'),
  ('SOS', 'SZA', 'https://picsum.photos/300?102'),
  ('Midnights', 'Taylor Swift', 'https://picsum.photos/300?103')
) as v (album, artist, cover_url)
join public.artists a on a.name = v.artist;

-- 3. Tracks (duration is in seconds: 3:18 = 198)
insert into public.tracks (title, artist_id, album_id, genre, duration_seconds)
select v.title, a.id, al.id, v.genre, v.duration_seconds
from (values
  ('God''s Plan', 'Drake', 'Scorpion', 'Hip-Hop', 198),
  ('Kill Bill', 'SZA', 'SOS', 'R&B', 153),
  ('Anti-Hero', 'Taylor Swift', 'Midnights', 'Pop', 200)
) as v (title, artist, album, genre, duration_seconds)
join public.artists a on a.name = v.artist
join public.albums al on al.name = v.album and al.artist_id = a.id;

-- Check it worked: should list every song with its artist and album.
select t.title, a.name as artist, al.name as album
from public.tracks t
join public.artists a on a.id = t.artist_id
left join public.albums al on al.id = t.album_id
order by a.name, t.title;
