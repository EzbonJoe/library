import { quotes } from "../data/millionaireFastLaneQuotes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
    });

    document.querySelector('.js-milli').innerHTML = qoutesHTML;
