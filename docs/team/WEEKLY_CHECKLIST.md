# Weekly checklist: Nov 10 to Dec 7

Final deadline: **Sunday Dec 7**. Maurice's dates come from the team plan; the other dates are proposed, so move them at the next sync if needed. Tick boxes as you go and commit this file with your work.

Briefs: `SANJAY_BRIEF.md`, `DONALTHEA_BRIEF.md`, `NOOR_BRIEF.md`, `STP_TEST_CASES_DRAFT.md`.

## Status today (Mon Nov 10)

- **Nobody has committed anything pivot-related since Oct 22.** The last commit on `main` is the Oct 22 merge (song search + library).
- **Maurice:** backend in progress. The local branch `maurice/pet-backend` has an uncommitted migration (`20261110000000_pet_companion.sql`), `supabase/tests/security_checks.sql` and Edge Function folders (`spotify-auth`, `spotify-data` and `delete-account` are still empty). `lib/pet.ts` and `lib/spotify.ts` don't exist yet. The Nov 9 item (Spotify dev app + 5 users) needs confirming.
- **Sanjay:** the SDK 58 upgrade is **due today and not done**. The app is still on SDK 57 with the old 4 tabs.
- **Donalthea:** pet art exists **only in Figma**; nothing is exported to the repo.
- **Noor:** **nothing in the repo yet** (no STP or requirements).
- **Decision needed this week:** Maurice's draft maps 5 mood tags onto 4 pet moods and keeps hunger, happiness and growth fields. The product rule is that the pet's face mirrors the mood tag and missed days are sleepy, with no meters. Agree on this by Nov 12 so Sanjay and Donalthea build to the same model.
- Old branch `origin/sanjay/playlist-screen-library-data`: leave unmerged.

## Week 1: Nov 10 to 16 (foundations)

**Maurice**
- [ ] Nov 9 (late): Spotify dev app, owner on Premium, 5 testers allow-listed, redirect URI `syncd://spotify-auth` registered
- [ ] Nov 11: tables (pet, check-ins, daily summary, Spotify connection) + RLS, committed and pushed; schema posted for Sanjay
- [ ] Nov 11: settle the mood model (5 tags shown directly, sleepy for missed days, no hunger or happiness in the API)
- [ ] Nov 12: `spotify-auth` Edge Function (PKCE code exchange, tokens server-side) + `getRecentSongs`, `getTopArtists`, `getSpotifyStatus`
- [ ] Nov 12: add the missing lib functions Sanjay needs (connect, this week's check-ins, reminder prefs)

**Sanjay**
- [ ] **Nov 10: SDK 58 upgrade** (`npx expo install expo@^58 --fix`, `npx expo-doctor` clean, typecheck passes), pushed on a branch
- [ ] Nov 11: Android development build working on a phone or emulator
- [ ] Nov 12: 3 tabs (Pet, My Week, Settings) + Welcome, Age gate and Consent screens; old tabs removed
- [ ] Nov 14: `<SpotifyAttribution/>` component + Connect Spotify (expo-auth-session PKCE) against Maurice's function
- [ ] Nov 14: theme.ts updated with Donalthea's tokens

**Donalthea**
- [ ] Nov 12: app palette tokens + 6 pet colour keys (base/shade/light) sent to Sanjay
- [ ] Nov 14: exported to `syncd-app/assets/pet/`: `egg_body`, `egg_crack_1`, `egg_crack_2`, `baby_body`, `grown_body`, 5 faces + `face_blink`, `fx_zzz`
- [ ] Nov 14: official Spotify logo files downloaded into `syncd-app/assets/spotify/`

**Noor**
- [ ] Nov 12: pivot requirements list (R1 to R22) committed
- [ ] Nov 14: STP draft committed (outline in NOOR_BRIEF.md)

## Week 2: Nov 17 to 23 (features)

**Maurice**
- [ ] Nov 17: check-in, streak, stage and keepsake logic incl. automatic skip day; genre to colour
- [ ] Nov 19: `disconnectSpotify` + `deleteAccount` cleanup; demo mode with mock data (`EXPO_PUBLIC_DEMO_MODE`)
- [ ] Nov 20 to 21: DB and security tests with Noor (TC-25 to TC-28, TC-33)
- [ ] Nov 21: backdating SQL helper for Noor's date tests

**Sanjay**
- [ ] Nov 17: Adopt + Pet home (with demo data if the backend is late)
- [ ] Nov 19: 3-step check-in + result animations
- [ ] Nov 21: My Week (mood calendar + template diary) + Settings (disconnect, delete account, legal links)

**Donalthea**
- [ ] Nov 18: keepsakes (shelf + worn), `egg_shell_pieces`, fx files, `keepsake_slot_empty`
- [ ] Nov 21: animation specs (durations, easing, reduced-motion versions)
- [ ] Nov 21: dark mode checks done (list in brief)

**Noor**
- [ ] Nov 19: test cases agreed with the team
- [ ] Nov 20 to 21: run security and delete tests with Maurice; log results in the STR

## Week 3: Nov 24 to 30 (reminders, polish; Thanksgiving Nov 26, light week)

**Maurice**
- [ ] Nov 24: fix any backend failures from the security tests
- [ ] Nov 25: privacy policy + terms text final (Spotify third-party beneficiary, data retention)
- [ ] Start the final report backend and architecture sections

**Sanjay**
- [ ] Nov 24: reminders (local notifications, opt-in after the first check-in, max 1 per day, quiet hours)
- [ ] Nov 25: loading, empty and error states on every screen; game-word grep clean
- [ ] Nov 25: SETUP.md updated (SDK 58, dev build, 3 tabs, new env vars)

**Donalthea**
- [ ] Nov 24: app icon, adaptive icon, splash, favicon exported
- [ ] Nov 25: final screen mockups exported to `docs/team/mockups/` (Appendix C + SDD flow)

**Noor**
- [ ] Nov 24 to Dec 2: run the full STP on the dev build and in demo mode; send failures to their owners

## Week 4: Dec 1 to 7 (fix, freeze, submit)

**Everyone**
- [ ] Dec 1 to 3: fix High failures first, then Medium
- [ ] Dec 3: Noor's STR draft
- [ ] Dec 4: **code freeze**; merge to `main`
- [ ] Dec 5: Noor's STR final; demo video recorded (dev build + demo mode backup)
- [ ] Dec 5: Appendix B (React Native tutorial evidence, all 4) and Appendix C (individual mockups, all 4) collected
- [ ] Dec 6: final report proofread by everyone
- [ ] **Dec 7: submit**

## Must-haves before the freeze (from LEGAL_REVIEW.md)

- [ ] Only 2 Spotify scopes; PKCE; no tokens or secrets in the app
- [ ] RLS on every table; A/B test passes
- [ ] Disconnect deletes Spotify data; in-app delete account
- [ ] Privacy + terms before sign-up and in Settings
- [ ] Full Spotify logo + "OPEN SPOTIFY" on every Spotify screen; art uncropped
- [ ] 13+ age gate
- [ ] No game wording or mechanics; stats only from check-ins
- [ ] Reminders opt-in, max 1 per day, quiet hours, off switch
- [ ] Own palette and logo (not green-on-black, no circle or wave logo)
- [ ] No ads, payments or AI on Spotify data
