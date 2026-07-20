-- Gmail (and Google Workspace's googlemail.com alias) ignores dots in the
-- local part of an address, and every major provider ignores a "+alias"
-- suffix -- so without normalization, one inbox can subscribe an unlimited
-- number of "unique" times just by rearranging dots (which is exactly what
-- happened: e.hona.y.a.d.o.k6.06@gmail.com is the same inbox as
-- ehonayadok606@gmail.com). This normalizes the email to its canonical form
-- before it's stored, so the existing UNIQUE constraint on subscribers.email
-- catches these as duplicates automatically -- and since it's enforced in a
-- BEFORE INSERT trigger, it can't be bypassed by posting directly to the
-- REST API either, the same way the client-side form could be skipped.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create or replace function normalize_subscriber_email()
returns trigger as $$
declare
  at_pos int;
  local_part text;
  domain_part text;
begin
  new.email := lower(trim(new.email));
  at_pos := position('@' in new.email);

  if at_pos = 0 then
    return new; 
  end if;

  local_part := substring(new.email from 1 for at_pos - 1);
  domain_part := substring(new.email from at_pos + 1);

  
  local_part := regexp_replace(local_part, '\+.*$', '');


  if domain_part in ('gmail.com', 'googlemail.com') then
    local_part := replace(local_part, '.', '');
  end if;

  new.email := local_part || '@' || domain_part;
  return new;
end;
$$ language plpgsql;

drop trigger if exists normalize_subscriber_email_trigger on subscribers;

create trigger normalize_subscriber_email_trigger
before insert on subscribers
for each row execute function normalize_subscriber_email();
