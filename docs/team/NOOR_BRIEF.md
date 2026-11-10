# Noor brief: STP, STR and requirements

Written 2026-11-10. Owner: Noor. Draft cases: `docs/team/STP_TEST_CASES_DRAFT.md`.

## Framing (use these words in every doc)

SYNCD is **a music journal with a living mascot** that sits next to Spotify. It is **not a game**: Spotify's Developer Policy III.2 bans games. In the STP, STR, SRS and final report, never call it a game, and don't use "levels", "points", "XP", "score", "win" or "feed". Use check-in, song of the day, mood, stage, keepsake and days in a row instead.

## Your tasks

1. **Nov 12: Requirements list.** Rewrite the requirements for the pivot using the IDs below. Remove playlists, search, playback, ads and Identify.
2. **Nov 14: STP draft** committed to the repo (Word/PDF is fine for the course, plus a copy or link in `docs/`). Follow the course template; if its headings differ from the outline below, keep the template's headings and move the content under them.
3. **Nov 19: Test cases final.** Go through the draft table with the team. Each owner confirms their rows.
4. **Nov 20 to 21: DB and security tests** with Maurice (A/B account tests, delete tests).
5. **Nov 24 to Dec 2: Run the full STP** on the Android dev build and in demo mode. Log results in the STR.
6. **Dec 3: STR draft**, with every failure reported to its owner.
7. **Dec 5: STR final** + the testing section of the final report.

## Requirement IDs

| ID | Requirement |
|---|---|
| R1 | 13+ age gate; under-13s are blocked |
| R2 | Privacy policy and terms shown and agreed **before** sign-up; linked in Settings; terms name Spotify as a third-party beneficiary |
| R3 | Email sign-up, log in, log out, forgot password |
| R4 | Connect Spotify with PKCE; only `user-read-recently-played` + `user-top-read`; no tokens on the device |
| R5 | Adopt one egg per account and name it (1 to 24 characters) |
| R6 | Daily check-in: song from recently played + 1 of 5 mood tags + optional note (max 140 characters); once per day |
| R7 | Pet mood mirrors the chosen mood tag |
| R8 | Stages: egg (0) -> baby (3 real check-ins) -> grown (14) |
| R9 | Automatic skip day keeps the streak (earn 1 per 7 days in a row, hold max 2) |
| R10 | Pet never dies; missed days make it sleepy |
| R11 | Keepsakes at 7 / 14 / 30 real check-ins |
| R12 | Top genre -> one of 6 pet colours |
| R13 | My Week: mood calendar + weekly diary from fixed templates (no AI) |
| R14 | Spotify attribution (full logo + "OPEN SPOTIFY") on every screen with Spotify data; art uncropped |
| R15 | Disconnect Spotify deletes all Spotify-derived data and stops requests |
| R16 | In-app account deletion removes everything |
| R17 | Data privacy: a user can only read their own data; tokens are never readable by the app |
| R18 | Reminders: opt-in after the first check-in, max 1 per day, quiet hours, kind wording, easy off |
| R19 | Not a game: no game wording or mechanics; pet changes only via check-in, never via listening volume |
| R20 | Demo mode (`EXPO_PUBLIC_DEMO_MODE=true`) works end to end with mock data |
| R21 | Every screen has loading, empty and error states |
| R22 | Own branding: name doesn't start with "Spot", no green-on-black, no circle or wave logo |

## STP outline

1. **Introduction:** purpose, scope (the pivoted app only), references (SRS, SDD, LEGAL_REVIEW.md, Spotify Developer Policy and Terms, design guidelines).
2. **Test items:** the Expo app (`syncd-app`, SDK 58, Android dev build + Expo Go for quick UI checks), the Supabase database + RLS (`supabase/migrations`), and the Edge Functions (`spotify-auth`, `spotify-data`, `delete-account`).
3. **Features to be tested:** R1 to R22.
4. **Features not tested:** iOS push (no paid Apple account), app store submission, more than 5 Spotify users (dev mode limit), load testing.
5. **Approach:**
   - Manual functional tests on the dev build.
   - SQL tests for RLS and delete (`supabase/tests/security_checks.sql`, Maurice).
   - A copy review for game words: `grep -rniE "game|level|xp|points|score|feed|hungry|unlock|reward" syncd-app/app syncd-app/components`.
   - Date-dependent tests (streak, skip day, stages) need Maurice's SQL to backdate check-ins. The app only accepts today's date.
   - Demo mode run for every flow.
6. **Pass/fail criteria:** a case passes when the actual result matches the expected result exactly. The release passes with **0 open High** and no more than 3 open Medium failures.
7. **Suspension and resumption:** stop if login or the database is down; resume after a fix.
8. **Test environment:** Android phone or emulator with the dev build, a Supabase project (`unwytogkxdmmjmpiqxkm`), 5 allow-listed Spotify test accounts (with A and B as the two main ones), and a desktop browser for the Supabase SQL editor.
9. **Test data:** Accounts A and B, each with a pet; one fresh account C; one under-13 date of birth; mock data for demo mode.
10. **Schedule:** see `WEEKLY_CHECKLIST.md`.
11. **Roles:** Noor runs all tests and writes the STR. Owners fix: Sanjay (UI), Maurice (DB, functions, security), Donalthea (art, branding).
12. **Risks:** Spotify 403 for non-allow-listed users (use demo mode as backup), no iOS push, Thanksgiving week, late backend functions.

## STR columns

Use the same table as the draft and fill in **Actual result**, **Pass/Fail**, **Severity** (Low/Medium/High), **Date**, **Tester** and **Bug notes**. Severity guide:
- **High:** policy, security or data loss (attribution missing, another user's data visible, delete doesn't delete, under-13 gets in), or a flow crashes.
- **Medium:** a feature works wrong but there is a workaround (wrong stage art, counter off).
- **Low:** cosmetic (spacing, typo, colour).

The draft table pre-fills the severity a failure **would** get. Change it if the actual bug is milder.
