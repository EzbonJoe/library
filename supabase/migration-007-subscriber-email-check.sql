-- The public "insert" policy on subscribers (migration-004) has no format
-- validation, so anyone posting directly to the REST API (not just through
-- the subscribe form) could store arbitrary text as an "email" -- including
-- an HTML/script payload that would later render in the admin panel's
-- subscriber list. Reject anything that isn't email-shaped at the database
-- level, regardless of how the insert request was made.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

alter table subscribers
  add constraint subscribers_email_format
  check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
