-- Adds user accounts, submitted quotes (review queue), and public profiles.
-- Additive only -- does not touch the existing books/quotes RLS from
-- migration-008, which stays locked to the admin UID for curated content.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_-]{3,30}$'),
  display_name text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists user_quotes (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  book_title text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists user_quotes_owner_id_idx on user_quotes (owner_id);
create index if not exists user_quotes_status_idx on user_quotes (status);

alter table profiles enable row level security;
alter table user_quotes enable row level security;


create policy "public read profiles" on profiles for select using (true);

create policy "owner insert own profile" on profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "owner update own profile" on profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


create policy "public read approved user quotes" on user_quotes
  for select using (status = 'approved' or auth.uid() = owner_id);

create policy "owner insert own pending user quotes" on user_quotes
  for insert to authenticated
  with check (auth.uid() = owner_id and status = 'pending');


create policy "admin moderate user quotes" on user_quotes
  for update to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb')
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "owner edit own pending user quotes" on user_quotes
  for update to authenticated
  using (auth.uid() = owner_id and status = 'pending')
  with check (auth.uid() = owner_id and status = 'pending');

create policy "admin delete user quotes" on user_quotes
  for delete to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "owner delete own pending user quotes" on user_quotes
  for delete to authenticated
  using (auth.uid() = owner_id and status = 'pending');
