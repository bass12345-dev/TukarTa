-- Migration 0016: AI agent human-in-the-loop proposals + tool-call audit log
--
-- The agent never writes domain data itself. Write-capable tools create a row in ai_proposals
-- (status = 'pending'); only an explicit user decision (approve / reject) moves it forward, and
-- execution happens in the edge function under the user's own RLS context.

-- 1. Proposals ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_proposals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  message_id  UUID REFERENCES public.ai_messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN (
                'create_gig', 'update_gig', 'add_songs_to_setlist', 'remove_songs_from_setlist',
                'reorder_setlist', 'add_to_dictionary', 'invite_musician')),
  risk        TEXT NOT NULL DEFAULT 'low' CHECK (risk IN ('low', 'medium', 'high')),
  payload     JSONB NOT NULL,               -- validated arguments the executor will use
  preview     JSONB NOT NULL,               -- { title, subtitle, lines[] } shown to the user
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                'pending', 'executing', 'executed', 'rejected', 'failed', 'expired')),
  result      JSONB,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at  TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;

-- Users may read their own proposals. There are deliberately NO insert/update/delete policies:
-- only the edge function (service role) creates proposals and moves them through their lifecycle,
-- so a client can never mark a proposal as approved or forge one.
CREATE POLICY "Users read their own AI proposals"
  ON public.ai_proposals FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_proposals_session ON public.ai_proposals(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_proposals_message ON public.ai_proposals(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_proposals_user_status ON public.ai_proposals(user_id, status);

-- 2. Tool-call audit / observability ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_tool_calls (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tool        TEXT NOT NULL,
  args        JSONB,
  ok          BOOLEAN NOT NULL DEFAULT TRUE,
  error       TEXT,
  duration_ms INTEGER,
  model       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_tool_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own AI tool calls"
  ON public.ai_tool_calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_user_created ON public.ai_tool_calls(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_session ON public.ai_tool_calls(session_id);

-- 3. Message bookkeeping ------------------------------------------------------------------------
-- Idempotency for client retries of the same chat turn.
ALTER TABLE public.ai_messages ADD COLUMN IF NOT EXISTS client_msg_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_messages_client_msg
  ON public.ai_messages(session_id, client_msg_id) WHERE client_msg_id IS NOT NULL;

-- Used for per-user rate limiting (count of user turns in a window).
CREATE INDEX IF NOT EXISTS idx_ai_messages_role_created ON public.ai_messages(role, created_at DESC);
