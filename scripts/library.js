import { supabase } from './supabaseClient.js';
import { bookLink } from './legacySlugs.js';

async function loadPage(){
  let booksHTML = '';

  const url = new URL(window.location.href);
  const search = url.searchParams.get('search');

  const { data: books, error } = await supabase
    .from('books')
    .select('slug, title, image, status')
    .order('id');

  if(error){
    console.error(error);
    return;
  }

  let filteredBooks = books;

  if(search){
    document.querySelector('.js-search-input').value = search;
    filteredBooks = books.filter((book) => {
      return book.title.toLowerCase().includes(search.toLowerCase());
    });
  }

  filteredBooks.forEach((book) => {
    const link = book.status === 'coming_soon' ? 'coming-soon' : bookLink(book.slug);
    booksHTML += `
    <a href="${link}">
      <div class="book-container">
        <div class="cover-frame">
          <img class="image" src="${book.image}" alt="${book.title} cover" loading="lazy">
        </div>
        <div class="text-container">
          <div class="book-title">${book.title}</div>
        </div>
      </div>
    </a>`;
  });

  const gridEl = document.querySelector('.js-grid');
  const emptyStateEl = document.querySelector('.js-empty-state');

  if(filteredBooks.length === 0){
    gridEl.hidden = true;
    emptyStateEl.hidden = false;
    document.querySelector('.js-empty-state-text').textContent = search
      ? `No books found for "${search}".`
      : 'No books found.';
  }else{
    gridEl.hidden = false;
    emptyStateEl.hidden = true;
    gridEl.innerHTML = booksHTML;
  }

  function goToSearch(){
    const search = document.querySelector('.js-search-input').value;
    window.location.href = `best-book-quotes-and-the-books-they-come-from.html?search=${encodeURIComponent(search)}`;
  }

  document.querySelector('.js-search-button').addEventListener('click', goToSearch);

  document.querySelector('.js-search-input').addEventListener('keydown', (event) => {
    if(event.key === 'Enter'){
      goToSearch();
    }
  })
}

loadPage();