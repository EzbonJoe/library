-- Email capture for the "quote of the day" list. Visitors can submit their own
-- email (anon insert), but only the logged-in admin can read or remove the list.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create table if not exists subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table subscribers enable row level security;

create policy "public can subscribe" on subscribers
for insert to anon with check (true);

create policy "authenticated can view subscribers" on subscribers
for select to authenticated using (true);

create policy "authenticated can delete subscribers" on subscribers
for delete to authenticated using (true);
