-- Migration 0022: chat features
--
-- Reply, edit, delete (soft), reactions, attachments, and "delete chat for me".

-- 1. Message columns
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size INT;

-- Body may be empty when a message only carries an attachment
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_body_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_body_check CHECK (char_length(body) <= 2000);

-- 2. Senders edit or delete their own messages
CREATE POLICY "Senders update their own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- 3. Reactions: one row per user, message, and emoji
CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id  UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 16),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read reactions"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_reactions.message_id AND auth.uid() IN (c.user_a, c.user_b)
    )
  );

CREATE POLICY "Participants add their own reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_reactions.message_id AND auth.uid() IN (c.user_a, c.user_b)
    )
  );

CREATE POLICY "Users remove their own reactions"
  ON public.message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- 4. Delete chat for me: hidden until a newer message arrives
CREATE TABLE IF NOT EXISTS public.conversation_hides (
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hidden_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE public.conversation_hides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own hides"
  ON public.conversation_hides FOR SELECT
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.hide_conversation(p_conversation UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_conversation AND auth.uid() IN (c.user_a, c.user_b)
  ) THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  INSERT INTO public.conversation_hides (conversation_id, user_id, hidden_at)
  VALUES (p_conversation, auth.uid(), NOW())
  ON CONFLICT (conversation_id, user_id) DO UPDATE SET hidden_at = EXCLUDED.hidden_at;
END;
$$;

REVOKE ALL ON FUNCTION public.hide_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hide_conversation(UUID) TO authenticated;

-- 5. Attachments live in a private bucket; the path starts with the conversation id
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Participants upload chat attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND auth.uid() IN (c.user_a, c.user_b)
    )
  );

CREATE POLICY "Participants read chat attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND auth.uid() IN (c.user_a, c.user_b)
    )
  );

-- 6. Realtime for reactions and edits
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION
  WHEN undefined_object OR duplicate_object THEN NULL;
END $$;
