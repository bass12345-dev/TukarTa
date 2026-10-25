# TukarTa AI Agent — Audit & Production Architecture

## 1. Audit of the previous agent (`setlist-agent` v33 + `app/ai-agent.tsx`)

| # | Severity | Finding |
|---|---|---|
| 1 | **Critical** | Auth was a hand-rolled base64 decode of the JWT (`decodeSafe`) with `verify_jwt: false`. The signature was never checked, so anyone could forge a token with any `sub`. |
| 2 | **Critical** | The function then used the **service-role key** for every read, bypassing RLS. Combined with #1, a forged token could read any user's bands, repertoire and chats and write messages into their sessions. |
| 3 | High | `extract-songs` had the same unverified-JWT pattern and did not even require a user; it downloaded any `filePath` from the private `song-screenshots` bucket with the service role. |
| 4 | High | Actions were a free-text `ACTIONS: [...]` JSON blob parsed with a regex. No schema, no server-side validation; ids written by the LLM were trusted. |
| 5 | High | **HITL gaps:** typing "sure" / "yes please" / "go ahead" silently approved *every* pending proposal, including invites to other people. "Applied" state lived only in React state, so reopening a chat showed finished proposals as pending again (duplicate gigs / invites). No edit step, no risk tiers, no idempotency, no audit trail. |
| 6 | Medium | Prompt injection surface: other users' display names, song titles and OCR text were interpolated into the system prompt / user turn as if trusted. |
| 7 | Medium | Context dumping: whole repertoire + 15 other musicians injected on every turn (cost, latency, privacy). No tools, so the model could not look anything up. |
| 8 | Medium | Reliability/cost: dynamic Groq model discovery and sequential model loop on every request, no timeouts, no rate limit, user message persisted before the model call (orphaned on failure). |
| 9 | Low | Client executed approvals by calling hooks directly; failures were only `console.error`, the user saw nothing. |

Also noted outside the agent: `songs` UPDATE policy lets any authenticated user edit any shared song; Supabase advisors flag `handle_new_user` / `update_musician_avg_rating` / `rls_auto_enable` as callable `SECURITY DEFINER` RPCs and leaked-password protection as off.

## 2. New architecture

```
App (ai-agent.tsx)
  ├─ chat  ───────────────► setlist-agent  action:'chat'
  │                           1. auth.getUser(JWT)           (verified identity)
  │                           2. user-scoped client (RLS)    (reads + domain writes)
  │                           3. LLM tool loop (≤5 steps): Groq 70B → Gemini 2.5 Flash → Groq 8B
  │                              read tools run immediately; propose_* tools create ai_proposals rows
  │                           4. persist assistant message, link proposals, log tool calls
  ├─ proposals (RLS select) ◄─ ai_proposals  (status: pending → executing → executed|failed|rejected|expired)
  └─ approve / edit / dismiss ► setlist-agent  action:'decide'
                                atomic claim (pending→executing) → re-validate → execute under user RLS → record result
```

**Human-in-the-loop guarantees**
- The model has **no write path**. `propose_*` tools only insert a *pending* proposal (service role, bookkeeping only).
- Clients cannot create or advance proposals: `ai_proposals` has a SELECT policy only.
- A proposal executes **exactly once**: an atomic `pending → executing` update is the lock; replays and double-taps are no-ops.
- Execution **re-validates** against current data and permissions (e.g. still a band member, gig not duplicated), and runs through the user's own JWT so RLS is the final authority.
- Risk tiers: `low` (setlist / repertoire edits), `medium` (create/update/remove gig data), `high` (invite = messages another person). High-risk proposals are never part of "Approve all" and the server refuses to batch-approve them.
- Edit-before-approve for gigs (name, venue, date, duration) and invite messages; edits are re-validated server-side.
- Proposals expire after 24 h. Every decision is stored (`decided_at`, `status`, `result`, `error`).
- The free-text approval shortcut is gone; approval is only an explicit button tap.

**Tools**

| Tool | Type | Purpose |
|---|---|---|
| `search_my_repertoire` | read | Filter the user's songs by text / genre / live-ready |
| `get_gig_setlist` | read | Gig + ordered setlist + approx. duration |
| `list_my_gigs`, `list_my_bands` | read | Gigs and bands (with active members) |
| `get_band_common_songs` | read | Songs **every** band member knows |
| `search_musicians` | read | Recruit by instrument / city / genre / availability |
| `search_song_catalog` | read | Resolve song ids from the shared catalog |
| `suggest_setlist` | read | Deterministic draft: band-common pool, duration fit, mood filter, energy-arc ordering |
| `propose_create_gig` / `propose_update_gig` | write→proposal | Gig management (date must be future, duplicate-checked) |
| `propose_add_songs_to_setlist` / `propose_remove_songs_from_setlist` / `propose_reorder_setlist` | write→proposal | Setlist editing (batched; positions rewritten safely around the unique-position constraint) |
| `propose_add_to_dictionary` | write→proposal | Add up to 20 songs to the repertoire |
| `propose_invite_musician` | write→proposal (high) | Leader-only, no links, no duplicates |

**Production hardening**
- Verified identity, RLS everywhere, minimal service-role use; secrets only in function env.
- Input validation on every tool argument (uuid / length / range / date), tool output capped, model never shown internal ids in text (UUID scrub).
- System prompt treats tool/DB text as untrusted data, scopes the assistant to music, forbids claiming unapproved actions.
- Provider fallback chain with 30 s timeouts; fixed models (override with `AGENT_GROQ_MODEL`, `AGENT_GROQ_FALLBACK_MODEL`, `AGENT_GEMINI_MODEL`).
- Rate limit 40 chat turns / user / hour; idempotent retries via `clientMsgId`; failed turns remove their orphaned user message.
- Observability: every tool call is logged to `ai_tool_calls` (tool, args, ok/error, duration, model).
- `extract-songs` now requires a verified user and only accepts `extractions/<name>.jpg`; OCR text is sanitised before it reaches the agent.

## 3. Rollout (nothing below has been applied to Supabase yet)

1. Apply `supabase/migrations/0016_ai_agent_proposals.sql`.
2. Ensure function secrets exist: `GROQ_API_KEY`, `GEMINI_API_KEY` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are provided by the platform).
3. Deploy `setlist-agent` and `extract-songs`. Keep `verify_jwt` off: the new publishable key format is not a JWT, so gateway verification would reject calls; the functions verify the user themselves.
4. **Order matters:** the new app build calls `action: 'chat' | 'decide'`. The old app build keeps calling the old contract, so deploy the function and ship the APK together, or old installs will see "Unknown action"-style errors until updated.
5. Smoke test: propose a gig → Edit → Approve; ask for a setlist for a band gig → Approve all; invite a musician → verify it needs its own tap; reopen the chat and confirm decided proposals stay decided.

## 4. Known limits / next steps
- Replies are not streamed (RN fetch streaming is unreliable); the existing typewriter animation covers the wait.
- `extract-songs` uploads still share one `extractions/` folder; scoping uploads per user (and storage policy) is the next hardening step.
- No automated eval suite yet: add golden conversations for the propose/approve flows and tool-argument validation.
- Consider tightening the `songs` UPDATE policy and revoking public `EXECUTE` on the flagged `SECURITY DEFINER` functions.
