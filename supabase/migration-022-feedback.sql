-- Lightweight, internal-only feedback capture -- shown to returning visitors
-- as a dismissible on-site prompt (not public reviews/testimonials), so
-- there's no moderation queue here, just anon insert + admin-only read,
-- same shape as migration-004-subscribers.sql.
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

create table if not exists feedback (
  id bigint generated always as identity primary key,
  rating smallint not null check (rating between 1 and 5),
  message text,
  page_path text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "public can submit feedback" on feedback
  for insert to anon, authenticated
  with check (true);

create policy "admin view feedback" on feedback
  for select to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');

create policy "admin delete feedback" on feedback
  for delete to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');
