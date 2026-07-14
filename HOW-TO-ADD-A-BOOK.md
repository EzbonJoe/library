# Adding a new book to Gadzeke

This is the full workflow for adding a book and its quotes, start to finish, without
needing any code changes. Everything below happens through the admin panel and two
terminal commands.

## 1. Prepare a cover image

Any `.jpg`, `.png`, or `.webp` file works — you'll upload it directly in the next step
(it gets stored in Supabase, not the git repo).

## 2. Log into the admin panel

Go to `https://gadzeke.com/admin.html` and log in with your Supabase account
(email + password).

## 3. Add the book

In the **"Add a new book"** section:
- **Title** — the book's title, e.g. `Atomic Habits`.
- **Author** — e.g. `James Clear`. Leave blank if unsure; you can fill it in later
  under "Manage books".
- **Category** — pick the closest fit from the dropdown (Business, Psychology,
  Money, etc.) — this drives the category filter chips on the home page.
- **Slug** — leave blank. It auto-generates from the title (e.g.
  `Quotes-From-Atomic-Habits`) and updates live as you type, so you can see it
  before submitting.
- **Cover image** — upload the file from step 1.
- **Status** — `Published` if you're adding quotes now, `Coming soon` if you just
  want it to appear as a placeholder for later.

Click **Add book**. This is the only step that needs a code-free "new page" to work —
the book is immediately reachable at `gadzeke.com/book.html?book=<slug>`, no manual
page creation needed.

## 4. Add quotes

Still logged in, use **"Add a quote"**:
- Pick the book from the dropdown (it appears immediately after step 3).
- Paste the quote text.
- Click **Add quote**.

Repeat for each quote. They appear on the book's page in the order you add them.

Optional: in **"Manage quotes"**, you can mark one quote **★ Set as Featured** —
that's the quote that shows in the large featured section at the top of the home page.
Only one quote can be featured at a time; setting a new one automatically unsets
the old one.

## 5. Update the sitemap

This step needs your computer, not the admin panel — it makes the new book
discoverable by Google.

Open a terminal in the project folder and run:

```
node migration/generate-sitemap.mjs
```

This regenerates `sitemap.xml` from whatever's currently published in the database
(so it always reflects reality, no manual list to maintain).

## 6. Push the updated sitemap live

```
git add sitemap.xml
git commit -m "Update sitemap"
git push origin main
```

Netlify auto-deploys within seconds of the push. Google will pick up the new sitemap
on its own schedule — no need to manually resubmit in Search Console unless you want
faster indexing (Search Console → Sitemaps → click the existing `sitemap.xml` entry →
it'll show "Success" once re-crawled).

---

## Quick reference

| Task | Where |
|---|---|
| Add/edit/delete books | `gadzeke.com/admin.html` → Add a new book / Manage books |
| Add/edit/delete/feature quotes | `gadzeke.com/admin.html` → Add a quote / Manage quotes |
| View/export email subscribers | `gadzeke.com/admin.html` → Subscribers |
| Regenerate sitemap | `node migration/generate-sitemap.mjs` (then commit + push) |
| Set your real Amazon affiliate tag | `scripts/config.js` — one line, updates every book page automatically |

**You never need to write HTML or touch code for a new book** — the only manual
step outside the admin panel is re-running the sitemap script and pushing it.
