const imgContainer = document.querySelector('.image-container');
const prevEl = document.getElementById('prev');
const nextEl = document.getElementById('next');

let x = 0;
let timer;

prevEl.addEventListener('click', () => {
  x = x + 45;
  clearTimeout(timer);
  updateGallery();
});

nextEl.addEventListener('click', () => {
  x = x - 45;
  clearTimeout(timer);
  updateGallery();
});


function updateGallery(){
  imgContainer.style.transform = `perspective(1000px) rotateY(${x}deg)`;
  timer = setTimeout(() => {
    x = x - 45;
    updateGallery();
  },3000)
}

updateGallery();

const buttonEl = document.querySelector('.button-effect');

buttonEl.addEventListener('mouseover', (event) => {
  const x = (event.pageX - buttonEl.offsetLeft);
  const y = (event.pageY - buttonEl.offsetTop);

  buttonEl.style.setProperty("--xPos", x + "px");
  buttonEl.style.setProperty("--yPos", y + "px");
});



