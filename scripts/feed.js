import { supabase } from './supabaseClient.js';
import { bookLink } from './legacySlugs.js';

const PAGE_SIZE = 12;
const BOOKMARKS_KEY = 'gadzeke-bookmarks';

const chipBar = document.querySelector('.js-chip-bar');
const searchInput = document.querySelector('.js-search-input');
const bookmarkToggle = document.querySelector('.js-bookmark-toggle');
const quoteGrid = document.querySelector('.js-quote-grid');
const skeletonGrid = document.querySelector('.js-skeleton-grid');
const emptyState = document.querySelector('.js-empty-state');
const scrollSentinel = document.querySelector('.js-scroll-sentinel');
const featuredEl = document.querySelector('.js-featured');
const recentlyAddedEl = document.querySelector('.js-recently-added');
const authorsListEl = document.querySelector('.js-authors-list');

let state = {
  category: '',
  search: '',
  author: '',
  bookmarkedOnly: false,
  page: 0,
  isLoading: false,
  hasMore: true,
};

function getBookmarks(){
  try{
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [];
  }catch{
    return [];
  }
}

function isBookmarked(id){
  return getBookmarks().includes(id);
}

function toggleBookmark(id){
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);

  if(index === -1){
    bookmarks.push(id);
  }else{
    bookmarks.splice(index, 1);
  }

  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  return bookmarks.includes(id);
}

function estimateReadingTime(text){
  const words = text.trim().split(/\s+/).length;
  const seconds = Math.max(5, Math.round((words / 200) * 60));
  return seconds < 60 ? `${seconds} sec read` : `${Math.round(seconds / 60)} min read`;
}

function quoteCardHTML(quote){
  const book = quote.book;
  const bookmarked = isBookmarked(quote.id);

  return `
    <article class="quote-card" data-quote-id="${quote.id}">
      <div class="quote-card-top">
        <img class="quote-card-cover" src="${book.image}" alt="${book.title} cover" loading="lazy">
        <div class="quote-card-book-meta">
          <div class="quote-card-title">${book.title}</div>
          <div class="quote-card-author">${book.author ?? ''}</div>
        </div>
        ${book.category ? `<span class="quote-card-badge">${book.category}</span>` : ''}
      </div>

      <p class="quote-card-text">${quote.text}</p>

      <div class="quote-card-footer">
        <span class="quote-card-meta">${estimateReadingTime(quote.text)}</span>
        <div class="quote-card-actions">
          <button type="button" class="icon-btn js-bookmark-btn ${bookmarked ? 'is-bookmarked' : ''}" aria-label="Bookmark this quote">${bookmarked ? '★' : '☆'}</button>
          <button type="button" class="icon-btn js-share-btn" aria-label="Share this quote">⤴</button>
          <button type="button" class="icon-btn js-copy-btn" aria-label="Copy this quote">⧉</button>
        </div>
      </div>

      <a class="quote-card-link" href="${bookLink(book.slug)}">Read more from this book →</a>
    </article>
  `;
}

function observeCardEntrance(cardEl){
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(cardEl);
}

function appendQuotes(quotes){
  const wrapper = document.createElement('div');
  wrapper.innerHTML = quotes.map(quoteCardHTML).join('');

  [...wrapper.children].forEach((cardEl) => {
    quoteGrid.appendChild(cardEl);
    observeCardEntrance(cardEl);
  });
}

quoteGrid.addEventListener('click', async (event) => {
  const card = event.target.closest('.quote-card');
  if(!card) return;

  const quoteId = Number(card.dataset.quoteId);

  if(event.target.closest('.js-bookmark-btn')){
    const button = event.target.closest('.js-bookmark-btn');
    const nowBookmarked = toggleBookmark(quoteId);
    button.classList.toggle('is-bookmarked', nowBookmarked);
    button.textContent = nowBookmarked ? '★' : '☆';
  }

  if(event.target.closest('.js-copy-btn')){
    const button = event.target.closest('.js-copy-btn');
    const text = card.querySelector('.quote-card-text').textContent;
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = 'Copied ✓';
    button.classList.add('is-copied');
    setTimeout(() => {
      button.textContent = original;
      button.classList.remove('is-copied');
    }, 1500);
  }

  if(event.target.closest('.js-share-btn')){
    const bookSlug = card.querySelector('.quote-card-link').getAttribute('href');
    const url = `${window.location.origin}/${bookSlug}`;
    const text = card.querySelector('.quote-card-text').textContent;

    if(navigator.share){
      navigator.share({ text, url }).catch(() => {});
    }else{
      await navigator.clipboard.writeText(url);
    }
  }
});

function buildQuery(){
  let query = supabase
    .from('quotes')
    .select('id, text, book:books!inner(title, image, author, category, slug)');

  if(state.category){
    query = query.eq('book.category', state.category);
  }

  if(state.author){
    query = query.eq('book.author', state.author);
  }

  if(state.search){
    query = query.ilike('text', `%${state.search}%`);
  }

  if(state.bookmarkedOnly){
    query = query.in('id', getBookmarks());
  }

  const from = state.page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  return query.order('created_at', { ascending: false }).range(from, to);
}

async function loadNextPage(){
  if(state.isLoading || !state.hasMore) return;

  if(state.bookmarkedOnly && getBookmarks().length === 0){
    state.hasMore = false;
    if(state.page === 0){
      quoteGrid.innerHTML = '';
      emptyState.hidden = false;
    }
    return;
  }

  state.isLoading = true;
  skeletonGrid.hidden = state.page > 0;

  const { data: quotes, error } = await buildQuery();

  skeletonGrid.hidden = true;
  state.isLoading = false;

  if(error){
    console.error(error);
    return;
  }

  if(state.page === 0 && quotes.length === 0){
    emptyState.hidden = false;
  }else{
    emptyState.hidden = true;
    appendQuotes(quotes);
  }

  state.hasMore = quotes.length === PAGE_SIZE;
  state.page += 1;
}

function resetFeed(){
  state.page = 0;
  state.hasMore = true;
  quoteGrid.innerHTML = '';
  emptyState.hidden = true;
  loadNextPage();
}

chipBar.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if(!chip) return;

  chipBar.querySelectorAll('.chip').forEach((el) => el.classList.remove('is-active'));
  chip.classList.add('is-active');
  state.category = chip.dataset.category;
  state.author = '';
  resetFeed();
});

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = searchInput.value.trim();
    state.author = '';
    resetFeed();
  }, 300);
});

bookmarkToggle.addEventListener('click', () => {
  state.bookmarkedOnly = !state.bookmarkedOnly;
  bookmarkToggle.classList.toggle('is-active', state.bookmarkedOnly);
  resetFeed();
});

const scrollObserver = new IntersectionObserver((entries) => {
  if(entries[0].isIntersecting){
    loadNextPage();
  }
}, { rootMargin: '400px' });

scrollObserver.observe(scrollSentinel);

async function loadFeatured(){
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('id, text, book:books(title, image, author, slug)')
    .eq('featured', true)
    .limit(1)
    .maybeSingle();

  if(error || !quote){
    featuredEl.remove();
    return;
  }

  featuredEl.style.backgroundImage = `url('${quote.book.image}')`;
  featuredEl.innerHTML = `
    <div class="featured-overlay"></div>
    <div class="featured-content">
      <img class="featured-cover" src="${quote.book.image}" alt="${quote.book.title} cover">
      <p class="featured-quote">${quote.text}</p>
      <div class="featured-book">${quote.book.title} — ${quote.book.author ?? ''}</div>
      <a class="featured-cta" href="${bookLink(quote.book.slug)}">Read More From This Book</a>
    </div>
  `;
}

async function loadRecentlyAdded(){
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('id, text, book:books(title, image, slug)')
    .order('created_at', { ascending: false })
    .limit(5);

  if(error || !quotes){
    return;
  }

  recentlyAddedEl.innerHTML = quotes.map((quote) => `
    <a class="sidebar-item" href="${bookLink(quote.book.slug)}">
      <img src="${quote.book.image}" alt="" loading="lazy">
      <span>${quote.book.title}</span>
    </a>
  `).join('');
}

async function loadAuthors(){
  const { data: books, error } = await supabase
    .from('books')
    .select('author')
    .not('author', 'is', null)
    .order('author');

  if(error || !books){
    return;
  }

  const authors = [...new Set(books.map((book) => book.author))].slice(0, 8);

  authorsListEl.innerHTML = authors.map((author) => `
    <button type="button" class="sidebar-item js-author-filter" data-author="${author}">${author}</button>
  `).join('');

  authorsListEl.querySelectorAll('.js-author-filter').forEach((button) => {
    button.addEventListener('click', () => {
      state.author = button.dataset.author;
      state.category = '';
      state.search = '';
      searchInput.value = '';
      chipBar.querySelectorAll('.chip').forEach((el) => el.classList.remove('is-active'));
      chipBar.querySelector('.chip[data-category=""]')?.classList.add('is-active');
      resetFeed();
    });
  });
}

loadFeatured();
loadRecentlyAdded();
loadAuthors();
loadNextPage();
