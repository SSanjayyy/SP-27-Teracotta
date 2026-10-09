# SP-27 — SYNCD

A Spotify-inspired music app, built for CS 4850 (Fall 2026).

## Mobile app (Expo / React Native)

The app lives in [`syncd-app/`](./syncd-app). It is an Expo (SDK 57) +
Expo Router project with 4 core tabs (Home, Search, Library, Profile) and
Supabase Auth (sign up, log in, log out, and staying logged in after
reopening the app).

```bash
cd syncd-app
npm install
npx expo start
```

**Full setup instructions and the command log: [`SETUP.md`](./SETUP.md).**

## Web prototype (reference only)

[`prototype-web/`](./prototype-web) is the earlier React (Vite) UI prototype
running on mock data. It's kept as a design reference for the
Midnight + Electric Blue theme and screen layouts; new work goes in `syncd-app/`.

## Team

CS 4850, Section 01 — Maurice McKay, Donalthea Drysdale, Noor Muhammad, Sanjay Ravikumar
