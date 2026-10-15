import os

# Estructura a crear
structure = {
    "src": {
        "assets": {
            "images": {
                "iconos": {
                    
                },
                "svg": {
                    "sprite.svg": "Aquí va el contenido SVG"
                }
            },
            "fonts": {},
            "styles": {
                "main.css": '''
/* Aquí va el contenido CSS principal */
*{
    margin: 0px;
    padding: 0px;
    text-decoration: none;
}

:root{
}

.body{
    display: flex;
    flex-wrap: wrap;
    justify-content: start;
    align-content: start;
}
.header{
    display: flex;
    flex-wrap: wrap;
    justify-content: start;
    align-content: start;
    z-index: 5;
}
                ''',
                "index.css": '''
/* Aquí va el contenido CSS de tu index */
                '''
            },
            "scripts": {
                "main.js": "// Aquí va el contenido JS principal",
                "index.js": "// Aquí va el contenido JS de tu index"
            }
        },
        "pages": {
            "inicio.html": "<!-- Contenido HTML para la página de inicio -->\n<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Inicio</title>\n</head>\n<body>\n  <h1>Página de Inicio</h1>\n</body>\n</html>\n",
            "contacto.html": "<!-- Contenido HTML para la página de contacto -->\n<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Contacto</title>\n</head>\n<body>\n  <h1>Contacto</h1>\n</body>\n</html>\n",
            "terminos-y-condiciones.html": "<!-- Contenido HTML para términos y condiciones -->\n<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Términos y Condiciones</title>\n</head>\n<body>\n  <h1>Términos y Condiciones</h1>\n</body>\n</html>\n"
        },
        "components": {},
        "utils": {},
        "config": {
            "sitemap.py":'''
import os
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom.minidom import parseString
from datetime import datetime

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PAGES_DIR = os.path.join(ROOT_DIR, 'src', 'pages')

BASE_URL = "https://www.tusitio.com/"

# Configuraciones por defecto para sitemap
DEFAULT_CHANGEFREQ = "daily"
DEFAULT_PRIORITY = "1.0"

def get_files():
    files = []
    print(f"Buscando archivos en: {PAGES_DIR}")
    for root, _, filenames in os.walk(PAGES_DIR):
        for f in filenames:
            if f.endswith('.html') or f.endswith('.php'):
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, ROOT_DIR).replace(os.sep, '/')
                last_mod_timestamp = os.path.getmtime(full_path)
                last_mod = datetime.utcfromtimestamp(last_mod_timestamp).strftime('%Y-%m-%d')
                print(f"Archivo encontrado: {rel_path} - LastMod: {last_mod}")
                files.append({
                    "url": rel_path,
                    "lastmod": last_mod
                })
    return files

def generate_sitemap(pages):
    urlset = Element('urlset')
    urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')

    for page in pages:
        url_el = SubElement(urlset, 'url')

        loc = SubElement(url_el, 'loc')
        loc.text = BASE_URL + page["url"]

        lastmod = SubElement(url_el, 'lastmod')
        lastmod.text = page["lastmod"]

        changefreq = SubElement(url_el, 'changefreq')
        changefreq.text = DEFAULT_CHANGEFREQ

        priority = SubElement(url_el, 'priority')
        priority.text = DEFAULT_PRIORITY

    rough_string = tostring(urlset, 'utf-8')
    reparsed = parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")

def save_sitemap(xml_content):
    sitemap_path = os.path.join(ROOT_DIR, 'sitemap.xml')
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(xml_content)
    print(f"sitemap.xml generado en: {sitemap_path}")

if __name__ == "__main__":
    pages = get_files()
    sitemap_xml = generate_sitemap(pages)
    save_sitemap(sitemap_xml)

''',
"convertidor.py":'''
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
'''
        }
    },
    "docs": {
        "README.md": ''' 
# XandA - Generador de Sitios Web

**XandA** es un generador de sitios web de código libre desarrollador en python, cuyo propósito es generar estructuras de proyectos para facilitar el desarrollo de sitios web y así mejorar la productividad en cada proyecto. Dichas estructuras son fáciles de modificar, intuitivas y limpias, proporcionando al desarrollador un código y una jerarquía de carpetas bastante amigable.

----------------------------------------

## Estrcutura del proyecto
Se compone de tres carpetas y siete archivos en la raíz, los cuales cumplen funciones específicas dentro del proyecto, mientras que otros albergan subcarpetas como el caso de "src", cuyo contenido es alojar a "assets", "components", "config", "pages" y "utils" juntos a su respectivo contenido correspondiente:

    ├── src/ # Código fuente principal
    │ ├── assets/ # Recursos estáticos
    │ │ ├── images/
    │ │ │ ├── iconos/
    │ │ │ └── svg/
    │ │ │ └── sprite.svg
    │ │ ├── styles/
    │ │ │ └── main.css # Estilos globales
    │ │ └── scripts/
    │ │ └── main.js # Scripts globales
    │ ├── components/ # Componentes reutilizables
    │ ├── config/ # Scripts de configuración
    │ │ ├── convertidor.py # Convierte todas las imágenes en .webp
    │ │ └── sitemap.py # Generación automática de sitemap.xml
    │ ├── pages/ # Páginas HTML/PHP del sitio
    │ │ ├── index.html
    │ │ ├── contacto.html
    │ │ ├── 404.html
    │ │ └── ...
    │ └── utils/ # Funciones auxiliares
    │
    ├── docs/ # Documentación
    │ └── README.md
    ├── test/ # Pruebas
    │
    ├── .htaccess
    ├── .gitignore
    ├── index.html
    ├── LICENSE.txt
    ├── manifest.json
    ├── robots.txt
    └── sitemap.xml

----------------------------------------

## Carpetas, usos y archivos

**config:**
Alberga dos archivos importantes que deben ser ejecutados con extremo cuidado y cada uno aporta una función crucial al proyecto:
 - *sitemap.py:* Anlaiza el contenido de la carpeta "pages" todos los archivos .html y .php los agrega al sitemap.xml. En el caso de haber eliminado un archivo y este ya había sido previamente cargado al sitemap.xml, el archivo sitemap.py es capaz de identificar si un archivo ya no se encuentra dentro de esa carpeta y lo elimina del sitemap.xml
 - *convertidor.py:* Este archivo buscará todas las imágenes que estén dentro de src/assets/images las cuales covnertirá en .webp a excepción de las que ya estén convertidas, en svg y las que estén en formato .ico. De igual manera omitirá todo lo que esté dentro de la carpeta iconos
Los archivos de esta carpeta tienen como fin proporcionar componentes que pueden ser utilizados en páginas .html y .php, algunos de ellos son menús, secciones, formularios, etc. La forma de cargar un componente es mandarlo a llamar con un "<scripts src="./src/components/componente.js"></scripts>", porteriormente necesitarás insertar esto en tu etiquetado .html o tu código .php "". No obstante, dentro de cada componente hay un comentario que te explicará como mandarlo a llamar.

**sprite.svg**
El archivo sprite.svg está alojado dentro de la carpeta "svg" y su función es almacenar bastantes .svg en un solo archivo, con la finalidad de ser mandados a llamar a través de la sintaxis "xlink:href" y así ahorrar tiempo, redundancia y peso a los archivos que requieran de estos respectivos .svg

----------------------------------------
'''
    },
    "tests": {

    },
    "favicon.ico": ""
}

# Archivos raíz con contenido
root_files = {
    ".htaccess": "# Aquí puedes poner reglas para Apache\n",
    "robots.txt": "User-agent: *\nDisallow:\n",
    "sitemap.xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <!-- URLs del sitio -->\n</urlset>\n",
    "LICENSE.txt": " ",
    "manifest.json": "{\n  \"name\": \"Proyecto\",\n  \"shorts_name\": \"Proyecto\",\n  \"start_url\": \"/\",\n  \"display\": \"standalone\"\n}\n",
    "index.html": '''
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Index</title>
    <meta name="date" content="2024-09-05">
    <link rel="canonical" href="URL">
    <meta name="theme-color" content="#ffffff">
    <link rel="alternate" hreflang="es" href="URL">
    <meta name="mobile-web-app-capable" content="yes">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="Referrer-Policy" content="no-referrer-when-downgrade">-->
    
    <!-- SEO -->
    <meta name="description" content="Descripcion">
    <meta name="keywords" content="Palabras clave">
    <meta name="author" content="Autor">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
    <meta name="subject" content="Subject">
    <meta name="rating" content="General">
    
    <!-- Open Graph para Redes Sociales -->
    <meta property="og:title" content="Titulo">
    <meta property="og:type" content="website">
    <meta property="og:url" content="URL">
    <meta property="og:description" content="Descripcion">
    <meta property="og:locale" content="es_MX">
    <meta property="og:site_name" content="nombre">
    <meta property="og:image" content="assets/images/">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Titulo">
    <meta name="twitter:description" content="Descripcion">
    <meta name="twitter:site" content="nombre">
    <meta name="twitter:image" content="assets/images/">
    <meta property="og:image:alt" content="Titulo">

    <!-- Favicon -->
    <link rel="icon" href="favicon.ico">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <link rel="shortcut icon" href="favicon.ico" type="image/x-icon">

    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" sizes="180x180" href="src/assets/images/iconos/apple-touch-icon-180x180.png">
    <link rel="apple-touch-icon" sizes="152x152" href="src/assets/images/iconos/apple-touch-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="120x120" href="src/assets/images/iconos/apple-touch-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="76x76" href="src/assets/images/iconos/apple-touch-icon-76x76.png">

    <!-- Iconos para Android -->
    <link rel="icon" sizes="192x192" href="src/assets/images/iconos/android-chrome-192x192.png">
    <link rel="icon" sizes="512x512" href="src/assets/images/iconos/android-chrome-512x512.png">

    <!-- Otros formatos -->
    <link rel="icon" type="image/png" sizes="32x32" href="src/assets/images/iconos/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="src/assets/images/iconos/favicon-16x16.png">

    <!-- AWESOME  -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">

    <!-- AOS -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">

    <!-- CSS -->
    <link rel="stylesheet" href="src/assets/styles/main.css">
    <link rel="stylesheet" href="src/assets/styles/index.css">

    <!-- Datos Estructurados JSON-LD -->
    <script type="application/ld+json">
        {
        "@context": "https://schema.org",
        "@type": "NewsMediaOrganization",
        "name": "Nombre",
        "url": "URL",
        "logo": "assets/images/logo.png",
        "sameAs": [
            "URL Redes Sociales",
            "URL Redes Sociales"
        ],
        "description": "Descripcion",
        "founder": "Nombre del fundador",
        "foundingDate": "Año",
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Support",
            "email": "correo electrónico",
            "url": "URL contacto"
        }
        }
    </script>

    <!-- Fuentes -->
</head>
<body class="body">
    <!-- Header -->
    <header class="header">
    </header>

    <!-- Main -->
    <main class="main">
    </main>

    <!-- Footer -->
    <footer class="footer">
    </footer>

    <!-- Scripts -->
    <script src="src/assets/scripts/main.js"></script>
    <script src="src/assets/scripts/index.js"></script>
</body>
</html>
''',
    ".gitignore": "hola"
}

def create_structure(base_path, structure_dict):
    for name, content in structure_dict.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            # Es carpeta
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        else:
            # Es archivo con contenido
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)

def create_root_files(base_path, files_dict):
    for filename, content in files_dict.items():
        path = os.path.join(base_path, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

if __name__ == "__main__":
    base = os.getcwd()
    print(f"Creando estructura en: {base}")
    create_structure(base, structure)
    create_root_files(base, root_files)
    print("¡Estructura creada con éxito!")