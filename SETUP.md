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
- **"Confirm email"**: if on, new users must click an email link before they
  can log in (the app tells them this). For class demos it's easier to turn it off.
- Use the **publishable** (`sb_publishable_…`) or legacy **anon** key in `.env`.
  Never the secret / service_role key.

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
