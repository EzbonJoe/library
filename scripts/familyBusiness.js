import { quotes } from "../data/FamilyBusinessQuotes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
      console.log(qoutesHTML);
    });

    document.querySelector('.js-familyBusiness').innerHTML = qoutesHTML;
