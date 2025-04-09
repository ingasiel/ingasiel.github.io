document.addEventListener("DOMContentLoaded", function() {
    const pantallaCarga = document.getElementById('id_burbujas');
    let creandoBurbujas = true;
    function crearBurbujas() {
        if (!creandoBurbujas) {
            console.log("No se están creando burbujas, la pantalla de carga ya se ha ocultado.");
            return;
        }
        console.log("Creando una burbuja...");
        const burbuja = document.createElement('div');
        burbuja.classList.add('burbujas');
        const tamaño = Math.random() * (80 - 20) + 20;
        burbuja.style.width = `${tamaño}px`;
        burbuja.style.height = `${tamaño}px`;
        const posX = Math.random() * 100;
        burbuja.style.left = `${posX}vw`;
        const duracion = Math.random() * (10 - 5) + 5;
        burbuja.style.animationDuration = `${duracion}s`;
        pantallaCarga.appendChild(burbuja);
        setTimeout(() => {
            burbuja.remove();
            console.log("Burbuja eliminada después de la animación.");
        }, duracion * 1000);
    }
    const intervalo = setInterval(crearBurbujas, 200);
    setTimeout(() => {
        console.log("La pantalla de carga está comenzando a desvanecerse...");
        pantallaCarga.style.opacity = "0";
        pantallaCarga.style.transition = "opacity 1s";
    }, 2000);
    setTimeout(() => {
        pantallaCarga.style.display = "none";
        creandoBurbujas = false;
        clearInterval(intervalo);
        console.log("Pantalla de carga oculta y burbujas detenidas.");
    }, 3000);
});