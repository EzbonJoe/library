# Using Google Search Console to grow GadZeke's search traffic

Two different problems show up in the Search Console **Performance** report, and
they need opposite fixes. Don't apply one's fix to the other's data.

- **Impressions high, clicks low** → a CTR problem. People see the page in
  results but don't click. Fix the snippet or wait out an indexing lag.
- **Clicks high** → proven demand. People already want this. Amplify it —
  reinforce the page, and mine the query phrasing for what to build next.

## 1. Fixing low CTR

In the **Queries** tab, sort by impressions descending. For anything with real
impressions but ~0% CTR, check **position** (Pages tab, or the query's detail
view) before touching anything:

- **Ranking outside the top ~15** → this is a ranking/content problem, not a
  snippet problem. Nobody scrolls that far regardless of how good the title
  is. Needs more content depth or internal links, not a copy edit.
- **Ranking well (top 10) but still ~0% CTR** → the title/meta description
  doesn't match what people typed. Rewrite the `<title>` and description to
  use the query's actual phrasing (GSC shows you the literal words people
  searched — use them).

## 2. Special case: old URLs after a site restructure

GadZeke migrated from hand-authored static pages (`/quotes-from-33-strategies-of-war`,
etc.) to the unified `/book/[slug]` route, with 301/308 redirects in
[web/next.config.ts](web/next.config.ts) covering the old paths. After a migration like
this, old URLs can keep showing up in Search Console with real impressions and
near-zero clicks for a long time — Google doesn't swap what it displays in
results the moment a redirect goes live; it has to recrawl the old URL first.

**How to tell if this is what's happening:** run URL Inspection on the old URL.
If it shows "Page is indexed" with a **self-referencing canonical** (User-declared
canonical = the old URL itself) and no mention of a redirect, Google's copy of
that URL predates the redirect being processed. Confirm the redirect is
actually live with:

```
curl -s -D - -o /dev/null "https://gadzeke.com/<old-path>"
```

Look for a `301`/`308` status and a `Location` header pointing at the new URL.

**The fix:** in URL Inspection, click **Request Indexing** on the old URL. That
queues an immediate recrawl; once Googlebot sees the redirect, Google
consolidates ranking signal into the new URL and updates what shows in
results. Expect **2-4 weeks** for the Performance report to reflect it — don't
re-request repeatedly, it won't speed things up further.

**What does *not* fix this:** resubmitting or editing the sitemap. Sitemaps are
a discovery mechanism for pages Google doesn't know about yet — they don't
cause old URLs to stick around, and they don't make Google drop or merge an
already-indexed URL either. `web/src/app/sitemap.ts` only ever lists current
canonical URLs; that's correct and sufficient. The old-URL cleanup only
happens via a recrawl.

## 3. Turning proven queries into growth

In the **Queries** tab, sort by **clicks** descending instead of impressions.
This is your validated-demand list — real people already found and clicked
these.

For each one:

1. **Find the page that earns it** (Pages tab, filtered to the query) and
   reinforce it — more depth if the page is thin, internal links using the
   query's exact phrasing as anchor text, title/H1 that echoes the winning
   phrase verbatim.
2. **Watch for topic clusters that don't map to an existing page.** Book-title
   queries land naturally on `/book/[slug]`. But topic-phrased queries — "quotes
   about X", "X quotes" for a theme rather than a book title — often don't have
   a home. That's a signal to build a dedicated topic page.
3. **Book-title queries with no matching book yet** are a content/acquisition
   backlog: validated demand for a book you haven't added.

### Worked example: `/quotes-about-tactics`

Built from the query cluster "tactical quotes" / "quotes about tactics", which
didn't map to any single book or existing category (Business, Leadership, etc.
were too broad; "tactics" cuts across several books instead of being one
book's whole theme).

Pattern for the next one of these:

- Query quotes by **keyword match on quote text**, not `books.category` — a
  theme like this rarely aligns with the fixed category list:
  ```ts
  supabase
    .from("quotes")
    .select("id, text, editors_pick, book:books!inner(title, image, author, category, slug, status)")
    .eq("book.status", "published")
    .or("text.ilike.*tactic*,text.ilike.*strategy*,text.ilike.*strategic*")
  ```
  (Note: PostgREST's `or()` filter needs `*` as the wildcard, not `%`.)
- Check the match count before building anything — a handful of quotes reads
  as thin content and isn't worth a dedicated page. Aim for a real double-digit
  set pulled from multiple books.
- New route under `web/src/app/(site)/<topic-slug>/page.tsx`, reusing the
  existing `QuoteCard` component and global `.hero` / `.quote-grid` styles
  (from `feed.css`) so it looks native to the site instead of bolted on.
- **Add it to `web/src/app/sitemap.ts`** and **link to it from somewhere real**
  (it's currently linked from `/categories`). A page with no internal link and
  no sitemap entry is an orphan — same failure mode as the legacy-URL problem
  above, just self-inflicted instead of inherited from a migration.

## 4. Cadence

Review the Queries and Pages tabs monthly. Re-check any in-progress legacy-URL
migrations until their impressions have clearly shifted to the new URLs, then
stop tracking them — at that point there's nothing left to act on.
