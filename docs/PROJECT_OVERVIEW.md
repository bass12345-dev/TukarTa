# PROJECT_OVERVIEW.md
# Setlist AI — Project Overview

## What Is It?

Setlist AI is a mobile app for Filipino musicians and bands that uses AI to build smarter setlists, match musicians by the songs they actually know, and help bands find replacement players in real time.

The core idea: every musician already has their songs written somewhere — a Notes app, a photo of a handwritten list, an old Word doc. Setlist AI lets them upload that screenshot, and the AI extracts their full song library automatically. That library becomes their searchable, shareable musician profile.

---

## The Problem

Filipino gigging musicians — in Cebu, Manila, Davao — deal with the same recurring chaos:

- A member cancels an hour before the gig
- Nobody agrees on what songs everyone actually knows
- The band leader builds a setlist alone, members find out at soundcheck
- Finding a replacement singer who already knows your songs means scrolling through Facebook groups for hours
- Mid-show the crowd loses energy and nobody can quickly pivot the setlist

There is no tool that connects **who knows what songs** to **setlist building** to **finding musicians**. Those are three separate problems solved by three separate apps — or not solved at all.

---

## The Solution

One app that does three things tightly:

1. **Song knowledge tracking** — each musician's profile contains every song they can perform, with a confidence level. This is built during onboarding via screenshot upload + AI extraction.

2. **AI setlist generation** — the AI generates a setlist using only songs all current band members know. Chat with it naturally: *"45-minute acoustic set, start high energy, end with something emotional."*

3. **Musician marketplace** — bands browse nearby musicians filtered by genre, ratings, and most importantly — which songs they already know. A band can find a replacement bassist who knows 80% of their setlist in under a minute.

---

## Target Users

| Persona | Description | Primary Pain |
|---|---|---|
| Gigging musician | Plays bars, cafés, events 2–4x/month | Setlist chaos, last-minute changes |
| Band leader | Organizes gigs, manages members | Coordination, finding replacements |
| Session musician | Freelance player available for hire | Visibility, showcasing song knowledge |
| Church worship leader | Leads weekly services | Managing which songs the team knows |
| Wedding band | High-stakes gigs, full setlists | Reliability, song matching |

**Primary market:** Cebu, Manila, Davao — expanding to all PH after traction.

---

## MVP Scope

### In Scope

- Google Sign-In via Supabase Auth
- Onboarding screenshot upload → AI song extraction → profile creation
- Musician profile: role, genres, ratings, songs known, confidence levels
- Band creation and member invites
- AI setlist generation based on shared known songs
- Band setlist review: approve, suggest changes, reorder
- Browse musicians by location, genre, and song overlap
- Stage mode: lyrics + chords view, swipe between songs
- Basic real-time setlist sharing within a band

### Out of Scope for MVP

- Spotify integration
- pgvector / semantic song search
- In-app payments and subscriptions
- Video/voice calling
- Advanced analytics and gig history
- Rehearsal tracking
- Auto-scroll lyrics
- Voice commands

---

## Success Metrics

| Milestone | Metric | Target |
|---|---|---|
| Week 4 (soft launch) | Beta users | 20 musicians, 5 bands |
| Week 8 (public launch) | Active bands | 30 bands using setlist feature |
| Month 2 | Marketplace hires | 10 successful musician hires via app |
| Month 3 | Retention | 60% of bands return for second gig |
| Month 4 | Revenue | 35 paying Premium users |

---

## Competitive Advantage

No existing app connects song knowledge → setlist generation → musician hiring in one flow. The screenshot onboarding removes the biggest friction point (data entry) and immediately creates the data that makes every other feature useful.

The `musician_song_knowledge` table is the moat. Every song a musician confirms they know makes their profile more valuable to bands, which brings more bands, which makes musician profiles more valuable. Classic network effect — but anchored to real, verifiable data.
