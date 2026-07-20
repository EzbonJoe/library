const dropDownEl = document.querySelector('.js-drop-down');
const backdropEl = document.querySelector('.js-mobile-menu-backdrop');
const menuToggleEl = document.querySelector('.js-icon-container');

let isMenuOpen = false;

function setMenuOpen(open){
  isMenuOpen = open;
  document.body.classList.toggle('menu-open', open);
  dropDownEl.classList.toggle('is-open', open);
  backdropEl.classList.toggle('is-open', open);
  menuToggleEl.classList.toggle('is-open', open);
  menuToggleEl.setAttribute('aria-expanded', String(open));
}

menuToggleEl.addEventListener('click', () => setMenuOpen(!isMenuOpen));
backdropEl.addEventListener('click', () => setMenuOpen(false));

dropDownEl.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (event) => {
  if(event.key === 'Escape') setMenuOpen(false);
});

// Header goes from a nearly-transparent bar to a blurred, bordered one once
// the page has scrolled past the top — matches the "premium sticky header"
// pattern used by Linear/Notion/Stripe.
const headerEl = document.querySelector('.header');
let headerScrollTicking = false;

function handleHeaderScroll(){
  headerEl.classList.toggle('header--scrolled', window.scrollY > 16);
  headerScrollTicking = false;
}

window.addEventListener('scroll', () => {
  if(!headerScrollTicking){
    requestAnimationFrame(handleHeaderScroll);
    headerScrollTicking = true;
  }
}, { passive: true });

handleHeaderScroll();

// Bookmark icon: colored whenever the visitor has any saved quotes (so it's
// not just a static gray icon forever), on every page. On the home feed
// specifically, clicking it toggles the "Bookmarked only" filter in place
// via the existing pill button's own click handler, instead of doing a full
// page reload back to the top — reloading is only unavoidable from other
// pages, since bookmarked quotes can currently only be viewed on the feed.
const bookmarkIconEl = document.querySelector('.js-bookmark-icon');
const bookmarkToggleEl = document.querySelector('.js-bookmark-toggle');

function refreshBookmarkIconState(){
  if(!bookmarkIconEl) return;

  let hasBookmarks = false;
  try{
    hasBookmarks = (JSON.parse(localStorage.getItem('gadzeke-bookmarks')) || []).length > 0;
  }catch{
    hasBookmarks = false;
  }

  const filterActive = Boolean(bookmarkToggleEl?.classList.contains('is-active'));
  bookmarkIconEl.classList.toggle('has-bookmarks', hasBookmarks || filterActive);
}

refreshBookmarkIconState();
window.addEventListener('gadzeke:bookmarks-changed', refreshBookmarkIconState);

if(bookmarkIconEl && bookmarkToggleEl){
  bookmarkIconEl.addEventListener('click', (event) => {
    event.preventDefault();
    bookmarkToggleEl.click();
    requestAnimationFrame(refreshBookmarkIconState);
  });
}
