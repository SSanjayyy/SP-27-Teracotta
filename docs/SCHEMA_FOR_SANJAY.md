# Pet companion backend: what to call from each screen

Written for Sanjay (screens). Maurice owns the backend. Last updated 2026-11-10.

**Short version:** don't write database or Spotify code in screens. Import from
`lib/pet.ts`, `lib/spotify.ts` and `lib/reminders.ts`. Every function throws an
`Error` with a message you can show the user, so wrap calls in `try/catch` and show
`err.message`.

```ts
import { getMyPet, checkIn } from '@/lib/pet';
import { getRecentSongs } from '@/lib/spotify';

try {
  const state = await getMyPet();          // null = no pet yet -> show the adopt screen
  const songs = await getRecentSongs();    // up to 20, newest first
  const result = await checkIn(songs[0], 'calm', 'optional note');
} catch (err) {
  // err.message is safe to show
}
```

## Ground rules that affect the screens

- **Not a game.** Spotify's Developer Policy bans games, so never show xp, points, levels,
  scores, or win/lose words. The pet *grows up* (egg, baby, grown) and `growth` is simply
  "days together".
- **Only the check-in changes the pet.** Nothing is based on how much someone listens.
- **The pet mirrors the user's mood.** At check-in the user picks one of 5 moods: joyful,
  calm, sleepy, fired_up or thoughtful. The pet shows that mood. After a missed day it shows
  `sleepy`. It never dies, and there's no hunger or feeding.
- **Max 20 Spotify items in any list.** The functions already return at most 20.
- **Be kind about streaks.** If `streakReset` is true, say something like "Welcome back!",
  never "You lost your streak".

## Which function for which screen

| Screen | What it shows or does | Call (from `@/lib/...`) |
|---|---|---|
| Onboarding / Settings: Connect Spotify | Spotify login button | `expo-auth-session` (see the top of `lib/spotify.ts`), then `connectSpotify(code, codeVerifier, redirectUri)`. If that Spotify account is already linked to another SYNCD account, it throws a message saying so |
| Anywhere: "is Spotify connected?" | Connected badge, name, last sync | `getSpotifyStatus()` returns `{ connected, displayName, connectedAt, lastSyncedAt }` |
| Adopt screen (first launch) | Name your egg | `adoptPet(name)` (1 to 24 characters) |
| Pet tab | Pet, mood, stage, color, streak, skip days | `getMyPet()` returns `{ pet, streak }` or `null` |
| Pet tab: rename | Rename the pet | `renamePet(name)` |
| Check-in: pick the song of the day | Recently played list | `getRecentSongs()` (pass `{ refresh: true }` for pull-to-refresh) |
| Check-in: pick a mood and note | Mood chips + optional note | `MOODS`, `MOOD_LABELS` (note max 140 characters) |
| Check-in: save (once per day; a second try within 20 hours just returns `alreadyCheckedIn: true`) | Shows the result | `checkIn(song, mood, note?)` returns `{ pet, streak, alreadyCheckedIn, usedSkipDay, streakReset, stageChanged, newKeepsakes }` |
| Pet tab: streak only | Streak number and skip days | `getStreak()` (or use `getMyPet().streak`) |
| My Week | The last 7 days of check-ins | `getMyCheckIns(daysBefore(6), todayLocal())` |
| My Week | Listening recap per day (display only) | `getDailySummaries(fromDate, toDate)` |
| My Week / Pet tab | Top artists and genres | `getTopArtists()`, or `getSpotifyData()` for `{ recentlyPlayed, topArtists, topGenres }` in one call |
| Keepsakes | Unlocked mementos | `getMyKeepsakes()` (keys: `week_together`, `two_weeks_together`, `month_together`) |
| Settings: reminder | One friendly reminder a day | `getReminderPrefs()`, `saveReminderPrefs({ enabled, reminderHour, quietStart, quietEnd })` |
| Settings: disconnect Spotify | Removes all Spotify data | `disconnectSpotify()`. Also tell the user they can remove the app at spotify.com/account/apps |
| Settings: delete account | Deletes everything, signs out | `deleteAccount()`. Ask "Are you sure?" first; it can't be undone |

Helpers: `todayLocal()` and `daysBefore(n)` give `YYYY-MM-DD` dates.
`PET_COLORS[pet.colorKey]` gives `{ main, light, label }` for drawing the pet.
`GENRE_LABELS[genreKey]` gives a display name. `PET_RULES` has the numbers below.

## Pet rules

| Rule | Number |
|---|---|
| Egg hatches into baby | 3 days together |
| Baby grows up | 14 days together |
| Growth | +1 per check-in (skip days don't count) |
| Skip day earned | every 7 days of streak |
| Most skip days held | 2 |
| Keepsakes | 7, 14 and 30 days together |
| Pet shows `sleepy` | once a day is missed |

**Automatic skip day:** if the user misses exactly one day and has a skip day, the next
check-in uses it automatically and the streak keeps going (`usedSkipDay: true`). If they miss
more, the streak starts again at 1. Nothing else is lost.

## Pet colors (from genre)

The pet's color follows the most common genre among the user's last 14 songs of the day.
Spotify leaves many artists' genres blank, so plenty of songs are `other`.

| Color key | Genres |
|---|---|
| `pink` | pop, latin |
| `gold` | hip-hop, country |
| `red` | rock |
| `purple` | r&b / soul, jazz |
| `blue` | electronic, classical |
| `green` | indie, other (the default) |

The hex values in `PET_COLORS` are placeholders until Donalthea's colors are final.

## Demo mode

Set `EXPO_PUBLIC_DEMO_MODE=true` in `syncd-app/.env`. Spotify functions then return
fictional demo songs and artists with no network calls. If the Supabase keys are also empty,
the pet lives in memory on the phone, so the whole app can be demoed with no accounts.
`getSpotifyData().demo` is `true` whenever the data is demo data. You could show a small
"Demo" tag.

## Database tables (for reference)

You don't query these directly; the functions above do it. The app can only *read* rows that
belong to the logged-in user.

| Table | What it holds | Who can write |
|---|---|---|
| `spotify_connections` | Spotify tokens for each user (encrypted). One Spotify account per SYNCD account | Edge functions only. The app can't even read it |
| `pets` | One pet per user: name, stage, mood, color, growth, streak, skip days | Only the database functions (`adopt_pet`, `rename_pet`, `do_daily_check_in`) |
| `check_ins` | One row per day: song of the day, mood, note, or a skip day | Only `do_daily_check_in` |
| `daily_summaries` | Per-day listening recap: track count, top genre, top artist (display only) | Only the `spotify-data` edge function |
| `keepsakes` | Unlocked keepsakes | Only `do_daily_check_in` |
| `notification_prefs` | Reminder settings and push token | The user, for their own row |

## Database functions (RPCs) and edge functions

| Name | Kind | Used by |
|---|---|---|
| `get_my_pet(p_local_date)` | RPC | `getMyPet`, `getStreak` |
| `adopt_pet(p_name, p_local_date)` | RPC | `adoptPet` |
| `rename_pet(p_name, p_local_date)` | RPC | `renamePet` |
| `do_daily_check_in(p_track, p_local_date, p_mood, p_note)` | RPC | `checkIn` |
| `get_my_spotify_status()` | RPC | `getSpotifyStatus` |
| `disconnect_spotify()` | RPC | `disconnectSpotify` |
| `purge_old_spotify_data()` | RPC, server only | Runs daily (pg_cron). Clears Spotify data older than 8 weeks |
| `pet_rules()`, `pet_stage_for()`, `genre_key_for()`, `color_key_for_genre()` | Helpers | Inside the database |
| `spotify-auth` | Edge function | `connectSpotify` |
| `spotify-data` | Edge function | `getSpotifyData`, `getRecentSongs`, `getTopArtists` |
| `delete-account` | Edge function | `deleteAccount` |

## Spotify data we keep, and for how long

- Song details on check-ins and daily summaries are kept for **8 weeks** and then cleared
  automatically. The user's own mood and note stay.
- **Disconnect** deletes the tokens, all daily summaries, the song details on every check-in,
  and resets the pet's genre color. The pet itself, its growth, streak and keepsakes stay.
- **Delete account** removes everything.
