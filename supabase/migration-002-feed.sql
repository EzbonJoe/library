-- Adds the data the new quotes feed needs: author + category per book, and a
-- featured flag on quotes (for the hero section). Run once in the Supabase SQL Editor,
-- same way supabase/schema.sql was run.

alter table books add column if not exists author text;
alter table books add column if not exists category text;
alter table quotes add column if not exists featured boolean not null default false;

-- Category is assigned per book (not per quote) since tagging ~1,200 individual quotes
-- isn't practical, and each of these books maps cleanly onto one dominant theme anyway.
-- Author left NULL where not confidently known -- fill in via the admin panel instead of guessing.

update books set author = 'Robert Greene',    category = 'Leadership'    where slug = 'Quotes-From-33-Strategies-Of-War';
update books set author = 'Robert Greene',    category = 'Success'       where slug = 'Quotes-from-Mastery';
update books set author = 'Brian Tracy',      category = 'Success'       where slug = 'Quotes-From-Goals-by-Brian-Tracy';
update books set author = 'Robin Sharma',     category = 'Spirituality'  where slug = 'Quotes-From-The-Monk-Who-Sold-His-Ferrari';
update books set author = null,               category = 'Leadership'    where slug = 'Quotes-From-How-To-Lead-The-Family-Business';
update books set author = 'MJ DeMarco',       category = 'Money'         where slug = 'Quotes-From-The-Millionaire-Fastlane';
update books set author = 'David Deida',      category = 'Spirituality'  where slug = 'way-of-the-superior-man';
update books set author = 'Robin Sharma',     category = 'Habits'        where slug = 'Quotes-from-The-5am-Club';
update books set author = 'Napoleon Hill',    category = 'Money'         where slug = 'think-and-grow-rich';
update books set author = 'Zig Ziglar',       category = 'Business'      where slug = 'Quotes-From-Secrets-Of-Closing-A-Sell';
update books set author = 'Robert Greene',    category = 'Psychology'    where slug = 'Quotes-From-Laws-of-Human-Nature';
update books set author = null,               category = 'Leadership'    where slug = 'science-of-power';
update books set author = 'George S. Clason', category = 'Money'         where slug = 'Quotes-From-The-Richest-Man-In-Babylon';
update books set author = 'Robert Kiyosaki',  category = 'Money'         where slug = 'Quotes-From-Rich-Dad-Poor-Dad';
update books set author = 'Marcus Aurelius',  category = 'Philosophy'    where slug = 'meditations';
update books set author = 'Napoleon Hill',    category = 'Success'       where slug = 'laws-of-success';
update books set author = 'Dale Carnegie',    category = 'Relationships' where slug = 'Quotes-From-How-To-Win-Friends-And-Influence-People';
update books set author = 'Stephen Covey',    category = 'Habits'        where slug = 'Quotes-From-7-Habits-of-Highly-Effective-People';

update quotes set featured = true
where book_id = (select id from books where slug = 'Quotes-From-Rich-Dad-Poor-Dad')
and text = 'He who has the gold makes the rules.';
