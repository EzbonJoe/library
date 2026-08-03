export function postLink(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}
