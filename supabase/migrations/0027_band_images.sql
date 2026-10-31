-- 0027: band profile photo (avatar_url, already on bands) and cover photo (cover_url).
-- Files live in the public bucket 'band-images' under <bandId>/... Only the band's leader can
-- upload, replace or remove them.

alter table public.bands add column if not exists cover_url text;

insert into storage.buckets (id, name, public)
values ('band-images', 'band-images', true)
on conflict (id) do nothing;

-- Public read: the bucket is public, so anyone can view the image URLs.
create policy "Band images are public" on storage.objects
  for select using (bucket_id = 'band-images');

create policy "Band leader uploads band images" on storage.objects
  for insert with check (
    bucket_id = 'band-images'
    and exists (
      select 1 from public.bands b
      where b.id::text = (storage.foldername(name))[1]
        and b.leader_id = auth.uid()
    )
  );

create policy "Band leader replaces band images" on storage.objects
  for update using (
    bucket_id = 'band-images'
    and exists (
      select 1 from public.bands b
      where b.id::text = (storage.foldername(name))[1]
        and b.leader_id = auth.uid()
    )
  );

create policy "Band leader removes band images" on storage.objects
  for delete using (
    bucket_id = 'band-images'
    and exists (
      select 1 from public.bands b
      where b.id::text = (storage.foldername(name))[1]
        and b.leader_id = auth.uid()
    )
  );
