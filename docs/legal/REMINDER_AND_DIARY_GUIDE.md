> **Not legal advice — student project draft.**
> **DRAFTS for Noor:** reminder and diary copy for [APP NAME]. Edit freely, but keep to the rules below.

# Reminder and Diary Guide

## Rules for all copy
1. **At most 1 reminder a day.** Reminders are **off by default**. Ask the user to turn them on only **after their first check-in**, never at launch. Respect quiet hours. Turning them off takes one tap in Settings.
2. **No guilt.** The mascot is never hungry, sad because of the user, sick or dying. No "you broke your streak" and no countdowns.
3. **Never mention listening, minutes, play counts, streaming or Spotify usage.** The ask is always to *check in* or *pick today's song*. Never "listen to feed me".
4. **No game words:** no points, level up, score, win, unlock, reward or game. See the word table in SPOTIFY_COMPLIANCE.md §2.
5. Keep it short (under about 80 characters) so it fits a lock-screen notification.
6. Do not repeat the same message two days in a row. Pick one at random from the pool.
7. Push messages can use `{pet_name}`. They must not include song or artist names, because lock screens are visible to other people.

## 15 reminder messages (pet voice)
1. I saved you a spot on the couch. Pick today's song?
2. {pet_name} here. I'd love to hear how your day felt.
3. No rush. Whenever you're ready, let's check in.
4. I'm doodling in our journal. Want to add today's page?
5. Hi again! What song fits today?
6. I kept the kettle warm. Tell me your mood?
7. Little reminder from your little buddy: today's page is open.
8. I'm curious: joyful, calm, sleepy, fired up or thoughtful today?
9. Our journal has a fresh page waiting. Only if you feel like it.
10. {pet_name} is wiggling hello. Check in when it suits you.
11. Tiny question from me: what's today's song?
12. I made space on today's page for you.
13. Whatever kind of day it was, I'd like to hear about it.
14. Hello! A quick check-in together?
15. I'm here and comfy. Come say hi when you have a moment.

**After a missed day:** the mascot is always happy to see the user. Example in-app copy: "You're back! I missed you. Let's pick today's song."

## 10 weekly diary templates
**Allowed placeholders only:** `{pet_name}`, `{days_together}`, `{mood_most}`, `{song_of_week}`, `{artist_of_week}`, `{checkins_this_week}`, `{keepsake}`.

Data rules (from Spotify Policy III.13 and III.14):
- Fill the placeholders with **simple lookups from this user's own check-ins**. No AI or LLM writes or rewrites these sentences.
- `{song_of_week}` comes from the user's own song-of-the-day picks, not from play counts.
- Show the Spotify logo and an "OPEN SPOTIFY" link next to any diary line that shows `{song_of_week}` or `{artist_of_week}`.
- If a value is missing (for example after a disconnect, or if no keepsake arrived this week), skip that sentence. Never show an empty `{ }`.

1. This week we checked in {checkins_this_week} times. {pet_name} loved every one.
2. We've been together for {days_together} days now. {pet_name} is growing up nicely.
3. Most days this week felt {mood_most}. {pet_name} curled up right beside you.
4. Our song of the week was {song_of_week}. {pet_name} kept humming it.
5. {artist_of_week} kept turning up in our journal this week.
6. A new keepsake joined our shelf: {keepsake}!
7. {pet_name}'s favourite page this week was the one with {song_of_week} on it.
8. {checkins_this_week} pages filled this week, and {days_together} days together in all.
9. It was a {mood_most} kind of week. {pet_name} thinks that's just right.
10. Dear diary: {pet_name} here. This week sounded like {artist_of_week}, and I liked it.

**Tone check before shipping:** read each line aloud. Rewrite it if it sounds like a score, a reward, a scolding, or a comment on how much someone listened.
