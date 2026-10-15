 
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
