import { quotes } from "../data/7habits.js";

let qoutesHTML = '';

  quotes.forEach((quote) => {
    qoutesHTML += `
      <div class="quotes">${quote}</div>
    `;
    console.log(qoutesHTML);
  });

  document.querySelector('.js-habit').innerHTML = qoutesHTML;
