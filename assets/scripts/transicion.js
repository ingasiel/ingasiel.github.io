function transicionpagina() {
    document.getElementById('id_transicionpagina').style.display = "flex";
    crearBurbujas();
    setTimeout(function() {
        document.getElementById('id_transicionpagina_oscuro').style.backgroundColor = "rgba(0, 0, 0)";
        setTimeout(function() {
            window.location.href = "pages/registro.html";
        }, 1000); 
    }, 1000);
}
function crearBurbujas() {
    const contenedor = document.getElementById('burbujas-container');
    const cantidadBurbujas = 30;
    contenedor.innerHTML = '';
    for (let i = 0; i < cantidadBurbujas; i++) {
        const burbuja = document.createElement('div');
        burbuja.classList.add('burbujas');
        const tamano = Math.random() * 50 + 20;
        burbuja.style.width = tamano + 'px';
        burbuja.style.height = tamano + 'px';
        burbuja.style.left = Math.random() * 100 + 'vw';
        burbuja.style.animationDuration = Math.random() * 2 + 4 + 's';
        contenedor.appendChild(burbuja);
    }
}