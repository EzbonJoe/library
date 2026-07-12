# Gadzeke — design direction & progress log

## Where this came from

Gadzeke started as a static personal site sharing quotes from books that inspired the owner
(see `PROJECT-OVERVIEW.md`). After wiring it up to Supabase (real upload flow via `admin.html`),
the next ask was to make the site "eye catching." That went through a few rounds before landing
on the actual target below.

## Progress log

1. **Round 1 — amber/teal design system.** Built a full token system (`styles/tokens.css`),
   serif/sans typography pairing, a live Amber-vs-Teal toggle to compare palettes, redesigned
   header/home/library grid/book-quote cards (italic serif quotes, left accent border, decorative
   quotation mark). **Rejected**: quote cards felt "squeezed and unpleasing to the eye," and the
   user wanted the original navy/aliceblue/pink/orange palette back rather than a new accent.
2. **Round 2 — revert + masonry cards.** Reverted every color to the original values, kept the
   structural wins (uniform book-cover cropping, spacing scale, serif headings), rebuilt quote
   cards as a 2-3 column masonry layout with circular number badges instead of inline "1.". **Still
   rejected** ("still not right") — at this point the user supplied the brief below, which makes
   clear the bar is a full premium product experience, not an incremental card restyle.
3. **Round 3 — this brief.** See below.

## The brief (verbatim intent, condensed)

A single, premium **"Words That Change Perspectives"** quotes-browsing experience in the spirit of
Apple/Notion/Medium/Spotify/Pinterest/Readwise:
- Hero with large heading + subtext + centered search + **sticky category chips**
  (Business, Psychology, Philosophy, Money, Relationships, Leadership, Success, Habits,
  Spirituality, Productivity) that cut across the whole library, not one book.
- A **featured quote** hero section (full-width background image from the book, dark overlay,
  floating cover, "Read More From This Book" CTA).
- **Quote cards** with: quote text, book cover thumbnail, title, author, category badge, estimated
  reading time, like count, bookmark icon, share icon, copy-quote button, hover lift.
- **Infinite scroll** with fade-up animation, animating once per card.
- **Sidebar** (desktop): Trending Books, Most Saved Quotes, Recently Added, Authors to Explore,
  Reading Streak.
- Skeleton loaders, empty states, full dark mode, WCAG AA accessibility.
- New color direction: `#FAFAF8` / white cards / `#111111` text / warm gold `#C9A227` accent
  (light), `#0D1117` / `#161B22` (dark).

## The gap: this is a platform pivot, not a restyle

Two things in this brief change the site's actual architecture, not just its CSS, and are worth
being explicit about before building:

1. **Unified cross-book feed vs. per-book pages.** Categories like "Business" or "Relationships"
   span many books — the brief describes one continuous browsing feed across the *entire*
   library, not "pick a book, then see its quotes" (today's model: `Best-book-quotes-...html` →
   `Quotes-From-<Book>.html`). Does this feed replace that navigation, sit alongside it, or become
   the new home page?
2. **Social/product features need new data this site doesn't have yet.** Today's schema is just
   `books (slug, title, image, status)` and `quotes (book_id, text, position)`. The brief assumes:
   - `category` per quote (doesn't exist — would need tagging, likely per-book to start)
   - `author` per book (doesn't exist, though inferable and easy to backfill)
   - persisted **like counts** and **bookmarks** (public, cross-visitor — needs a schema addition
     and a public-write RLS policy, since there's no visitor login on this site)
   - **reading streak** (meaningless without a way to identify a returning visitor — no accounts
     exist; a per-browser localStorage approximation is possible but isn't a real "streak")
   - **trending books / most-saved** (needs view or save counts aggregated over time — no tracking
     exists yet)

None of this is a blocker — it's all buildable — but it's a meaningfully bigger project than a
card redesign, and some pieces (streak, trending) are more "social platform" than "personal
reading journal," which is what this site actually is (one owner curating quotes, visitors just
browsing). Worth deciding intentionally which of these earn their complexity before implementation
starts, rather than building all of it by default.

## Next step

Confirming scope with the user (unified feed vs. per-book, which social features are worth
building for a single-admin personal site) before entering implementation planning.
