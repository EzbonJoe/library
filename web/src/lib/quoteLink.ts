// Individual quotes live at /book/[slug]/[position] -- nested under their
// book (not a flat /quote/[id]) so the URL itself carries the book context,
// and so the route can reuse the same slug-based lookup the book page
// already does instead of introducing a second identifier scheme.
export function quoteLink(bookSlug: string, position: number): string {
  return `/book/${encodeURIComponent(bookSlug)}/${position}`;
}
