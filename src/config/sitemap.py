
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

