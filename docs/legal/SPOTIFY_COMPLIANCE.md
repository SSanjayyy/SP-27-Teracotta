> **Not legal advice — student project draft.**
> Compliance checklist for [APP NAME], a music journal with a living mascot (not a game).
> Sources, all read 2026-11-10:
> - Developer Policy (effective 15 May 2025): https://developer.spotify.com/policy
> - Developer Terms **v10** (effective 15 May 2025): https://developer.spotify.com/terms
> - Design guidelines: https://developer.spotify.com/documentation/design
>
> Clause numbers are as shown on those pages on that date. Recheck the numbering whenever Spotify updates a page.
> "Where" paths marked *(planned)* do not exist yet in the repo. Current code is in `supabase/migrations/20261110000000_pet_companion.sql` and `supabase/functions/`.

## 1. Clause checklist

| # | Rule (source) | How we comply | Where in code/screens | Status |
|---|---|---|---|---|
| 1 | **No games**, including trivia quizzes (Policy III.2) | Framed as a music journal with a living mascot. No points, levels, scores, leaderboards, win or lose states, and no "game" wording (see §2). The mascot never dies. | All UI copy; `pet_rules()` comment block in the pet migration; store listing *(planned)* | In progress: copy review needed |
| 2 | Don't artificially increase play counts "by providing any compensation (financial or otherwise)" (Policy II.2) | The mascot changes **only** through the daily check-in (`do_daily_check_in()`). The song is chosen from songs already played. Nothing reads listening volume or minutes. Copy never says "listen more". | `do_daily_check_in()`; `daily_summaries` is display-only; reminder copy (REMINDER_AND_DIARY_GUIDE.md) | Done in schema |
| 3 | Do not analyze Spotify Content or the Service; no building profiles of users (Policy III.13) | Genre → colour is a fixed per-user lookup. The diary uses fixed templates. No cross-user totals or profiles. | `genre_key_for()`, `color_key_for_genre()` | Done in schema |
| 4 | No ML/AI training or ingestion with Spotify Content (Policy III.14; Terms IV.2.1.1) | No LLM or AI service anywhere. Diary text comes from templates only. | `syncd-app/lib/diary.ts` *(planned)* | Keep enforced |
| 5 | Not targeted to children; block known or suspected children (Policy III.8) | 13+ age gate at sign-up. Under-13 accounts are blocked and deleted. No child-directed marketing. | `app/(auth)/sign-up.tsx` age step *(planned)* | To do |
| 6 | Privacy policy that clearly describes data use (Policy I); displayed **before** install or sign-up (Terms V.12) | PRIVACY_POLICY.md is shown on the sign-up screen before the account is created, and linked in Settings and the store listing. | `app/(auth)/sign-up.tsx`; Settings → Privacy *(planned)* | Draft written |
| 7 | Enforceable end-user agreement with minimum terms V.11.1 to V.11.5, including Spotify as third-party beneficiary (Terms V.11) | TERMS_OF_USE.md §5 and §6 mirror V.11.1 to V.11.5. Users must tick a required checkbox at sign-up. | `app/(auth)/sign-up.tsx` checkbox; Settings → Terms *(planned)* | Draft written |
| 8 | Only request the data needed (Policy I, minimisation) | Only scopes `user-read-recently-played` and `user-top-read` | `supabase/functions/_shared/spotify.ts`, `spotify-auth` | Check the scope string |
| 9 | Don't store Spotify Content indefinitely (Terms IV.3.1.1); store only as long as needed (Policy I) | 56-day maximum on all Spotify-derived rows | Scheduled purge job *(planned: not in the migration yet)* | **To do** |
| 10 | Local caching only as strictly necessary (Terms IV.3.2) | No offline song store. Only image cache for cover art. | Expo image cache | OK |
| 11 | Easy disconnect with clear instructions; on disconnect, delete and stop processing Spotify Personal Data (Policy I; Terms V.8); within 5 days (Terms Appendix A §5(c)) | Settings → Disconnect Spotify deletes tokens and daily summaries, and blanks song fields on check-ins immediately. | `disconnect_spotify()`; Settings screen *(planned)* | Done in schema. See open question Q1. |
| 12 | Attribute content to Spotify with Spotify Marks (Policy II.4.1) and link back to the album, content or playlist (Policy II.4.2) | Spotify logo on every screen showing Spotify data. Each song links to its Spotify page. | Pet check-in picker, My Week *(planned)* | To do |
| 13 | Metadata and cover art not offered as a standalone service (Policy II.4.3) | Only shown inside the user's own journal | — | OK |
| 14 | No implied endorsement, tie-in or co-branding (Policy II.1, VI.2; Terms IX.7) | "Not affiliated with Spotify" line in Privacy, Terms and About | Settings → About *(planned)* | Draft written |
| 15 | Name must not begin with "Spot" or sound or look like Spotify (Policy VI.2); no Spotify Marks in the app name (Terms IV.2.3.2) | Name is [APP NAME] (TBD). "for Spotify" is acceptable (design guidelines). | `app.json` name | Name pending |
| 16 | No data transfer to another service (Policy III.9) | No export or sharing of Spotify data to other services | — | OK |
| 17 | Don't mimic or replace a core Spotify experience (Policy III.11) | No playback, search or library screens in the new version. Song links open Spotify. | Remove old `search.tsx` / `library.tsx` tabs | To do |
| 18 | Commercial use not permitted (Policy IV.2; Terms III.1(a) "private personal use"); don't sell Spotify Content or data (Terms V.5) | No ads, payments or data sales. Personal, non-commercial use in the Terms of Use. | — | OK |
| 19 | Don't email users without explicit consent (Policy I) | Only account emails sent by Supabase Auth (sign-up confirmation, password reset). No marketing email. | Supabase Auth email templates | OK |
| 20 | Industry-standard security (Policy I) | Edge Function token exchange with PKCE, no secrets in the app bundle, RLS on every table, tokens in a table the app cannot read | `spotify_connections` RLS; `supabase/tests/security_checks.sql` | In progress |
| 21 | Never show more than 20 items in a content set (design guidelines) | Song-of-the-day picker shows at most 20 recent tracks | Check-in picker *(planned)*. Note: `spotify.ts` currently fetches `limit=50`, so cap the display at 20. | **To do** |

### Open questions
- **Q1. Pet colour after disconnect.** `disconnect_spotify()` resets `genre_key` to `'other'`, but the pet **keeps its colour**, which was derived from Spotify top-genre data. If the colour counts as Spotify Personal Data (Terms V.8), reset it to a neutral default on disconnect too. Safer choice: reset it.
- **Q2. "Do not analyze the Spotify Content… for any purpose" (Policy III.13)** is broad. Picking a colour from the user's own top genre is a display mapping, not analysis, but this is our interpretation and Spotify has not confirmed it.
- **Q3. Streaks.** "Streak" and "skip day" are not on the banned list, but a streak is a game-like mechanic. Prefer "days together" in the UI (see §2).

## 2. Words to use and avoid in UI copy

| Avoid | Why | Use instead |
|---|---|---|
| points, XP, coins | Game currency (III.2) | (no counter shown); "grows" |
| level, level up | Game progression (III.2) | grows, grew up, "is now a baby / grown-up" |
| score, high score, rank | Game scoring (III.2) | days together, check-ins this week |
| win, lose, beat, unlock, reward | Win or lose states (III.2) | keepsake, "you got a keepsake", "a little memento" |
| game, play (as in "play with your pet"), quest, challenge, mission | Game framing (III.2) | journal, check in, spend time with |
| leaderboard, friends' ranking, compare | Game plus cross-user analysis (III.2, III.13) | (no social ranking at all) |
| feed by listening, listen more, stream to grow, minutes, play count | Compensation for plays (II.2) | pick today's song, check in |
| hungry, starving, dying, sad because you left, don't let it down | Guilt or dark patterns | missed you, saved you a spot, whenever you're ready |
| streak (in headline copy), streak freeze | Game-like | days together, rest day |
| egg hatches as a "reward" | Reward framing | "{pet_name} hatched!" |
| Spotify-powered, official, by Spotify, Spot… (in the name) | Endorsement or naming (VI.2, IX.7) | "for Spotify", "uses your Spotify history" |
| AI diary, smart insights, analysis of your taste | AI or analysis (III.13, III.14) | your week, diary, a little recap |
| **Use freely:** grows, days together, keepsake, check in, song of the day, mood, journal, diary, mascot, companion, rest day | | |

## 3. Spotify attribution spec
Source: https://developer.spotify.com/documentation/design, read 2026-11-10. This lists only what that page says. Download the official logo files from that page. Do not redraw them.

**Logo or icon**
- In partner integrations, always use the **full logo** (icon plus wordmark).
- The icon may stand alone only as the app icon on a device's app screen.
- The wordmark must never appear without the icon.

**Minimum size**
- Full logo: at least **70px** digital, or 20mm print.
- Icon: at least **21px** digital, or 6mm print.

**Clear space**
- Exclusion zone = **half the height of the icon** on all sides.
- Keep the logo clear of busy image areas, low-contrast areas and text.

**Colour**
- **Green** logo only on a **black or white** background.
- On any other background, use a monochrome logo: **black on light** backgrounds, **white on dark** backgrounds.
- For our app: on any coloured card, use the black or white logo, not the green one.

**Link text**
- If the Spotify app is **not installed**: **GET SPOTIFY FREE**.
- If it **is installed**: **OPEN SPOTIFY**, **PLAY ON SPOTIFY** or **LISTEN ON SPOTIFY**.

**Album artwork**
- Use only artwork provided by Spotify, kept in its original form.
- Don't crop it in any way.
- Don't animate or distort it. This includes overlays and blurring, so no mood tints and no mascot over the art.
- Don't place our brand or logo on top of it.
- Corners **must be rounded**: **4px** radius on small and medium devices, **8px** on large devices.
- If space is limited, it's OK to leave artwork out.

**Metadata**
- Must always be legible. Don't manipulate content or metadata.
- May be truncated if space is limited, but the user must always be able to view the full metadata, for example with tap-to-expand.
- Design character counts: playlist or album name 25, artist name 18, track name 23.
- Metadata must always be accompanied by the Spotify brand.

**Other rules**
- Always attribute content from Spotify with the logo.
- Don't use the Spotify brand with any other brand or in co-branded communications.
- Spotify content should never sit next to content from similar services.
- Never show more than **20 items** in a content set.

**Our app name and logo**
- The name must not include "Spotify" or be similar in sound or spelling. Saying it is "for Spotify" is acceptable.
- Our logo must not include or look like the Spotify logo or brand elements: no Spotify Green, no circle, no waves.
- Don't use Spotify trademarks, in whole or part, in our company, product, app, service or website name.

**Where it applies:** the check-in song picker, the song-of-the-day card on the Pet tab, the song and artist of the week on My Week, and any keepsake that shows a song.
