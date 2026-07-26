-- Collections: user-named folders that group quotes from either source
-- (curated library quotes via saved_quotes, or the user's own personal
-- quotes via user_quotes). Additive only.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create table if not exists collections (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists collections_owner_id_idx on collections (owner_id);

-- Polymorphic membership row: item_type distinguishes which table item_ref
-- points into (quotes.id for 'saved', user_quotes.id for 'personal') since a
-- single FK can't target two different tables.
create table if not exists collection_items (
  id bigint generated always as identity primary key,
  collection_id bigint not null references collections(id) on delete cascade,
  item_type text not null check (item_type in ('saved', 'personal')),
  item_ref bigint not null,
  created_at timestamptz not null default now(),
  unique (collection_id, item_type, item_ref)
);

create index if not exists collection_items_collection_id_idx on collection_items (collection_id);

alter table collections enable row level security;
alter table collection_items enable row level security;

create policy "owner manage own collections" on collections
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner manage own collection items" on collection_items
  for all to authenticated
  using (exists (select 1 from collections c where c.id = collection_items.collection_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from collections c where c.id = collection_items.collection_id and c.owner_id = auth.uid()));
