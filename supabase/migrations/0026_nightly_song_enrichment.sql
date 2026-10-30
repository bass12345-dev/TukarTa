-- 0026: nightly genre and BPM backfill, so nobody has to run it by hand.
-- The admin token is read from Supabase Vault (secret name: backfill_admin_token).
-- Store it once in the SQL editor, with the same value as the BACKFILL_ADMIN_TOKEN function secret:
--   select vault.create_secret('<the token>', 'backfill_admin_token');

create extension if not exists pg_net;
create extension if not exists pg_cron with schema pg_catalog;

-- One batch of enrich-songs. Does nothing until the Vault secret exists.
create or replace function public.run_enrich_songs_batch()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_token text;
begin
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name = 'backfill_admin_token'
  limit 1;

  if v_token is null then
    return;
  end if;

  perform net.http_post(
    url := 'https://atowgxluqogdsxxeavna.supabase.co/functions/v1/enrich-songs',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_token, 'Content-Type', 'application/json'),
    body := '{"limit": 25}'::jsonb
  );
end;
$$;

-- Every night at 19:00 UTC (03:00 in Manila). Songs that can't be filled are retried nightly; that's cheap.
select cron.unschedule('enrich-songs-nightly')
where exists (select 1 from cron.job where jobname = 'enrich-songs-nightly');

select cron.schedule('enrich-songs-nightly', '0 19 * * *', $$select public.run_enrich_songs_batch();$$);
