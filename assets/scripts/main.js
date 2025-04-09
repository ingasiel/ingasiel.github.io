let scrollToTopBtn = document.getElementById("scrollToTopBtn");
let nav = document.getElementById("id_nav");
window.onscroll = function() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        scrollToTopBtn.classList.add("show");
        nav.classList.add("fixed");
    } else {
        scrollToTopBtn.classList.remove("show");
        nav.classList.remove("fixed");
    }
};
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
document.addEventListener("DOMContentLoaded", function() {
    const circulos = document.querySelectorAll('.linea-circulo');
    let index = 0;
    function activarCirculo() {
        circulos.forEach(circulo => circulo.classList.remove('active'));
        circulos[index].classList.add('active');
        index = (index + 1) % circulos.length;
    }
    setInterval(activarCirculo, 5000);
});
document.addEventListener("DOMContentLoaded", function() {
    const circulos = document.querySelectorAll('.linea-circulo-frame');
    let index = 0;
    function activarCirculo() {
        circulos.forEach(circulo => circulo.classList.remove('active'));
        circulos[index].classList.add('active');
        index = (index + 1) % circulos.length;
    }
    setInterval(activarCirculo, 5000);
});
const iframe = document.querySelector('.frame-1 iframe');
let counter = 0;
const videos = [
    "https://www.youtube.com/embed/_wNLTV_ACb0",
    "https://www.youtube.com/embed/SE5onqhndLI",
    "https://www.youtube.com/embed/0ZNoQs34yQk"
];
function cambiarIframe() {
    iframe.src = videos[counter];
    counter = (counter + 1) % videos.length;
}
setInterval(cambiarIframe, 5000);
function createRandomImage() {
    const section = document.getElementById('id-section-universal-imagenes-generadas-fondo');
    const image = document.createElement('div');
    const size = Math.random() * (150 - 30) + 30;
    const xPos = Math.random() * section.offsetWidth;
    const yPos = Math.random() * section.offsetHeight;
    const rotation = Math.random() * 360;
    image.classList.add('background-image');
    image.style.width = `${size}px`;
    image.style.height = `${size}px`;
    image.style.left = `${xPos}px`;
    image.style.top = `${yPos}px`;
    image.style.transform = `rotate(${rotation}deg)`;
    section.appendChild(image);
    setTimeout(() => {
        section.removeChild(image);
    }, 6000);
}
setInterval(createRandomImage, Math.random() * 2000 + 1000);
setTimeout(function() {
    var ventanaEmergente = document.getElementById("id_ventana_emergente_registro");
    if (ventanaEmergente && ventanaEmergente.style.display !== "flex") {
      ventanaEmergente.style.display = "flex";
    }
    
  }, 60000);
  document.getElementById("cerrar_ventana_emergente").addEventListener("click", function() {
    var ventanaEmergente = document.getElementById("id_ventana_emergente_registro");
    if (ventanaEmergente) {
      ventanaEmergente.style.display = "none";
    }
  });  