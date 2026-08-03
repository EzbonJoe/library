import type { MetadataRoute } from "next";

const SITE_URL = "https://gadzeke.com";

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1.0 },
  { path: "/books", priority: 0.9 },
  { path: "/blog", priority: 0.7 },
  { path: "/quotes-about-tactics", priority: 0.7 },
  { path: "/editors-picks", priority: 0.7 },
  { path: "/authors", priority: 0.7 },
  { path: "/categories", priority: 0.7 },
  { path: "/about", priority: 0.6 },
  { path: "/contact", priority: 0.5 },
  { path: "/privacy-policy", priority: 0.3 },
  { path: "/terms-and-conditions", priority: 0.3 },
];

function supabaseHeaders() {
  return {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  };
}

// PostgREST caps a single request at this project's max-rows setting (1000)
// regardless of query params -- with 1273 quotes in the table, the old
// single fetch here silently dropped the last ~270, leaving them out of the
// sitemap entirely. Paginating with limit/offset until a partial page comes
// back is the only way to get every row.
async function fetchAllPaginated<T>(baseUrl: string): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const response = await fetch(`${baseUrl}${separator}limit=${pageSize}&offset=${offset}`, {
      headers: supabaseHeaders(),
      next: { revalidate: 3600 },
    });
    const page: T[] = response.ok ? await response.json() : [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

// Every book — legacy or new — now resolves through the single /book/[slug]
// route (Phase 2), so unlike the old migration/generate-sitemap.mjs there's
// no separate legacy-slug branch to account for here.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const [books, quotes, posts] = await Promise.all([
    fetchAllPaginated<{ slug: string; status: string }>(`${supabaseUrl}/rest/v1/books?select=slug,status&order=id`),
    // PostgREST embedded-resource filter: only quotes whose book is published.
    fetchAllPaginated<{ position: number; books: { slug: string; status: string } }>(
      `${supabaseUrl}/rest/v1/quotes?select=position,books!inner(slug,status)&books.status=eq.published&order=id`,
    ),
    fetchAllPaginated<{ slug: string; published_at: string | null }>(
      `${supabaseUrl}/rest/v1/posts?select=slug,published_at&status=eq.published`,
    ),
  ]);

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

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
    lastModified: post.published_at ? new Date(post.published_at) : lastModified,
    priority: 0.6,
  }));

  return [...staticEntries, ...bookEntries, ...quoteEntries, ...postEntries];
}
