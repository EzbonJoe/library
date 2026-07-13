// Regenerates sitemap.xml from live Supabase data. Re-run this after adding,
// removing, or publishing books so the sitemap stays current:
//   node migration/generate-sitemap.mjs
import fs from 'node:fs';
import { LEGACY_BOOK_SLUGS } from '../scripts/legacySlugs.js';

const SUPABASE_URL = 'https://honghcqqtehmdjhcvxup.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbmdoY3FxdGVobWRqaGN2eHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDMwNzUsImV4cCI6MjA5OTQxOTA3NX0.QwY9Dw1X_5O2bcmwz-3hVpjsV_0xGssfMIPLcsSpvwU';
const SITE_URL = 'https://gadzeke.com';

const STATIC_PAGES = [
  { path: '/', priority: '1.00' },
  { path: '/best-book-quotes-and-the-books-they-come-from', priority: '0.90' },
  { path: '/about', priority: '0.60' },
  { path: '/contact', priority: '0.50' },
  { path: '/privacy-policy', priority: '0.30' },
  { path: '/terms-and-conditions', priority: '0.30' },
];

async function main(){
  const response = await fetch(`${SUPABASE_URL}/rest/v1/books?select=slug,status&order=id`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });

  if(!response.ok){
    throw new Error(`Failed to fetch books: ${response.status} ${await response.text()}`);
  }

  const books = await response.json();

  const bookUrls = books
    .filter((book) => book.status === 'published')
    .map((book) => ({
      path: LEGACY_BOOK_SLUGS.has(book.slug) ? `/${book.slug.toLowerCase()}` : `/book.html?book=${encodeURIComponent(book.slug)}`,
      priority: '0.70',
    }));

  const allUrls = [...STATIC_PAGES, ...bookUrls];
  const lastmod = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls
    .map((u) => `  <url>\n    <loc>${SITE_URL}${u.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n')}\n</urlset>\n`;

  fs.writeFileSync(new URL('../sitemap.xml', import.meta.url), xml);
  console.log(`Wrote sitemap.xml with ${allUrls.length} URLs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
