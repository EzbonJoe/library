import { quotes } from "../data/richDadPoorDadQuotes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
      console.log(qoutesHTML);
    });

    document.querySelector('.js-richDadPoorDad').innerHTML = qoutesHTML;
