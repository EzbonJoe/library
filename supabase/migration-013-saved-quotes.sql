-- Account-synced bookmarks ("Saved Quotes" in My Library). Additive only --
-- doesn't touch the existing books/quotes RLS from migration-008. Anonymous
-- visitors keep the existing localStorage-only bookmarking; this table is
-- what lets a logged-in user's saves follow them across devices.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create table if not exists saved_quotes (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  quote_id bigint not null references quotes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, quote_id)
);

create index if not exists saved_quotes_owner_id_idx on saved_quotes (owner_id);

alter table saved_quotes enable row level security;

create policy "owner read own saved quotes" on saved_quotes
  for select to authenticated
  using (auth.uid() = owner_id);

create policy "owner insert own saved quotes" on saved_quotes
  for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "owner delete own saved quotes" on saved_quotes
  for delete to authenticated
  using (auth.uid() = owner_id);
