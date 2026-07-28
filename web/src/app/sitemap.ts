import type { MetadataRoute } from "next";

const SITE_URL = "https://gadzeke.com";

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1.0 },
  { path: "/books", priority: 0.9 },
  { path: "/authors", priority: 0.7 },
  { path: "/categories", priority: 0.7 },
  { path: "/about", priority: 0.6 },
  { path: "/contact", priority: 0.5 },
  { path: "/privacy-policy", priority: 0.3 },
  { path: "/terms-and-conditions", priority: 0.3 },
];

// Every book — legacy or new — now resolves through the single /book/[slug]
// route (Phase 2), so unlike the old migration/generate-sitemap.mjs there's
// no separate legacy-slug branch to account for here.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [booksResponse, quotesResponse] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/books?select=slug,status&order=id`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 3600 },
    }),
    // PostgREST embedded-resource filter: only quotes whose book is published.
    fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/quotes?select=position,books!inner(slug,status)&books.status=eq.published`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 3600 },
      },
    ),
  ]);

  const books: { slug: string; status: string }[] = booksResponse.ok ? await booksResponse.json() : [];
  const quotes: { position: number; books: { slug: string; status: string } }[] = quotesResponse.ok
    ? await quotesResponse.json()
    : [];

  const lastModified = new Date();

  const bookEntries: MetadataRoute.Sitemap = books
    .filter((book) => book.status === "published")
    .map((book) => ({
      url: `${SITE_URL}/book/${encodeURIComponent(book.slug)}`,
      lastModified,
      priority: 0.7,
    }));

  const quoteEntries: MetadataRoute.Sitemap = quotes.map((quote) => ({
    url: `${SITE_URL}/book/${encodeURIComponent(quote.books.slug)}/${quote.position}`,
    lastModified,
    priority: 0.5,
  }));

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified,
    priority: page.priority,
  }));

  return [...staticEntries, ...bookEntries, ...quoteEntries];
}
