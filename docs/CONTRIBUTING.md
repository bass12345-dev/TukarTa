# CONTRIBUTING.md
# Developer Setup — Setlist AI

## Prerequisites

- Node.js 20+
- pnpm 9+
- Expo CLI (`pnpm add -g expo-cli`)
- EAS CLI (`pnpm add -g eas-cli`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- iOS Simulator (Xcode, macOS only) or Android Studio

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Auth (Supabase handles this, but you need the client IDs)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id

# AI (Gemini)
GEMINI_API_KEY=your-gemini-api-key   # Server-side only, in Edge Functions

# App
EXPO_PUBLIC_APP_ENV=development
```

**Never commit `.env.local`.** The `.env.example` file in the repo shows required keys without values.

---

## Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/setlist-ai.git
cd setlist-ai
pnpm install

# 2. Start Supabase locally
supabase start
# This starts: Postgres, Auth, Storage, Realtime, Edge Functions

# 3. Run database migrations
supabase db push

# 4. Seed development data (optional)
supabase db seed

# 5. Start the Expo dev server
pnpm start

# 6. Open on device
# iOS: press 'i'
# Android: press 'a'
# Expo Go: scan QR code
```

---

## Project Structure

```
setlist-ai/
├── app/                        # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── onboarding/
│   │       ├── role.tsx
│   │       ├── upload.tsx      # Screenshot upload
│   │       └── review.tsx      # Song review + confirm
│   ├── (tabs)/
│   │   ├── home/
│   │   ├── setlists/
│   │   │   ├── [id].tsx
│   │   │   ├── agent.tsx       # AI chat
│   │   │   └── stage.tsx       # Stage mode
│   │   ├── discover/
│   │   └── notifications/
│   └── _layout.tsx
├── components/                 # Shared UI components
│   ├── SongCard.tsx
│   ├── MusicianCard.tsx
│   ├── SetlistRow.tsx
│   ├── ConfidencePicker.tsx
│   └── StageView.tsx
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── auth.ts                # Auth helpers
│   └── gemini.ts              # AI helpers (client-safe)
├── store/
│   ├── useAuthStore.ts        # Zustand: auth state
│   ├── useBandStore.ts        # Zustand: active band
│   └── useSetlistStore.ts     # Zustand: current setlist
├── hooks/
│   ├── useSongs.ts            # React Query hooks
│   ├── useSetlist.ts
│   └── useMusicians.ts
├── supabase/
│   ├── migrations/            # SQL migrations
│   ├── functions/
│   │   ├── extract-songs/     # Screenshot → song list
│   │   ├── gen-setlist/       # AI setlist generation
│   │   ├── ai-agent/          # Chat agent
│   │   └── fetch-lyrics/      # LRCLIB integration
│   └── seed.sql
├── types/
│   └── database.ts            # Generated Supabase types
└── constants/
    ├── colors.ts
    └── fonts.ts
```

---

## Supabase Edge Functions

Edge Functions run Deno. Each function lives in `supabase/functions/`.

```bash
# Run a function locally
supabase functions serve extract-songs

# Deploy a function
supabase functions deploy extract-songs

# Set secrets (server-side env vars for Edge Functions)
supabase secrets set GEMINI_API_KEY=your-key
```

---

## Database Migrations

```bash
# Create a new migration
supabase migration new add_musician_ratings

# Apply migrations locally
supabase db push

# Generate TypeScript types from schema
supabase gen types typescript --local > types/database.ts
```

---

## Git Branching Strategy

```
main          ← production builds only, protected
dev           ← integration branch, all features merged here first
feature/*     ← individual feature branches, branch from dev
hotfix/*      ← urgent fixes, branch from main, merge to both
```

**Branch naming:**
```
feature/screenshot-extraction
feature/ai-setlist-generation
feature/marketplace-browse
hotfix/auth-session-expiry
```

---

## Pull Request Guidelines

1. Branch from `dev`, not `main`
2. PR title format: `feat: add screenshot extraction`, `fix: setlist approval not updating`
3. All PRs require passing lint + type check
4. Include a short description of what changed and why
5. Add a screenshot or screen recording for UI changes
6. Assign yourself; request review from at least one other person

**Commit format (conventional commits):**
```
feat: add confidence level picker to song review
fix: google auth redirect not working on Android
chore: update supabase client to v2.39
docs: add edge function deployment instructions
```

---

## Running Tests

```bash
# Lint
pnpm lint

# Type check
pnpm typecheck

# Unit tests (Edge Functions)
pnpm test

# All checks (run before pushing)
pnpm check
```

---

## Building for Stores

```bash
# Configure EAS (first time only)
eas build:configure

# Development build (for testing on physical device)
eas build --profile development --platform android

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```
