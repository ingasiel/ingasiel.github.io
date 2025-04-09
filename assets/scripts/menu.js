function abrir_menu() {
    document.getElementById('menu_celular').style.display = 'flex';
}
function cerrar_menu() {
    document.getElementById('menu_celular').style.display = 'none';
}
document.addEventListener("DOMContentLoaded", function() {
    const menuItems = document.querySelectorAll('.nav-1-ul .nav-1-li a');
    const contenedorMenu = document.querySelector('.contenedor-menu-celular-main');
    if (contenedorMenu) {
        contenedorMenu.innerHTML = '';
        menuItems.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('menu-celular-opciones');
            const p = document.createElement('p');
            p.textContent = item.textContent;
            div.appendChild(p);
            contenedorMenu.appendChild(div);
        });
    }
});