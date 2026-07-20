# GadZeke — Project Overview

## What it is

**GadZeke** is a static website you built (by Rami Zeke) that shares key quotes/takeaways from
self-help and business books — 33 Strategies of War, Rich Dad Poor Dad, The Millionaire Fastlane,
Mastery, Laws of Human Nature, How to Win Friends and Influence People, 7 Habits, etc.

Per the About page copy: *"These notes are not AI generated but they are got from individuals who
have actually read the books and felt that the quote had a positive effect on them."* Right now, if
someone wants to contribute quotes, the site just tells them to **email a file to
ramizeke516@gmail.com** — there's no upload feature yet.

## Tech stack

Pure static site. No backend, no database, no build tools, no `package.json`, no framework.
- Plain HTML pages, one per book
- Plain CSS (`styles/`)
- Vanilla JS ES modules (`scripts/`, `data/`)
- Deployed as static files (there's an `htaccess` for Apache URL rewriting so `/about` serves
  `about.html`, etc.)

## Structure

```
index.html                                  Home page (image carousel + CTA)
Best-book-quotes-and-the-books-they-come-from.html   Library/grid page with search
Quotes-From-<Book>.html                     One page per book, renders that book's quotes
about.html / contact.html / coming-soon.html

data/
  books.js                                  Master list: {image, title, link} for every book
                                             shown on the library grid — including "coming-soon"
                                             placeholders for books not yet written up
  <book>Quotes.js                           One file per book, each exporting a plain array of
                                             quote strings, e.g. richDadPoorDadQuotes.js

scripts/
  library.js                                Renders the book grid from books.js + client-side
                                             search (via ?search= query param)
  <book>.js                                 One tiny script per book page: imports that book's
                                             quotes array and dumps each quote into a <div>
  header.js / darkmode.js / home.js         Shared UI behavior (nav dropdown, dark mode toggle,
                                             home page image rotator)

styles/                                     Plain CSS, split by page/section
images/, icons/                             Book cover images and UI icons
```

## How a book gets added today (fully manual)

1. Add a cover image to `images/`
2. Add an entry to `data/books.js` (image, title, link slug)
3. Create `data/<book>Quotes.js` — hand-type every quote as a string in an array
4. Create `scripts/<book>.js` — a copy-pasted loader script (import quotes, build HTML, inject into `.js-<book>` div)
5. Create `Quotes-From-<Book>.html` — a copy-pasted page shell wired to that script

That's ~4 hand-written files per book, entirely copy-paste-driven, with no shared template or data
store. This is the main thing that makes "uploading quotes" hard right now — there's no form, no
storage, and no dynamic rendering; everything is hardcoded at author-time.

## What's not built yet

- **No way for a user (or even the site owner) to submit/upload a quote through the site.** The
  About page explicitly punts this to email.
  - "coming-soon" books in `books.js` (Way of the Superior Man, Think and Grow Rich, Science of
    Power, Meditations, Laws of Success) point to a stub page.
- No backend/API, no database — everything is a static array baked into JS files at commit time.
- No forms anywhere on the site.

## Goal for this round of improvements

Add the ability to **upload/submit quotes** (from books the user is currently reading) directly
through the site, instead of emailing a file. This requires deciding:
- Where submitted quotes get stored (a backend + database, a static-site-friendly service like a
  form backend / headless CMS / Google Sheet, or just local browser storage for a personal-only
  version)
- Whether submissions go live immediately or need review/approval first
- Whether to keep the existing hardcoded per-book file structure or move all quotes into a single
  shared data source (e.g. one JSON/DB collection with a `book` field) that both the existing pages
  and the new upload form can read/write — the latter would also remove the copy-paste-per-book
  pattern described above.
