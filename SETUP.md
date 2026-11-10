# SYNCD — Setup Guide

Every command used to set up the SYNCD mobile app, in order. Part 1 is how to
get it running on your machine. Part 2 is the log of how the project was
created, so we can repeat it or write it up later.

---

## Part 1 — Run the app on your machine

### Prerequisites (one time)

- **Node.js 20 LTS or newer** — https://nodejs.org (check with `node -v`)
- **Git** — check with `git --version`
- **Expo Go** on your phone (App Store / Google Play), *or* an Android emulator / iOS simulator
- A code editor (VS Code recommended)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/SSanjayyy/SP-27-Teracotta.git
cd SP-27-Teracotta/syncd-app

# 2. Install dependencies
npm install

# 3. Make sure every Expo package matches our SDK version (57)
npx expo install --fix

# 4. Set up Supabase keys (skip until the key is shared — the app still runs)
cp .env.example .env          # Windows PowerShell: copy .env.example .env
#    then open .env and paste in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY

# 5. Start the dev server
npx expo start
#    Scan the QR code with Expo Go (Android) or the Camera app (iOS).
#    Press "a" for Android emulator, "i" for iOS simulator, "w" for web.
```

**First person to run `npm install`:** commit the generated `package-lock.json`
so everyone installs the exact same versions:

```bash
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Useful commands

| Command | What it does |
|---|---|
| `npx expo start` | Start the dev server |
| `npx expo start -c` | Start with a cleared cache (try this first when things act weird) |
| `npm run typecheck` | Check TypeScript errors without running the app |
| `npx expo-doctor` | Check the project for version/config problems |
| `npx expo install <package>` | Install a package at the version that matches our Expo SDK (use this instead of `npm install` for anything React Native) |

### Troubleshooting: app won't open on your phone (timeout)

Your phone can't reach your laptop over the network. This is common on campus Wi-Fi.

1. Stop the server (Ctrl+C) and run `npx expo start --tunnel`. Say yes if it
   offers to install `@expo/ngrok`, then scan the new QR code.
2. Windows: allow Node.js through the firewall ("Allow an app through Windows
   Firewall" → tick Node.js for Private and Public).
3. Update Expo Go from the App Store / Play Store. An old Expo Go can't open an
   SDK 57 project.
4. To check the UI without a phone, press `w` to open it in the browser.

### Before the Supabase key is shared

The login screen shows a **"Continue without account (dev only)"** button when
there's no `.env` file. It drops you straight into the 4 tabs so you can build
screens. It disappears as soon as `.env` is filled in.

### Supabase dashboard settings (for whoever owns the project)

- **Authentication → Sign In / Providers → Email** must be enabled.
- **"Confirm email"** (under **Sign In / Providers → User Signups**, not inside
  the Email panel): if on, new users must click an email link before they
  can log in (the app tells them this). For class demos it's easier to turn it off.
- Use the **publishable** (`sb_publishable_…`) or legacy **anon** key in `.env`.
  Never the secret / service_role key.

### Database tables (Supabase)

The schema lives in `supabase/migrations/`. Our shared project already has it, so
ask the team for the project URL and publishable key. To set up a fresh project:

1. In the Supabase dashboard, open the **SQL Editor** and start a **New query**.
2. Run each file in `supabase/migrations/` in order (oldest date first), one per query:
   paste the whole file and click **Run**. Expect "Success. No rows returned". Run each file only once per project.
   - `20261009000000_initial_schema.sql`: tables and security rules
   - `20261016000000_discovered_playlist_and_covers.sql`: the "Discovered" playlist and album covers
   - `20261020000000_genre_breakdown.sql`: the genre breakdown for listening habits
   - `20261110000000_pet_companion.sql`: the pet, check-ins, streaks, keepsakes, Spotify
     connection and reminders (only adds things, so it's safe on the shared project). It also
     schedules a daily pg_cron job; if you see a notice that pg_cron isn't enabled, turn it on
     under **Database → Extensions → pg_cron** and run the last `do $$ ... $$;` block again.
3. Optional: run `supabase/seed.sql` to add sample songs.
4. Check it with:

   ```sql
   select tablename, rowsecurity from pg_tables where schemaname = 'public';
   ```

   You should see 15 tables, all with `rowsecurity = true`.
5. Run `supabase/tests/security_checks.sql` the same way. It ends with
   "ALL SECURITY CHECKS PASSED" and rolls everything back, so it leaves no test data.

What it creates:

| Table | Who can see it |
|---|---|
| `profiles` | Your own row. Created automatically when you sign up. You can't change your own `subscription_tier`. |
| `artists`, `albums`, `tracks` | Any logged-in user can read. Only added through the dashboard. |
| `playlists`, `playlist_tracks` | Only the owner (read, add, rename, delete). Every user gets a "Discovered" playlist at sign-up that can't be deleted. |
| `listening_history`, `identify_logs`, `ad_impressions` | Only the owner (read and add). |
| `pets`, `check_ins`, `daily_summaries`, `keepsakes` | Only the owner, read only. Changes go through the database functions, so nobody can edit their own streak or growth. |
| `notification_prefs` | Only the owner (read, add, change). |
| `spotify_connections` | Nobody in the app, not even the owner. Only edge functions can read the tokens. |

What each pet table and function is for, and which `lib/` function each screen calls, is in
`docs/SCHEMA_FOR_SANJAY.md`.

Changes to the schema go in a **new** file in `supabase/migrations/` (newer
timestamp at the front of the name). Don't edit one that's already been run.

### Using playlists in a screen

Don't write database code in screens. Import from `lib/playlists.ts`:

```ts
import { getMyPlaylists, createPlaylist } from '@/lib/playlists';

try {
  const playlists = await getMyPlaylists(); // [{ id, name, songCount, imageUrl, isDiscovered, ... }]
} catch (err) {
  // err.message is safe to show the user
}
```

Also there: `getDiscoveredPlaylist`, `renamePlaylist`, `deletePlaylist`,
`getPlaylistTracks`, `addTrack`, `removeTrack`, `moveTrack`, `searchTracks`.

Listening history is in `lib/listening.ts`: call `logPlay(trackId)` when a song
starts playing, `getRecentlyPlayed()` for Home's "Recently played", and
`getGenreBreakdown()` for the Profile tab (returns `[{ genre, plays, percent }]`).

The pet, check-in, Spotify and reminder functions are in `lib/pet.ts`, `lib/spotify.ts`
and `lib/reminders.ts`. See `docs/SCHEMA_FOR_SANJAY.md` for which one each screen calls.

### Edge functions & Spotify

Spotify login and data go through three Supabase Edge Functions in `supabase/functions/`, so
the Spotify tokens never sit in the app:

| Function | What it does |
|---|---|
| `spotify-auth` | Finishes "Connect Spotify": swaps the login code for tokens, saves them, returns the Spotify display name |
| `spotify-data` | Recently played songs and top artists (20 each at most), refreshing the token when needed. `?demo=1` returns fictional demo data |
| `delete-account` | Deletes the logged-in user and everything they own |

Shared code is in `supabase/functions/_shared/`.

**1. Spotify Developer Dashboard** (https://developer.spotify.com/dashboard, whoever owns the app):

- Open the app → **Settings** → **Redirect URIs** and add every address the app logs in from:
  - `syncd://spotify-callback` (phone builds; `syncd` is the scheme in `app.json`)
  - `http://localhost:8081/spotify-callback` (Expo web on your machine)
  - In Expo Go the address looks like `exp://192.168.x.x:8081/--/spotify-callback`. Print
    `AuthSession.makeRedirectUri({ scheme: 'syncd', path: 'spotify-callback' })` once and add
    exactly what it shows.
- **APIs used:** Web API.
- **User Management:** add each tester's Spotify email (dev mode allows only a few users;
  anyone not on the list gets an error when connecting).
- Copy the **Client ID**. You don't need the Client Secret: the app uses PKCE.

**2. Supabase CLI** (one time): `npm install -g supabase` (or use `npx supabase ...`), then

```bash
supabase login
supabase link --project-ref unwytogkxdmmjmpiqxkm
```

**3. Secrets** (stored by Supabase, never in the app or the repo):

```bash
# Required: the Spotify app's Client ID
supabase secrets set SPOTIFY_CLIENT_ID=your-client-id
# Required: the redirect URIs logins may use (comma-separated, no spaces). Must match the
# Spotify dashboard exactly. If this is missing or empty, EVERY login is refused.
supabase secrets set SPOTIFY_REDIRECT_URIS=syncd://spotify-callback,http://localhost:8081/spotify-callback
# Required: the key that encrypts Spotify tokens in the database (32 random bytes, base64).
# Run this once and don't change it: changing it means everyone has to connect Spotify again.
supabase secrets set TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
# Optional: if Spotify fails, return demo data instead of an error (good for class demos)
supabase secrets set DEMO_MODE=true
```

On Windows without `openssl`, run this in PowerShell to make the key, then pass it to
`supabase secrets set TOKEN_ENCRYPTION_KEY=...`:
`$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)`.
(Git Bash includes `openssl`, so the command above works there too.)

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to edge functions automatically.
There is no client secret: login uses PKCE only.

**4. Deploy** (again after any change to `supabase/functions/`):

```bash
supabase functions deploy spotify-auth
supabase functions deploy spotify-data
supabase functions deploy delete-account
```

**5. The app:** in `syncd-app/.env` set `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` (see `.env.example`)
and install the login packages:

```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

**Demo mode:** `EXPO_PUBLIC_DEMO_MODE=true` in `syncd-app/.env` makes the app use fictional
songs with no Spotify calls. With no Supabase keys either, the pet lives on the phone only.

**Spotify data rules:** we only ask for `user-read-recently-played` and `user-top-read`, show
at most 20 items of Spotify content in a list, delete all Spotify data when the user
disconnects, and clear song details older than 8 weeks every night (pg_cron).

---

## Part 2 — How this project was created (command log)

### Repo cleanup

```bash
git clone https://github.com/SSanjayyy/SP-27-Teracotta.git
cd SP-27-Teracotta

# Remove the stray nested-repo entry (it was an empty folder linked as a submodule)
git rm --cached syncd-app/repo-temp
rmdir syncd-app/repo-temp

# Collapse the doubled syncd-app/syncd-app folder: keep the old Vite web
# prototype as a design reference, free up syncd-app/ for the Expo app
git mv syncd-app/syncd-app prototype-web
rmdir syncd-app
```

(The CS 3502 `file_manager.py` had already been deleted in an earlier commit.)

### Expo project

The project was written by hand to match what these commands produce
(the build machine had no npm access). To recreate it from scratch:

```bash
# Blank TypeScript Expo app (SDK 57)
npx create-expo-app@latest syncd-app --template blank-typescript
cd syncd-app

# Expo Router (file-based navigation + tabs) and its peer packages
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# Web support (optional, lets you press "w" to run in a browser)
npx expo install react-dom react-native-web

# Tab icons
npx expo install @expo/vector-icons

# Supabase Auth + session storage (keeps people logged in after reopening the app)
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

Then:
- `package.json` → `"main": "expo-router/entry"`
- `app.json` → `"scheme": "syncd"`, `"plugins": ["expo-router"]`
- `tsconfig.json` → `"paths": { "@/*": ["./*"] }`

### Project layout

```
syncd-app/
├── app/
│   ├── _layout.tsx          # Root: AuthProvider + logged-in/logged-out switch
│   ├── (auth)/              # Shown when logged out
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── (tabs)/              # Shown when logged in — the 4 core tabs
│       ├── _layout.tsx      # Tab bar
│       ├── index.tsx        # Home
│       ├── search.tsx
│       ├── library.tsx
│       └── profile.tsx      # Shows email + Log out
├── components/              # AuthForm, shared UI (Screen, Button, Input…)
├── constants/theme.ts       # Midnight + Electric Blue colors
├── context/auth.tsx         # Session state, signIn / signUp / signOut
├── lib/supabase.ts          # Supabase client (session saved with AsyncStorage)
└── .env.example             # Copy to .env and add the Supabase URL + key
```

### Adding screens

Keep the tab bar at 4 tabs. New screens go inside a tab's folder, e.g.
turn `library.tsx` into `library/index.tsx` and add `library/playlist/[id].tsx`
with a `library/_layout.tsx` Stack.
