-- Per-song intro length in seconds: where the lyrics start in the recording.
-- Stage mode subtracts it from the playback clock so highlight and autoscroll line up with the vocals.
alter table public.songs
  add column if not exists lyrics_offset_sec numeric(5,1) not null default 0
  check (lyrics_offset_sec >= 0 and lyrics_offset_sec <= 600);
