// Separate from lib/bookmarks.ts (which saves individual quotes) — this
// saves whole books, keyed by slug since that's what every book-related page
// already has on hand.
const BOOK_BOOKMARKS_KEY = "gadzeke-book-bookmarks";

export function getBookBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOOK_BOOKMARKS_KEY) ?? "[]") || [];
  } catch {
    return [];
  }
}

export function isBookBookmarked(slug: string): boolean {
  return getBookBookmarks().includes(slug);
}

export function toggleBookBookmark(slug: string): boolean {
  const bookmarks = getBookBookmarks();
  const index = bookmarks.indexOf(slug);

  if (index === -1) {
    bookmarks.push(slug);
  } else {
    bookmarks.splice(index, 1);
  }

  localStorage.setItem(BOOK_BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return bookmarks.includes(slug);
}
