const transicionPagina = document.getElementById("id_transicionpagina");
function ocultarPantalla() {
    transicionPagina.classList.add("hidden");
    setTimeout(() => {
        transicionPagina.style.display = "none";
    }, 1500);
}
setTimeout(ocultarPantalla, 1000);