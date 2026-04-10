# PRD.md
# Product Requirements Document — Setlist AI MVP

## 1. Authentication

### User Stories
- As a new user, I want to sign in with Google so I don't have to remember a password.
- As a returning user, I want to stay logged in across app restarts.
- As a user, I want to choose my role (musician / band leader) during onboarding.

### Functional Requirements
- Google OAuth via Supabase Auth
- Session persistence using Supabase session tokens stored securely
- Role selection screen post-login (Singer, Guitarist, Bassist, Drummer, Keyboardist, Session Musician)
- Profile photo pulled from Google account by default

### Acceptance Criteria
- User taps "Continue with Google" → Google consent screen → redirected back into app within 5 seconds
- Session survives app close and reopen
- First-time users are routed to onboarding; returning users go to home screen

---

## 2. Onboarding — Screenshot Song Extraction

### User Stories
- As a musician, I want to upload a photo of my song list so I don't have to type every song manually.
- As a musician, I want to review and confirm the songs the AI extracted before they go on my profile.
- As a musician, I want to add a confidence level to each song so bands know how well I know it.

### Functional Requirements
- Upload up to 5 screenshots per onboarding session (Notes, photos, handwritten lists)
- AI (via Supabase Edge Function calling a vision-capable model) extracts: song title, artist name, and optionally key/genre
- Extracted songs displayed in a review list with ability to edit, delete, or add manually
- Confidence selector per song: 1 (learning) to 5 (can perform live)
- "Can perform live" toggle per song
- Songs saved to `musician_song_knowledge` table on confirm

### Acceptance Criteria
- Extraction completes within 10 seconds per screenshot
- At least 80% of clearly written song titles are extracted correctly
- User can edit any extracted field before saving
- Minimum 3 songs required to complete onboarding
- Progress indicator shown during AI processing

---

## 3. Musician Profile

### User Stories
- As a musician, I want my profile to show my genres, role, location, and songs I know.
- As a band looking to hire, I want to see a musician's ratings and song list before contacting them.
- As a musician, I want to add more songs to my profile anytime.

### Functional Requirements
- Profile fields: display name, role(s), genres (multi-select), city, bio (optional), profile photo
- Songs known list with confidence badges (1–5 stars) and live-readiness indicator
- Ratings display (average from past hires — starts empty, grows over time)
- "Add more songs" button → opens screenshot upload or manual entry
- Public profile view (what other users see) vs. private edit view

### Acceptance Criteria
- Profile loads in under 2 seconds
- Song list is searchable/filterable on the profile
- Confidence level visible to anyone viewing the profile
- Edit changes save and reflect immediately

---

## 4. Band Management

### User Stories
- As a band leader, I want to create a band and invite members by username or link.
- As a band member, I want to see all songs our band collectively knows.
- As a band leader, I want to see which songs all members know vs. partial overlap.

### Functional Requirements
- Create band: name, genre tags, city
- Invite members via deep link or username search
- Band overview screen: list of members, collective song overlap summary
- Song overlap view: songs all members know (intersection), songs some know (partial), songs only one knows
- Band leader role can remove members and manage settings

### Acceptance Criteria
- Invite link works via standard share sheet
- Overlap computation is accurate and updates when a member adds songs
- Band screen shows member count and song overlap count prominently

---

## 5. AI Setlist Generation

### User Stories
- As a band leader, I want to tell the AI the gig details and have it build a setlist automatically.
- As a band leader, I want to chat with the AI to refine the setlist.
- As a band member, I want the AI to only include songs everyone in the band knows.

### Functional Requirements
- Gig creation form: venue name, date/time, duration (minutes), mood/vibe (tags), genre focus
- AI generates setlist using: shared known songs, gig duration, mood tags, energy arc (high → mid → closing)
- Chat interface to refine: *"remove slow songs"*, *"add more OPM"*, *"move that song to the end"*
- AI tool functions: `create_setlist`, `add_song`, `remove_song`, `reorder_song`, `replace_song`
- Setlist shows: song order, artist, estimated duration, key, confidence average

### Acceptance Criteria
- Setlist generated within 8 seconds
- Every song on the generated setlist exists in at least one member's known songs
- Chat commands update the setlist in real time
- Duration total matches requested gig length ± 5 minutes

---

## 6. Band Setlist Review & Approval

### User Stories
- As a band leader, I want to share the draft setlist with all members.
- As a band member, I want to approve the setlist or suggest a change.
- As a band leader, I want to see everyone's approval before finalizing.

### Functional Requirements
- Share setlist to band with one tap
- Members receive push notification
- Each member can: Approve, or Suggest (text note on a specific song)
- Band leader sees approval status per member
- Leader can finalize setlist; finalized setlists are locked for editing
- Suggestion thread visible to all members

### Acceptance Criteria
- All members see the shared setlist within 30 seconds (Supabase Realtime)
- Approval status updates live without refresh
- Finalized setlist cannot be edited without leader unlocking it

---

## 7. Musician Marketplace (Browse & Hire)

### User Stories
- As a band leader, I want to search for a singer near my city who knows songs similar to our setlist.
- As a session musician, I want to be discoverable to bands who need my genre and instruments.
- As a band leader, I want to invite a musician I found directly into our gig setlist.

### Functional Requirements
- Browse screen with filters: instrument/role, city, genre, minimum star rating
- Song overlap filter: "show musicians who know at least N songs from our setlist"
- Musician card: photo, name, role, genres, rating, song match count
- Full profile view with song list and past gig history (if available)
- "Invite to gig" button → sends in-app notification to musician
- Musician can accept or decline invite

### Acceptance Criteria
- Search results load within 3 seconds
- Song overlap count is accurate against current setlist
- Invite notification delivered within 10 seconds

---

## 8. Stage Mode

### User Stories
- As a band member, I want to open the finalized setlist during a gig and see lyrics/chords full screen.
- As a performer, I want to swipe to the next song quickly.
- As a performer, I want a dark background so it's readable on stage.

### Functional Requirements
- Full-screen dark mode view
- Swipe left/right to navigate between songs
- Lyrics + chord display (from band's stored chord version or fetched from LRCLIB)
- Large text mode toggle
- Current song highlighted, next song previewed at bottom
- Transpose chords up/down by half-step

### Acceptance Criteria
- Opens within 1 second from setlist view
- Works fully offline once setlist is loaded
- Chord transpose updates all chords instantly
- Minimum font size 20px in stage mode

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| App startup time | Under 3 seconds cold start |
| Offline support | Setlists and songs available offline after first load |
| Authentication security | Supabase RLS on all user data tables |
| AI response time | Setlist generation under 8 seconds |
| Screenshot extraction | Under 10 seconds per image |
| Realtime sync latency | Under 2 seconds for setlist share/approval |
| Supported OS | iOS 15+ and Android 10+ |
