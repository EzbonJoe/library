const dropDownEl = document.querySelector('.js-drop-down');
const backdropEl = document.querySelector('.js-mobile-menu-backdrop');
const menuToggleEl = document.querySelector('.js-icon-container');

let isMenuOpen = false;

function setMenuOpen(open){
  isMenuOpen = open;
  document.body.classList.toggle('menu-open', open);
  dropDownEl.classList.toggle('is-open', open);
  backdropEl.classList.toggle('is-open', open);
  menuToggleEl.classList.toggle('is-open', open);
  menuToggleEl.setAttribute('aria-expanded', String(open));
}

menuToggleEl.addEventListener('click', () => setMenuOpen(!isMenuOpen));
backdropEl.addEventListener('click', () => setMenuOpen(false));

dropDownEl.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (event) => {
  if(event.key === 'Escape') setMenuOpen(false);
});
