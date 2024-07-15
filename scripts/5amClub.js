import { quotes } from "../data/5amClubQuotes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
      console.log(qoutesHTML);
    });

    document.querySelector('.js-5amClub').innerHTML = qoutesHTML;
