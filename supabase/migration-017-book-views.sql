-- Recently Viewed: logs the last time a logged-in user opened each book's
-- page. One row per (owner, book) -- re-visiting bumps viewed_at rather than
-- growing an ever-larger history log, since "recently viewed" only cares
-- about the most recent look, not a full audit trail.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create table if not exists book_views (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  book_slug text not null references books(slug) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (owner_id, book_slug)
);

create index if not exists book_views_owner_id_idx on book_views (owner_id);

alter table book_views enable row level security;

create policy "owner manage own book views" on book_views
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
