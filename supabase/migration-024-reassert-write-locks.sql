-- Re-applies migration-008's admin write locks idempotently, same reasoning
-- as migration-020's fix for posts: if migration-008 was only partially
-- applied (SQL editor cutting off partway through a pasted multi-statement
-- script), the original wide-open "authenticated ... using (true))" policies
-- from schema.sql/migration-003/migration-004 are still active alongside the
-- newer admin-locked ones -- and RLS policies for the same command are
-- permissive/OR'd together, so the old open policy alone is enough to let
-- any logged-in user write, regardless of the admin-locked policy sitting
-- next to it. drop-if-exists on both the legacy AND the admin policy names
-- makes this safe to run regardless of what's currently live.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

drop policy if exists "authenticated insert books" on books;
drop policy if exists "authenticated update books" on books;
drop policy if exists "authenticated delete books" on books;
drop policy if exists "admin insert books" on books;
drop policy if exists "admin update books" on books;
drop policy if exists "admin delete books" on books;

create policy "admin insert books" on books
  for insert to authenticated
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin update books" on books
  for update to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb')
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin delete books" on books
  for delete to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');


drop policy if exists "authenticated insert quotes" on quotes;
drop policy if exists "authenticated update quotes" on quotes;
drop policy if exists "authenticated delete quotes" on quotes;
drop policy if exists "admin insert quotes" on quotes;
drop policy if exists "admin update quotes" on quotes;
drop policy if exists "admin delete quotes" on quotes;

create policy "admin insert quotes" on quotes
  for insert to authenticated
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin update quotes" on quotes
  for update to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb')
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin delete quotes" on quotes
  for delete to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');


drop policy if exists "authenticated can view subscribers" on subscribers;
drop policy if exists "authenticated can delete subscribers" on subscribers;
drop policy if exists "admin view subscribers" on subscribers;
drop policy if exists "admin delete subscribers" on subscribers;

create policy "admin view subscribers" on subscribers
  for select to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin delete subscribers" on subscribers
  for delete to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');


drop policy if exists "authenticated upload covers" on storage.objects;
drop policy if exists "authenticated update covers" on storage.objects;
drop policy if exists "authenticated delete covers" on storage.objects;
drop policy if exists "admin upload covers" on storage.objects;
drop policy if exists "admin update covers" on storage.objects;
drop policy if exists "admin delete covers" on storage.objects;

create policy "admin upload covers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'covers' and auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin update covers" on storage.objects
  for update to authenticated
  using (bucket_id = 'covers' and auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb')
  with check (bucket_id = 'covers' and auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin delete covers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'covers' and auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');
