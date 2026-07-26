// Book cover images added via the current admin are full Supabase Storage
// URLs, but the 18 original books (migrated from the old static site) still
// store root-relative paths like "images/Rich Dad Poor Dad.png" — a
// convention that only worked when every page lived one path segment deep
// at the site root. On a nested route like /book/[slug], the browser
// resolves that relative path against the *page's* URL instead of the
// site's, landing on /book/images/... (404) instead of /images/....
// This normalizes either form into something that resolves correctly no
// matter how deep the current page's path is.
export function resolveCoverUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}
