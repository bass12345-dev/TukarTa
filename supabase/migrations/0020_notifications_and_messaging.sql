-- Migration 0020: saved notification settings, in-app notifications inbox, linked-musician messaging
--
-- Messaging is limited to "linked" musicians: they share an active band, or one of them
-- has an invite from a band led by the other. are_linked() enforces this everywhere.

-- 1. Notification settings follow the account (users already may update their own row)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_settings JSONB NOT NULL
  DEFAULT '{"gigs": true, "setlists": true, "messages": true, "reviews": false, "offers": true}'::jsonb;

-- 2. In-app notifications. Rows are only written by triggers below (security definer).
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,            -- 'invite' | 'message'
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users mark their notifications read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Linked check shared by conversations and messages
CREATE OR REPLACE FUNCTION public.are_linked(a UUID, b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a IS NOT NULL AND b IS NOT NULL AND a <> b AND (
    EXISTS (
      SELECT 1
      FROM public.band_members m1
      JOIN public.band_members m2 ON m2.band_id = m1.band_id
      WHERE m1.user_id = a AND m2.user_id = b
        AND m1.status = 'active' AND m2.status = 'active'
    )
    OR EXISTS (
      SELECT 1
      FROM public.musician_invites i
      JOIN public.bands bd ON bd.id = i.from_band_id
      WHERE (bd.leader_id = a AND i.to_musician_id = b)
         OR (bd.leader_id = b AND i.to_musician_id = a)
    )
  );
$$;

-- 4. Conversations (one per pair of users)
CREATE TABLE IF NOT EXISTS public.conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversations_order CHECK (user_a < user_b),
  CONSTRAINT conversations_pair UNIQUE (user_a, user_b)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() IN (user_a, user_b));

-- Start (or reopen) a conversation with a linked musician. Client never inserts directly.
CREATE OR REPLACE FUNCTION public.start_conversation(p_other UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me UUID := auth.uid();
  a UUID := LEAST(me, p_other);
  b UUID := GREATEST(me, p_other);
  cid UUID;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.are_linked(me, p_other) THEN
    RAISE EXCEPTION 'you can only message musicians you share a band or invite with';
  END IF;

  INSERT INTO public.conversations (user_a, user_b)
  VALUES (a, b)
  ON CONFLICT (user_a, user_b) DO NOTHING;

  SELECT id INTO cid FROM public.conversations WHERE user_a = a AND user_b = b;
  RETURN cid;
END;
$$;

REVOKE ALL ON FUNCTION public.start_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_conversation(UUID) TO authenticated;

-- 5. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body             TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON public.messages (conversation_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND auth.uid() IN (c.user_a, c.user_b)
    )
  );

CREATE POLICY "Linked participants send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() IN (c.user_a, c.user_b)
        AND public.are_linked(c.user_a, c.user_b)
    )
  );

-- Keep conversations sorted by activity
CREATE OR REPLACE FUNCTION public.touch_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_touch_conversation ON public.messages;
CREATE TRIGGER messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();

-- 6. Notification triggers (respect the recipient's saved settings)
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.conversations%ROWTYPE;
  recipient UUID;
  sender_name TEXT;
  wants BOOLEAN;
BEGIN
  SELECT * INTO c FROM public.conversations WHERE id = NEW.conversation_id;
  recipient := CASE WHEN c.user_a = NEW.sender_id THEN c.user_b ELSE c.user_a END;

  SELECT COALESCE((notification_settings->>'messages')::boolean, true), display_name
    INTO wants, sender_name
  FROM public.users WHERE id = recipient;

  SELECT display_name INTO sender_name FROM public.users WHERE id = NEW.sender_id;

  IF wants THEN
    INSERT INTO public.notifications (user_id, kind, title, body, data)
    VALUES (
      recipient, 'message',
      COALESCE(sender_name, 'New message'),
      LEFT(NEW.body, 120),
      jsonb_build_object('conversation_id', NEW.conversation_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_notify ON public.messages;
CREATE TRIGGER messages_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

CREATE OR REPLACE FUNCTION public.notify_on_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  band_name TEXT;
  wants BOOLEAN;
BEGIN
  SELECT name INTO band_name FROM public.bands WHERE id = NEW.from_band_id;
  SELECT COALESCE((notification_settings->>'gigs')::boolean, true) INTO wants
  FROM public.users WHERE id = NEW.to_musician_id;

  IF wants THEN
    INSERT INTO public.notifications (user_id, kind, title, body, data)
    VALUES (
      NEW.to_musician_id, 'invite',
      'Invitation to ' || COALESCE(band_name, 'a band'),
      NEW.message,
      jsonb_build_object('invite_id', NEW.id, 'band_id', NEW.from_band_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS musician_invites_notify ON public.musician_invites;
CREATE TRIGGER musician_invites_notify
  AFTER INSERT ON public.musician_invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite();

-- 7. Realtime for live chat (skipped quietly if the publication is absent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN undefined_object OR duplicate_object THEN NULL;
END $$;
