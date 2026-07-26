-- Account-synced whole-book favorites ("My Books" in My Library), mirroring
-- migration-013's saved_quotes pattern but keyed by book slug instead of
-- quote id, matching lib/bookBookmarks.ts's existing localStorage key.
-- Additive only -- anonymous visitors keep the existing localStorage-only
-- book bookmarking untouched.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create table if not exists saved_books (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  book_slug text not null references books(slug) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, book_slug)
);

create index if not exists saved_books_owner_id_idx on saved_books (owner_id);

alter table saved_books enable row level security;

create policy "owner read own saved books" on saved_books
  for select to authenticated
  using (auth.uid() = owner_id);

create policy "owner insert own saved books" on saved_books
  for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "owner delete own saved books" on saved_books
  for delete to authenticated
  using (auth.uid() = owner_id);
