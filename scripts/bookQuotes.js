import { supabase } from './supabaseClient.js';
import { LEGACY_BOOK_SLUGS } from './legacySlugs.js';
import { AMAZON_AFFILIATE_TAG } from './config.js';

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
    .select('id, title, author, category, image, slug')
    .ilike('slug', slug)
    .single();

  if(bookError || !book){
    console.error(bookError ?? `No book found for slug "${slug}"`);
    return;
  }

  const byAuthor = book.author ? ` by ${book.author}` : '';
  const pageTitle = `${book.title} Quotes${byAuthor} | Gadzeke`;
  const description = `Hand-picked quotes from ${book.title}${byAuthor}${book.category ? ` on ${book.category}` : ''} — curated by Gadzeke, not AI-generated.`;
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

    const buyLink = document.createElement('a');
    buyLink.className = 'buy-book-link';
    buyLink.href = buildAmazonSearchUrl(book.title, book.author);
    buyLink.target = '_blank';
    buyLink.rel = 'noopener sponsored';
    buyLink.textContent = 'Buy this book on Amazon ↗';
    headingEl.insertAdjacentElement('afterend', buyLink);
  }

  const { data: quotes, error: quotesError } = await supabase
    .from('quotes')
    .select('text')
    .eq('book_id', book.id)
    .order('position');

  if(quotesError){
    console.error(quotesError);
    return;
  }

  const quotesHTML = quotes.map((quote, index) => `
    <div class="quotes">
      <div class="quote-number">${index + 1}</div>
      <p class="quote-text">${quote.text}</p>
    </div>
  `).join('');

  document.querySelector('.js-quotes').innerHTML = quotesHTML;

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
