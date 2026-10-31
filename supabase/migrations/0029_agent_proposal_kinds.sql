-- 0029: let the agent propose the new change types (Phase 1 of the agent plan).
-- Each new kind has a validator and an executor in supabase/functions/setlist-agent.

alter table public.ai_proposals drop constraint if exists ai_proposals_kind_check;

alter table public.ai_proposals add constraint ai_proposals_kind_check check (kind = any (array[
  'create_gig', 'update_gig', 'add_songs_to_setlist', 'remove_songs_from_setlist', 'reorder_setlist',
  'add_to_dictionary', 'invite_musician', 'band_setlist',
  'update_song', 'remove_from_library', 'add_to_band_dictionary', 'remove_from_band_dictionary',
  'create_rehearsal', 'mark_absence', 'assign_substitute'
]::text[]));
