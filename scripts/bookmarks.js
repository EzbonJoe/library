// Shared bookmark storage — used by both the home feed (where bookmarked
// quotes can be filtered/browsed) and individual book pages (where a quote
// can be bookmarked while reading). Same localStorage key everywhere, so a
// quote bookmarked from either place shows up correctly in the other.
const BOOKMARKS_KEY = 'gadzeke-bookmarks';

export function getBookmarks(){
  try{
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [];
  }catch{
    return [];
  }
}

export function isBookmarked(id){
  return getBookmarks().includes(id);
}

export function toggleBookmark(id){
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);

  if(index === -1){
    bookmarks.push(id);
  }else{
    bookmarks.splice(index, 1);
  }

  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  // Lets the header icon (a separate, non-module script loaded on every
  // page) update its color live, no matter which page the bookmark was
  // toggled from — without the two scripts needing to import each other.
  window.dispatchEvent(new CustomEvent('gadzeke:bookmarks-changed'));
  return bookmarks.includes(id);
}
