import {books} from '../data/books.js';

function loadPage(){
  let booksHTML = '';

  const url = new URL(window.location.href);
  const search = url.searchParams.get('search');

  let filteredBooks = books;

  if(search){
    filteredBooks = books.filter((book) => {
      return book.title.toLowerCase().includes(search.toLowerCase());
    });
  }

  filteredBooks.forEach((book) => {
    booksHTML += `
    <a href="${book.link}">
      <div class="book-container">
        <img class="image" src="${book.image}">
        <div class="text-container">
          <div class="book-title">${book.title}.</div>
        </div>
      </div>
    </a>`;
    //console.log(booksHTML);
  });

  document.querySelector('.js-grid')
    .innerHTML = booksHTML;

  document.querySelector('.js-search-button').addEventListener('click', () => {
    const search = document.querySelector('.js-search-input').value;
    window.location.href= `Best-book-quotes-and-the-books-they-come-from.html?search=${search}`;
  })

  document.querySelector('.js-search-input').addEventListener('keydown', (event) => {
    if(event.key === 'Enter'){
      const search = document.querySelector('.js-search-input').value;
      window.location.href= `Best-book-quotes-and-the-books-they-come-from.html?search=${search}`;
    }else if(event.key === 'Go'){
      const search = document.querySelector('.js-search-input').value;
      window.location.href= `Best-book-quotes-and-the-books-they-come-from.html?search=${search}`;
    }
  })
}

loadPage();