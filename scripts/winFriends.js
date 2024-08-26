import { quotes } from "../data/winFriendsQuotes.js";

let qoutesHTML = '';

    quotes.forEach((quote) => {
      qoutesHTML += `
        <div class="quotes">${quote}</div>
      `;
    });

    document.querySelector('.js-winFriends').innerHTML = qoutesHTML;
