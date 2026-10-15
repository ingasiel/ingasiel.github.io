/* ===== Agua de tinas y lavabos | Inicio ===== */
(function () {
    'use strict';

    /* Respeta la preferencia de menos movimiento */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const seccion = document.querySelector('.seccion-tinas-y-lavabos');
    if (!seccion) return;

    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */
    const MARGEN_IMPACTO = 26;     /* px sobre el borde inferior de la sección */
    const NIVEL_BASE     = 120;    /* nivel inicial del agua (px) */
    const NIVEL_MIN      = 44;
    const NIVEL_MAX_ABS  = 260;

    /* Física de la superficie (unidades por segundo).
       Propagación lenta y elegante: las olas viajan a
       ~600 px/s y se amortiguan suavemente. */
    const PASOS_POR_S = 120;   /* pasos de física por segundo */
    const C2          = 4000;  /* velocidad: c ≈ √C2 × dx px/s */
    const TENSION     = 5;     /* regreso al nivel (periodo ~2.8 s) */
    const ROZAMIENTO  = 0.35;  /* disipación por segundo */
    const DIFUSION    = 0.15;  /* suavizado por paso: elimina la vibración fina */
    const VEL_MAX     = 350;   /* px/s */

    /* Gotas que caen (solo computadora, como pediste) */
    const GRAVEDAD_GOTA = 1050;
    const INTERVALO     = [2.6, 5.2];   /* s entre gotas */
    const FRACCION_X    = [0.60, 0.92]; /* nacen en el lado derecho */

    /* Apariencia */
    const ALFA_LINEA     = 0.22;
    const ALFA_MASA      = 0.10;
    const ALFA_CAUSTICAS = 0.04;

    /* Si al rotar tu dispositivo el agua se lanza al lado
       contrario al esperado, pon true */
    const INVERTIR_ROTACION = false;

    /* ---------- Utilidades ---------- */
    const aleatorio = (a, b) => a + Math.random() * (b - a);
    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);

    /* ---------- Lienzo global (fixed: cubre el viewport) ---------- */
    const canvas = document.createElement('canvas');
    canvas.className = 'canvas-ondas-tinas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let dpr = 1, vw = 0, vh = 0;

    /* =====================================================
       SIMULACIÓN DE AGUA (shallow-water 1D con volumen)
       N columnas cubren todo el ancho de la pantalla. Cada
       columna tiene altura h y velocidad v. Las olas viajan,
       se reflejan en los extremos y se amortiguan.
    ===================================================== */
    let N = 0, dx = 8;
    let h = null, v = null, tmp = null, tgt = null, suave = null;

    function construirArrays() {
        h = new Float32Array(N);
        v = new Float32Array(N);
        tmp = new Float32Array(N);
        tgt = new Float32Array(N);
        suave = new Float32Array(N);
    }

    /* impulso gaussiano: fuerza negativa = cráter */
    function impulso(xPantalla, fuerza, sigmaPx) {
        if (!h) return;
        const c = (xPantalla / vw) * (N - 1);
        const s = Math.max(1.4, sigmaPx / dx);
        const r = Math.ceil(s * 3);
        for (let k = -r; k <= r; k++) {
            const i = Math.round(c) + k;
            if (i < 1 || i > N - 2) continue;
            h[i] += fuerza * Math.exp(-(k * k) / (2 * s * s));
        }
    }

    /* ---------- Estado ---------- */
    let relojSim = 0;
    let nivelActual = 0, nivelObjetivo = 0, volumen = null;
    let tilt = 0, tiltObjetivo = 0, tiltMaxActual = 60;
    const pulsos = [];        /* inclinaciones programadas (rotación) */
    let ultimoPulso = -10;

    const gotas = [];         /* cayendo (solo computadora) */
    const gotasRebote = [];   /* gotita del pico tras el impacto */
    const particulas = [];    /* salpicaduras */
    const flashes = [];
    const eventos = [];       /* acciones programadas del impacto */

    let seccRect = null, nivelY = 0;
    let tSiguiente = 1.2;

    /* ---------- Rotación / orientación ---------- */
    function anguloPantalla() {
        if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
        if (typeof window.orientation === 'number') return window.orientation;
        return 0;
    }
    let angPrevio = anguloPantalla();
    let portraitPrevio = window.innerHeight > window.innerWidth;
    let wPrevio = window.innerWidth;

    /* pulso de inclinación: el agua se lanza hacia un lado,
       rebota y se asienta (bell curve = arranque y frenado suaves) */
    function lanzarPulso(dir, escalaAmp, dur, retardo) {
        if (relojSim - ultimoPulso < 1.0) return;
        ultimoPulso = relojSim;
        pulsos.push({
            t0: relojSim + (retardo || 0),
            dur: dur,
            dir: dir * (INVERTIR_ROTACION ? -1 : 1),
            amp: tiltMaxActual * escalaAmp
        });
    }

    function alCambiarOrientacion() {
        const a = anguloPantalla();
        let delta = a - angPrevio;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        angPrevio = a;
        if (!delta) return;
        lanzarPulso(delta > 0 ? 1 : -1, Math.abs(delta) >= 90 ? 1 : 0.6, 2.0, 0.15);
    }
    window.addEventListener('orientationchange', alCambiarOrientacion);

    /* respaldo por resize: volteo vertical/horizontal o cambio
       grande de ancho también generan slosh (monitores girados,
       ventanas redimensionadas, devtools) */
    window.addEventListener('resize', function () {
        medir();
        const portrait = window.innerHeight > window.innerWidth;
        if (portrait !== portraitPrevio) {
            portraitPrevio = portrait;
            lanzarPulso(portrait ? 1 : -1, 1, 2.0, 0.1);
        } else {
            const dw = window.innerWidth - wPrevio;
            if (Math.abs(dw) > 120) lanzarPulso(dw > 0 ? 1 : -1, 0.45, 1.5, 0);
        }
        wPrevio = window.innerWidth;
    });

    /* inclinación continua por sensor (Android; iOS pide permiso
       por gesto y por eso aquí no se solicita) */
    let tiltVivo = 0, tiltVivoActivo = false, ultimoTiltVivo = -10;
    window.addEventListener('deviceorientation', function (e) {
        if (e.beta == null && e.gamma == null) return;
        const ang = anguloPantalla();
        let g;
        if (ang === 90) g = e.beta;
        else if (ang === -90 || ang === 270) g = -(e.beta || 0);
        else if (ang === 180) g = -(e.gamma || 0);
        else g = e.gamma;
        if (g == null) return;
        tiltVivo = clamp(g / 30, -1, 1) * tiltMaxActual * 0.5 * (INVERTIR_ROTACION ? -1 : 1);
        tiltVivoActivo = true;
        ultimoTiltVivo = relojSim;
    });

    /* ---------- Física ---------- */
    function actualizarTiltObjetivo() {
        let objetivo = 0;
        for (let i = pulsos.length - 1; i >= 0; i--) {
            const p = (relojSim - pulsos[i].t0) / pulsos[i].dur;
            if (p >= 1) { pulsos.splice(i, 1); continue; }
            if (p < 0) continue;
            objetivo += pulsos[i].dir * pulsos[i].amp * Math.pow(Math.sin(Math.PI * p), 1.4);
        }
        if (tiltVivoActivo) objetivo += tiltVivo;
        tiltObjetivo = objetivo;
    }

    function pasoFisica(pasoS) {
        relojSim += pasoS;

        actualizarTiltObjetivo();
        tilt += (tiltObjetivo - tilt) * Math.min(1, pasoS * 3);
        for (let i = 0; i < N; i++) tgt[i] = tilt * (2 * i / (N - 1) - 1);

        const amort = Math.max(0, 1 - ROZAMIENTO * pasoS);

        for (let i = 1; i < N - 1; i++) {
            const lap = h[i - 1] + h[i + 1] - 2 * h[i];
            const acc = C2 * lap + TENSION * (tgt[i] - h[i]);
            v[i] = (v[i] + acc * pasoS) * amort;
            if (v[i] > VEL_MAX) v[i] = VEL_MAX;
            else if (v[i] < -VEL_MAX) v[i] = -VEL_MAX;
        }
        for (let i = 1; i < N - 1; i++) h[i] += v[i] * pasoS;

        /* difusión: mata las vibraciones de alta frecuencia */
        for (let i = 1; i < N - 1; i++) {
            tmp[i] = h[i] * (1 - 2 * DIFUSION) + (h[i - 1] + h[i + 1]) * DIFUSION;
        }
        tmp[0] = tmp[1];
        tmp[N - 1] = tmp[N - 2];
        const t = h; h = tmp; tmp = t;
        h[0] = h[1];
        h[N - 1] = h[N - 2];
    }

    /* ---------- Gotas e impactos ---------- */
    function lanzarGota() {
        if (!seccRect) return;
        gotas.push({
            x: seccRect.left + seccRect.width * aleatorio(FRACCION_X[0], FRACCION_X[1]),
            y: Math.max(-30, seccRect.top - 24),
            vy: aleatorio(30, 70),
            r: aleatorio(2.6, 4.0)
        });
    }

    function impactar(x, rGota) {
        /* cráter ancho y suave: ola lenta, nada de temblor */
        impulso(x, -(9 + rGota * 1.5), 13);

        const n = 5 + ((Math.random() * 3) | 0);
        for (let i = 0; i < n; i++) {
            particulas.push({
                x: x + aleatorio(-2, 2), y: nivelY - 2,
                vx: aleatorio(-70, 70),
                vy: -aleatorio(90, 200),
                r: aleatorio(0.7, 1.5),
                vida: 0, dur: aleatorio(0.4, 0.75)
            });
        }

        flashes.push({ x, y: nivelY, t0: relojSim, dur: 0.38, r: 22 + rGota * 5 });
        eventos.push({ t: relojSim + 0.38, tipo: 'jet', x: x });
    }

    function actualizar(dt) {
        /* eventos programados (gotita del pico) */
        for (let i = eventos.length - 1; i >= 0; i--) {
            const e = eventos[i];
            if (relojSim < e.t) continue;
            eventos.splice(i, 1);
            gotasRebote.push({
                x: e.x + aleatorio(-3, 3), y: nivelY - 4,
                vy: -aleatorio(150, 215),
                r: aleatorio(1.3, 2.0)
            });
        }

        /* gotas cayendo */
        for (let i = gotas.length - 1; i >= 0; i--) {
            const d = gotas[i];
            d.vy = Math.min(680, d.vy + GRAVEDAD_GOTA * dt);
            d.y += d.vy * dt;
            if (d.y >= nivelY - d.r * 0.3) {
                impactar(d.x, d.r);
                gotas.splice(i, 1);
            }
        }

        /* gotita del pico: sube y vuelve a caer */
        for (let i = gotasRebote.length - 1; i >= 0; i--) {
            const d = gotasRebote[i];
            d.vy += GRAVEDAD_GOTA * dt;
            d.y += d.vy * dt;
            if (d.vy > 0 && d.y >= nivelY - 1) {
                impulso(d.x, -4.5, 8);
                for (let k = 0; k < 2; k++) {
                    particulas.push({
                        x: d.x + aleatorio(-1.5, 1.5), y: nivelY - 2,
                        vx: aleatorio(-50, 50), vy: -aleatorio(60, 130),
                        r: aleatorio(0.6, 1.1), vida: 0, dur: aleatorio(0.3, 0.5)
                    });
                }
                gotasRebote.splice(i, 1);
            }
        }

        /* salpicaduras */
        for (let i = particulas.length - 1; i >= 0; i--) {
            const s = particulas[i];
            s.vida += dt;
            if (s.vida >= s.dur) { particulas.splice(i, 1); continue; }
            s.vy += 880 * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
        }

        /* NUEVO: gotas que salpican cuando el agua se agita
           (rotación / slosh fuerte): las crestas rápidas
           lanzan gotitas por inercia */
        let vMax = 0, iMax = -1;
        for (let i = 1; i < N - 1; i += 2) {
            const av = Math.abs(v[i]);
            if (av > vMax) { vMax = av; iMax = i; }
        }
        if (vMax > 150 && particulas.length < 80) {
            const i = clamp(iMax + ((Math.random() * 7) | 0) - 3, 1, N - 2);
            if (Math.abs(v[i]) > 110) {
                particulas.push({
                    x: i * dx + aleatorio(-2, 2),
                    y: nivelY - h[i] - 2,
                    vx: clamp(v[i] * 0.5, -190, 190),
                    vy: -aleatorio(70, 210),
                    r: aleatorio(0.7, 1.5),
                    vida: 0, dur: aleatorio(0.45, 0.85)
                });
            }
        }

        /* flashes */
        for (let i = flashes.length - 1; i >= 0; i--) {
            if (relojSim - flashes[i].t0 >= flashes[i].dur) flashes.splice(i, 1);
        }

        /* el sensor dejó de reportar: apagar tilt vivo */
        if (tiltVivoActivo && relojSim - ultimoTiltVivo > 2) tiltVivoActivo = false;
    }

    /* ---------- Dibujo ---------- */
    function ambiente(x, t) {
        /* oleaje ambiente: una respiración larga, casi imperceptible */
        return Math.sin(x * 0.0042 + t * 0.32) * 2.6
             + Math.sin(x * 0.013 - t * 0.21) * 0.8;
    }

    function dibujar(t) {
        ctx.clearRect(0, 0, vw, vh);
        if (!h || !seccRect) return;

        const fondoY = nivelY + nivelActual;

        /* campo suavizado para render (nada de parpadeo) */
        for (let i = 1; i < N - 1; i++) {
            suave[i] = 0.5 * h[i] + 0.25 * (h[i - 1] + h[i + 1]);
        }
        suave[0] = suave[1];
        suave[N - 1] = suave[N - 2];

        /* ruta de la superficie */
        const ruta = new Path2D();
        for (let i = 0; i < N; i++) {
            const x = i * dx;
            const y = nivelY - suave[i] + ambiente(x, t);
            if (i === 0) ruta.moveTo(x, y); else ruta.lineTo(x, y);
        }

        /* masa de agua translúcida */
        const masa = new Path2D(ruta);
        masa.lineTo(vw, fondoY);
        masa.lineTo(0, fondoY);
        masa.closePath();
        const gm = ctx.createLinearGradient(0, nivelY - 12, 0, fondoY);
        gm.addColorStop(0, 'rgba(255, 255, 255, ' + (ALFA_MASA + 0.07) + ')');
        gm.addColorStop(0.22, 'rgba(255, 255, 255, ' + (ALFA_MASA * 0.75) + ')');
        gm.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gm;
        ctx.fill(masa);

        /* caústicas: luz derivando dentro del agua */
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
            const cx = vw * (0.18 + i * 0.30) + Math.sin(t * 0.05 + i * 2.1) * vw * 0.06;
            const cy = nivelY + Math.min(40, nivelActual * 0.4) + Math.sin(t * 0.08 + i) * 12;
            const cr = vw * 0.10;
            const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
            cg.addColorStop(0, 'rgba(255, 255, 255, ' + ALFA_CAUSTICAS + ')');
            cg.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = cg;
            ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
        }
        ctx.restore();

        /* línea de superficie */
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + ALFA_LINEA + ')';
        ctx.lineWidth = 1.25;
        ctx.stroke(ruta);

        /* brillos suaves y uniformes (sin parpadeo) */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 4;
        ctx.stroke(ruta);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 9;
        ctx.stroke(ruta);

        /* línea-espejo: grosor/masa del agua vista de perfil */
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
            const y = nivelY - suave[i] + 7;
            if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * dx, y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();

        /* destellos en los máximos locales (estables, del campo suave) */
        let nGlints = 0;
        for (let i = 2; i < N - 2 && nGlints < 10; i++) {
            if (suave[i] > 8 && suave[i] >= suave[i - 1] && suave[i] >= suave[i + 1]) {
                const a = 0.10 + Math.min(0.22, suave[i] / 50);
                ctx.beginPath();
                ctx.arc(i * dx, nivelY - suave[i], 0.8 + Math.min(1, suave[i] / 40), 0, 6.283);
                ctx.fillStyle = 'rgba(255, 255, 255, ' + a.toFixed(3) + ')';
                ctx.fill();
                nGlints++;
            }
        }

        /* flash del impacto */
        for (const f of flashes) {
            const p = (relojSim - f.t0) / f.dur;
            const a = 0.18 * (1 - p) * (1 - p);
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (1 + p * 1.6));
            g.addColorStop(0, 'rgba(255, 255, 255, ' + a.toFixed(3) + ')');
            g.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r * (1 + p * 1.6), 0, 6.283);
            ctx.fill();
        }

        /* reflejo de la gota mientras cae */
        for (const d of gotas) {
            const cerca = clamp((d.y - (nivelY - 280)) / 280, 0, 1);
            if (cerca <= 0) continue;
            const rg = ctx.createLinearGradient(0, nivelY, 0, nivelY + 70);
            rg.addColorStop(0, 'rgba(255, 255, 255, ' + (0.16 * cerca).toFixed(3) + ')');
            rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = rg;
            ctx.fillRect(d.x - d.r * 1.1, nivelY, d.r * 2.2, 70);
        }

        /* gotas cayendo */
        for (const d of gotas) {
            const ry = d.r * (1 + Math.min(0.9, d.vy / 620));
            const rx = d.r * 0.8;

            const estela = ctx.createLinearGradient(0, d.y - ry * 2.6, 0, d.y);
            estela.addColorStop(0, 'rgba(255, 255, 255, 0)');
            estela.addColorStop(1, 'rgba(255, 255, 255, 0.10)');
            ctx.fillStyle = estela;
            ctx.fillRect(d.x - d.r * 0.24, d.y - ry * 2.6, d.r * 0.48, ry * 2.2);

            const grad = ctx.createRadialGradient(
                d.x - rx * 0.3, d.y - ry * 0.35, rx * 0.15,
                d.x, d.y, ry * 1.05
            );
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
            grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.17)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, rx, ry, 0, 0, 6.283);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(d.x - rx * 0.3, d.y - ry * 0.3, rx * 0.26, ry * 0.14, -0.4, 0, 6.283);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
            ctx.fill();
        }

        /* gotita del pico */
        for (const d of gotasRebote) {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, 6.283);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.32, 0, 6.283);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fill();
        }

        /* partículas de salpicadura */
        for (const s of particulas) {
            const k = 1 - s.vida / s.dur;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, 6.283);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.26 * k).toFixed(3) + ')';
            ctx.fill();
        }
    }

    /* ---------- Medición ---------- */
    function medir() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        vw = window.innerWidth;
        vh = window.innerHeight;
        canvas.width = Math.round(vw * dpr);
        canvas.height = Math.round(vh * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const nuevoN = clamp(Math.round(vw / 9.5), 120, 260);
        if (nuevoN !== N) {
            N = nuevoN;
            construirArrays();
        }
        dx = vw / N;
    }

    /* ---------- Bucle principal ---------- */
    const mqGotas = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
    let gotasActivas = mqGotas.matches;
    function alCambiarGotas(e) { gotasActivas = e.matches; }
    if (mqGotas.addEventListener) mqGotas.addEventListener('change', alCambiarGotas);
    else if (mqGotas.addListener) mqGotas.addListener(alCambiarGotas);

    let rafId = 0, corriendo = false, enPantalla = false, tPrevio = 0, acumulado = 0;
    const MS_PASO = 1000 / PASOS_POR_S;

    function cuadro(ahoraMs) {
        let dt = (ahoraMs - tPrevio) / 1000;
        tPrevio = ahoraMs;
        if (dt > 0.05) dt = 0.05;
        if (dt < 0) dt = 0;

        /* física a tasa fija (igual en 60 o 144 Hz) */
        acumulado += dt * 1000;
        let pasos = 0;
        while (acumulado >= MS_PASO && pasos < 8) {
            pasoFisica(MS_PASO / 1000);
            acumulado -= MS_PASO;
            pasos++;
        }

        /* medir la sección cada cuadro (scroll, resize, rotación) */
        seccRect = seccion.getBoundingClientRect();
        nivelY = seccRect.bottom - MARGEN_IMPACTO;
        tiltMaxActual = clamp(seccRect.height * 0.16, 40, 90);

        /* conservación de volumen: al rotar/redimensionar, el
           nivel se recalcula y el agua sube o baja sola */
        if (volumen === null) {
            volumen = Math.min(NIVEL_BASE, seccRect.height * 0.22) * vw;
            nivelActual = clamp(volumen / vw, NIVEL_MIN, NIVEL_MAX_ABS);
        }
        nivelObjetivo = clamp(volumen / vw, NIVEL_MIN, Math.min(seccRect.height * 0.30, NIVEL_MAX_ABS));
        nivelActual += (nivelObjetivo - nivelActual) * Math.min(1, dt * 1.5);

        /* gotas solo en computadora */
        if (gotasActivas) {
            tSiguiente -= dt;
            if (tSiguiente <= 0) {
                lanzarGota();
                tSiguiente = aleatorio(INTERVALO[0], INTERVALO[1]);
            }
        }

        actualizar(dt);
        dibujar(relojSim);

        rafId = requestAnimationFrame(cuadro);
    }

    function iniciar() {
        if (corriendo || !enPantalla || document.hidden) return;
        corriendo = true;
        tPrevio = performance.now();
        acumulado = 0;
        rafId = requestAnimationFrame(cuadro);
    }
    function detener() {
        if (!corriendo) return;
        corriendo = false;
        cancelAnimationFrame(rafId);
    }

    /* Solo corre cuando la sección está visible */
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entradas) {
            enPantalla = entradas[0].isIntersecting;
            enPantalla ? iniciar() : detener();
        }, { threshold: 0.12 }).observe(seccion);
    } else {
        enPantalla = true;
        iniciar();
    }

    document.addEventListener('visibilitychange', function () {
        document.hidden ? detener() : iniciar();
    });

    /* arranque */
    medir();
    requestAnimationFrame(function () {
        canvas.classList.add('canvas-ondas-tinas-activa');
    });
})();
/* ===== Agua de tinas y lavabos | Final ===== */