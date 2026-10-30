-- 0025: substitutes (sessionists) for rehearsals, Personal Dictionary sync, and the
-- readiness rule updated to count substitutes.

-- ─── Absences and substitutes ───────────────────────────────────────────────

create table if not exists public.rehearsal_absences (
  rehearsal_id uuid not null references public.rehearsals(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (rehearsal_id, member_id)
);

create table if not exists public.rehearsal_substitutes (
  id uuid primary key default gen_random_uuid(),
  rehearsal_id uuid not null,
  absent_member_id uuid not null,
  sub_user_id uuid references auth.users(id) on delete set null,
  sub_name text not null,
  role text not null,
  created_at timestamptz not null default now(),
  unique (rehearsal_id, absent_member_id),
  foreign key (rehearsal_id, absent_member_id)
    references public.rehearsal_absences(rehearsal_id, member_id) on delete cascade
);

-- Cifra thumbs-up can now belong to a member OR a substitute, never both.
alter table public.rehearsal_song_cifra drop constraint if exists rehearsal_song_cifra_pkey;
alter table public.rehearsal_song_cifra alter column member_id drop not null;
alter table public.rehearsal_song_cifra
  add column if not exists substitute_id uuid references public.rehearsal_substitutes(id) on delete cascade;
alter table public.rehearsal_song_cifra
  add constraint rehearsal_song_cifra_one_holder check ((member_id is not null) <> (substitute_id is not null));
create unique index if not exists rehearsal_song_cifra_member_uq
  on public.rehearsal_song_cifra (rehearsal_id, song_id, member_id) where member_id is not null;
create unique index if not exists rehearsal_song_cifra_sub_uq
  on public.rehearsal_song_cifra (rehearsal_id, song_id, substitute_id) where substitute_id is not null;

alter table public.rehearsal_absences enable row level security;
alter table public.rehearsal_substitutes enable row level security;

create policy "Band members read absences" on public.rehearsal_absences
  for select using (exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_member(r.band_id)));
create policy "Members mark own absence" on public.rehearsal_absences
  for insert with check (
    exists (select 1 from public.rehearsals r where r.id = rehearsal_id
      and (member_id = auth.uid() or public.is_band_leader(r.band_id)))
  );
create policy "Members clear own absence" on public.rehearsal_absences
  for delete using (
    exists (select 1 from public.rehearsals r where r.id = rehearsal_id
      and (member_id = auth.uid() or public.is_band_leader(r.band_id)))
  );

create policy "Band members read substitutes" on public.rehearsal_substitutes
  for select using (exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_member(r.band_id)));
create policy "Leader assigns substitutes" on public.rehearsal_substitutes
  for insert with check (exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_leader(r.band_id)));
create policy "Leader removes substitutes" on public.rehearsal_substitutes
  for delete using (exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_leader(r.band_id)));

-- A linked substitute (an app account) can read the rehearsal they are covering, nothing else.
-- Table aliases are explicit below: rehearsal_substitutes also has rehearsal_id and id columns.
create policy "Linked substitutes read rehearsal" on public.rehearsals
  for select using (exists (
    select 1 from public.rehearsal_substitutes s
    where s.rehearsal_id = rehearsals.id and s.sub_user_id = auth.uid()
  ));
create policy "Linked substitutes read rehearsal songs" on public.rehearsal_songs
  for select using (exists (
    select 1 from public.rehearsal_substitutes s
    where s.rehearsal_id = rehearsal_songs.rehearsal_id and s.sub_user_id = auth.uid()
  ));
create policy "Linked substitutes read cifra" on public.rehearsal_song_cifra
  for select using (exists (
    select 1 from public.rehearsal_substitutes s
    where s.rehearsal_id = rehearsal_song_cifra.rehearsal_id and s.sub_user_id = auth.uid()
  ));
create policy "Linked substitutes read substitutes" on public.rehearsal_substitutes
  for select using (sub_user_id = auth.uid());
create policy "Linked substitutes read absences" on public.rehearsal_absences
  for select using (exists (
    select 1 from public.rehearsal_substitutes s
    where s.rehearsal_id = rehearsal_absences.rehearsal_id and s.sub_user_id = auth.uid()
  ));

-- Replace the member-only cifra write policies so substitutes can be ticked too.
drop policy if exists "Members set own cifra" on public.rehearsal_song_cifra;
drop policy if exists "Members remove own cifra" on public.rehearsal_song_cifra;

create policy "Members or substitutes set cifra" on public.rehearsal_song_cifra
  for insert with check (
    (member_id = auth.uid() and exists (select 1 from public.rehearsals r where r.id = rehearsal_id and public.is_band_member(r.band_id)))
    or (substitute_id is not null and exists (
      select 1 from public.rehearsal_substitutes s
      join public.rehearsals r on r.id = s.rehearsal_id
      where s.id = substitute_id and (s.sub_user_id = auth.uid() or public.is_band_leader(r.band_id))
    ))
  );
create policy "Members or substitutes remove cifra" on public.rehearsal_song_cifra
  for delete using (
    member_id = auth.uid()
    or (substitute_id is not null and exists (
      select 1 from public.rehearsal_substitutes s
      join public.rehearsals r on r.id = s.rehearsal_id
      where s.id = substitute_id and (s.sub_user_id = auth.uid() or public.is_band_leader(r.band_id))
    ))
  );

-- ─── Readiness rule (now counts substitutes) ────────────────────────────────
-- Per song on a rehearsal:
--   * every active NON-singer member must be covered: they ticked, or their substitute ticked
--     (an absent member with no substitute is not covered);
--   * singers form a group: active singers who are present and not excused, plus substitutes
--     with the singer role. If the group is non-empty, at least one of them must tick.

create or replace function public.refresh_band_dictionary(p_rehearsal uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_band uuid;
  r record;
  v_nonsinger_missing int;
  v_singer_group int;
  v_singer_thumbed int;
begin
  select band_id into v_band from public.rehearsals where id = p_rehearsal;
  if v_band is null then return; end if;

  for r in select song_id from public.rehearsal_songs where rehearsal_id = p_rehearsal loop
    select count(*) into v_nonsinger_missing
    from public.band_members bm
    where bm.band_id = v_band and bm.status = 'active'
      and not exists (
        select 1 from public.musician_profiles mp
        where mp.user_id = bm.user_id and 'singer' = any(mp.roles)
      )
      and not (
        case when exists (select 1 from public.rehearsal_absences a
                          where a.rehearsal_id = p_rehearsal and a.member_id = bm.user_id)
          then exists (
            select 1 from public.rehearsal_song_cifra c
            join public.rehearsal_substitutes s on s.id = c.substitute_id
            where c.rehearsal_id = p_rehearsal and c.song_id = r.song_id and s.absent_member_id = bm.user_id
          )
          else exists (
            select 1 from public.rehearsal_song_cifra c
            where c.rehearsal_id = p_rehearsal and c.song_id = r.song_id and c.member_id = bm.user_id
          )
        end
      );

    -- Singer group size: present, non-excused singer members + singer substitutes
    select (
      select count(*) from public.band_members bm
      join public.musician_profiles mp on mp.user_id = bm.user_id
      where bm.band_id = v_band and bm.status = 'active' and 'singer' = any(mp.roles)
        and not exists (select 1 from public.rehearsal_absences a where a.rehearsal_id = p_rehearsal and a.member_id = bm.user_id)
        and not exists (select 1 from public.rehearsal_song_excused e where e.rehearsal_id = p_rehearsal and e.song_id = r.song_id and e.member_id = bm.user_id)
    ) + (
      select count(*) from public.rehearsal_substitutes s
      where s.rehearsal_id = p_rehearsal and s.role = 'singer'
    ) into v_singer_group;

    select count(*) into v_singer_thumbed
    from public.rehearsal_song_cifra c
    where c.rehearsal_id = p_rehearsal and c.song_id = r.song_id
      and (
        (c.member_id is not null and exists (
          select 1 from public.band_members bm
          join public.musician_profiles mp on mp.user_id = bm.user_id
          where bm.user_id = c.member_id and bm.band_id = v_band and bm.status = 'active' and 'singer' = any(mp.roles)
            and not exists (select 1 from public.rehearsal_absences a where a.rehearsal_id = p_rehearsal and a.member_id = bm.user_id)
            and not exists (select 1 from public.rehearsal_song_excused e where e.rehearsal_id = p_rehearsal and e.song_id = r.song_id and e.member_id = bm.user_id)
        ))
        or (c.substitute_id is not null and exists (
          select 1 from public.rehearsal_substitutes s where s.id = c.substitute_id and s.role = 'singer'
        ))
      );

    if v_nonsinger_missing = 0 and (v_singer_group = 0 or v_singer_thumbed > 0) then
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

-- Absence and substitute changes also re-run the rule.
create or replace function public.rehearsal_roster_changed()
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

create trigger rehearsal_absence_refresh
  after insert or delete on public.rehearsal_absences
  for each row execute function public.rehearsal_roster_changed();
create trigger rehearsal_substitute_refresh
  after insert or delete on public.rehearsal_substitutes
  for each row execute function public.rehearsal_roster_changed();

-- ─── Personal Dictionary sync ───────────────────────────────────────────────
-- Every member of a band gets a musician_song_knowledge row for each song in the band
-- dictionary. Existing rows are never overwritten.

create or replace function public.sync_dictionary_song_to_members()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.musician_song_knowledge
    (musician_id, song_id, confidence_level, can_perform_live, source, genre, created_at, updated_at)
  select bm.user_id, new.song_id, 3, true, 'band_dictionary',
         (select s.genre from public.songs s where s.id = new.song_id), now(), now()
  from public.band_members bm
  where bm.band_id = new.band_id and bm.status = 'active'
  on conflict (musician_id, song_id) do nothing;
  return new;
end;
$$;

create trigger band_dictionary_personal_sync
  after insert on public.band_dictionary
  for each row execute function public.sync_dictionary_song_to_members();

-- Remove the personal copy only when no other band the member belongs to still has the song.
create or replace function public.unsync_dictionary_song_from_members()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.musician_song_knowledge k
  where k.song_id = old.song_id
    and k.source = 'band_dictionary'
    and k.musician_id in (select bm.user_id from public.band_members bm where bm.band_id = old.band_id)
    and not exists (
      select 1 from public.band_dictionary bd
      join public.band_members m2 on m2.band_id = bd.band_id and m2.user_id = k.musician_id and m2.status = 'active'
      where bd.song_id = old.song_id and bd.band_id <> old.band_id
    );
  return old;
end;
$$;

create trigger band_dictionary_personal_unsync
  after delete on public.band_dictionary
  for each row execute function public.unsync_dictionary_song_from_members();

-- A member who joins (or is re-activated) gets the band's existing dictionary songs.
create or replace function public.sync_dictionary_to_new_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    insert into public.musician_song_knowledge
      (musician_id, song_id, confidence_level, can_perform_live, source, genre, created_at, updated_at)
    select new.user_id, bd.song_id, 3, true, 'band_dictionary',
           (select s.genre from public.songs s where s.id = bd.song_id), now(), now()
    from public.band_dictionary bd
    where bd.band_id = new.band_id
    on conflict (musician_id, song_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger band_member_dictionary_sync
  after insert or update of status on public.band_members
  for each row execute function public.sync_dictionary_to_new_member();
