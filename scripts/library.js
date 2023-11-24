import {books} from '../data/books.js';

let booksHTML = '';

books.forEach((book) => {
  booksHTML += `
  <div class="book-container">
    <img class="image" src="${book.image}">
    <div class="text-container">
      <div class="book-title">${book.title}.</div>
      <div class="quotes">${book.text}.</div>
    </div>
  </div>
  `;
  console.log(booksHTML);
});

document.querySelector('.js-grid')
  .innerHTML = booksHTML;