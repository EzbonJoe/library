-- Adds a book-level description and a "featured" flag (mirrors quotes.featured/editors_pick)
-- for the Netflix-style Books browse page: description powers the book detail hero, featured
-- marks the candidate pool for the rotating featured-book hero and editorial breakout.
-- Run once in the Supabase SQL Editor, same way earlier migrations were run.

alter table books add column if not exists description text;
alter table books add column if not exists featured boolean not null default false;
