-- Migration 0012: AI Chat Persistence (Sessions & Messages)

-- 1. AI Sessions Table
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gig_id      UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'New Conversation',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own sessions" 
  ON public.ai_sessions FOR ALL 
  USING (auth.uid() = user_id);

-- 2. AI Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  actions     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read messages from their sessions" 
  ON public.ai_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_sessions 
      WHERE id = ai_messages.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert messages to their sessions" 
  ON public.ai_messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_sessions 
      WHERE id = ai_messages.session_id AND user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_messages_session_id ON public.ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON public.ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_gig_id ON public.ai_sessions(gig_id);
