# Donalthea brief: pet art, palette and motion

Written 2026-11-10. Owner: Donalthea. Code contact: Sanjay.

## Framing

SYNCD is **a music journal with a living mascot**, not a game. The pet is a cosy picture of the user's music week. It has no health bars, no coins, no level badges and no win or lose screens. It never dies or looks sick; on missed days it is just sleepy. The art should feel original and must not look like Spotify, Tamagotchi or Duolingo.

## Hand-off rules

- Figma is fine for design, but the app can only use what is **exported into the repo**. Put files in `syncd-app/assets/...` with the exact names below and tell Sanjay when a batch lands.
- Format: **SVG** (flattened, no embedded raster, no text objects; outline any text). App icon and splash files are **PNG**.
- **Body colour:** draw the main body fill as `currentColor`, so the app can tint it with any colour key. Draw shading and highlights as black or white at low opacity on top, so they work with every colour.
- **Artboards:** bodies are 512 x 512, faces are 256 x 256, and keepsake overlays are 512 x 512 lined up with the body. Use transparent backgrounds. Keep the pet centred on the same baseline in every body file so nothing jumps when the stage changes.
- For each body, write down the **face anchor** (centre x, y and scale on the 512 artboard) in the table at the end, so Sanjay can place the faces.

## Art list (exact file names)

### Stages
| File | What | When |
|---|---|---|
| `syncd-app/assets/pet/egg_body.svg` | Egg (not shaped like a Tamagotchi toy) | 0 to 2 check-ins |
| `syncd-app/assets/pet/egg_crack_1.svg` | Small crack overlay | after 1 check-in |
| `syncd-app/assets/pet/egg_crack_2.svg` | Bigger crack overlay | after 2 check-ins |
| `syncd-app/assets/pet/egg_shell_pieces.svg` | Shell bits for the hatch animation | at 3 check-ins |
| `syncd-app/assets/pet/baby_body.svg` | Baby | 3 to 13 check-ins |
| `syncd-app/assets/pet/grown_body.svg` | Grown-up | 14+ check-ins |

### Faces (shared by egg, baby and grown; scaled per stage)
| File | Mood tag | Expression |
|---|---|---|
| `syncd-app/assets/pet/face_joyful.svg` | `joyful` | Big open smile, happy squint eyes |
| `syncd-app/assets/pet/face_calm.svg` | `calm` | Soft closed smile, relaxed half-lidded eyes |
| `syncd-app/assets/pet/face_sleepy.svg` | `sleepy` | Droopy eyes, little yawn. Also used for missed days |
| `syncd-app/assets/pet/face_fired_up.svg` | `fired_up` | Bright wide eyes, determined grin, tiny eyebrows |
| `syncd-app/assets/pet/face_thoughtful.svg` | `thoughtful` | Eyes looking up to one side, small "hmm" mouth |
| `syncd-app/assets/pet/face_blink.svg` | (any) | Eyes closed, for the blink animation |

The pet's face always **mirrors the mood the user picked** at check-in. Avoid sad, crying, angry or sick faces.

### Sleepy state (missed days)
| File | What |
|---|---|
| `syncd-app/assets/pet/fx_zzz.svg` | Floating "z z z" over the pet |
| `syncd-app/assets/pet/sleepy_blanket.svg` | Optional little blanket overlay for 2+ missed days |

Sleepy plus zzz is the only missed-day look. It's cute and calm, never guilt-inducing.

### Keepsakes (appear at 7 / 14 / 30 real check-ins)
| Backend key | Check-ins | Shelf icon (96 x 96) | Worn overlay |
|---|---|---|---|
| `week_together` | 7 | `syncd-app/assets/pet/keepsake_scarf.svg` | `keepsake_scarf_worn_baby.svg`, `keepsake_scarf_worn_grown.svg` |
| `two_weeks_together` | 14 | `syncd-app/assets/pet/keepsake_beanie.svg` | `keepsake_beanie_worn_grown.svg` |
| `month_together` | 30 | `syncd-app/assets/pet/keepsake_headphones.svg` | `keepsake_headphones_worn_grown.svg` |

Also export `syncd-app/assets/pet/keepsake_slot_empty.svg` for an empty shelf slot (a soft outline, not a padlock). The objects can change if you have better ideas; just keep the backend keys and tell Sanjay the new file names. Headphones must not be green or round in a way that echoes the Spotify logo.

### Small effects
`syncd-app/assets/pet/fx_sparkle.svg` (check-in), `fx_music_note.svg` (floating note), `fx_heart.svg` (tap reaction), `fx_skip_day.svg` (a small pillow or bookmark icon meaning "a skip day kept your streak").

### App icon and splash
| File | Size |
|---|---|
| `syncd-app/assets/icon.png` | 1024 x 1024, no transparency |
| `syncd-app/assets/adaptive-icon.png` | 1024 x 1024 foreground, safe zone in the middle 66% |
| `syncd-app/assets/splash-icon.png` | 1024 x 1024, transparent |
| `syncd-app/assets/favicon.png` | 48 x 48 |

Icon rules: **not a circle with waves or sound bars, not green on black**, not an owl, not an egg-shaped device frame. The pet's face on a warm background works well.

### Spotify logo: do not draw it
Download the official full logo (icon + wordmark) from developer.spotify.com/documentation/design. Save it as `syncd-app/assets/spotify/spotify_full_logo_white.png` and `syncd-app/assets/spotify/spotify_full_logo_black.png` exactly as provided. Leave it unedited and uncropped. In mockups, leave at least 70 px width for it plus an "OPEN SPOTIFY" link on every screen that shows songs or artists. Album art is always shown square and uncropped, with no overlays.

## Pet colour keys

The backend already turns the user's top genre into one of **6 colour keys** (Maurice's draft mapping):

| Colour key | Genres |
|---|---|
| `pink` | pop, latin |
| `gold` | hip-hop, country |
| `red` | rock |
| `purple` | r&b, jazz |
| `blue` | electronic, classical |
| `green` | indie, other, unknown (also the default) |

For each key, deliver **base / shade / light** hex values (18 in total) in Figma and in a note to Sanjay. Requirements:
- `green` must be clearly **not Spotify green** (#1DB954). Go towards sage, mint or teal, and check it next to the Spotify logo.
- Every base colour needs a dark outline or shade so it reads on the dark app background.
- Keep them friendly and slightly muted, not neon.

## App palette (replaces Midnight + Electric Blue)

Reviewers said the app looked like Spotify. Give the app its own look:
- Avoid near-black with bright green, and avoid a Spotify-style layout (big black sidebar, green pill buttons).
- A warmer direction fits the team name (Teracotta): for example terracotta, cream, plum and dusk blue. Your call.
- A rounded, friendly typeface that isn't Spotify's (for example Nunito or Fredoka from Google Fonts). Sanjay loads it with `expo-font`.
- Deliver values for the **same token names** as `syncd-app/constants/theme.ts` (`void, surface, surfaceRaised, surfaceHover, border, borderStrong, electric, electricBright, electricGlow, electricDim, text, textMuted, textFaint, success, warn, danger`), plus **5 mood accent colours** (`moodJoyful, moodCalm, moodSleepy, moodFiredUp, moodThoughtful`) for the My Week calendar dots. Sanjay can rename `electric*` to `accent*` later.

## Animation list

Give each one a short spec (frames in Figma + duration + easing). Sanjay builds them in code by moving the SVG parts, so no Lottie is needed.

| Name | Trigger | Idea | Length |
|---|---|---|---|
| `idle_breathe` | Always | Slow squash and stretch | 3 s loop |
| `blink` | Every 4 to 7 s | Swap to `face_blink` | 150 ms |
| `egg_wobble` | Idle egg, or a tap | Side-to-side rock | 600 ms |
| `egg_crack` | Check-ins 1 and 2 | Wobble + crack appears | 800 ms |
| `hatch` | 3rd check-in | Shell bits fly off, baby pops up | 1.5 s |
| `grow_up` | 14th check-in | Soft glow, baby to grown | 1.5 s |
| `react_joyful` | Check-in with joyful | Double bounce + sparkle | 1 s |
| `react_calm` | calm | Gentle sway + music note | 1 s |
| `react_sleepy` | sleepy | Slow yawn + one "z" | 1.2 s |
| `react_fired_up` | fired_up | Quick hop + little arm pump | 1 s |
| `react_thoughtful` | thoughtful | Head tilt + "..." bubble | 1.2 s |
| `sleepy_zzz` | Missed days | zzz floats up | 2.5 s loop |
| `keepsake_appear` | 7/14/30 check-ins | Item drops softly onto the shelf or pet | 1 s |
| `skip_day_saved` | First open after a skip day | Pillow icon puffs once | 800 ms |
| `tap_react` | Tap on the pet | Small hop + heart | 500 ms |

No confetti "level up" bursts, no "+10" numbers and no trophies. Every animation also needs a **reduced motion** fallback (a fade or a still frame).

## Dark mode checks (the app is dark by default)

- [ ] Every pet colour key + outline is readable on `void` and `surface`.
- [ ] Faces are visible on the darkest body colour (check purple and blue).
- [ ] Text meets WCAG AA contrast (4.5:1 body, 3:1 large) on every surface.
- [ ] The 5 mood accent colours can be told apart by people with colour blindness. Also use the tiny face, not colour alone.
- [ ] Use the white Spotify logo on dark screens; never put the green logo on a coloured background.
- [ ] The app icon looks right on both light and dark home screens.
- [ ] No pure #000 on large areas next to green (this reads as Spotify).
- [ ] If a light theme is added later, rerun this list.

## Also for the course
Individual Figma mockups go in the Final Report Appendix C, and group mockups showing the screen flow go in the SDD. Please export the new screens (Welcome, Age gate, Consent, Connect, Adopt, Pet, Check-in x3, My Week, Settings) as PNG into `docs/team/mockups/` when they are ready.

## Face anchor table (fill in)

| Body file | Face centre x | Face centre y | Face scale |
|---|---|---|---|
| egg_body.svg | | | |
| baby_body.svg | | | |
| grown_body.svg | | | |
