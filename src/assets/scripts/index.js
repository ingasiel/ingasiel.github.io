/* ===== Agua simulada en el encabezado | Inicio ===== */
(function () {
    'use strict';

    const seccion = document.querySelector('.seccion-encabezado');
    if (!seccion) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* ---------- Configuración ---------- */
    const DURACION_MS   = 3000;     // duración total de la animación
    const FADE_MS       = 450;      // desvanecido final
    const PASOS_POR_S   = 300;      // velocidad de propagación de la onda
    const AMORTIGUACION = 0.9945;   // qué tan rápido se disipa la onda
    const REFRACTACION  = 0.04;     // distorsión del fondo a través del agua
    const LUZ_MAX       = 140;      // intensidad del brillo en las crestas
    const COLORES_AGUA = [          // gradiente radial: centro → bordes
        [0.00, [32, 134, 172]],     // cian cristalino
        [0.40, [15, 72, 106]],
        [0.75, [7, 32, 56]],
        [1.00, [2, 13, 26]]         // profundidad
    ];
    const GOTAS = [                 // unas pocas ondas, desde el centro
        { t: 0,   radio: 0.075, fuerza: -560 },
        { t: 420, radio: 0.052, fuerza: -360 },
        { t: 860, radio: 0.036, fuerza: -250 }
    ];

    /* ---------- Canvas ---------- */
    const canvas = document.createElement('canvas');
    canvas.className = 'canvas-agua-encabezado';
    canvas.setAttribute('aria-hidden', 'true');
    seccion.prepend(canvas);
    const ctx = canvas.getContext('2d');

    // Resolución interna baja a propósito: el CSS la estira y las ondas se ven suaves
    const rect = seccion.getBoundingClientRect();
    const sw = Math.max(140, Math.min(Math.round(rect.width * 0.35), 420));
    const sh = Math.max(90, Math.round(rect.height * sw / rect.width));
    canvas.width = sw;
    canvas.height = sh;

    /* ---------- Fondo pre-renderizado: agua cristalina + caústicas ---------- */
    const fondo = document.createElement('canvas');
    fondo.width = sw;
    fondo.height = sh;
    const fx = fondo.getContext('2d');

    const grad = fx.createRadialGradient(sw / 2, sh / 2, 0, sw / 2, sh / 2, Math.hypot(sw, sh) / 2);
    COLORES_AGUA.forEach(function (c) { grad.addColorStop(c[0], `rgb(${c[1][0]},${c[1][1]},${c[1][2]})`); });
    fx.fillStyle = grad;
    fx.fillRect(0, 0, sw, sh);

    // PRNG determinista: la luz siempre cae igual (controlado, elegante)
    let seed = 20240905;
    const rnd = function () { return (seed = seed * 16807 % 2147483647) / 2147483647; };

    // Caústicas: manchas de luz filtrada por el agua
    fx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
        const x = rnd() * sw, y = rnd() * sh;
        const r = (0.06 + rnd() * 0.18) * Math.max(sw, sh) * 0.5;
        const cg = fx.createRadialGradient(x, y, 0, x, y, r);
        cg.addColorStop(0, `rgba(150, 225, 250, ${(0.02 + rnd() * 0.05).toFixed(3)})`);
        cg.addColorStop(1, 'rgba(150, 225, 250, 0)');
        fx.fillStyle = cg;
        fx.beginPath();
        fx.ellipse(x, y, r, r * (0.45 + rnd() * 0.3), rnd() * Math.PI, 0, Math.PI * 2);
        fx.fill();
    }

    // Haces de luz diagonales (luz entrando a una piscina)
    for (let i = 0; i < 2; i++) {
        fx.save();
        fx.translate(sw * (0.3 + i * 0.4), -sh * 0.2);
        fx.rotate(0.5 - i * 0.25);
        const beam = fx.createLinearGradient(0, 0, 0, sh * 1.6);
        beam.addColorStop(0, 'rgba(190, 235, 255, 0.10)');
        beam.addColorStop(0.6, 'rgba(190, 235, 255, 0.03)');
        beam.addColorStop(1, 'rgba(190, 235, 255, 0)');
        fx.fillStyle = beam;
        const ancho = sw * (0.10 + rnd() * 0.08);
        fx.fillRect(-ancho / 2, 0, ancho, sh * 1.6);
        fx.restore();
    }
    fx.globalCompositeOperation = 'source-over';
    const fondoPix = fx.getImageData(0, 0, sw, sh).data;

    /* ---------- Simulación física de ondas (propagación real) ---------- */
    let bufA = new Float32Array(sw * sh);   // altura actual
    let bufB = new Float32Array(sw * sh);   // altura previa
    const imagen = ctx.createImageData(sw, sh);
    const pix = imagen.data;
    pix.set(fondoPix); // los bordes exteriores quedan estáticos con el fondo

    function soltarGota(cxN, cyN, radioN, fuerza) {
        const cx = Math.round(cxN * sw), cy = Math.round(cyN * sh);
        const r = Math.max(4, Math.round(radioN * Math.min(sw, sh)));
        for (let y = -r; y <= r; y++) {
            const yy = cy + y;
            if (yy < 1 || yy >= sh - 1) continue;
            for (let x = -r; x <= r; x++) {
                const xx = cx + x;
                if (xx < 1 || xx >= sw - 1) continue;
                const d = Math.sqrt(x * x + y * y) / r;
                if (d <= 1) bufA[yy * sw + xx] += fuerza * (1 + Math.cos(Math.PI * d)) * 0.5;
            }
        }
    }

    function pasoFisica() {
        for (let y = 1; y < sh - 1; y++) {
            const fila = y * sw;
            for (let x = 1; x < sw - 1; x++) {
                const i = fila + x;
                const v = (bufA[i - 1] + bufA[i + 1] + bufA[i - sw] + bufA[i + sw]) * 0.5 - bufB[i];
                bufB[i] = v * AMORTIGUACION;
            }
        }
        const tmp = bufA; bufA = bufB; bufB = tmp;
    }

    function pintar() {
        for (let y = 1; y < sh - 1; y++) {
            const fila = y * sw;
            for (let x = 1; x < sw - 1; x++) {
                const i = fila + x;
                const dx = bufA[i - 1] - bufA[i + 1];   // pendiente de la superficie
                const dy = bufA[i - sw] - bufA[i + sw];

                // Refracción: el fondo se muestrea desplazado, como a través de agua real
                let sx = x + dx * REFRACTACION;
                let sy = y + dy * REFRACTACION;
                if (sx < 0) sx = 0; else if (sx > sw - 1.001) sx = sw - 1.001;
                if (sy < 0) sy = 0; else if (sy > sh - 1.001) sy = sh - 1.001;
                const q = ((sy | 0) * sw + (sx | 0)) * 4;

                // Especular: las crestas orientadas a la luz brillan (curva suave, sin mesetas)
                const s = dx + dy;
                const m = s > 0 ? s / (s + 170) : 0;
                const spec = m * LUZ_MAX;
                const fac = 0.92 + 0.26 * m;

                const p = i * 4;
                pix[p]     = fondoPix[q]     * fac + spec * 0.80;
                pix[p + 1] = fondoPix[q + 1] * fac + spec;
                pix[p + 2] = fondoPix[q + 2] * fac + spec * 1.05; // brillo frío
                pix[p + 3] = 255;
            }
        }
        ctx.putImageData(imagen, 0, 0);
    }

    /* ---------- Bucle principal ---------- */
    const inicioDesv = DURACION_MS - FADE_MS;
    let tPrevio = performance.now();
    const tInicio = tPrevio;
    let acumulado = 0;
    let gotaIdx = 0;

    function cuadro(ahora) {
        const t = ahora - tInicio;
        let dt = ahora - tPrevio;
        tPrevio = ahora;
        if (dt > 50) dt = 50;
        acumulado += dt;

        // Lanzar las gotas programadas
        while (gotaIdx < GOTAS.length && t >= GOTAS[gotaIdx].t) {
            soltarGota(0.5, 0.5, GOTAS[gotaIdx].radio, GOTAS[gotaIdx].fuerza);
            gotaIdx++;
        }

        // Física a velocidad constante, sin importar los Hz del monitor
        const msPaso = 1000 / PASOS_POR_S;
        let pasos = 0;
        while (acumulado >= msPaso && pasos < 14) {
            pasoFisica();
            acumulado -= msPaso;
            pasos++;
        }

        pintar();

        // Aparición suave y desvanecido que termina exactamente en DURACION_MS
        let opacidad = Math.min(1, t / 350);
        if (t > inicioDesv) opacidad *= Math.max(0, 1 - (t - inicioDesv) / FADE_MS);
        canvas.style.opacity = opacidad;

        if (t < DURACION_MS) {
            requestAnimationFrame(cuadro);
        } else {
            canvas.remove(); // DOM limpio al terminar
        }
    }
    requestAnimationFrame(cuadro);
})();
/* ===== Agua simulada en el encabezado | Final ===== */





function iniciarTitulosTrazados(selector, opciones = {}) {
    const config = {
        delayLetra: 70,   // ms entre el inicio de cada letra
        durTrazo: 2000,    // ms de trazado por letra
        durRelleno: 300,  // ms del relleno final
        ...opciones
    };
    const NS = 'http://www.w3.org/2000/svg';

    const preparar = (h2) => {
        const texto = h2.textContent.trim();
        if (!texto) return null;

        h2.setAttribute('aria-label', texto); // accesibilidad
        h2.textContent = '';

        const svg = document.createElementNS(NS, 'svg');
        svg.classList.add('titulo-trazado-svg');
        svg.setAttribute('aria-hidden', 'true');

        const text = document.createElementNS(NS, 'text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '0');

        const tspans = [...texto].map((caracter, i) => {
            const tspan = document.createElementNS(NS, 'tspan');
            tspan.textContent = caracter === ' ' ? '\u00A0' : caracter;
            tspan.classList.add('letra');
            tspan.style.setProperty('--i', i);
            text.appendChild(tspan);
            return tspan;
        });

        svg.appendChild(text);
        h2.appendChild(svg);

        svg.style.setProperty('--dur-trazo', config.durTrazo + 'ms');
        svg.style.setProperty('--dur-relleno', config.durRelleno + 'ms');
        svg.style.setProperty('--delay-letra', config.delayLetra + 'ms');

        // Medir cuando la fuente ya esté cargada
        requestAnimationFrame(() => {
            const bbox = text.getBBox();
            const margen = 2;
            svg.setAttribute('viewBox',
                `${bbox.x - margen} ${bbox.y - margen} ` +
                `${bbox.width + margen * 2} ${bbox.height + margen * 2}`);
            svg.setAttribute('width', Math.ceil(bbox.width + margen * 2));
            svg.setAttribute('height', Math.ceil(bbox.height + margen * 2));

            const fontSize = parseFloat(getComputedStyle(text).fontSize);
            tspans.forEach(t => {
                const ancho = t.getComputedTextLength();
                // Heurística del perímetro del contorno de cada letra
                t.style.setProperty('--len', Math.ceil((ancho + fontSize) * 3));
            });
        });

        return svg;
    };

    // Esperar a que cargue Haken antes de medir
    document.fonts.ready.then(() => {
        const svgs = [...document.querySelectorAll(selector)]
            .map(preparar)
            .filter(Boolean);

        // La animación arranca cuando el título entra en pantalla
        const io = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
        if (entrada.isIntersecting && entrada.intersectionRatio >= 0.6) {
            entrada.target.classList.add('animar');    // reproducir
        } else if (!entrada.isIntersecting) {
            entrada.target.classList.remove('animar'); // reiniciar al salir
        }
    });
}, { threshold: [0, 0.6] });

        svgs.forEach(svg => io.observe(svg));
    });
}

iniciarTitulosTrazados('.h2-tinas-y-lavabos, #toilets, #griferia');


/* Animación de textos al hacer scroll | Inicio */
document.addEventListener("DOMContentLoaded", () => {
    const textos = document.querySelectorAll(".contenedor-titulo-toilets p, .contenedor-titulo-griferia p");

    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("texto-visible");
            } else {
                entrada.target.classList.remove("texto-visible");
            }
        });
    }, {
        threshold: 0.15
    });

    textos.forEach((texto) => observador.observe(texto));
});
/* Animación de textos al hacer scroll | Fin */
/* Centrado real de títulos trazados | Inicio */
(function () {
    'use strict';

    function reencuadrar() {
        document.querySelectorAll('.titulo-trazado-svg').forEach(function (svg) {
            const text = svg.querySelector('text');
            if (!text) return;

            let b;
            try { b = text.getBBox(); } catch (e) { return; }
            if (!b || !b.width) return;

            /* reencuadra el viewBox al texto real (+ aire para el trazo) */
            const aire = 3;
            svg.setAttribute('viewBox',
                (b.x - aire) + ' ' + (b.y - aire) + ' ' +
                (b.width + aire * 2) + ' ' + (b.height + aire * 2));

            /* la caja ahora mide exactamente lo que mide el texto;
               el CSS la centra con margin-inline: auto en móvil */
            svg.style.width = (b.width + aire * 2) + 'px';
        });
    }

    /* Clave: medir solo cuando la fuente ya cargó. Si se mide antes,
       Haken no está disponible y el ancho sale mal (el bug original). */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(reencuadrar);
    }
    /* respaldo por si el DOM tarda en generarse */
    window.addEventListener('load', reencuadrar);
})();
/* Centrado real de títulos trazados | Final */