const dropDownEl = document.querySelector('.js-drop-down');
const iconEl = document.querySelector('.js-icon-container');

let isDropDownOn = false;


iconEl.addEventListener('click', () => {
  if(!isDropDownOn){
    dropDownEl.style.display = "block";
    iconEl.innerHTML = '<img src="icons/close-icon.png" class="close-icon">';
    isDropDownOn = true;
  }else{
    dropDownEl.style.display = "none"; 
    iconEl.innerHTML = '<img src="icons/burger-menu2.png" class="icon">';
    isDropDownOn = false;
  }
});
