const inputEl = document.querySelector('.input');
const displayColorNameEl = document.querySelector('.display-color-name');

inputEl.checked = JSON.parse(localStorage.getItem('display-color'));

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
