-- migration-010 gave the admin UID write access to every user_quotes row
-- (for approve/reject) but never gave it read access to *other users'*
-- pending rows -- the only select policy shows a row to the public once
-- approved, or to its own owner. That silently filtered the admin's
-- "Review submissions" list down to nothing, since the admin isn't the
-- owner of quotes it's supposed to be moderating. This adds the missing
-- read policy (Postgres RLS ORs multiple permissive select policies, so
-- this only adds visibility -- it doesn't change who else can see what).
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create policy "admin read all user quotes" on user_quotes
  for select to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');
