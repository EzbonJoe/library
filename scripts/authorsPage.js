import { supabase } from './supabaseClient.js';
import { escapeHtml } from './escapeHtml.js';

const gridEl = document.querySelector('.js-authors-grid');

async function loadAuthors(){
  const { data: books, error } = await supabase
    .from('books')
    .select('author')
    .not('author', 'is', null)
    .order('author');

  if(error || !books){
    return;
  }

  const authors = [...new Set(books.map((book) => book.author))];

  gridEl.innerHTML = authors.map((author) => `
    <a class="browse-card" href="./?author=${encodeURIComponent(author)}">${escapeHtml(author)}</a>
  `).join('');
}

loadAuthors();
