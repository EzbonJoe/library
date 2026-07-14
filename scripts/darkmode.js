const inputEl = document.querySelector('.input');
const displayColorNameEl = document.querySelector('.display-color-name');
const prefersDarkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function getInitialIsDark(){
  const stored = localStorage.getItem('display-color');
  if(stored !== null) return JSON.parse(stored);
  return prefersDarkQuery ? prefersDarkQuery.matches : false;
}

inputEl.checked = getInitialIsDark();

updateDisplayColor();

function updateDisplayColor(){
  const isDark = inputEl.checked;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  // Legacy vars, kept until every stylesheet migrates off --site-background-color/--site-color.
  if(isDark){
    document.documentElement.style.setProperty('--site-background-color', '#131720');
    document.documentElement.style.setProperty('--site-color', 'white');
    displayColorNameEl.innerHTML = 'Dark Mode';
  }else{
    document.documentElement.style.setProperty('--site-background-color', 'aliceblue');
    document.documentElement.style.setProperty('--site-color', 'black');
    displayColorNameEl.innerHTML = 'Light Mode';
  }
}

inputEl.addEventListener('input', () => {
  updateDisplayColor();
  updateLocalStorage();
})

function updateLocalStorage(){
  localStorage.setItem('display-color', JSON.stringify(inputEl.checked));
}

// Keep following the OS/browser preference live — but only until the visitor
// picks a theme themselves, at which point their explicit choice wins.
if(prefersDarkQuery){
  prefersDarkQuery.addEventListener('change', (event) => {
    if(localStorage.getItem('display-color') !== null) return;
    inputEl.checked = event.matches;
    updateDisplayColor();
  });
}
