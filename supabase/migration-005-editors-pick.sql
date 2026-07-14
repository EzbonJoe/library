-- Lets the admin mark any number of quotes as "Editor's Pick" (unlike `featured`,
-- which is exclusive to a single quote for the hero section). Also powers the
-- daily-rotating "Quote of the Day" hero, drawn from this same pool.
alter table quotes add column if not exists editors_pick boolean not null default false;
