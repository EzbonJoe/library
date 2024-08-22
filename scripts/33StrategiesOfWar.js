import { quotes } from "../data/33strategiesOfWarQuotes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
    });

    document.querySelector('.js-strategiesOfWar').innerHTML = qoutesHTML;
