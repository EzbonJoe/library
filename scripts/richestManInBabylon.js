import { quotes } from "../data/richestManInBabylonQuotes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
    });

    document.querySelector('.js-babylon').innerHTML = qoutesHTML;
