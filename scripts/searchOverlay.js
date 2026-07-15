import { supabase } from './supabaseClient.js';
import { bookLink } from './legacySlugs.js';

const RECENT_KEY = 'gadzeke-recent-searches';
const POPULAR_BOOKS_LIMIT = 4;

const triggerEl = document.querySelector('.js-search-trigger');
const backdropEl = document.querySelector('.js-search-overlay-backdrop');
const overlayEl = document.querySelector('.js-search-overlay');
const inputEl = document.querySelector('.js-search-overlay-input');
const resultsEl = document.querySelector('.js-search-overlay-results');

if(triggerEl && overlayEl){
  let isOpen = false;

  function getRecentSearches(){
    try{
      return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    }catch{
      return [];
    }
  }

  function addRecentSearch(term){
    const trimmed = term.trim();
    if(!trimmed) return;
    const existing = getRecentSearches().filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase());
    existing.unshift(trimmed);
    localStorage.setItem(RECENT_KEY, JSON.stringify(existing.slice(0, 5)));
  }

  function goToSearch(term){
    addRecentSearch(term);
    window.location.href = `./?search=${encodeURIComponent(term)}`;
  }

  function setOpen(open){
    isOpen = open;
    document.body.classList.toggle('search-open', open);
    overlayEl.classList.toggle('is-open', open);
    backdropEl.classList.toggle('is-open', open);

    if(open){
      inputEl.value = '';
      renderDefaultState();
      requestAnimationFrame(() => inputEl.focus());
    }
  }

  async function renderDefaultState(){
    const recents = getRecentSearches();
    const recentHTML = recents.length ? `
      <div class="search-overlay-section-label">Recent Searches</div>
      ${recents.map((term) => `
        <button type="button" class="search-overlay-item js-search-recent" data-term="${term}">🕘 ${term}</button>
      `).join('')}
    ` : '';

    resultsEl.innerHTML = `${recentHTML}<div class="search-overlay-section-label">Popular Books</div><div class="js-popular-books"></div>`;

    const { data: books } = await supabase
      .from('books')
      .select('title, author, slug')
      .order('created_at', { ascending: false })
      .limit(POPULAR_BOOKS_LIMIT);

    const popularEl = resultsEl.querySelector('.js-popular-books');
    if(popularEl && books){
      popularEl.innerHTML = books.map((book) => `
        <a class="search-overlay-item" href="${bookLink(book.slug)}">
          📖 ${book.title}${book.author ? `<span class="search-overlay-item-meta"> — ${book.author}</span>` : ''}
        </a>
      `).join('');
    }
  }

  async function renderResults(term){
    const [{ data: quotes }, { data: books }] = await Promise.all([
      supabase
        .from('quotes')
        .select('id, text, book:books(title, slug)')
        .ilike('text', `%${term}%`)
        .limit(5),
      supabase
        .from('books')
        .select('title, author, slug')
        .ilike('title', `%${term}%`)
        .limit(5),
    ]);

    const hasResults = (quotes && quotes.length) || (books && books.length);

    if(!hasResults){
      resultsEl.innerHTML = `<div class="search-overlay-empty">No matches for "${term}".</div>`;
      return;
    }

    const bookResultsHTML = (books && books.length) ? `
      <div class="search-overlay-section-label">Books</div>
      ${books.map((book) => `
        <a class="search-overlay-item js-search-result" data-term="${term}" href="${bookLink(book.slug)}">
          📖 ${book.title}${book.author ? `<span class="search-overlay-item-meta"> — ${book.author}</span>` : ''}
        </a>
      `).join('')}
    ` : '';

    const quoteResultsHTML = (quotes && quotes.length) ? `
      <div class="search-overlay-section-label">Quotes</div>
      ${quotes.map((quote) => `
        <a class="search-overlay-item js-search-result" data-term="${term}" href="${bookLink(quote.book.slug)}">
          ❝ ${quote.text.slice(0, 60)}${quote.text.length > 60 ? '…' : ''}<span class="search-overlay-item-meta"> — ${quote.book.title}</span>
        </a>
      `).join('')}
    ` : '';

    resultsEl.innerHTML = bookResultsHTML + quoteResultsHTML;
  }

  triggerEl.addEventListener('click', () => setOpen(!isOpen));
  backdropEl.addEventListener('click', () => setOpen(false));

  document.addEventListener('keydown', (event) => {
    const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if(isShortcut){
      event.preventDefault();
      setOpen(!isOpen);
    }

    if(event.key === 'Escape' && isOpen){
      setOpen(false);
    }
  });

  let searchTimer;
  inputEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const term = inputEl.value.trim();

    if(!term){
      renderDefaultState();
      return;
    }

    searchTimer = setTimeout(() => renderResults(term), 250);
  });

  inputEl.addEventListener('keydown', (event) => {
    if(event.key === 'Enter' && inputEl.value.trim()){
      goToSearch(inputEl.value.trim());
    }
  });

  resultsEl.addEventListener('click', (event) => {
    const recentButton = event.target.closest('.js-search-recent');
    if(recentButton){
      inputEl.value = recentButton.dataset.term;
      renderResults(recentButton.dataset.term);
      return;
    }

    const result = event.target.closest('.js-search-result');
    if(result){
      addRecentSearch(result.dataset.term);
    }
  });
}
