> **Not legal advice — student project draft.**
> **DRAFT for Noor to finalize.** Noor owns the privacy text. Team items to fill in are in [square brackets]. Before any public release, have the course instructor or KSU legal counsel review it.
> Source rules: Spotify Developer Terms v10 §V.12 (show a privacy policy before sign-up) and Developer Policy §I (Users and Data), both read 2026-11-10.

# [APP NAME] Privacy Policy

**Last updated:** [date]  ·  **Draft version:** 0.1

[APP NAME] is a music journal with a living mascot. Each day you can check in: pick a song of the day, tag your own mood, and, if you want, add a short note. Your mascot changes with your check-ins.

[APP NAME] is a student project built for CS 4850 (Senior Project) at Kennesaw State University. It is not a commercial product.

## The short version
- We collect only what the journal needs to work.
- We do not sell your data. We do not show ads. We do not use your data to train or run AI.
- We keep data that comes from Spotify for **56 days at most**.
- If you disconnect Spotify, we delete everything that came from Spotify.
- If you delete your account, we delete everything.
- You must be **13 or older** to use [APP NAME].

## 1. What we collect and why

| What | Where it comes from | Why we need it |
|---|---|---|
| **Email address and password login** | You, at sign-up. Login is handled by our database provider, Supabase (Supabase Auth). We never see or store your password in plain text. | To create your account and let you sign in. |
| **Your recently played tracks** (track name, artist, album art, link) | Spotify, with your permission (scope `user-read-recently-played`) | So you can pick your song of the day from songs you already played. |
| **Your top artists** (artist name and genre) | Spotify, with your permission (scope `user-top-read`) | To pick your mascot's colour and show your "artist of the week" in your weekly diary. |
| **Spotify login tokens** | Spotify, when you connect | So we can fetch the two lists above. They are kept on our server only, never on your phone, and the app itself cannot read them. |
| **Your check-ins:** song of the day, mood tag (joyful, calm, sleepy, fired up or thoughtful) and an optional note of up to 140 characters | You | This is your journal. Your mascot changes only when you check in. |
| **Your mascot's name and keepsakes** | You and your check-ins | To show your mascot and the keepsakes you get at 7, 14 and 30 check-ins. |
| **Push notification token, reminder time and quiet hours** | Your phone, only if you turn reminders on | To send at most one friendly reminder a day. Reminders are off until you choose to turn them on after your first check-in. |
| **Age confirmation** (that you are 13 or older) | You, at sign-up | To keep the app for people aged 13 and up. |

**What we do not do:**
- We do not read how much or how long you listen. Your mascot never changes based on listening time or play counts.
- We do not ask Spotify for your playlists, your saved library, your email on Spotify, or playback control. We request only the two scopes named above.
- We do not collect your location, contacts or photos.
- We do not use advertising or tracking cookies or SDKs. [Noor: confirm with Sanjay that the app includes no analytics or crash SDK. If it does, name it here.]

## 2. How we use your data
- To show **you** your own journal, mascot and weekly diary. Your data is shown only to you. We do not have public profiles, friend lists or rankings.
- The mascot's colour comes from a simple lookup from your top genre. Your weekly diary is filled in from fixed sentence templates. **No AI or machine-learning service ever receives your Spotify data or your notes.**
- We do not combine your data with other users' data. We do not build profiles about you and we do not target you with anything.

## 3. Who we share it with
We **never sell** your data and we **never share it with advertisers**. We use these services only to run the app:
- **Supabase** stores your account and journal. [Noor: add the hosting region from the Supabase dashboard.]
- **Spotify** receives your login request when you connect your Spotify account.
- **Expo push notification service** (and Apple or Google, which deliver the push) receives your push token and the reminder text, only if you turn reminders on.

We may disclose data if the law requires it.

## 4. How long we keep it
| Data | How long |
|---|---|
| Data from Spotify (recent tracks, top artists, song details on your check-ins, daily recaps) | **56 days at most**, then deleted automatically. Deleted straight away if you disconnect Spotify. |
| Spotify login tokens | Until you disconnect Spotify or delete your account |
| Your own mood tags, notes, mascot name and keepsakes | Until you delete them or delete your account |
| Account (email) | Until you delete your account |

## 5. Your choices
- **Disconnect Spotify:** go to Settings → Disconnect Spotify. We delete your Spotify tokens and all data that came from Spotify right away (Spotify requires this within 5 days; we do it immediately). Your own words (mood tags and notes) stay unless you delete them. You can also remove [APP NAME]'s access at spotify.com/account/apps.
- **Delete your account:** go to Settings → Delete account. This deletes your account and everything linked to it. [Noor: add the web deletion link required by Google Play once it exists.]
- **Reminders:** turn them on or off, change the time, or set quiet hours at any time in Settings.
- **Questions or requests:** email [team contact email].

## 6. Age
[APP NAME] is for people **13 and older**. We ask your age at sign-up. If we learn that a user is under 13, we will delete the account. If you believe a child under 13 is using [APP NAME], contact [team contact email].

## 7. Spotify
[APP NAME] is an independent student project made for Spotify users. It is **not affiliated with, sponsored by or endorsed by Spotify.** Song, artist and artwork information is provided by Spotify and links back to Spotify. Spotify is a trademark of Spotify AB. How Spotify handles your data is covered by Spotify's own privacy policy.

## 8. Security
Spotify tokens are stored only on our server, in a table the app cannot read. Every table uses row-level security so each account can see only its own data. No system is perfectly secure, but we follow standard practice for a project of this size.

## 9. Changes
If we change this policy, we will update the date at the top and show you a notice in the app.

## 10. Contact
[APP NAME] team, CS 4850 Senior Project (SP-27), Kennesaw State University.
Email: [team contact email]
