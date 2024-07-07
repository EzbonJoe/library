import {books} from '../data/books.js';

let booksHTML = '';

books.forEach((book) => {
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