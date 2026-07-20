import { supabase } from './supabaseClient.js';
import { LEGACY_BOOK_SLUGS, bookLink } from './legacySlugs.js';
import { AMAZON_AFFILIATE_TAG } from './config.js';
import { isSupported as isSpeechSupported, speakOne, speakSequence, stopSpeaking } from './textToSpeech.js';
import { isBookmarked, toggleBookmark } from './bookmarks.js';
import { isBookBookmarked, toggleBookBookmark } from './bookBookmarks.js';

function resetListenUI(){
  document.querySelectorAll('.js-listen-quote-btn.is-playing').forEach((btn) => {
    btn.classList.remove('is-playing');
    btn.textContent = '🔊';
  });
  document.querySelectorAll('.quotes.is-playing').forEach((el) => el.classList.remove('is-playing'));

  const listenAllBtn = document.querySelector('.js-listen-all-btn');
  if(listenAllBtn){
    listenAllBtn.classList.remove('is-playing');
    listenAllBtn.textContent = '🔊 Listen to All Quotes';
  }
}

const RECENTLY_VIEWED_KEY = 'gadzeke-recently-viewed';

function recordRecentlyViewed(slug){
  try{
    const existing = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
    const deduped = [slug, ...existing.filter((entry) => entry !== slug)];
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(deduped.slice(0, 10)));
  }catch{
    // localStorage unavailable (private browsing, etc.) — not critical, skip silently
  }
}

function buildAmazonSearchUrl(title, author){
  const query = author ? `${title} ${author}` : title;
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_AFFILIATE_TAG}`;
}

function setMetaByName(name, content){
  let el = document.querySelector(`meta[name="${name}"]`);
  if(!el){
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProperty(property, content){
  let el = document.querySelector(`meta[property="${property}"]`);
  if(!el){
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href){
  let el = document.querySelector('link[rel="canonical"]');
  if(!el){
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(data){
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

async function loadQuotes(){
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('book') || window.location.pathname.split('/').pop().replace(/\.html$/, '');

  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, title, author, category, image, slug, description')
    .ilike('slug', slug)
    .single();

  if(bookError || !book){
    console.error(bookError ?? `No book found for slug "${slug}"`);
    return;
  }

  recordRecentlyViewed(book.slug);

  const byAuthor = book.author ? ` by ${book.author}` : '';
  const pageTitle = `${book.title} Quotes${byAuthor} | GadZeke`;
  const description = `Hand-picked quotes from ${book.title}${byAuthor}${book.category ? ` on ${book.category}` : ''} — curated by GadZeke, not AI-generated.`;
  const canonicalPath = LEGACY_BOOK_SLUGS.has(book.slug)
    ? `/${book.slug.toLowerCase()}`
    : `${window.location.pathname}?book=${encodeURIComponent(book.slug)}`;
  const canonicalUrl = `${window.location.origin}${canonicalPath}`;
  const imageUrl = new URL(book.image, window.location.href).href;

  document.title = pageTitle;
  setMetaByName('description', description);
  setCanonical(canonicalUrl);
  setMetaByProperty('og:type', 'book');
  setMetaByProperty('og:title', pageTitle);
  setMetaByProperty('og:description', description);
  setMetaByProperty('og:url', canonicalUrl);
  setMetaByProperty('og:image', imageUrl);
  setMetaByName('twitter:card', 'summary');
  setMetaByName('twitter:title', pageTitle);
  setMetaByName('twitter:description', description);
  setMetaByName('twitter:image', imageUrl);

  const headingEl = document.querySelector('.book-heading');
  if(headingEl){
    headingEl.textContent = `Quotes From ${book.title}`;
  }

  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('id, text, position, editors_pick')
    .eq('book_id', book.id)
    .order('position');

  if(quotesError){
    console.error(quotesError);
    return;
  }

  const quotesHTML = quotes.map((quote, index) => {
    const bookmarked = isBookmarked(quote.id);

    return `
    <div class="quotes" data-quote-id="${quote.id}">
      <div class="quote-number">${index + 1}</div>
      <p class="quote-text">${quote.text}</p>
      <div class="quote-actions">
        <button type="button" class="quote-listen-btn js-bookmark-quote-btn ${bookmarked ? 'is-bookmarked' : ''}" aria-label="Bookmark this quote">${bookmarked ? '★' : '☆'}</button>
        ${isSpeechSupported() ? `<button type="button" class="quote-listen-btn js-listen-quote-btn" aria-label="Listen to this quote">🔊</button>` : ''}
      </div>
    </div>
  `;
  }).join('');

  const quotesListEl = document.querySelector('.js-quotes');
  quotesListEl.innerHTML = quotesHTML;

  quotesListEl.addEventListener('click', (event) => {
    const bookmarkButton = event.target.closest('.js-bookmark-quote-btn');
    if(bookmarkButton){
      const quoteEl = bookmarkButton.closest('.quotes');
      const quoteId = Number(quoteEl.dataset.quoteId);
      const nowBookmarked = toggleBookmark(quoteId);
      bookmarkButton.classList.toggle('is-bookmarked', nowBookmarked);
      bookmarkButton.textContent = nowBookmarked ? '★' : '☆';
      return;
    }

    const button = event.target.closest('.js-listen-quote-btn');
    if(!button) return;

    const wasPlaying = button.classList.contains('is-playing');
    resetListenUI();
    stopSpeaking();

    if(wasPlaying) return;

    const quoteEl = button.closest('.quotes');
    const text = quoteEl.querySelector('.quote-text').textContent;

    button.classList.add('is-playing');
    button.textContent = '⏸';
    quoteEl.classList.add('is-playing');

    speakOne(text, {
      onEnd: () => {
        button.classList.remove('is-playing');
        button.textContent = '🔊';
        quoteEl.classList.remove('is-playing');
      },
    });
  });

  const heroEl = document.querySelector('.js-book-hero');
  if(heroEl && quotes.length > 0){
    const totalWords = quotes.reduce((sum, quote) => sum + quote.text.trim().split(/\s+/).length, 0);
    const readingMinutes = Math.max(1, Math.round(totalWords / 200));
    const sampleQuote = quotes.find((quote) => quote.editors_pick) || quotes.find((quote) => quote.position === 1) || quotes[0];

    heroEl.innerHTML = `
      <div class="book-hero">
        <img class="book-hero-cover" src="${imageUrl}" alt="${book.title} cover">
        <div>
          <h2 class="book-hero-title">${book.title}</h2>
          ${book.author ? `<div class="book-hero-author">${book.author}</div>` : ''}
          ${book.description ? `<p class="book-hero-description">${book.description}</p>` : ''}
          <div class="book-hero-stats">
            <span class="book-stat">${quotes.length} Quote${quotes.length === 1 ? '' : 's'}</span>
            <span class="book-stat">${readingMinutes} min read</span>
            ${book.category ? `<span class="book-stat">${book.category}</span>` : ''}
          </div>
          <div class="book-hero-actions">
            <button type="button" class="book-hero-btn js-read-quotes">Read Quotes</button>
            <button type="button" class="book-hero-btn-secondary js-show-popular-quote">Show Popular Quote</button>
            ${isSpeechSupported() ? `<button type="button" class="book-hero-btn-secondary js-listen-all-btn">🔊 Listen to All Quotes</button>` : ''}
            <button type="button" class="book-hero-btn-secondary js-save-book-btn ${isBookBookmarked(book.slug) ? 'is-saved' : ''}">${isBookBookmarked(book.slug) ? '✓ Saved' : '🔖 Save Book'}</button>
            <a class="book-hero-btn-secondary" href="${buildAmazonSearchUrl(book.title, book.author)}" target="_blank" rel="noopener sponsored">Buy on Amazon ↗</a>
          </div>
          <div class="book-hero-quote-reveal js-popular-quote-reveal" hidden>"${sampleQuote.text}"</div>
        </div>
      </div>
    `;

    heroEl.querySelector('.js-read-quotes').addEventListener('click', () => {
      document.querySelector('.js-quotes').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    heroEl.querySelector('.js-save-book-btn').addEventListener('click', (event) => {
      const nowSaved = toggleBookBookmark(book.slug);
      event.target.classList.toggle('is-saved', nowSaved);
      event.target.textContent = nowSaved ? '✓ Saved' : '🔖 Save Book';
    });

    heroEl.querySelector('.js-show-popular-quote').addEventListener('click', (event) => {
      const reveal = heroEl.querySelector('.js-popular-quote-reveal');
      reveal.hidden = !reveal.hidden;
      event.target.textContent = reveal.hidden ? 'Show Popular Quote' : 'Hide Quote';
    });

    const listenAllBtn = heroEl.querySelector('.js-listen-all-btn');
    listenAllBtn?.addEventListener('click', () => {
      const wasPlaying = listenAllBtn.classList.contains('is-playing');
      resetListenUI();
      stopSpeaking();

      if(wasPlaying) return;

      const quoteEls = [...document.querySelectorAll('.js-quotes .quotes')];
      const texts = quoteEls.map((el) => el.querySelector('.quote-text').textContent);

      listenAllBtn.classList.add('is-playing');
      listenAllBtn.textContent = '⏸ Stop Listening';

      speakSequence(texts, {
        onItemStart: (index) => {
          quoteEls[index].classList.add('is-playing');
          quoteEls[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        onItemEnd: (index) => {
          quoteEls[index].classList.remove('is-playing');
        },
        onDone: resetListenUI,
      });
    });
  }

  const recommendedEl = document.querySelector('.js-book-recommended');
  if(recommendedEl && book.category){
    const { data: recommended } = await supabase
      .from('books')
      .select('title, slug, image')
      .eq('category', book.category)
      .eq('status', 'published')
      .neq('id', book.id)
      .limit(4);

    if(recommended && recommended.length > 0){
      recommendedEl.innerHTML = `
        <h2 class="book-recommended-heading">More on ${book.category}</h2>
        <div class="book-mini-grid">
          ${recommended.map((otherBook) => `
            <a class="book-mini-card" href="${bookLink(otherBook.slug)}">
              <img src="${otherBook.image}" alt="${otherBook.title} cover" loading="lazy">
              <div class="book-mini-card-title">${otherBook.title}</div>
            </a>
          `).join('')}
        </div>
      `;
    }
  }

  setJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    ...(book.author ? { author: { '@type': 'Person', name: book.author } } : {}),
    image: imageUrl,
    url: canonicalUrl,
    ...(book.category ? { genre: book.category } : {}),
  });

  setJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${window.location.origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Books', item: `${window.location.origin}/best-book-quotes-and-the-books-they-come-from` },
      { '@type': 'ListItem', position: 3, name: book.title, item: canonicalUrl },
    ],
  });
}

loadQuotes();
