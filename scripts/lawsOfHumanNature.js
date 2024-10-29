import { quotes } from "../data/lawsOfHumanNatureQuotes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
    });

    document.querySelector('.js-humanNature').innerHTML = qoutesHTML;
