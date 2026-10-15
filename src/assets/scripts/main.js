document.addEventListener("scroll", () => {
    const header = document.getElementById("id-header");

    if(scrollY > 0){
        header.classList.remove("header");
        header.classList.add("header-activo");
    }else{
        header.classList.add("header");
        header.classList.remove("header-activo");
    }
})