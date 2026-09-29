# SYNCD — Frontend

A React (Vite) frontend prototype for **SYNCD**, the SP-27 group project. This
is a standalone UI shell over mock data — it renders every screen from the
Design Document (Login/Register, Home, Search, Library, Playlist, Now
Playing, Identify, Listening Habits, Account) so the team has something
clickable to demo, review, and eventually wire up to the real Node/Express
backend.

**Theme:** Midnight + Electric Blue — a near-black base (`#0a0e1a`) so the app
feels like its own space at night, with an electric blue (`#3e7bfa` →
`#6fe3ff`) accent carrying anything "live" or data-driven: the Identify
button, active nav state, progress bars, and the genre-breakdown chart.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

## Project structure

```
src/
  App.jsx              top-level view state ("router") + now-playing state
  styles.css            design tokens (colors/type/spacing) + all component styles
  data/mockData.js       placeholder tracks/playlists/genre data — swap for real API calls
  utils.js               deterministic gradient "cover art" generator
  components/
    Auth.jsx              login/register screen
    Sidebar.jsx            left nav + playlist shortcuts
    NowPlayingBar.jsx      persistent bottom player
    Home.jsx               recently played / playlists / recommended
    Search.jsx              search + genre filter chips
    Library.jsx             all playlists
    PlaylistView.jsx        single playlist detail
    Identify.jsx            Shazam-style "what's playing" flow (simulated match)
    Habits.jsx               genre breakdown + streak stats
    Account.jsx               subscription tier + connected accounts
    TrackList.jsx             shared track-row list used by several screens
    Icons.jsx                 small hand-rolled icon set (no icon-library dependency)
```

## What's real vs. simulated

Everything here runs on mock data in `src/data/mockData.js` — there is no
backend call yet. `Identify.jsx` simulates the record → recognize → match
round trip with a `setTimeout` so the flow can be demoed; swap that for a
real call to the chosen recognition API (AudD/ACRCloud) once the backend
endpoint exists. Playback controls update local state only — no audio
actually plays.

## Pushing this to GitHub

This folder isn't connected to a git remote yet. From inside `syncd-app/`:

```bash
git init
git add .
git commit -m "Add SYNCD frontend prototype (Midnight + Electric Blue)"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

If the team already has a SYNCD repo, drop this `src/` folder (plus
`package.json`, `vite.config.js`, `index.html`) into it on its own branch
instead of starting a new repo.
