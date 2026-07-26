// Shared bookmark storage — used by the home feed (bookmarked quotes can be
// filtered/browsed there) and individual book pages (a quote can be
// bookmarked while reading). Same localStorage key and event name as the
// legacy scripts/bookmarks.js so a visitor's existing bookmarks (and any
// browser extensions/tests relying on the event) keep working post-rewrite.
const BOOKMARKS_KEY = "gadzeke-bookmarks";
export const BOOKMARKS_CHANGED_EVENT = "gadzeke:bookmarks-changed";

export function getBookmarks(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]") || [];
  } catch {
    return [];
  }
}

export function isBookmarked(id: number): boolean {
  return getBookmarks().includes(id);
}

export function toggleBookmark(id: number): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);

  if (index === -1) {
    bookmarks.push(id);
  } else {
    bookmarks.splice(index, 1);
  }

  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT));
  return bookmarks.includes(id);
}
