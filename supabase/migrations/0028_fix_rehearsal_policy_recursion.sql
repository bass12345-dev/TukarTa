-- 0028: fix "infinite recursion detected in policy for relation rehearsals".
-- The rehearsal policies read rehearsal_substitutes, whose policies read rehearsals again,
-- so Postgres loops. The fix: small SECURITY DEFINER helpers that read the tables without
-- running the policies, and every rehearsal policy calls the helpers.
-- NOT APPLIED YET: apply after owner approval.

create or replace function public.rehearsal_band_id(p_rehearsal uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select band_id from public.rehearsals where id = p_rehearsal;
$$;

create or replace function public.is_linked_sub(p_rehearsal uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rehearsal_substitutes s
    where s.rehearsal_id = p_rehearsal and s.sub_user_id = auth.uid()
  );
$$;

-- Drop every policy on the rehearsal tables, then recreate them in one place.
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('rehearsals','rehearsal_songs','rehearsal_song_cifra','rehearsal_song_excused',
                        'rehearsal_absences','rehearsal_substitutes')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- rehearsals
create policy "rehearsals read" on public.rehearsals
  for select using (public.is_band_member(band_id) or public.is_linked_sub(id));
create policy "rehearsals create" on public.rehearsals
  for insert with check (public.can_plan_rehearsal(band_id) and created_by = auth.uid());
create policy "rehearsals update" on public.rehearsals
  for update using (public.is_band_leader(band_id));
create policy "rehearsals delete" on public.rehearsals
  for delete using (public.is_band_leader(band_id));

-- rehearsal_songs
create policy "rehearsal songs read" on public.rehearsal_songs
  for select using (public.is_band_member(public.rehearsal_band_id(rehearsal_id)) or public.is_linked_sub(rehearsal_id));
create policy "rehearsal songs add" on public.rehearsal_songs
  for insert with check (public.can_plan_rehearsal(public.rehearsal_band_id(rehearsal_id)));
create policy "rehearsal songs remove" on public.rehearsal_songs
  for delete using (public.can_plan_rehearsal(public.rehearsal_band_id(rehearsal_id)));

-- rehearsal_substitutes
create policy "substitutes read" on public.rehearsal_substitutes
  for select using (public.is_band_member(public.rehearsal_band_id(rehearsal_id)) or sub_user_id = auth.uid());
create policy "substitutes assign" on public.rehearsal_substitutes
  for insert with check (public.is_band_leader(public.rehearsal_band_id(rehearsal_id)));
create policy "substitutes remove" on public.rehearsal_substitutes
  for delete using (public.is_band_leader(public.rehearsal_band_id(rehearsal_id)));

-- rehearsal_absences
create policy "absences read" on public.rehearsal_absences
  for select using (public.is_band_member(public.rehearsal_band_id(rehearsal_id)) or public.is_linked_sub(rehearsal_id));
create policy "absences mark" on public.rehearsal_absences
  for insert with check (member_id = auth.uid() or public.is_band_leader(public.rehearsal_band_id(rehearsal_id)));
create policy "absences clear" on public.rehearsal_absences
  for delete using (member_id = auth.uid() or public.is_band_leader(public.rehearsal_band_id(rehearsal_id)));

-- rehearsal_song_excused
create policy "excused read" on public.rehearsal_song_excused
  for select using (public.is_band_member(public.rehearsal_band_id(rehearsal_id)));
create policy "excused set" on public.rehearsal_song_excused
  for insert with check (member_id = auth.uid() and public.is_band_member(public.rehearsal_band_id(rehearsal_id)));
create policy "excused remove" on public.rehearsal_song_excused
  for delete using (member_id = auth.uid());

-- rehearsal_song_cifra
create policy "cifra read" on public.rehearsal_song_cifra
  for select using (public.is_band_member(public.rehearsal_band_id(rehearsal_id)) or public.is_linked_sub(rehearsal_id));
create policy "cifra set" on public.rehearsal_song_cifra
  for insert with check (
    (member_id = auth.uid() and public.is_band_member(public.rehearsal_band_id(rehearsal_id)))
    or (substitute_id is not null and exists (
      select 1 from public.rehearsal_substitutes s
      where s.id = substitute_id
        and (s.sub_user_id = auth.uid() or public.is_band_leader(public.rehearsal_band_id(s.rehearsal_id)))
    ))
  );
create policy "cifra remove" on public.rehearsal_song_cifra
  for delete using (
    member_id = auth.uid()
    or (substitute_id is not null and exists (
      select 1 from public.rehearsal_substitutes s
      where s.id = substitute_id
        and (s.sub_user_id = auth.uid() or public.is_band_leader(public.rehearsal_band_id(s.rehearsal_id)))
    ))
  );
