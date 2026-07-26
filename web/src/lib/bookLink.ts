// The old static site had 13 hand-authored legacy pages plus a dynamic
// book.html?book=... template, so links needed to pick between two URL
// shapes (see the old scripts/legacySlugs.js). The rewrite unifies every
// book onto a single /book/[slug] route (Phase 2), so link generation no
// longer needs that distinction — the 13 legacy URLs instead 301-redirect
// into this route via next.config.ts.
export function bookLink(slug: string): string {
  return `/book/${encodeURIComponent(slug)}`;
}
