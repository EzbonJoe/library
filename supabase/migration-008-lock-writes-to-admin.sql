-- Defense-in-depth: the existing write policies on books/quotes/storage/
-- subscribers grant access to any "authenticated" session, not specifically
-- you. That was only safe as long as public signup stayed disabled. This
-- locks every write policy to your specific admin user ID instead, so even
-- a future signup-setting mistake wouldn't hand out write access to a
-- stranger who creates an account.
--
-- Before running this: find your admin user ID in the Supabase dashboard
-- under Authentication -> Users (click your account, copy the "User UID"),
-- or run:  select id, email from auth.users;
-- Then replace 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb' below with that value.


drop policy if exists "authenticated insert books" on books;
drop policy if exists "authenticated update books" on books;
drop policy if exists "authenticated delete books" on books;

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

create policy "admin view subscribers" on subscribers
  for select to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin delete subscribers" on subscribers
  for delete to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');


drop policy if exists "authenticated upload covers" on storage.objects;
drop policy if exists "authenticated update covers" on storage.objects;
drop policy if exists "authenticated delete covers" on storage.objects;

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
