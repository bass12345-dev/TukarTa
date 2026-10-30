-- 0024: rehearsal days, cifra thumbs-up, Band Dictionary, and leadership transfer.
-- NOT APPLIED YET: apply to production only after owner approval.

-- ─── Helpers ────────────────────────────────────────────────────────────────

create or replace function public.is_band_member(p_band uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.band_members
    where band_id = p_band and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_band_leader(p_band uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bands where id = p_band and leader_id = auth.uid()
  );
$$;

-- Members who can add songs to a rehearsal: the leader or anyone with the singer role.
create or replace function public.can_plan_rehearsal(p_band uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_band_leader(p_band)
    or exists (
      select 1 from public.band_members bm
      join public.musician_profiles mp on mp.user_id = bm.user_id
      where bm.band_id = p_band and bm.user_id = auth.uid() and bm.status = 'active'
        and 'singer' = any(mp.roles)
    );
$$;

-- ─── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.rehearsals (
  id uuid primary key default gen_random_uuid(),
  band_id uuid not null references public.bands(id) on delete cascade,
  title text not null default 'Rehearsal',
  starts_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.rehearsal_songs (
  rehearsal_id uuid not null references public.rehearsals(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (rehearsal_id, song_id)
);

-- A member's thumbs-up: "I have the cifra for this song."
create table if not exists public.rehearsal_song_cifra (
  rehearsal_id uuid not null,
  song_id uuid not null,
  member_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (rehearsal_id, song_id, member_id),
  foreign key (rehearsal_id, song_id) references public.rehearsal_songs(rehearsal_id, song_id) on delete cascade
);

-- A singer's "Not my song" excuse for this rehearsal's song.
create table if not exists public.rehearsal_song_excused (
  rehearsal_id uuid not null,
  song_id uuid not null,
  member_id uuid not null references auth.users(id) on delete cascade,
  primary key (rehearsal_id, song_id, member_id),
  foreign key (rehearsal_id, song_id) references public.rehearsal_songs(rehearsal_id, song_id) on delete cascade
);

-- The band's fully-learned songs.
create table if not exists public.band_dictionary (
  band_id uuid not null references public.bands(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  added_at timestamptz not null default now(),
  confirmed_rehearsal_id uuid references public.rehearsals(id) on delete set null,
  leader_approved boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  primary key (band_id, song_id)
);

-- ─── Row-level security ─────────────────────────────────────────────────────

alter table public.rehearsals enable row level security;
alter table public.rehearsal_songs enable row level security;
alter table public.rehearsal_song_cifra enable row level security;
alter table public.rehearsal_song_excused enable row level security;
alter table public.band_dictionary enable row level security;

create policy "Band members read rehearsals" on public.rehearsals
  for select using (public.is_band_member(band_id));
create policy "Planners create rehearsals" on public.rehearsals
  for insert with check (public.can_plan_rehearsal(band_id) and created_by = auth.uid());
create policy "Leader edits rehearsals" on public.rehearsals
  for update using (public.is_band_leader(band_id));
create policy "Leader deletes rehearsals" on public.rehearsals
  for delete using (public.is_band_leader(band_id));

create policy "Band members read rehearsal songs" on public.rehearsal_songs
  for select using (exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_member(r.band_id)));
create policy "Planners add rehearsal songs" on public.rehearsal_songs
  for insert with check (exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.can_plan_rehearsal(r.band_id)));
create policy "Planners remove rehearsal songs" on public.rehearsal_songs
  for delete using (exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.can_plan_rehearsal(r.band_id)));

create policy "Band members read cifra" on public.rehearsal_song_cifra
  for select using (exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_member(r.band_id)));
create policy "Members set own cifra" on public.rehearsal_song_cifra
  for insert with check (member_id = auth.uid() and exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_member(r.band_id)));
create policy "Members remove own cifra" on public.rehearsal_song_cifra
  for delete using (member_id = auth.uid());

create policy "Band members read excuses" on public.rehearsal_song_excused
  for select using (exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_member(r.band_id)));
create policy "Members set own excuse" on public.rehearsal_song_excused
  for insert with check (member_id = auth.uid() and exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_member(r.band_id)));
create policy "Members remove own excuse" on public.rehearsal_song_excused
  for delete using (member_id = auth.uid());

create policy "Band members read dictionary" on public.band_dictionary
  for select using (public.is_band_member(band_id));
create policy "Leader adds to dictionary" on public.band_dictionary
  for insert with check (public.is_band_leader(band_id));
create policy "Leader removes from dictionary" on public.band_dictionary
  for delete using (public.is_band_leader(band_id));

-- ─── Readiness rule ─────────────────────────────────────────────────────────
-- For each song on a rehearsal:
--   * every active member WITHOUT the singer role must have a cifra thumbs-up;
--   * at least one active singer must have a thumbs-up, and singers who marked
--     "Not my song" are excused from the group (they neither block nor count).
-- Passing songs are added to band_dictionary. Failing automatic entries from this
-- rehearsal are removed; leader-approved entries are never removed here.

create or replace function public.refresh_band_dictionary(p_rehearsal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_band uuid;
  r record;
  v_nonsinger_missing int;
  v_singers_total int;
  v_singers_thumbed int;
begin
  select band_id into v_band from public.rehearsals where id = p_rehearsal;
  if v_band is null then return; end if;

  for r in select song_id from public.rehearsal_songs where rehearsal_id = p_rehearsal loop
    -- Non-singer members who still lack a thumbs-up
    select count(*) into v_nonsinger_missing
    from public.band_members bm
    where bm.band_id = v_band and bm.status = 'active'
      and not exists (
        select 1 from public.musician_profiles mp
        where mp.user_id = bm.user_id and 'singer' = any(mp.roles)
      )
      and not exists (
        select 1 from public.rehearsal_song_cifra c
        where c.rehearsal_id = p_rehearsal and c.song_id = r.song_id and c.member_id = bm.user_id
      );

    -- Singers who are not excused
    select count(*) into v_singers_total
    from public.band_members bm
    join public.musician_profiles mp on mp.user_id = bm.user_id
    where bm.band_id = v_band and bm.status = 'active' and 'singer' = any(mp.roles)
      and not exists (
        select 1 from public.rehearsal_song_excused e
        where e.rehearsal_id = p_rehearsal and e.song_id = r.song_id and e.member_id = bm.user_id
      );

    select count(*) into v_singers_thumbed
    from public.rehearsal_song_cifra c
    join public.band_members bm on bm.user_id = c.member_id and bm.band_id = v_band and bm.status = 'active'
    join public.musician_profiles mp on mp.user_id = bm.user_id and 'singer' = any(mp.roles)
    where c.rehearsal_id = p_rehearsal and c.song_id = r.song_id;

    if v_nonsinger_missing = 0 and (v_singers_total = 0 or v_singers_thumbed > 0) then
      insert into public.band_dictionary (band_id, song_id, confirmed_rehearsal_id)
      values (v_band, r.song_id, p_rehearsal)
      on conflict (band_id, song_id) do nothing;
    else
      delete from public.band_dictionary
      where band_id = v_band and song_id = r.song_id
        and confirmed_rehearsal_id = p_rehearsal and leader_approved = false;
    end if;
  end loop;
end;
$$;

-- Thumbs-up and excuse changes re-run the rule for that rehearsal.
create or replace function public.rehearsal_cifra_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_band_dictionary(old.rehearsal_id);
  else
    perform public.refresh_band_dictionary(new.rehearsal_id);
  end if;
  return null;
end;
$$;

create trigger rehearsal_cifra_refresh
  after insert or delete on public.rehearsal_song_cifra
  for each row execute function public.rehearsal_cifra_changed();

create trigger rehearsal_excuse_refresh
  after insert or delete on public.rehearsal_song_excused
  for each row execute function public.rehearsal_cifra_changed();

-- ─── Leader bypass ──────────────────────────────────────────────────────────

create or replace function public.leader_add_to_dictionary(p_band uuid, p_song uuid, p_rehearsal uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_band_leader(p_band) then
    raise exception 'Only the band leader can add songs directly to the Band Dictionary.';
  end if;
  insert into public.band_dictionary (band_id, song_id, confirmed_rehearsal_id, leader_approved, approved_by)
  values (p_band, p_song, p_rehearsal, true, auth.uid())
  on conflict (band_id, song_id) do update
    set leader_approved = true, approved_by = auth.uid();
end;
$$;

-- ─── Leadership transfer ────────────────────────────────────────────────────

create or replace function public.transfer_band_leadership(p_band uuid, p_new_leader uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_band_leader(p_band) then
    raise exception 'Only the current band leader can pass leadership.';
  end if;
  if not exists (
    select 1 from public.band_members
    where band_id = p_band and user_id = p_new_leader and status = 'active'
  ) then
    raise exception 'The new leader must be an active member of this band.';
  end if;
  update public.bands set leader_id = p_new_leader where id = p_band;
  -- The old leader stays in the band as a regular member.
  update public.band_members set role = 'member'
    where band_id = p_band and user_id = auth.uid() and role = 'leader';
  update public.band_members set role = 'leader'
    where band_id = p_band and user_id = p_new_leader;
end;
$$;
