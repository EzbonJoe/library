-- Cross-referenced every published book against externally-recognized "most
-- quoted" lines (Goodreads, BrainyQuote, book-summary sites) to find quotes
-- already in the catalog that carry outside search demand -- the same
-- pattern documented in SEARCH-CONSOLE-WORKFLOW.md. Two kinds of fixes:
--
-- 1. Three quotes have a transcription error that breaks the line's actual
--    meaning (not just a style variation) -- fixed here rather than left for
--    someone to notice.
-- 2. One quote per book, picked from confirmed matches against the
--    widely-circulated version of that book's most-cited lines, gets
--    editors_pick = true so it surfaces in the homepage hero, the book
--    page's "Show Popular Quote", and the ✨ Editor's Pick badge in the feed.
--
-- Run once in the Supabase SQL Editor, same as the earlier migrations.

-- ---------------------------------------------------------------------------
-- 1. Transcription fixes
-- ---------------------------------------------------------------------------

-- How To Win Friends And Influence People #7 -- "weary" breaks the actual
-- line ("be wary of friends who flatter you"); as stored it reads as if
-- flattery is merely tiring rather than something to be cautious of.
update quotes set text =
  'Don''t be afraid of enemies who attack you, but be wary of friends who flatter you.'
  where id = 1104;

-- Rich Dad Poor Dad #59 -- "lossers" typo, plus a stray double space.
update quotes set text =
  'Failure inspires winners and failure defeats losers.'
  where id = 1076;

-- Secrets Of Closing Sell #7 -- stored as "...will determine your attitude",
-- repeating the first word instead of the actual punchline word
-- ("altitude"), which is the entire point of the line.
update quotes set text =
  'Your attitude, not your aptitude, will determine your altitude.'
  where id = 750;

-- ---------------------------------------------------------------------------
-- 2. Editor's Picks -- one per book, matched against externally-verified
--    "most quoted" lines for that specific title
-- ---------------------------------------------------------------------------

update quotes set editors_pick = true where id = 1114; -- How To Win Friends: "You can make more friends in two months..."
update quotes set editors_pick = true where id = 5;    -- 33 Strategies Of War: "Being unconquerable lies with yourself."
update quotes set editors_pick = true where id = 348;  -- Mastery: "...The time that leads to mastery is dependent on the intensity of our focus."
update quotes set editors_pick = true where id = 869;  -- Laws of Human Nature: "The horse and rider must work together..."
update quotes set editors_pick = true where id = 457;  -- The Monk Who Sold His Ferrari: "Self-mastery is the DNA of life mastery."
update quotes set editors_pick = true where id = 554;  -- The Millionaire Fastlane: "Value your time poorly and you will be poor..."
update quotes set editors_pick = true where id = 629;  -- The 5am Club: "Own your morning. Elevate your life."
update quotes set editors_pick = true where id = 1022; -- Rich Dad Poor Dad: "The poor and the middle class work for money..."
update quotes set editors_pick = true where id = 750;  -- Secrets Of Closing Sell: "...will determine your altitude." (after the fix above)
update quotes set editors_pick = true where id = 986;  -- Richest Man in Babylon: "Gold cometh gladly..."
update quotes set editors_pick = true where id = 1165; -- 7 Habits Of Highly Effective People: "Two people can see the same thing..."

-- Goals (Brian Tracy) intentionally excluded: none of the widely-circulated
-- "Brian Tracy quotes" found online matched this book's actual text verbatim
-- -- they appear to be drawn from his broader speaking career rather than
-- this specific book, so there was nothing to verify against.
