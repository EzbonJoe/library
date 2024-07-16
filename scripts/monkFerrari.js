import { quotes } from "../data/monkQoutes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
      console.log(qoutesHTML);
    });

    document.querySelector('.js-monk').innerHTML = qoutesHTML;
