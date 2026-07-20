import { supabase } from './supabaseClient.js';
import { bookLink } from './legacySlugs.js';
import { isBookBookmarked, toggleBookBookmark } from './bookBookmarks.js';

const CATEGORY_ORDER = ['Business', 'Psychology', 'Philosophy', 'Money', 'Relationships', 'Leadership', 'Success', 'Habits', 'Spirituality', 'Productivity'];
const RECENTLY_VIEWED_KEY = 'gadzeke-recently-viewed';
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

const searchInput = document.querySelector('.js-search-input');
const chipBar = document.querySelector('.js-chip-bar');
const savedToggle = document.querySelector('.js-saved-toggle');
const browseModeEl = document.querySelector('.js-browse-mode');
const searchModeEl = document.querySelector('.js-search-mode');
const rowsEl = document.querySelector('.js-rows');
const gridEl = document.querySelector('.js-grid');
const emptyStateEl = document.querySelector('.js-empty-state');
const emptyStateTextEl = document.querySelector('.js-empty-state-text');
const suggestionsWrapEl = document.querySelector('.js-empty-state-suggestions-wrap');
const suggestionsEl = document.querySelector('.js-empty-state-suggestions');
const sortSelect = document.querySelector('.js-sort-select');

let allBooks = [];
const statsMap = new Map();
const state = { search: '', category: '', savedOnly: false };

function getRecentlyViewed(){
  try{
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
  }catch{
    return [];
  }
}

function bookLinkFor(book){
  return book.status === 'coming_soon' ? 'coming-soon' : bookLink(book.slug);
}

function bookCardHTML(book){
  const stats = statsMap.get(book.id) || { count: 0, hasEditorsPick: false, isNew: false };
  const badges = [
    stats.isNew ? `<span class="book-badge book-badge--new">New</span>` : '',
    stats.hasEditorsPick ? `<span class="book-badge book-badge--pick">Pick</span>` : '',
  ].filter(Boolean).join('');
  const saved = isBookBookmarked(book.slug);

  return `
    <a class="book-card" href="${bookLinkFor(book)}">
      <div class="book-card-cover-wrap">
        <img class="book-card-cover" src="${book.image}" alt="${book.title} cover" loading="lazy">
        ${badges ? `<div class="book-card-badges">${badges}</div>` : ''}
        <button type="button" class="book-card-save-btn js-save-book-btn ${saved ? 'is-saved' : ''}" data-slug="${book.slug}" aria-label="Save this book">${saved ? '★' : '☆'}</button>
        <div class="book-card-cta">Read Quotes →</div>
      </div>
      <div class="book-card-title">${book.title}</div>
      ${book.author ? `<div class="book-card-author">${book.author}</div>` : ''}
      <div class="book-card-meta">${stats.count} Quote${stats.count === 1 ? '' : 's'}</div>
    </a>
  `;
}

document.addEventListener('click', (event) => {
  const saveButton = event.target.closest('.js-save-book-btn');
  if(!saveButton) return;

  event.preventDefault();
  event.stopPropagation();

  const nowSaved = toggleBookBookmark(saveButton.dataset.slug);
  saveButton.classList.toggle('is-saved', nowSaved);
  saveButton.textContent = nowSaved ? '★' : '☆';
});

function rowHTML(title, books){
  if(books.length === 0) return '';
  return `
    <section class="book-row-section">
      <h2 class="book-row-heading">${title}</h2>
      <div class="book-row">${books.map(bookCardHTML).join('')}</div>
    </section>
  `;
}

function editorialBreakoutHTML(featuredPool, excludeId){
  if(featuredPool.length === 0) return '';

  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  const pool = featuredPool.length > 1 ? featuredPool.filter((book) => book.id !== excludeId) : featuredPool;
  const book = pool[(daysSinceEpoch + 1) % pool.length];
  const stats = statsMap.get(book.id) || {};

  return `
    <section class="editorial-breakout">
      <img class="editorial-breakout-cover" src="${book.image}" alt="${book.title} cover">
      <div>
        <span class="editorial-breakout-label">Editor's Pick of the Week</span>
        <h2 class="editorial-breakout-title">${book.title}</h2>
        ${stats.sampleQuote ? `<p class="editorial-breakout-quote">"${stats.sampleQuote}"</p>` : ''}
        ${book.description ? `<p class="quote-card-author">${book.description}</p>` : ''}
        <a class="featured-cta" href="${bookLinkFor(book)}">Read Quotes →</a>
      </div>
    </section>
  `;
}

function renderFeaturedHero(featuredPool){
  const featuredEl = document.querySelector('.js-featured');
  if(!featuredEl) return null;

  if(featuredPool.length === 0){
    featuredEl.remove();
    return null;
  }

  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  const book = featuredPool[daysSinceEpoch % featuredPool.length];
  const stats = statsMap.get(book.id) || { count: 0, sampleQuote: null };

  featuredEl.style.backgroundImage = `url('${book.image}')`;
  featuredEl.innerHTML = `
    <div class="featured-overlay"></div>
    <div class="featured-content">
      <span class="featured-label">Featured Book</span>
      <img class="featured-cover" src="${book.image}" alt="${book.title} cover">
      <p class="featured-quote">${stats.sampleQuote ? `"${stats.sampleQuote}"` : book.title}</p>
      <div class="featured-book">${book.title}${book.author ? ` — ${book.author}` : ''}</div>
      <div class="featured-stat">${stats.count} Quote${stats.count === 1 ? '' : 's'} Available</div>
      <a class="featured-cta" href="${bookLinkFor(book)}">Read Quotes →</a>
    </div>
  `;

  return book;
}

function renderBrowseMode(){
  const published = allBooks.filter((book) => book.status !== 'coming_soon');
  const featuredPool = published.filter((book) => book.featured);

  const heroBook = renderFeaturedHero(featuredPool);
  const sections = [];

  const recentlyAdded = [...published]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);
  sections.push(rowHTML('Recently Added', recentlyAdded));

  const categoryRows = CATEGORY_ORDER
    .map((category) => ({ category, books: published.filter((book) => book.category === category) }))
    .filter((entry) => entry.books.length > 0);

  categoryRows.slice(0, 2).forEach((entry) => sections.push(rowHTML(entry.category, entry.books)));

  if(featuredPool.length > 0){
    sections.push(editorialBreakoutHTML(featuredPool, heroBook ? heroBook.id : null));
  }

  categoryRows.slice(2).forEach((entry) => sections.push(rowHTML(entry.category, entry.books)));

  const recentlyViewedBooks = getRecentlyViewed()
    .map((slug) => published.find((book) => book.slug === slug))
    .filter(Boolean);

  if(recentlyViewedBooks.length > 0){
    sections.push(rowHTML('Continue Exploring', recentlyViewedBooks));
  }

  rowsEl.innerHTML = sections.join('');
}

function filteredBooks(){
  const search = state.search.trim().toLowerCase();
  return allBooks.filter((book) => {
    const matchesCategory = !state.category || book.category === state.category;
    const matchesSearch = !search
      || book.title.toLowerCase().includes(search)
      || (book.author ?? '').toLowerCase().includes(search);
    const matchesSaved = !state.savedOnly || isBookBookmarked(book.slug);
    return matchesCategory && matchesSearch && matchesSaved;
  });
}

function sortBooks(books){
  const sorted = [...books];

  if(sortSelect.value === 'alphabetical'){
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  }else if(sortSelect.value === 'most-quotes'){
    sorted.sort((a, b) => (statsMap.get(b.id)?.count ?? 0) - (statsMap.get(a.id)?.count ?? 0));
  }else{
    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return sorted;
}

function renderSearchMode(){
  const results = sortBooks(filteredBooks());

  if(results.length === 0){
    gridEl.hidden = true;
    emptyStateEl.hidden = false;
    emptyStateTextEl.textContent = state.search
      ? `No books found for "${state.search}".`
      : (state.savedOnly ? "You haven't saved any books yet." : 'No books found.');

    const suggestions = allBooks
      .filter((book) => book.status !== 'coming_soon')
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    if(suggestions.length > 0){
      suggestionsWrapEl.hidden = false;
      suggestionsEl.innerHTML = suggestions.map(bookCardHTML).join('');
    }else{
      suggestionsWrapEl.hidden = true;
    }
  }else{
    gridEl.hidden = false;
    emptyStateEl.hidden = true;
    gridEl.innerHTML = results.map(bookCardHTML).join('');
  }
}

function isSearchModeActive(){
  return state.search.trim() !== '' || state.category !== '' || state.savedOnly;
}

function refresh(fromUserAction){
  const searchMode = isSearchModeActive();
  browseModeEl.hidden = searchMode;
  searchModeEl.hidden = !searchMode;

  if(searchMode){
    renderSearchMode();

    if(fromUserAction){
      searchModeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = searchInput.value;
    refresh(true);
  }, 150);
});

chipBar.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if(!chip) return;

  chipBar.querySelectorAll('.chip').forEach((el) => el.classList.remove('is-active'));
  chip.classList.add('is-active');
  state.category = chip.dataset.category;
  refresh(true);
});

sortSelect.addEventListener('change', () => {
  if(isSearchModeActive()) renderSearchMode();
});

savedToggle.addEventListener('click', () => {
  state.savedOnly = !state.savedOnly;
  savedToggle.classList.toggle('is-active', state.savedOnly);
  refresh(true);
});

function applyInitialFiltersFromURL(){
  const params = new URLSearchParams(window.location.search);
  const search = params.get('search') || '';
  const saved = params.get('saved') === 'true';

  if(search){
    state.search = search;
    searchInput.value = search;
  }

  if(saved){
    state.savedOnly = true;
    savedToggle.classList.add('is-active');
  }
}

// Supabase caps any single select() at 1000 rows by default, and this project
// has more quotes than that — a plain select() here silently truncated the
// stats to whichever books' quotes happened to fall in the first 1000 rows,
// leaving the rest undercounted or at zero. Page through with .range() instead.
async function fetchAllQuotes(){
  const PAGE_SIZE = 1000;
  const rows = [];
  let from = 0;

  while(true){
    const { data, error } = await supabase
      .from('quotes')
      .select('book_id, text, editors_pick, position')
      .order('id')
      .range(from, from + PAGE_SIZE - 1);

    if(error){
      console.error(error);
      break;
    }

    rows.push(...data);
    if(data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function init(){
  const [{ data: books, error: booksError }, quotes] = await Promise.all([
    supabase.from('books').select('*'),
    fetchAllQuotes(),
  ]);

  if(booksError || !books){
    console.error(booksError);
    return;
  }

  allBooks = books;

  if(quotes){
    quotes.forEach((quote) => {
      if(!statsMap.has(quote.book_id)){
        statsMap.set(quote.book_id, { count: 0, totalWords: 0, hasEditorsPick: false, sampleQuote: null, samplePriority: -1 });
      }

      const entry = statsMap.get(quote.book_id);
      entry.count += 1;
      entry.totalWords += quote.text.trim().split(/\s+/).length;

      if(quote.editors_pick) entry.hasEditorsPick = true;

      const priority = quote.editors_pick ? 2 : (quote.position === 1 ? 1 : 0);
      if(priority > entry.samplePriority){
        entry.sampleQuote = quote.text;
        entry.samplePriority = priority;
      }
    });
  }

  const now = Date.now();
  allBooks.forEach((book) => {
    const entry = statsMap.get(book.id) || { count: 0, totalWords: 0, hasEditorsPick: false, sampleQuote: null };
    entry.isNew = (now - new Date(book.created_at).getTime()) < TWO_WEEKS_MS;
    statsMap.set(book.id, entry);
  });

  renderBrowseMode();
  applyInitialFiltersFromURL();
  refresh();
}

init();
