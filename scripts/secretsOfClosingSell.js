import { quotes } from "../data/secretsOfClosingSellQuotes.js";

let qoutesHTML = '';

  quotes.forEach((quote) => {
    qoutesHTML += `
      <div class="quotes">${quote}</div>
    `;
  });

  document.querySelector('.js-sell').innerHTML = qoutesHTML;
