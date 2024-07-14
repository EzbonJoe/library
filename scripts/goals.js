import { quotes } from "../data/goalQuotes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
    });

    document.querySelector('.js-goals').innerHTML = qoutesHTML;
