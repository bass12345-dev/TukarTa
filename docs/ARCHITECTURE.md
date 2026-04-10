# ARCHITECTURE.md
# System Architecture — Setlist AI MVP

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                   React Native App (Expo)                │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Auth    │  │  Songs   │  │ Setlist  │  │ Market │  │
│  │  Screen  │  │  Profile │  │  Agent   │  │ place  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │              │              │      │
│  ┌────▼──────────────▼──────────────▼──────────────▼──┐  │
│  │          TanStack Query + Zustand Store             │  │
│  └────────────────────────┬────────────────────────────┘  │
│                           │                              │
│  ┌────────────────────────▼────────────────────────────┐  │
│  │      expo-sqlite (Drizzle ORM) — Offline Cache      │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / WebSocket
         ┌─────────────────▼──────────────────┐
         │           Supabase Platform         │
         │                                    │
         │  ┌──────────┐  ┌─────────────────┐ │
         │  │  Auth    │  │  PostgreSQL DB  │ │
         │  │ (Google  │  │  (Row Level     │ │
         │  │  OAuth)  │  │   Security)     │ │
         │  └──────────┘  └────────┬────────┘ │
         │                         │          │
         │  ┌──────────┐  ┌────────▼────────┐ │
         │  │ Storage  │  │    Realtime     │ │
         │  │(R2/S3)   │  │  (WebSocket)   │ │
         │  └──────────┘  └─────────────────┘ │
         │                                    │
         │  ┌─────────────────────────────────┐│
         │  │       Edge Functions (Deno)      ││
         │  │  /extract-songs  /gen-setlist    ││
         │  │  /ai-agent       /fetch-lyrics   ││
         │  └────────────────┬────────────────┘│
         └───────────────────┼─────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │    Google Gemini Flash API   │
              │   (Vision + Text + Tools)   │
              └─────────────────────────────┘
```

---

## Data Flow: Onboarding (Screenshot Extraction)

```
User taps "Upload Screenshot"
        │
        ▼
expo-image-picker → base64 image
        │
        ▼
POST /edge/extract-songs
  { image: base64, userId }
        │
        ▼
Edge Function:
  1. Validate image size (< 5MB)
  2. Call Gemini Flash Vision API
     Prompt: "Extract all song titles and artists from this image.
              Return JSON array: [{title, artist, key?, genre?}]"
  3. Parse response → normalize song data
  4. Return extracted song array
        │
        ▼
App displays review screen
User edits, adds confidence (1–5), toggles "can perform live"
        │
        ▼
Batch INSERT → musician_song_knowledge table
  (musician_id, song_id, confidence_level, can_perform_live)
        │
        ▼
Profile updated → visible to bands browsing marketplace
```

---

## Data Flow: AI Setlist Generation

```
Band leader fills gig form
  (duration, mood, venue, genre)
        │
        ▼
App queries: SELECT songs WHERE all band members know it
  → shared_songs[] from musician_song_knowledge
        │
        ▼
POST /edge/gen-setlist
  { gigDetails, sharedSongs[], bandId }
        │
        ▼
Edge Function:
  1. Build system prompt with gig context
  2. Build user message with shared songs list
  3. Call Gemini Flash with tool definitions
  4. Parse setlist response (ordered song array)
  5. Save to setlists + setlist_songs tables
  6. Return setlist_id
        │
        ▼
App navigates to Setlist Review screen
Supabase Realtime broadcasts setlist to all band members
```

---

## Data Flow: Band Setlist Approval

```
Leader taps "Share to Band"
        │
        ▼
UPDATE setlists SET status = 'shared'
        │
        ▼
Supabase Realtime → all band members receive update
Members see setlist on their home screen
        │
        ▼
Member taps "Approve" or "Suggest"
        │
        ▼
INSERT into setlist_approvals
  { setlist_id, member_id, status, note? }
        │
        ▼
Realtime broadcasts approval status to leader's screen
(approval_count / member_count updates live)
        │
        ▼
Leader taps "Finalize"
  UPDATE setlists SET status = 'finalized', locked = true
        │
        ▼
All members can now open Stage Mode
```

---

## AI Agent Tool-Calling Architecture

The AI agent chat uses Gemini's function-calling feature. The Edge Function defines tools, sends the conversation, executes the called tool, and returns the result.

```typescript
// Tool definitions sent to Gemini
const tools = [
  {
    name: "add_song",
    description: "Add a specific song to the setlist at a given position",
    parameters: {
      type: "object",
      properties: {
        song_id: { type: "string" },
        position: { type: "number" }
      }
    }
  },
  {
    name: "remove_song",
    description: "Remove a song from the setlist",
    parameters: {
      type: "object",
      properties: { song_id: { type: "string" } }
    }
  },
  {
    name: "reorder_song",
    description: "Move a song to a different position",
    parameters: {
      type: "object",
      properties: {
        song_id: { type: "string" },
        new_position: { type: "number" }
      }
    }
  },
  {
    name: "replace_song",
    description: "Swap one song for another from the shared known songs",
    parameters: {
      type: "object",
      properties: {
        remove_song_id: { type: "string" },
        add_song_id: { type: "string" }
      }
    }
  }
]

// Edge Function flow
async function handleAgentMessage(message: string, context: GigContext) {
  const response = await gemini.chat(message, { tools, context })

  if (response.toolCall) {
    const result = await executeTool(response.toolCall)
    return await gemini.chat(result, { tools, context }) // follow-up
  }

  return response.text
}
```

---

## Offline Architecture

Stage mode must work when the venue has no internet. Songs, lyrics, and setlists are cached locally on device using expo-sqlite.

```
App launch (online)
  → Sync active setlists to SQLite
  → Sync song knowledge for all band members
  → Cache fetched lyrics

Gig time (possibly offline)
  → Stage mode reads from SQLite only
  → No network calls required

Background (when back online)
  → TanStack Query refetches and resyncs
  → New songs added → synced to local cache
```

---

## Security Model

| Layer | Mechanism |
|---|---|
| Authentication | Supabase Auth JWT, Google OAuth |
| Authorization | Row Level Security (RLS) on every table |
| API | All Edge Functions validate JWT before execution |
| Storage | Storage bucket policies: users can only read/write their own files |
| Screenshot upload | Server-side size and MIME type validation |
| Song data | Users can only read band songs if they are a band member |

---

## Supabase Realtime Channels

| Channel | Subscribers | Events |
|---|---|---|
| `setlist:{setlist_id}` | All band members | INSERT/UPDATE on setlist_songs, setlist_approvals |
| `band:{band_id}` | All band members | New member joins, setlist shared |
| `invites:{user_id}` | Individual musician | New gig invite received |
