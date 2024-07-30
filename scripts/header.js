const dropDownEl = document.querySelector('.js-drop-down');
const iconEl = document.querySelector('.js-icon-container');
const displayBodyEl = document.querySelector('.display-color');
const displayColorName = document.querySelector('.display-color-name');

let isDropDownOn = false;


iconEl.addEventListener('click', () => {
  if(!isDropDownOn){
    dropDownEl.style.display = "block";
    displayBodyEl.style.display = "none";
    displayColorName.style.display = "none";
    iconEl.innerHTML = '<img src="icons/close-icon.png" class="close-icon">';
    isDropDownOn = true;
  }else{
    dropDownEl.style.display = "none"; 
    displayBodyEl.style.display = "initial";
    displayColorName.style.display = "initial";
    iconEl.innerHTML = '<img src="icons/burger-menu2.png" class="icon">';
    isDropDownOn = false;
  }
});
