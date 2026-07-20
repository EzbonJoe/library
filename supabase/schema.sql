-- GadZeke quote storage schema.
-- Run this once in the Supabase project's SQL Editor before wiring up the site.

create table if not exists books (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  image text not null,
  status text not null default 'published' check (status in ('published', 'coming_soon')),
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id bigint generated always as identity primary key,
  book_id bigint not null references books(id) on delete cascade,
  text text not null,
  position int not null,
  created_at timestamptz not null default now()
);

create index if not exists quotes_book_id_position_idx on quotes (book_id, position);

alter table books enable row level security;
alter table quotes enable row level security;

-- Visitors can read everything...
create policy "public read books" on books for select using (true);
create policy "public read quotes" on quotes for select using (true);

-- ...but only a logged-in (owner) session can write.
create policy "authenticated insert books" on books for insert to authenticated with check (true);
create policy "authenticated update books" on books for update to authenticated using (true) with check (true);
create policy "authenticated delete books" on books for delete to authenticated using (true);

create policy "authenticated insert quotes" on quotes for insert to authenticated with check (true);
create policy "authenticated update quotes" on quotes for update to authenticated using (true) with check (true);
create policy "authenticated delete quotes" on quotes for delete to authenticated using (true);
