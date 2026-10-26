-- Migration 0021: push notifications
--
-- Every row inserted into public.notifications (already filtered by the recipient's settings)
-- is pushed to that user's registered devices through Expo's push service.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1. Device tokens. Clients never write this table directly; they use the functions below.
CREATE TABLE IF NOT EXISTS public.push_tokens (
  token       TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON public.push_tokens (user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own push tokens"
  ON public.push_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Register this device for the signed-in user. A token that was used by another account on
--    the same phone is moved to the current user.
CREATE OR REPLACE FUNCTION public.register_push_token(p_token TEXT, p_platform TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  INSERT INTO public.push_tokens (token, user_id, platform, updated_at)
  VALUES (p_token, auth.uid(), p_platform, NOW())
  ON CONFLICT (token) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- 3. Forget this device (called on sign-out so the next account on the phone stops receiving pushes)
CREATE OR REPLACE FUNCTION public.remove_push_token(p_token TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.push_tokens WHERE token = p_token AND user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.register_push_token(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_push_token(TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.remove_push_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_push_token(TEXT) TO authenticated;

-- 4. Send a push for each new in-app notification.
--    Message text is not sent to Expo: message pushes say "Sent you a message" and the content
--    stays inside the app.
CREATE OR REPLACE FUNCTION public.send_push_for_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  msgs JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'to', t.token,
    'title', NEW.title,
    'body', CASE WHEN NEW.kind = 'message' THEN 'Sent you a message' ELSE COALESCE(NEW.body, '') END,
    'data', NEW.data || jsonb_build_object('kind', NEW.kind),
    'sound', 'default'
  ))
  INTO msgs
  FROM public.push_tokens t
  WHERE t.user_id = NEW.user_id;

  IF msgs IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := msgs,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json')
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A push failure must never block the notification or the action that created it.
  RAISE WARNING 'push send failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_send_push ON public.notifications;
CREATE TRIGGER notifications_send_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.send_push_for_notification();
