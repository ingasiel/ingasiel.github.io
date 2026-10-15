/* ===== Mar simulado en el encabezado | Inicio ===== */
(function () {
    'use strict';

    const seccion = document.querySelector('.seccion-encabezado');
    if (!seccion) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* ---------- Lienzo ---------- */
    const canvas = document.createElement('canvas');
    canvas.className = 'canvas-mar-encabezado';
    canvas.setAttribute('aria-hidden', 'true');
    seccion.appendChild(canvas); /* append: queda sobre la letra gigante (mismo z, después en DOM) */
    const ctx = canvas.getContext('2d');

    let dpr = 1, w = 0, h = 0;

    function medir() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        const r = canvas.getBoundingClientRect();
        w = r.width;
        h = r.height;
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    medir();
    window.addEventListener('resize', medir);

    /* ---------- Capas de olas (lejana → cercana) ----------
       ENFOQUE CRISTALINO: el agua es casi incolora. Cada capa es
       un velo blanco-gris MUY translúcido — el fondo y la letra
       gigante se ven a través de verdad. El agua se percibe por
       sus reflejos: línea de superficie especular blanca, halo,
       reflejo secundario, espuma y destellos. Sin color. */
    const CAPAS = [
        { y0: 0.30, a1: 0.085, f1: 1.4, v1: 0.55, a2: 0.045, f2: 3.1, v2: 0.85, a3: 0.020, f3: 6.7, v3: 1.30,
          fase: 0.0,
          cuerpoTop: 'rgba(216, 228, 234, 0.045)',  /* casi invisible arriba */
          cuerpoBot: 'rgba(216, 228, 234, 0.13)',
          linea: 'rgba(245, 250, 252, 0.26)', lineaW: 1.1, halo: 0.07,
          reflejo: 0.07, foam: 0.20 },

        { y0: 0.52, a1: 0.105, f1: 1.1, v1: 0.66, a2: 0.050, f2: 2.6, v2: 0.75, a3: 0.025, f3: 5.9, v3: 1.10,
          fase: 2.1,
          cuerpoTop: 'rgba(216, 228, 234, 0.075)',
          cuerpoBot: 'rgba(216, 228, 234, 0.19)',
          linea: 'rgba(245, 250, 252, 0.32)', lineaW: 1.3, halo: 0.09,
          reflejo: 0.09, foam: 0.24 },

        { y0: 0.74, a1: 0.125, f1: 0.9, v1: 0.78, a2: 0.055, f2: 2.2, v2: 0.65, a3: 0.030, f3: 5.1, v3: 0.95,
          fase: 4.4,
          cuerpoTop: 'rgba(216, 228, 234, 0.105)',
          cuerpoBot: 'rgba(216, 228, 234, 0.25)',
          linea: 'rgba(248, 252, 253, 0.38)', lineaW: 1.5, halo: 0.11,
          reflejo: 0.11, foam: 0.28 }
    ];

    /* Puntos de espuma por capa: visibles solo cuando la ola
       local está alta (cresta), se desvanecen en el valle */
    CAPAS.forEach(function (c) {
        c.espumas = [];
        for (let i = 0; i < 24; i++) {
            c.espumas.push({
                fx: Math.random(),
                r: 0.7 + Math.random() * 1.6,
                fase: Math.random() * 6.283,
                vel: 0.7 + Math.random() * 0.9
            });
        }
    });

    /* Altura de la superficie de una capa en la posición x */
    function superficie(x, t, c) {
        const X = x / w;
        /* "respiración" del oleaje: el mar sube y baja de intensidad muy lento */
        const infl = 0.82 + 0.28 * Math.sin(t * 0.18 + c.fase);
        return c.y0 * h
            + Math.sin(X * 6.283 * c.f1 + t * c.v1 + c.fase) * c.a1 * h * infl
            + Math.sin(X * 6.283 * c.f2 - t * c.v2 + c.fase * 1.7) * c.a2 * h
            + Math.sin(X * 6.283 * c.f3 + t * c.v3) * c.a3 * h;
    }

    /* Destellos: reflejos blancos que titilan sobre la superficie */
    const DESTELLOS = [];
    for (let i = 0; i < 26; i++) {
        DESTELLOS.push({
            x: Math.random(),
            capa: CAPAS[(Math.random() * CAPAS.length) | 0],
            fase: Math.random() * 6.283,
            vel: 0.5 + Math.random() * 1.1,
            r: 0.6 + Math.random() * 1.3,
            dy: 2 + Math.random() * 6
        });
    }

    /* ---------- Dibujo de un cuadro ---------- */
    function dibujar(t) {
        ctx.clearRect(0, 0, w, h);
        const paso = Math.max(4, Math.round(w / 160)); /* ~160 muestras por ola */

        for (const c of CAPAS) {
            /* cuerpo translúcido del agua: el fondo se ve a través */
            ctx.beginPath();
            ctx.moveTo(-30, h + 30);
            for (let x = -30; x <= w + 30; x += paso) ctx.lineTo(x, superficie(x, t, c));
            ctx.lineTo(w + 30, h + 30);
            ctx.closePath();

            const g = ctx.createLinearGradient(0, c.y0 * h - c.a1 * h, 0, h);
            g.addColorStop(0, c.cuerpoTop);
            g.addColorStop(1, c.cuerpoBot);
            ctx.fillStyle = g;
            ctx.fill();

            /* línea de superficie: especular blanco (donde el agua
               refleja la luz) — esto es lo que "dibuja" el agua */
            ctx.beginPath();
            for (let x = -30; x <= w + 30; x += paso) {
                const y = superficie(x, t, c);
                if (x === -30) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            /* halo difuso alrededor de la línea (luz esparcida) */
            ctx.save();
            ctx.globalAlpha = c.halo;
            ctx.lineWidth = c.lineaW * 5;
            ctx.strokeStyle = c.linea;
            ctx.stroke();
            ctx.restore();

            /* línea nítida */
            ctx.strokeStyle = c.linea;
            ctx.lineWidth = c.lineaW;
            ctx.stroke();

            /* NUEVO: reflejo secundario — una línea tenue desplazada
               debajo de la superficie; simula el grosor del agua
               vista de costado y refuerza el efecto "vidrio" */
            ctx.beginPath();
            for (let x = -30; x <= w + 30; x += paso) {
                const y = superficie(x, t, c) + h * 0.055;
                if (x === -30) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.save();
            ctx.globalAlpha = c.reflejo;
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
            ctx.stroke();
            ctx.restore();

            /* espuma puntual: blanca pura, solo en las crestas */
            for (const e of c.espumas) {
                const x = e.fx * w;
                const y = superficie(x, t, c);
                /* cuán alta está la ola aquí: 0 en el valle, 1 en la cresta */
                const alto = Math.max(0, (c.y0 * h - y) / (c.a1 * h));
                const a = alto * (0.55 + 0.45 * Math.sin(t * e.vel + e.fase));
                if (a < 0.04) continue;
                ctx.globalAlpha = a * c.foam;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y + 1, e.r, 0, 6.283);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        /* brillo amplio que se desplaza muy lento (luz sobre el agua) */
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const gx = w * (0.62 + 0.16 * Math.sin(t * 0.045));
        const gg = ctx.createRadialGradient(gx, h * 0.55, 0, gx, h * 0.55, w * 0.22);
        gg.addColorStop(0, 'rgba(255, 255, 255, 0.045)');
        gg.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gg;
        ctx.fillRect(0, 0, w, h);

        /* destellos titilando sobre la superficie */
        for (const d of DESTELLOS) {
            let a = Math.sin(t * d.vel + d.fase);
            if (a <= 0) continue;
            a *= a;
            const x = d.x * w + Math.sin(t * 0.05 + d.fase) * w * 0.01;
            const y = superficie(x, t, d.capa) + d.dy;
            if (y > h) continue;
            ctx.globalAlpha = a * 0.55;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, d.r, 0, 6.283);
            ctx.fill();
        }
        ctx.restore();
    }

    /* ---------- Bucle con pausa inteligente ----------
       Se detiene si el encabezado sale de pantalla o la
       pestaña se oculta. Tu animación de ondas no se toca. */
    let rafId = 0, enPantalla = true, corriendo = false;

    function cuadro(ahora) {
        dibujar(ahora / 1000);
        rafId = requestAnimationFrame(cuadro);
    }

    function iniciar() {
        if (corriendo || !enPantalla || document.hidden) return;
        corriendo = true;
        rafId = requestAnimationFrame(cuadro);
    }
    function detener() {
        if (!corriendo) return;
        corriendo = false;
        cancelAnimationFrame(rafId);
    }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entradas) {
            enPantalla = entradas[0].isIntersecting;
            enPantalla ? iniciar() : detener();
        }, { threshold: 0.02 }).observe(seccion);
    }
    document.addEventListener('visibilitychange', function () {
        document.hidden ? detener() : iniciar();
    });

    /* NUEVO: arranque a los 3 segundos (sincronizado con el final
       de la animación de ondas, que dura 3000 ms) */
    const RETRASO_MAR_MS = 3000;

    setTimeout(function () {
        requestAnimationFrame(function () {
            canvas.classList.add('canvas-mar-activa');
            iniciar();
        });
    }, RETRASO_MAR_MS);
})();
/* ===== Mar simulado en el encabezado | Final ===== */