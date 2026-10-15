
import os
from pathlib import Path
from PIL import Image

# ============================================================
# CONFIGURACIÓN
# ============================================================

# El ejecutable siempre estará en:
# /src/config/
#
# Por lo tanto:
# /src/config/  -> padre
# /src/         -> parent
# /src/assets/images/ -> destino

CARPETA_EJECUTABLE = Path(__file__).resolve().parent
RUTA_BASE = CARPETA_EJECUTABLE.parent / "assets" / "images"

# Extensiones que serán convertidas
EXTENSIONES_CONVERTIBLES = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".tif",
    ".tiff",
    ".gif",
    ".avif"
}

# Extensiones que NO se convierten
EXTENSIONES_IGNORADAS = {
    ".webp",
    ".ico",
    ".svg"
}

# Carpetas que se ignoran completamente
CARPETAS_IGNORADAS = {
    "logos",
    "iconos"
}


# ============================================================
# CONVERTIR IMAGEN
# ============================================================

def convertir_a_webp(ruta_imagen):
    try:
        ruta_imagen = Path(ruta_imagen)

        # Nombre del archivo sin extensión
        ruta_webp = ruta_imagen.with_suffix(".webp")

        # Si ya existe el WebP, no hacemos nada
        if ruta_webp.exists():
            print(f"[OMITIDO] Ya existe: {ruta_webp}")
            return "omitido"

        print(f"[CONVIRTIENDO] {ruta_imagen}")

        with Image.open(ruta_imagen) as imagen:

            # Manejar correctamente transparencias
            if imagen.mode in ("RGBA", "LA", "P"):
                imagen = imagen.convert("RGBA")
            else:
                imagen = imagen.convert("RGB")

            imagen.save(
                ruta_webp,
                "WEBP",
                quality=85,
                method=6
            )

        # Comprobar que realmente se creó
        if ruta_webp.exists():
            print(f"[OK] {ruta_webp}")

            # Eliminar original después de una conversión exitosa
            ruta_imagen.unlink()

            print(f"[ELIMINADO] {ruta_imagen}")

            return "convertido"

        print(f"[ERROR] No se creó el archivo WebP")
        return "error"

    except Exception as error:
        print(f"[ERROR] {ruta_imagen}")
        print(f"        {error}")
        return "error"


# ============================================================
# BUSCAR IMÁGENES
# ============================================================

def buscar_imagenes():

    print()
    print("=" * 70)
    print("CONVERTIDOR DE IMÁGENES A WEBP")
    print("=" * 70)

    print(f"Ejecutable ubicado en:")
    print(f"  {CARPETA_EJECUTABLE}")

    print()
    print(f"Buscando imágenes en:")
    print(f"  {RUTA_BASE}")

    print("=" * 70)
    print()

    # Comprobar que exista la carpeta
    if not RUTA_BASE.exists():

        print("[ERROR] La carpeta de imágenes no existe.")
        print()
        print(f"Ruta buscada:")
        print(f"  {RUTA_BASE}")

        return

    if not RUTA_BASE.is_dir():

        print("[ERROR] La ruta de imágenes no es una carpeta.")
        return

    encontradas = 0
    convertidas = 0
    omitidas = 0
    errores = 0

    # rglob permite entrar en todas las subcarpetas
    for ruta in RUTA_BASE.rglob("*"):

        # Solo archivos
        if not ruta.is_file():
            continue

        # ----------------------------------------------------
        # Comprobar si está dentro de logos o iconos
        # ----------------------------------------------------

        partes = [parte.lower() for parte in ruta.relative_to(RUTA_BASE).parts]

        if any(carpeta in CARPETAS_IGNORADAS for carpeta in partes[:-1]):
            print(f"[IGNORADO] Carpeta logos/iconos: {ruta}")
            omitidas += 1
            continue

        # ----------------------------------------------------
        # Obtener extensión
        # ----------------------------------------------------

        extension = ruta.suffix.lower()

        # WebP, ICO y SVG
        if extension in EXTENSIONES_IGNORADAS:
            print(f"[IGNORADO] {ruta}")
            omitidas += 1
            continue

        # ----------------------------------------------------
        # Comprobar si es una extensión convertible
        # ----------------------------------------------------

        if extension not in EXTENSIONES_CONVERTIBLES:
            continue

        encontradas += 1

        resultado = convertir_a_webp(ruta)

        if resultado == "convertido":
            convertidas += 1

        elif resultado == "omitido":
            omitidas += 1

        elif resultado == "error":
            errores += 1

    # ========================================================
    # RESUMEN
    # ========================================================

    print()
    print("=" * 70)
    print("PROCESO TERMINADO")
    print("=" * 70)

    print(f"Imágenes encontradas: {encontradas}")
    print(f"Convertidas:          {convertidas}")
    print(f"Omitidas:             {omitidas}")
    print(f"Errores:              {errores}")

    print("=" * 70)
    print()

    input("Presiona ENTER para cerrar...")


# ============================================================
# EJECUTAR
# ============================================================

if __name__ == "__main__":
    buscar_imagenes()
