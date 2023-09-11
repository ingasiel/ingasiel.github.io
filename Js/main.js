function vinculo1(){
    location.href="https://xandacompany.github.io/";
    
}

function celular(){
    document.getElementById("seleccion1").style.background="linear-gradient(45deg,#046ade,#a802fa)";
    document.getElementById("seleccion2").style.background="none";
    document.getElementById("seleccion3").style.background="none";



    document.getElementById("efecto2_aparecer1").style.display="flex";
    document.getElementById("efecto2_aparecer2").style.display="flex";
    document.getElementById("efecto2_aparecer3").style.display="flex";
    document.getElementById("efecto2_aparecer4").style.display="flex";
    document.getElementById("efecto2_aparecer5").style.display="flex";
    document.getElementById("efecto2_aparecer6").style.display="flex";

    document.getElementById("efecto_aparecer1").style.display="none";
    document.getElementById("efecto_aparecer2").style.display="none";
    document.getElementById("efecto_aparecer3").style.display="none";
    document.getElementById("efecto_aparecer4").style.display="none";
    document.getElementById("efecto_aparecer5").style.display="none";
    document.getElementById("efecto_aparecer6").style.display="none";

    document.getElementById("accion_de_tarjeta1").style.display="none";
    document.getElementById("accion_de_tarjeta2").style.display="none";
    document.getElementById("accion_de_tarjeta3").style.display="none";
    document.getElementById("accion_de_tarjeta4").style.display="none";
    document.getElementById("accion_de_tarjeta5").style.display="none";
    document.getElementById("accion_de_tarjeta6").style.display="none";
}

function web(){
    document.getElementById("seleccion2").style.background="linear-gradient(45deg,#046ade,#a802fa)";
    document.getElementById("seleccion1").style.background="none";
    document.getElementById("seleccion3").style.background="none";



    document.getElementById("accion_de_tarjeta1").style.display="flex";
    document.getElementById("accion_de_tarjeta2").style.display="flex";
    document.getElementById("accion_de_tarjeta3").style.display="flex";
    document.getElementById("accion_de_tarjeta4").style.display="flex";
    document.getElementById("accion_de_tarjeta5").style.display="flex";
    document.getElementById("accion_de_tarjeta6").style.display="flex";

    document.getElementById("efecto_aparecer1").style.display="none";
    document.getElementById("efecto_aparecer2").style.display="none";
    document.getElementById("efecto_aparecer3").style.display="none";
    document.getElementById("efecto_aparecer4").style.display="none";
    document.getElementById("efecto_aparecer5").style.display="none";
    document.getElementById("efecto_aparecer6").style.display="none";

    document.getElementById("efecto2_aparecer1").style.display="none";
    document.getElementById("efecto2_aparecer2").style.display="none";
    document.getElementById("efecto2_aparecer3").style.display="none";
    document.getElementById("efecto2_aparecer4").style.display="none";
    document.getElementById("efecto2_aparecer5").style.display="none";
    document.getElementById("efecto2_aparecer6").style.display="none";
}

function pc(){
    document.getElementById("seleccion3").style.background="linear-gradient(45deg,#046ade,#a802fa)";
    document.getElementById("seleccion2").style.background="none";
    document.getElementById("seleccion1").style.background="none";



    document.getElementById("accion_de_tarjeta1").style.display="none";
    document.getElementById("accion_de_tarjeta2").style.display="none";
    document.getElementById("accion_de_tarjeta3").style.display="none";
    document.getElementById("accion_de_tarjeta4").style.display="none";
    document.getElementById("accion_de_tarjeta5").style.display="none";
    document.getElementById("accion_de_tarjeta6").style.display="none";

    document.getElementById("efecto_aparecer1").style.display="flex";
    document.getElementById("efecto_aparecer2").style.display="flex";
    document.getElementById("efecto_aparecer3").style.display="flex";
    document.getElementById("efecto_aparecer4").style.display="flex";
    document.getElementById("efecto_aparecer5").style.display="flex";
    document.getElementById("efecto_aparecer6").style.display="flex";

    document.getElementById("efecto2_aparecer1").style.display="none";
    document.getElementById("efecto2_aparecer2").style.display="none";
    document.getElementById("efecto2_aparecer3").style.display="none";
    document.getElementById("efecto2_aparecer4").style.display="none";
    document.getElementById("efecto2_aparecer5").style.display="none";
    document.getElementById("efecto2_aparecer6").style.display="none";
}

function cargar_pdf(){
    window.open('../DA/ia_aplicada_en_la_salud_mental.pdf')
    document.getElementById("cargar_pdf_2").style.display="flex";
    document.getElementById("ocultar_para_pdf").style.display="none";
    document.getElementById("ocultar_para_pdf_2").style.display="none";
    document.getElementById("ocultar_para_pdf_3").style.display="none";

    return cargar_pdf();

}


function func_pantalla_emergente(){
    document.getElementById("cargar_pantalla_emergente").style.display="flex";
    document.getElementById("id_doby").style.overflow="hidden";
}

function func_pantalla_emergente_2(){
    document.getElementById("cargar_pantalla_emergente_2").style.display="flex";
    document.getElementById("id_doby").style.overflow="hidden";
}

function cerrarventanaemergente(){
    document.getElementById("cargar_pantalla_emergente").style.display="none";
    document.getElementById("cargar_pantalla_emergente_2").style.display="none";
    document.getElementById("cargar_pantalla_emergente_no_disponible").style.display="none";

    document.getElementById("id_doby").style.overflowY="scroll";
}

function func_pantalla_emergente_no_disponible(){
    document.getElementById("cargar_pantalla_emergente_no_disponible").style.display="flex";
}
