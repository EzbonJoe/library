# GadZeke — platform vision

## Where this came from

The Next.js rewrite (see `nextjs-rewrite` branch) added accounts, a moderated quote-submission
queue, and public profile pages (`/u/[username]`) as a first step toward letting visitors save
and share quotes, not just browse the ones curated from books. After that shipped and was
verified end-to-end, the owner laid out the fuller direction it's meant to grow into.

## The vision (owner's own framing)

GadZeke becomes a platform for people to save the quotes and words they live by — a social
network built around quotes, not just GadZeke's own curated library.

- Each person gets an account and a profile.
- On that profile, they can save quotes in two distinct ways:
  1. **Quotes that caught their attention from a book** — sourced from GadZeke's existing
     curated library (the `books`/`quotes` tables), attributed back to that book.
  2. **Personal quotes** — original lines the person came up with themselves, not sourced from
     any book in the library.
- Other visitors can browse a person's profile and see both kinds of quotes — "the words they
  live by."
- Longer-term, this extends beyond the website: a mobile app for the same platform.

## Current implementation vs. this vision

What's already in place (as of the Next.js rewrite, Phase 3):
- Accounts (`profiles` table, Supabase Auth email/password, `/signup` and `/login`).
- A single `user_quotes` table for anything a user submits, with a review queue (`pending` /
  `approved` / `rejected`) moderated from the admin panel before it's publicly visible.
- Public profile pages at `/u/[username]` listing a user's approved quotes.
- `user_quotes` currently has one optional free-text `book_title` field — it does **not**
  distinguish "linked to a real book in GadZeke's library" from "personal/original quote." Both
  look the same in the data model today.

**Gap to close for the fuller vision:** the two save-types described above (library-sourced vs.
personal) are meaningfully different objects — one references an existing `books`/`quotes` row
and should probably skip the review queue (it's already curated content, just being
saved/re-shared), while the other is original user content and genuinely needs moderation. This
likely means splitting into two tables (e.g. a `saved_library_quotes` join table referencing
`quotes.id`, alongside the existing `user_quotes` for original content) rather than overloading
one table with an optional book reference.

**Mobile app:** no action needed on the current web stack to prepare for this — Supabase has a
mobile SDK, and nothing built so far (accounts, RLS policies, data model) would need to be
redone to support a future mobile client hitting the same backend.

## Known hurdles

Raised when the vision was documented, before any implementation on it started. Worth deciding
on purpose rather than discovering under pressure later.

1. **Copyright, sharper than it looks today.** GadZeke's fair-use footing right now rests on
   "one curator, hand-picked short excerpts, personal commentary." Once any visitor can save
   quotes from books and publish them to a public profile, volume and control both change — and
   nothing stops someone pasting a full poem, song lyric, or long copyrighted passage into the
   "personal quote" field to dodge attribution entirely. Worth deciding: a length cap, and
   whether "personal quote" gets any originality check at all.
2. **Moderation stops scaling the moment more than a few people use it.** The review queue works
   because it's just one person approving a trickle of submissions. Real usage means the queue
   either becomes a part-time job or gets loosened — and loosening it re-opens the spam problem
   already patched once before (see the signup-abuse fix in git history, `f293368`). No free
   option here, just a tradeoff to make deliberately.
3. **The library-quote vs. personal-quote split is a moderation-evasion loophole if done
   carelessly.** If saving a library quote skips review (reasonable — it's already-curated
   content) but personal quotes don't, that boundary needs to be airtight, or it becomes the
   exploit in #1.
4. **Public profiles are a bigger attack surface than a quote library.** Impersonation (someone
   registers as a real author, or as the site owner), offensive usernames, harassment via
   profile content — none of this is covered by a single-admin review queue once profiles
   themselves are the public-facing thing, not just quotes.
5. **Discovery is missing entirely.** There's currently no way to find *people* — no directory,
   search-by-name, trending profiles, or follow graph. A "visit people's profiles" platform with
   no path to discover a profile you didn't already have the URL for isn't really social yet.
6. **The mobile app isn't just "add a client."** A UGC social app hits app-store review
   requirements a personal quote site doesn't — Apple in particular requires a working
   report/block flow for any app with user-generated public content, or it gets rejected. That
   has to exist on the backend before the app can ship, not after.
7. **Free-tier ceilings, quietly.** Supabase and Netlify's free tiers are fine for a personal
   site's traffic; a social platform's signups, storage, and bandwidth profile is a different
   order of magnitude. Not urgent, but worth knowing where those limits are before they surprise
   anyone.
8. **Brand dilution.** GadZeke's identity is "curated, actually read, not AI-generated." Once
   most content is user-submitted, that promise needs a clear visual line (GadZeke's own picks
   vs. everyone else's) or it stops meaning anything.

## Status

Vision documented; no implementation started on the library-quote/personal-quote split or the
mobile app. Next step, when the owner is ready, is likely the schema split described above,
followed by profile-page UI to show the two quote types distinctly (and probably a way to
"save" a quote directly from the existing feed/book pages, not just submit new text via
`/quotes/new`).
