-- Centralizes site-wide values (site name, SEO defaults, footer copy, social
-- links) that were previously hardcoded across layout.tsx, SiteHeader, and
-- SiteFooter, so the admin Settings page can edit them without a code
-- deploy. Singleton table: always exactly one row, id = 1.
create table if not exists settings (
  id int primary key default 1,
  site_name text not null default 'GadZeke',
  site_tagline text not null default 'Words That Change Perspectives',
  seo_description text not null default 'Discover timeless, hand-picked quotes from the world''s greatest business, psychology, and philosophy books — curated by GadZeke, not AI-generated.',
  og_image_url text not null default '/icons/logo-social.png',
  footer_curator_text text not null default 'Hand-picked by Rami Zeke, one book at a time — not AI-generated.',
  footer_copyright_text text not null default '© 2026 GadZeke — quotes are excerpted from their original books for personal inspiration and commentary.',
  youtube_url text,
  instagram_url text,
  twitter_url text,
  facebook_url text,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into settings (id) values (1) on conflict (id) do nothing;

alter table settings enable row level security;

create policy "public can view settings" on settings
  for select to anon, authenticated
  using (true);


create policy "admin update settings" on settings
  for update to authenticated
  using (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb')
  with check (auth.uid() = 'aaa8656a-e03f-4a6b-aef3-da9448f5cdeb');
