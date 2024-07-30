const inputEl = document.querySelector('.input');
const bodyEl = document.querySelector('body');
const displayColorNameEl = document.querySelector('.display-color-name');

inputEl.checked = JSON.parse(localStorage.getItem('display-color'));

updateDisplayColor();

function updateDisplayColor(){
  if(inputEl.checked){
    document.documentElement.style.setProperty('--site-background-color', '#151f30');
    document.documentElement.style.setProperty('--site-color', 'white');
    displayColorNameEl.innerHTML = 'Dark Mode';
  }else{
    document.documentElement.style.setProperty('--site-background-color', 'white');
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

console.log(document.documentElement);
