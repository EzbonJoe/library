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

// Header goes from a nearly-transparent bar to a blurred, bordered one once
// the page has scrolled past the top — matches the "premium sticky header"
// pattern used by Linear/Notion/Stripe.
const headerEl = document.querySelector('.header');
let headerScrollTicking = false;

function handleHeaderScroll(){
  headerEl.classList.toggle('header--scrolled', window.scrollY > 16);
  headerScrollTicking = false;
}

window.addEventListener('scroll', () => {
  if(!headerScrollTicking){
    requestAnimationFrame(handleHeaderScroll);
    headerScrollTicking = true;
  }
}, { passive: true });

handleHeaderScroll();
