-- Self-service account deletion. The anon/authenticated client can never
-- delete from auth.users directly (that needs the service role key, which
-- this project doesn't expose to the browser) -- so this wraps it in a
-- SECURITY DEFINER function that only ever deletes the CALLING user's own
-- row (auth.uid(), not a parameter), which is safe to grant to
-- `authenticated`. profiles/user_quotes/saved_quotes/collections all
-- reference auth.users(id) on delete cascade already, so deleting the auth
-- row cleans up everything else in one shot.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function delete_own_account() to authenticated;
