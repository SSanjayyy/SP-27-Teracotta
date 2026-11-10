# Sanjay brief: app screens (Expo)

Written 2026-11-10. Owner: Sanjay. Backend contact: Maurice.

## The one-line framing

SYNCD is now **a music journal with a living mascot**. It is not a game. Spotify's Developer Policy III.2 bans games, so the app has no points, levels, scores, XP, win/lose, leaderboards or "feed the pet" wording anywhere. The pet changes **only** when the user does the daily check-in. It never depends on how much they listen.

Words to use: check in, song of the day, mood, keepsake, days in a row, grows up, sleepy.
Words to never use in the UI: game, play (as in "play with your pet"), level, XP, points, score, win, lose, unlock, reward, feed, hungry, "listen more".

## Navigation map

```
app/
  _layout.tsx                 Root: gates in this order -> age gate -> consent -> auth -> Spotify -> pet -> tabs
  (onboarding)/
    welcome.tsx               What the app is, "Get started"
    age.tsx                   13+ age gate
    consent.tsx               Privacy policy + terms, must agree before sign-up
  (auth)/                     Keep: sign-in, sign-up, forgot-password (restyle only)
  connect-spotify.tsx         Connect Spotify (PKCE)
  adopt.tsx                   Adopt the egg + name it
  check-in/
    _layout.tsx               Modal stack, shared check-in state
    song.tsx                  Step 1: song of the day
    mood.tsx                  Step 2: mood tag
    note.tsx                  Step 3: optional note + confirm
  legal/privacy.tsx, legal/terms.tsx
  (tabs)/
    _layout.tsx               3 tabs: Pet, My Week, Settings
    index.tsx                 Pet
    week.tsx                  My Week
    settings.tsx              Settings
components/SpotifyAttribution.tsx   (required, see below)
```

Tabs are exactly three: **Pet** (`index`), **My Week** (`week`), **Settings** (`settings`). The old "keep 4 tabs" comment in `app/(tabs)/_layout.tsx` and SETUP.md no longer applies; please update SETUP.md when you retire the old tabs.

## Backend functions you call

Maurice is building these in `syncd-app/lib/pet.ts` and `syncd-app/lib/spotify.ts`. Never write Supabase queries in screens, and never call Spotify's API or token endpoint from the app. Exact return shapes come from Maurice's code; check with him before you build each screen.

| Function | File | Used by |
|---|---|---|
| `adoptPet(name)` | lib/pet.ts | Adopt |
| `getMyPet()` | lib/pet.ts | Root gate, Pet, check-in result |
| `checkIn({ track, moodTag, note })` | lib/pet.ts | Check-in step 3 |
| `getStreak()` | lib/pet.ts | Pet, My Week |
| `deleteAccount()` | lib/pet.ts (confirm with Maurice) | Settings |
| `getRecentSongs()` | lib/spotify.ts | Check-in step 1 |
| `getTopArtists()` | lib/spotify.ts | Adopt (sets colour), My Week |
| `getSpotifyStatus()` | lib/spotify.ts | Root gate, Settings |
| `disconnectSpotify()` | lib/spotify.ts | Settings |

**Gaps to raise with Maurice today** (screens need them but they are not in the list yet):
1. A function that sends the Spotify auth `code` + `codeVerifier` + `redirectUri` to the `spotify-auth` Edge Function, for example `connectSpotify(...)`.
2. A function that returns this week's check-ins (date, mood tag, song, note, skip day) for My Week, for example `getMyWeek(startDate)`.
3. Get/save reminder settings (`notification_prefs` table), for example `getReminderPrefs()` / `saveReminderPrefs()`.
4. **Mood model.** Maurice's draft SQL maps the 5 mood tags onto 4 pet moods (`happy/content/sleepy/lonely`) and still has `hunger`, `happiness` and `growth` fields. The product rule is now: the pet's face **mirrors the chosen mood tag** (joyful, calm, sleepy, fired_up, thoughtful), and missed days show **sleepy**. Ask him to return the mood tag directly. Do not show hunger, happiness or growth numbers anywhere in the UI.

## Every screen: the four states

Every screen that loads data has the same four states. Build them once as shared pieces in `components/ui.tsx` (you already have `Notice` and a spinner).

- **Loading:** spinner or a skeleton. No layout jump when data arrives.
- **Empty:** a friendly line plus the next action (examples below).
- **Error:** the error message from lib (it is safe to show) plus a "Try again" button. Never a blank screen.
- **Demo:** when `EXPO_PUBLIC_DEMO_MODE=true`, the lib functions return mock data. Show a small "Demo mode" badge in the header of every tab. Every flow must still work end to end.

## Screen by screen

### 1. Welcome
- Calls: nothing.
- Shows the app name, the pet egg art, one sentence ("A music journal with a little companion who keeps you company"), and a "Get started" button. Add "for Spotify" if you want, but never imply Spotify endorses the app.

### 2. Age gate (13+)
- Calls: nothing (local only).
- Ask for date of birth with a neutral picker (no hint about the right answer). Under 13: show a kind "Sorry, SYNCD is for people 13 and older" screen and do not continue. Remember the block on the device (AsyncStorage) so changing the answer right away doesn't work.
- Store only "age check passed: true". Don't store the birth date.

### 3. Consent
- Calls: nothing. Links to `legal/privacy` and `legal/terms` (text from Noor/Maurice; the terms must name Spotify as a third-party beneficiary).
- An "I agree to the Privacy Policy and Terms" checkbox. The sign-up button stays disabled until it is ticked. This must happen **before** sign-up.

### 4. Sign in / Sign up / Forgot password
- Keep the existing screens and `AuthForm`. Restyle only, with Donalthea's new theme.

### 5. Connect Spotify
- Calls: `getSpotifyStatus()` on open; the new connect function (gap 1) after login.
- Use `expo-auth-session` with PKCE and `expo-web-browser`:
  - Put `WebBrowser.maybeCompleteAuthSession()` at the top of the file.
  - `useAuthRequest` with `clientId` from `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`, `scopes: ['user-read-recently-played', 'user-top-read']` (only these two), `usePKCE: true`, and `redirectUri: makeRedirectUri({ scheme: 'syncd', path: 'spotify-auth' })`.
  - Discovery: `authorizationEndpoint: 'https://accounts.spotify.com/authorize'`, `tokenEndpoint: 'https://accounts.spotify.com/api/token'`.
  - On success, send `response.params.code`, `request.codeVerifier` and the redirect URI to Maurice's function. **Do not** exchange the code in the app, and never store or log tokens. The Edge Function keeps them server-side.
- The redirect URI must match one registered in the Spotify Dashboard exactly. Expo Go uses an `exp://` address, so test this screen in the **development build**.
- States: loading while the browser is open; error if the user cancels ("No problem, you can connect any time"); 403 means the account isn't one of the 5 allow-listed testers, so say that. Demo: the button skips straight to Adopt.
- Show the Spotify logo here as "Connect with Spotify", following Spotify's design guidelines.

### 6. Adopt the egg
- Calls: `getTopArtists()` (so the backend can set the colour), then `adoptPet(name)`.
- Shows the egg in its genre colour, a name field (1 to 24 characters, show a counter), and an "Adopt" button.
- If top artists include Spotify data on screen (artist names or images), show `<SpotifyAttribution/>`.
- Empty: no top artists yet means the pet gets the default colour. That's fine; don't block.

### 7. Pet (home tab)
- Calls: `getMyPet()`, `getStreak()`.
- Shows: the pet (stage body + mood face + colour + worn keepsakes), the pet's name, "X days in a row", skip days held, and one main button:
  - Not checked in today: "Today's check-in".
  - Checked in today: today's song card (uncropped album art, title, artist) and "See you tomorrow".
- If yesterday was covered by a skip day: a gentle line, "Yesterday was a skip day, your streak is safe."
- Missed days: the pet is sleepy (zzz). It never dies, never looks sad or sick, and there is no guilt text.
- Keepsakes shelf: 3 slots (7, 14, 30 check-ins). Empty slots read "Soon". Don't use "locked".
- No hunger, happiness or growth bars.
- `<SpotifyAttribution/>` whenever today's song card is visible.
- Empty: no pet means the user is sent to Adopt. Error: retry card.

### 8. Check-in (3 steps, modal)
One check-in per day. If `getMyPet()` says the user already checked in today, show the result screen instead of the steps.

**Step 1: Song of the day.** Calls `getRecentSongs()`. Shows a list of recently played tracks with square, uncropped art, title and artist. Each row links back to Spotify (track URL). `<SpotifyAttribution/>` on the screen. Pick one, then "Next".
- Empty: "No recent songs found yet. Once you've played something on Spotify it will show up here." Don't tell the user to listen more.
- Error "Spotify not connected": button to Connect Spotify.

**Step 2: Mood.** Five chips, each with the matching pet face: Joyful, Calm, Sleepy, Fired up, Thoughtful (sent as `joyful`, `calm`, `sleepy`, `fired_up`, `thoughtful`). One must be picked.

**Step 3: Note + confirm.** Optional note, 140 characters maximum, with a live counter, and a summary of the song and mood. "Check in" calls `checkIn({ track, moodTag, note })`.
- Result screen: the pet reacts with that mood's animation. If the stage changed (3 check-ins hatches the egg into a baby, 14 grows it up) play the hatch or grow-up animation. If a keepsake was just added (7, 14, 30 check-ins), show it.
- **After the first ever check-in only:** offer reminders (see Reminders). Never ask at app launch.
- Errors: "already checked in today" means show the result; network error means keep the user's picks and offer a retry.

### 9. My Week
- Calls: `getStreak()`, the week function (gap 2), `getTopArtists()`.
- **Mood calendar:** 7 day cells (Mon to Sun) with a mood colour dot and a tiny face. Skip days get their own mark. Missed days are blank with a small zzz, not red. Tap a day to see its song (art + link), mood and note. Arrows go to earlier weeks (only as far as the backend keeps data, about 8 weeks).
- **Weekly diary:** 2 to 4 sentences built **in the app from fixed templates**. No AI, and no Spotify data sent anywhere. Example templates:
  - "This week {petName} felt mostly {topMood}."
  - "You checked in {count} of 7 days."
  - "Your song of the week: {trackName} by {artistName}."
  - With 0 check-ins: "A quiet week. {petName} had a long nap."
- "Your top artists lately" from `getTopArtists()`, with attribution.
- `<SpotifyAttribution/>` on this screen (it shows songs and artists).
- Empty: first week with no check-ins shows the quiet-week template and a "Check in" button.

### 10. Settings
- Calls: `getSpotifyStatus()`, `disconnectSpotify()`, reminder prefs (gap 3), `deleteAccount()`.
- Sections:
  - **Spotify:** "Connected as {displayName}" + Disconnect. The confirm dialog says what is deleted: "This deletes all your Spotify songs and history from SYNCD. Your pet stays." After disconnecting, show "Connect Spotify" again.
  - **Reminders:** on/off, time, quiet hours (start/end). Default is off until the user opts in.
  - **About:** Privacy Policy, Terms, "SYNCD is not affiliated with Spotify", app version, "Demo mode" badge if on.
  - **Account:** Log out; **Delete account** (red). Two-step confirm: dialog, then type DELETE. Then call `deleteAccount()`, sign out, and go to Welcome. Note for the report: Google Play also wants a web link for account deletion.

## Reminders (local notifications)

Use `expo-notifications` **local scheduled** notifications. That avoids server push and Apple's paid account.
- Ask permission only after the first check-in, with our own friendly screen first, then the system prompt. If the user says no, the app works exactly the same.
- **At most 1 per day:** call `cancelAllScheduledNotificationsAsync()` before scheduling, so only one is ever pending. If the user has already checked in today, schedule for tomorrow.
- **Quiet hours:** never schedule inside quiet hours (default 22:00 to 08:00). Don't let the time picker pick a time inside them.
- Kind wording only. Example: "{petName} saved you a spot. Pick a song of the day when you're ready." No guilt, no "your pet is sad".
- Turning reminders off cancels everything scheduled.

## `<SpotifyAttribution/>` (required)

`components/SpotifyAttribution.tsx`, used on **every screen that shows Spotify data**: Connect, Adopt (if artists are shown), Pet (song card), Check-in step 1, My Week, and any day detail.

- Shows the **full Spotify logo** (icon + wordmark), not just the circle icon. Use the official file downloaded from Spotify's design page (developer.spotify.com/documentation/design), saved as `syncd-app/assets/spotify/spotify_full_logo_white.png` and `..._black.png`. Never redraw, recolour, stretch or crop it.
- At least 70 px wide. On our dark background use the **white** logo (green is only allowed on black or white).
- An "OPEN SPOTIFY" link next to it that opens the item's Spotify URL (or `https://open.spotify.com`) with `Linking.openURL`.
- Props: `url?: string`, `variant?: 'inline' | 'footer'`.
- Album art everywhere: square, `resizeMode="contain"`, never cropped, no filters or overlays on the art.
- Noor will check every Spotify screen for this.

## SDK 58 upgrade (due today, Nov 10)

Do this on a new branch, for example `sanjay/sdk-58`, from `main`.

```bash
cd syncd-app
npx expo install expo@^58 --fix        # moves every Expo package to the SDK 58 version
npx expo-doctor                         # fix everything it reports, run again until clean
npx expo install expo-auth-session expo-web-browser expo-crypto expo-notifications expo-device expo-dev-client react-native-svg
npm run typecheck
npx expo start -c                       # check the app still opens
```

- Update Expo Go on your phone to the SDK 58 version for quick screen checks.
- **Expo Go has not supported push notifications since SDK 53**, and the Spotify redirect needs our own `syncd://` scheme. So make a **development build** for real testing: `npx expo run:android` (needs Android Studio) or `eas build --profile development --platform android`. Remote push would need a dev build plus FCM (and Apple's paid account for iOS). We only need **local** notifications through `expo-notifications`, and they should be tested in the dev build.
- Add `expo-notifications` and `expo-web-browser` to `plugins` in `app.json` if `expo-doctor` or the docs ask for it.
- Commit `package.json` and `package-lock.json` together, and change "SDK 57" to "58" in SETUP.md.

## Old files to retire

The pivot removes the music-player parts. Delete these in one clean commit after the new tabs work:

- `app/(tabs)/search.tsx`, `app/(tabs)/library.tsx`, `app/(tabs)/profile.tsx` (move Log out into Settings). Rewrite `app/(tabs)/index.tsx` as Pet.
- `components/AlbumCard.tsx`, `CategoryCard.tsx`, `PlaylistCard.tsx`, `PlaylistRow.tsx`, `SearchBar.tsx`, `ProfileAvatar.tsx`. Look at `SongRow.tsx` first; keep it only if it fits the recent-songs list without playlist code.
- `lib/playlists.ts` and `lib/listening.ts`. **Check with Maurice first:** `playlists.ts` exports shared helpers (`ensureConfigured`, `fail`, `one`) that his new files may import.
- Keep: `AuthForm`, `FormField`, `IconButton`, `SectionHeader`, `SettingsRow`, `ui.tsx`, `context/auth.tsx`, `lib/supabase.ts`.
- Don't edit old migrations. Maurice decides what to do with the old tables.
- `prototype-web/` is only a reference. Don't reuse its Spotify-like look.

**Branch `origin/sanjay/playlist-screen-library-data`:** leave it **unmerged**. It adds a playlist screen and modal for the Library tab, which is being removed. Keep the branch as a record and don't delete it.

## Done means
- All screens above, each with loading, empty, error and demo states.
- Attribution on every Spotify screen, with uncropped art.
- No game words in any string. Run `grep -rniE "game|level|xp|points|score|feed|hungry|unlock|reward" app components` before every PR.
- Runs in the Android dev build and in demo mode.
