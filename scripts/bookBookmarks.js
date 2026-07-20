// Separate from scripts/bookmarks.js (which saves individual quotes) — this
// saves whole books, keyed by slug since that's what every page already has
// on hand (book.html, the legacy pages, and the books browse page).
const BOOK_BOOKMARKS_KEY = 'gadzeke-book-bookmarks';

export function getBookBookmarks(){
  try{
    return JSON.parse(localStorage.getItem(BOOK_BOOKMARKS_KEY)) || [];
  }catch{
    return [];
  }
}

export function isBookBookmarked(slug){
  return getBookBookmarks().includes(slug);
}

export function toggleBookBookmark(slug){
  const bookmarks = getBookBookmarks();
  const index = bookmarks.indexOf(slug);

  if(index === -1){
    bookmarks.push(slug);
  }else{
    bookmarks.splice(index, 1);
  }

  localStorage.setItem(BOOK_BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return bookmarks.includes(slug);
}
