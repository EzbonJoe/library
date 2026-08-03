-- Blog posts, managed from the admin dashboard so publishing doesn't need a
-- code deploy -- same shape as settings/books: snake_case columns, RLS with
-- public-read-published + hardcoded admin-uid write (same admin uid used
-- throughout migration-008 and migration-018).
create table if not exists posts (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table posts enable row level security;

create policy "public can view published posts" on posts
  for select to anon, authenticated
  using (status = 'published');

create policy "admin can view all posts" on posts
  for select to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin write posts" on posts
  for insert to authenticated
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin update posts" on posts
  for update to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb')
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin delete posts" on posts
  for delete to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');
