// The 13 original books each have a hand-authored static HTML page (clean URL,
// e.g. /Quotes-From-Rich-Dad-Poor-Dad) predating the Supabase-backed book.html
// template. Routing links to the dedicated page instead of book.html?book=...
// for these avoids two URLs serving the same content (a duplicate-content SEO
// issue) — any book added after this list was written has no dedicated page,
// so it falls back to book.html.
export const LEGACY_BOOK_SLUGS = new Set([
  'Quotes-From-33-Strategies-Of-War',
  'Quotes-from-Mastery',
  'Quotes-From-Goals-by-Brian-Tracy',
  'Quotes-From-The-Monk-Who-Sold-His-Ferrari',
  'Quotes-From-How-To-Lead-The-Family-Business',
  'Quotes-From-The-Millionaire-Fastlane',
  'Quotes-from-The-5am-Club',
  'Quotes-From-Secrets-Of-Closing-A-Sell',
  'Quotes-From-Laws-of-Human-Nature',
  'Quotes-From-The-Richest-Man-In-Babylon',
  'Quotes-From-Rich-Dad-Poor-Dad',
  'Quotes-From-How-To-Win-Friends-And-Influence-People',
  'Quotes-From-7-Habits-of-Highly-Effective-People',
]);

// Links use a lowercased path — Netlify's static file serving is case-insensitive
// (so the real, mixed-case .html file still resolves), but requesting the exact
// mixed-case path triggers an extra 301 redirect to the lowercase canonical form.
// Generating lowercase links avoids that hop entirely.
export function bookLink(slug){
  return LEGACY_BOOK_SLUGS.has(slug) ? slug.toLowerCase() : `book.html?book=${encodeURIComponent(slug)}`;
}
