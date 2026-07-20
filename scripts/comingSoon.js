import { supabase } from './supabaseClient.js';
import { bookLink } from './legacySlugs.js';
import { escapeHtml } from './escapeHtml.js';

async function loadSuggestions(){
  const { data: books, error } = await supabase
    .from('books')
    .select('slug, title, image, status')
    .eq('status', 'published');

  if(error || !books || books.length === 0){
    return;
  }

  const suggestions = books.sort(() => Math.random() - 0.5).slice(0, 4);

  document.querySelector('.js-suggestions').innerHTML = suggestions.map((book) => `
    <a href="${bookLink(book.slug)}">
      <div class="book-container">
        <div class="cover-frame">
          <img class="image" src="${book.image}" alt="${escapeHtml(book.title)} cover" loading="lazy">
        </div>
        <div class="text-container">
          <div class="book-title">${escapeHtml(book.title)}</div>
        </div>
      </div>
    </a>
  `).join('');

  document.querySelector('.js-suggestions-wrap').hidden = false;
}

loadSuggestions();
