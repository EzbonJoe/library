-- Reverts user_quotes from "public, reviewed before publish" to "private,
-- saved instantly, visible only to the owner" -- the social/public-profile
-- feature is paused for now (see PLATFORM-VISION.md), to be revisited later.
-- Existing approved quotes are left as-is in the database; they just stop
-- being publicly readable. Run once in the Supabase SQL Editor.

-- Nothing should be stuck in limbo once the review queue goes away.
update user_quotes set status = 'approved' where status = 'pending';


drop policy if exists "public read approved user quotes" on user_quotes;

create policy "owner read own user quotes" on user_quotes
  for select to authenticated
  using (auth.uid() = owner_id);


drop policy if exists "owner insert own pending user quotes" on user_quotes;

create policy "owner insert own user quotes" on user_quotes
  for insert to authenticated
  with check (auth.uid() = owner_id);


drop policy if exists "owner edit own pending user quotes" on user_quotes;
drop policy if exists "owner delete own pending user quotes" on user_quotes;

create policy "owner edit own user quotes" on user_quotes
  for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner delete own user quotes" on user_quotes
  for delete to authenticated
  using (auth.uid() = owner_id);
