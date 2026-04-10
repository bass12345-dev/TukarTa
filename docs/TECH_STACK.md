# TECH_STACK.md
# Technology Stack — Setlist AI MVP

## Overview

The stack is chosen for solo-developer speed, zero-ops infrastructure, and a free-to-launch cost profile. Every service has a usable free tier that covers the MVP phase.

---

## Frontend — Mobile App

| Technology | Choice | Reason |
|---|---|---|
| Framework | React Native + Expo (SDK 51+) | Cross-platform iOS + Android, familiar to web developers, large ecosystem |
| Navigation | Expo Router (file-based) | Simpler than React Navigation for MVP; built on React Navigation underneath |
| State management | Zustand | Minimal boilerplate, works well with React Query |
| Server state | TanStack Query (React Query v5) | Handles caching, background sync, optimistic updates |
| UI components | NativeWind (Tailwind for RN) | Utility-first styling, fast iteration |
| Icons | Expo Vector Icons (Ionicons) | Built into Expo, no extra install |
| Image picker | expo-image-picker | Screenshot upload for song extraction |
| Secure storage | expo-secure-store | Store Supabase session tokens securely |
| Notifications | Expo Notifications | Push notifications for setlist share + invite |
| Offline cache | expo-sqlite (via Drizzle ORM) | Local song and setlist cache for stage mode |

---

## Backend & Infrastructure

### Supabase (Primary Backend)

| Service | Usage |
|---|---|
| Supabase Auth | Google OAuth, session management, JWT |
| Supabase Database | PostgreSQL — all app data |
| Supabase Storage | Profile photos, uploaded screenshots |
| Supabase Realtime | Live setlist updates, approval status |
| Supabase Edge Functions | AI song extraction, setlist generation API |

**Why Supabase over building a custom Hono backend for MVP:**
A custom Hono API adds 2–3 weeks of auth, middleware, and deployment work. Supabase gives you auth, database, storage, realtime, and serverless functions in one dashboard. Post-MVP, a Hono layer on Cloudflare Workers can be added for complex business logic without migrating the database.

### AI Services — Free Tier Options

| Provider | Free Tier | Vision (Screenshot OCR) | Best For |
|---|---|---|---|
| Google Gemini 1.5 Flash | 15 RPM, 1M TPD free | Yes — excellent | **Recommended: best free vision + text** |
| OpenAI GPT-4o mini | $0.15/1M tokens (very cheap) | Yes | Backup option |
| Hugging Face (BLIP-2) | Free inference API | Yes (limited) | Fallback only, slower |

**Recommendation: Gemini 1.5 Flash** via the free Google AI Studio API key.
- Screenshot extraction: send image + prompt → get JSON song list
- Setlist generation: send gig details + known songs → get ordered setlist
- AI agent chat: tool-calling for setlist edits

### Lyrics Source

| Provider | Cost | Quality |
|---|---|---|
| LRCLIB | Free, open source | Good for popular songs |
| Manual entry | Free | 100% reliable |

MVP uses LRCLIB as primary, manual entry as fallback. No paid lyrics licensing needed at this stage.

---

## Database

PostgreSQL via Supabase. No pgvector for MVP (add post-traction for semantic search).

**ORM:** Drizzle ORM for both the Supabase Edge Functions (server) and local SQLite cache (client via expo-sqlite driver).

Using one ORM for both environments means shared schema types and a consistent query API.

---

## Development Tooling

| Tool | Purpose |
|---|---|
| TypeScript | Full stack type safety |
| Drizzle ORM + drizzle-kit | Schema management, migrations |
| ESLint + Prettier | Code quality |
| Vitest | Unit testing for Edge Functions |
| Detox | E2E testing (post-MVP) |
| EAS Build | Expo Application Services — cloud builds for iOS + Android |
| EAS Submit | Automated App Store + Play Store submission |

---

## Cost Estimate — MVP Phase

| Service | Free Tier | When You'll Pay |
|---|---|---|
| Supabase | 500MB DB, 1GB storage, 50MB Edge Function | After ~500 active users |
| Gemini Flash | 15 req/min, 1M tokens/day | After significant AI usage |
| Expo / EAS | 30 builds/month free | After launch volume |
| Google Play | ₱1,400 one-time | At submission |
| Apple Developer | ₱5,500/year | At iOS submission |
| **Total MVP monthly** | **₱0** | Until meaningful scale |

---

## Architecture Decision Records

**ADR-001: Supabase over custom Hono backend**
Decision: Use Supabase for MVP. Revisit at 1,000 active users.
Rationale: Saves 3 weeks of backend scaffolding. Auth, realtime, storage included. Easy migration path.

**ADR-002: Gemini Flash over OpenAI for AI features**
Decision: Google Gemini 1.5 Flash as primary AI.
Rationale: Free tier is the most generous for vision tasks. Excellent extraction accuracy for handwritten and typed song lists.

**ADR-003: Expo Router over React Navigation**
Decision: Expo Router (file-based routing).
Rationale: Simpler mental model, built-in deep linking, better TypeScript types. No meaningful downside for MVP.

**ADR-004: NativeWind over StyleSheet API**
Decision: NativeWind (Tailwind CSS for React Native).
Rationale: Faster UI iteration, consistent design tokens, familiar to web developers.

**ADR-005: LRCLIB over paid lyrics API**
Decision: LRCLIB for MVP lyrics.
Rationale: Free, no rate limits for reasonable usage, covers most popular songs. Avoids $2,000–10,000/month licensing costs at launch.
