-- Re-applies the posts write policies idempotently. If migration-019 was
-- only partially applied (e.g. the SQL editor cut off after the table +
-- public-read policy), authenticated inserts/updates/deletes would hit the
-- same RLS-denial as an anon request, since RLS defaults to deny with no
-- matching policy. drop-if-exists makes this safe to run regardless of
-- what's currently live.
drop policy if exists "admin can view all posts" on posts;
create policy "admin can view all posts" on posts
  for select to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

drop policy if exists "admin write posts" on posts;
create policy "admin write posts" on posts
  for insert to authenticated
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

drop policy if exists "admin update posts" on posts;
create policy "admin update posts" on posts
  for update to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb')
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

drop policy if exists "admin delete posts" on posts;
create policy "admin delete posts" on posts
  for delete to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');
