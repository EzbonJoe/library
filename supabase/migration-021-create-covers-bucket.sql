-- The 'covers' bucket referenced by migration-003 and migration-008 never
-- actually existed in this project (confirmed via GET /storage/v1/bucket
-- returning []), so every cover-image upload -- for books AND blog posts --
-- has been failing with "Bucket not found". This re-creates the bucket and
-- re-applies the final policy state from both migrations in one idempotent
-- pass, so it's safe to run regardless of what did or didn't apply before.

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "public read covers" on storage.objects;
create policy "public read covers" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "authenticated upload covers" on storage.objects;
drop policy if exists "authenticated update covers" on storage.objects;
drop policy if exists "authenticated delete covers" on storage.objects;

drop policy if exists "admin upload covers" on storage.objects;
create policy "admin upload covers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'covers' and auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

drop policy if exists "admin update covers" on storage.objects;
create policy "admin update covers" on storage.objects
  for update to authenticated
  using (bucket_id = 'covers' and auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb')
  with check (bucket_id = 'covers' and auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

drop policy if exists "admin delete covers" on storage.objects;
create policy "admin delete covers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'covers' and auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');
