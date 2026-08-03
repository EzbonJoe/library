-- The public "insert" policy on feedback (migration-022) has no size limit,
-- so anyone posting directly to the REST API (not just through the on-site
-- prompt) could store an arbitrarily large "message" -- cheap way to bloat
-- the table regardless of how the insert request was made. Cap it at the
-- database level, same reasoning as migration-007's email-format check on
-- subscribers.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

alter table feedback
  add constraint feedback_message_length
  check (message is null or char_length(message) <= 2000);
