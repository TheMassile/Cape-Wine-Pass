# Cape Wine Pass app (iPhone and Android)

Built with Expo (React Native). It uses the same Supabase database and logins as
the website.

## Try it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. In the Codespace terminal:
   ```bash
   cd mobile
   npm install
   cp .env.example .env.local     # then open mobile/.env.local and fill in the two values
   npm run start:tunnel
   ```
3. A QR code appears in the terminal. On iPhone scan it with the Camera app; on
   Android scan it from inside Expo Go. The app opens in Expo Go.
4. Save a file and the app on your phone updates by itself. Press `Ctrl + C` in the
   terminal to stop.

## Where things are

- `src/app/` — every file is a screen (Expo Router). `(tabs)/` holds the bottom tabs.
- `src/lib/` — Supabase connection, login state, data loading, colours and fonts.
- `src/components/` — shared building blocks (buttons, cards, text).

## Checks

```bash
npm run typecheck
npx expo lint
```
