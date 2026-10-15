/* Goteo simulado | Inicio */
(function () {
    'use strict';

    /* Respeta la preferencia de menos movimiento */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const encabezado = document.querySelector('.seccion-encabezado');
    const tarjetasEls = document.querySelectorAll('.tarjeta-griferia');
    if (!encabezado || !tarjetasEls.length) return;

    /* Utilidades */
    const aleatorio = (a, b) => a + Math.random() * (b - a);
    const elegir = arr => arr[(Math.random() * arr.length) | 0];

    /* =====================================================
       NUEVO: ciclo de vida de las zonas secadas.
       Cada zona que una gota deja despejada permanece así
       SECADO_PERSISTENCIA segundos y luego vuelve a empañarse
       con una transición de SECADO_TRANSICION segundos.
       Así los primeros rastros se cierran solos mientras
       llegan gotas nuevas y el vidrio no se satura.
    ===================================================== */
    const SECADO_PERSISTENCIA = 14;  /* s despejada (se aleatoriza ±30%) */
    const SECADO_TRANSICION = 4;     /* s de transición al re-empañarse */
    const SECADO_MAX_ZONAS = 160;    /* tope de seguridad por tarjeta */
    const VAHO_INTERVALO_REDIBUJO = 0.1; /* s entre redibujos del vaho (10 fps) */

    /* =====================================================
       1. LIENZO GLOBAL: goteo del borde, caída y salpicaduras.
          Independiente del canvas de ondas.
    ===================================================== */
    const lienzoGoteo = document.createElement('canvas');
    lienzoGoteo.className = 'canvas-goteo-encabezado';
    document.body.appendChild(lienzoGoteo);
    const ctxGoteo = lienzoGoteo.getContext('2d');

    let dpr = 1, anchoVp = 0, altoVp = 0;

    function redimensionarLienzo() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        anchoVp = window.innerWidth;
        altoVp = window.innerHeight;
        lienzoGoteo.width = Math.round(anchoVp * dpr);
        lienzoGoteo.height = Math.round(altoVp * dpr);
        ctxGoteo.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    redimensionarLienzo();
    window.addEventListener('resize', redimensionarLienzo);
    requestAnimationFrame(() => lienzoGoteo.classList.add('canvas-goteo-activa'));

    /* =====================================================
       2. LIENZOS DE VIDRIO MOJADO dentro de cada tarjeta
    ===================================================== */
    const tarjetas = Array.from(tarjetasEls).map(el => {
        const c = document.createElement('canvas');
        c.className = 'canvas-vidrio-tarjeta';
        el.appendChild(c);
        return {
            el, canvas: c, ctx: c.getContext('2d'),
            w: 0, h: 0, rect: null,
            gotas: [], manchas: [],
            tCondensacion: aleatorio(2, 6),
            fogCanvas: null, fogCtx: null, fogTextura: null,
            desfase: aleatorio(0, Math.PI * 2),
            /* NUEVO: estado del sistema de zonas secadas */
            secados: [], vahoSucio: false, vahoEnTransicion: false, tVaho: 0
        };
    });

    function medirTarjeta(t) {
        const r = t.el.getBoundingClientRect();
        t.w = r.width;
        t.h = r.height;
        t.canvas.width = Math.max(1, Math.round(t.w * dpr));
        t.canvas.height = Math.max(1, Math.round(t.h * dpr));
        t.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        construirVaho(t);
        /* NUEVO: al redimensionar se reinicia el ciclo de zonas */
        t.secados = [];
        t.vahoSucio = false;
        t.vahoEnTransicion = false;
        t.tVaho = 0;
    }

    /* =====================================================
       2b. VAHO DE CRISTAL
           El vidrio arranca empañado uniforme (con micro-gotas
           estáticas que dan textura). Las zonas despejadas nacen
           únicamente donde escurren las gotas, y cada una tiene
           su propio ciclo: despejada → transición → empañada.
    ===================================================== */
    function construirVaho(t) {
        if (t.w < 2 || t.h < 2) return;

        /* Textura del vaho completo (se genera una vez) */
        const tex = document.createElement('canvas');
        tex.width = Math.max(1, Math.round(t.w * dpr));
        tex.height = Math.max(1, Math.round(t.h * dpr));
        const tx = tex.getContext('2d');
        tx.setTransform(dpr, 0, 0, dpr, 0, 0);

        /* Base: algo más denso arriba y abajo, más aire al centro */
        const base = tx.createLinearGradient(0, 0, 0, t.h);
        base.addColorStop(0, 'rgba(212, 227, 239, 0.30)');
        base.addColorStop(0.5, 'rgba(206, 223, 236, 0.18)');
        base.addColorStop(1, 'rgba(202, 220, 234, 0.26)');
        tx.fillStyle = base;
        tx.fillRect(0, 0, t.w, t.h);

        /* Nubes suaves para que no se vea uniforme */
        const nNubes = Math.max(4, Math.round((t.w * t.h) / 40000));
        for (let i = 0; i < nNubes; i++) {
            const nx = aleatorio(0, t.w);
            const ny = aleatorio(0, t.h);
            const nr = aleatorio(t.w * 0.22, t.w * 0.55);
            const g = tx.createRadialGradient(nx, ny, 0, nx, ny, nr);
            g.addColorStop(0, 'rgba(226, 238, 247, 0.10)');
            g.addColorStop(1, 'rgba(226, 238, 247, 0)');
            tx.fillStyle = g;
            tx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
        }

        /* Micro-gotas de condensación estáticas (textura real) */
        const nMicro = Math.round((t.w * t.h) / 5500);
        for (let i = 0; i < nMicro; i++) {
            const mx = aleatorio(0, t.w);
            const my = aleatorio(0, t.h);
            const mr = aleatorio(0.6, 2.2);
            const g = tx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 0, mx, my, mr);
            g.addColorStop(0, 'rgba(235, 244, 250, 0.10)');
            g.addColorStop(1, 'rgba(190, 210, 228, 0.02)');
            tx.fillStyle = g;
            tx.beginPath();
            tx.arc(mx, my, mr, 0, Math.PI * 2);
            tx.fill();
        }

        t.fogTextura = tex;

        /* Capa de trabajo: copia de la textura (aquí secarán las gotas) */
        if (!t.fogCanvas) {
            t.fogCanvas = document.createElement('canvas');
            t.fogCtx = t.fogCanvas.getContext('2d');
        }
        t.fogCanvas.width = tex.width;
        t.fogCanvas.height = tex.height;
        t.fogCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        t.fogCtx.clearRect(0, 0, t.w, t.h);
        t.fogCtx.drawImage(tex, 0, 0, t.w, t.h);
    }

    /* =====================================================
       NUEVO: sistema de zonas secadas con ciclo de vida.
       En lugar de borrar el vaho directamente, cada pasada de
       gota registra una "zona" con su hora. El vaho se
       reconstruye desde la textura menos las zonas vivas; las
       que cumplen su tiempo se dibujan con alfa decreciente
       (transición) hasta desaparecer de la lista.
    ===================================================== */
    function secarZona(t, x, y, r, ahora) {
        if (!t.fogCtx) return;
        t.secados.push({
            x, y, r,
            t0: ahora,
            persist: aleatorio(SECADO_PERSISTENCIA * 0.7, SECADO_PERSISTENCIA * 1.3)
        });
        /* tope de seguridad: si se llena, la más vieja se cierra */
        if (t.secados.length > SECADO_MAX_ZONAS) t.secados.shift();
        t.vahoSucio = true;
    }

    function redibujarVaho(t, ahora) {
        if (!t.fogCtx || !t.fogTextura) return;
        const c = t.fogCtx;

        /* reconstrucción completa: textura + zonas vivas */
        c.clearRect(0, 0, t.w, t.h);
        c.drawImage(t.fogTextura, 0, 0, t.w, t.h);

        c.save();
        c.globalCompositeOperation = 'destination-out';

        let enTransicion = false;

        for (let i = t.secados.length - 1; i >= 0; i--) {
            const z = t.secados[i];
            const edad = ahora - z.t0;

            let k; /* 1 = totalmente seca, 0 = ya empañada */
            if (edad < z.persist) {
                k = 1;
            } else if (edad < z.persist + SECADO_TRANSICION) {
                /* transición suave de regreso a opaco */
                k = 1 - (edad - z.persist) / SECADO_TRANSICION;
                k = k * k * (3 - 2 * k); /* suavizado tipo smoothstep */
                enTransicion = true;
            } else {
                /* cumplió su ciclo: se elimina (el vaho queda intacto) */
                t.secados.splice(i, 1);
                continue;
            }

            const g = c.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r);
            g.addColorStop(0, 'rgba(0, 0, 0, ' + (0.6 * k).toFixed(3) + ')');
            g.addColorStop(0.7, 'rgba(0, 0, 0, ' + (0.25 * k).toFixed(3) + ')');
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            c.fillStyle = g;
            c.beginPath();
            c.arc(z.x, z.y, z.r, 0, Math.PI * 2);
            c.fill();
        }
        c.restore();

        t.vahoSucio = false;
        t.vahoEnTransicion = enTransicion;
    }

    tarjetas.forEach(medirTarjeta);
    if ('ResizeObserver' in window) {
        const observador = new ResizeObserver(() => tarjetas.forEach(medirTarjeta));
        tarjetas.forEach(t => observador.observe(t.el));
    } else {
        window.addEventListener('resize', () => tarjetas.forEach(medirTarjeta));
    }

    /* =====================================================
       3. BORDE INFERIOR DEL ENCABEZADO
          Micro-gotas nacen, se juntan con las mayores, se
          fusionan (el volumen se conserva), la gota crece, se
          estira colgando poco a poco y cede.
    ===================================================== */
    const gotasBorde = [];
    let bordeY = 0, bordeIzq = 0, bordeAncho = 0, bordeVisible = false;
    let tMicro = aleatorio(0.5, 1.2);

    function nuevaGotita(fx, r) {
        return {
            fx, r,
            vel: aleatorio(8, 22),        /* deslizamiento px/s hacia la gota mayor */
            crece: aleatorio(0.05, 0.14), /* condensación px/s */
            rMax: aleatorio(6, 10),       /* tamaño crítico donde cede */
            fase: 'fluye',
            t: 0,
            dur: aleatorio(1.0, 2.2)      /* tiempo colgando antes de caer */
        };
    }

    /* Posición horizontal alineada con las tarjetas de abajo */
    function fxSobreTarjetas() {
        const tramos = [];
        for (const t of tarjetas) {
            const rc = t.rect;
            if (!rc || !rc.width) continue;
            const a = (rc.left - bordeIzq) / bordeAncho;
            const b = (rc.right - bordeIzq) / bordeAncho;
            if (b <= 0.02 || a >= 0.98) continue;
            tramos.push([Math.max(0.02, a), Math.min(0.98, b)]);
        }
        if (tramos.length && Math.random() < 0.85) {
            const [a, b] = elegir(tramos);
            return aleatorio(a, b);
        }
        return Math.random();
    }

    function crearMicroGotas(dt) {
        if (!bordeVisible) return;
        tMicro -= dt;
        if (tMicro > 0 || gotasBorde.length >= 18) return;
        tMicro = aleatorio(0.8, 1.8);

        let fx;
        if (gotasBorde.length && Math.random() < 0.8) {
            /* nace cerca de otra: el agua se va juntando */
            fx = elegir(gotasBorde).fx + aleatorio(-0.05, 0.05);
        } else {
            fx = fxSobreTarjetas();
        }
        fx = Math.min(0.995, Math.max(0.005, fx));
        gotasBorde.push(nuevaGotita(fx, aleatorio(0.8, 2.0)));
    }

    function moverGotasBorde(dt) {
        if (!bordeVisible) return;
        const w = Math.max(300, bordeAncho);

        /* deslizamiento hacia la gota mayor más cercana + condensación */
        for (const g of gotasBorde) {
            if (g.fase !== 'fluye') continue;
            let objetivo = null, dMin = Infinity;
            for (const o of gotasBorde) {
                if (o === g || o.r <= g.r * 1.05) continue;
                const d = Math.abs(o.fx - g.fx);
                if (d < dMin) { dMin = d; objetivo = o; }
            }
            if (objetivo && dMin < 0.16) {
                g.fx += Math.sign(objetivo.fx - g.fx || 1) * g.vel * dt / w;
            }
            g.r += g.crece * dt;
            if (g.r >= g.rMax) { g.fase = 'cuelga'; g.t = 0; }
        }

        /* fusiones conservando el volumen (realismo) */
        for (let i = 0; i < gotasBorde.length; i++) {
            const a = gotasBorde[i];
            if (a.muerta) continue;
            for (let j = i + 1; j < gotasBorde.length; j++) {
                const b = gotasBorde[j];
                if (b.muerta || a.muerta) continue;
                if (Math.abs(a.fx - b.fx) * w < (a.r + b.r) * 0.6) {
                    const va = a.r ** 3, vb = b.r ** 3;
                    const mayor = va >= vb ? a : b;
                    const menor = mayor === a ? b : a;
                    mayor.fx = (a.fx * va + b.fx * vb) / (va + vb);
                    mayor.r = Math.cbrt(va + vb);
                    if (mayor.fase === 'fluye' && mayor.r >= mayor.rMax) {
                        mayor.fase = 'cuelga';
                        mayor.t = 0;
                    }
                    menor.muerta = true;
                }
            }
        }
        for (let i = gotasBorde.length - 1; i >= 0; i--) {
            if (gotasBorde[i].muerta) gotasBorde.splice(i, 1);
        }

        /* cuelga, se estira poco a poco y cede */
        for (const g of gotasBorde) {
            if (g.fase !== 'cuelga') continue;
            g.t += dt;
            if (g.t >= g.dur) {
                if (gotasCayendo.length < 14) {
                    soltarGota(bordeIzq + g.fx * bordeAncho, bordeY + g.r * 0.55, g.r * 1.0);
                }
                /* queda un núcleo pequeño y el ciclo vuelve a empezar */
                g.r = aleatorio(2, 4);
                g.fase = 'fluye';
                g.t = 0;
                g.dur = aleatorio(1.0, 2.2);
                g.rMax = aleatorio(6, 10);
            }
        }
    }

    function dibujarBorde() {
        if (!bordeVisible || !gotasBorde.length) return;

        /* línea de humedad casi imperceptible */
        ctxGoteo.beginPath();
        ctxGoteo.moveTo(bordeIzq + bordeAncho * 0.03, bordeY + 0.5);
        ctxGoteo.lineTo(bordeIzq + bordeAncho * 0.97, bordeY + 0.5);
        ctxGoteo.strokeStyle = 'rgba(185, 208, 226, 0.03)';
        ctxGoteo.lineWidth = 1.4;
        ctxGoteo.stroke();

        for (const g of gotasBorde) {
            const x = bordeIzq + g.fx * bordeAncho;
            const r = g.r;

            if (g.fase === 'fluye') {
                /* gotita adherida bajo el borde */
                const grad = ctxGoteo.createRadialGradient(
                    x - r * 0.3, bordeY - r * 0.2, r * 0.1,
                    x, bordeY + r * 0.2, r * 1.2
                );
                grad.addColorStop(0, 'rgba(215, 232, 245, 0.09)');
                grad.addColorStop(0.6, 'rgba(165, 192, 214, 0.055)');
                grad.addColorStop(1, 'rgba(140, 165, 190, 0.01)');
                ctxGoteo.beginPath();
                ctxGoteo.arc(x, bordeY + r * 0.12, r, 0, Math.PI);
                ctxGoteo.closePath();
                ctxGoteo.fillStyle = grad;
                ctxGoteo.fill();
                /* brillo */
                ctxGoteo.beginPath();
                ctxGoteo.ellipse(x - r * 0.32, bordeY + r * 0.32, r * 0.26, r * 0.13, -0.4, 0, Math.PI * 2);
                ctxGoteo.fillStyle = 'rgba(255, 255, 255, 0.10)';
                ctxGoteo.fill();
            } else {
                /* gota estirándose: el cuello se afina hasta ceder */
                const k = Math.min(1, g.t / g.dur);
                const cuello = r * (0.8 - 0.5 * k);
                const L = r * (1.2 + 1.15 * k);
                const rb = r * (0.7 + 0.4 * k);

                const grad = ctxGoteo.createLinearGradient(0, bordeY, 0, bordeY + L);
                grad.addColorStop(0, 'rgba(200, 220, 238, 0.08)');
                grad.addColorStop(0.55, 'rgba(175, 200, 222, 0.065)');
                grad.addColorStop(1, 'rgba(150, 178, 205, 0.025)');
                ctxGoteo.beginPath();
                ctxGoteo.moveTo(x - cuello, bordeY);
                ctxGoteo.bezierCurveTo(x - cuello * 0.7, bordeY + L * 0.5, x - rb, bordeY + L - rb * 1.05, x, bordeY + L);
                ctxGoteo.bezierCurveTo(x + rb, bordeY + L - rb * 1.05, x + cuello * 0.7, bordeY + L * 0.5, x + cuello, bordeY);
                ctxGoteo.closePath();
                ctxGoteo.fillStyle = grad;
                ctxGoteo.fill();
                /* brillo */
                ctxGoteo.beginPath();
                ctxGoteo.ellipse(x - rb * 0.35, bordeY + L - rb * 0.55, rb * 0.28, rb * 0.15, -0.5, 0, Math.PI * 2);
                ctxGoteo.fillStyle = 'rgba(255, 255, 255, 0.11)';
                ctxGoteo.fill();
            }
        }
    }

    /* =====================================================
       4. CAÍDA Y SALPICADURAS
    ===================================================== */
    const gotasCayendo = [];
    const gotasSalpicadura = [];

    function soltarGota(x, y, r) {
        gotasCayendo.push({ x, py: y, y, vy: 30, r });
    }

    function actualizarCaida(dt) {
        const G = 1150, VMAX = 470;
        for (let i = gotasCayendo.length - 1; i >= 0; i--) {
            const d = gotasCayendo[i];
            d.py = d.y;
            d.vy = Math.min(VMAX, d.vy + G * dt);
            d.y += d.vy * dt;

            /* ¿cruzó el borde superior de alguna tarjeta? */
            let destino = null;
            for (const t of tarjetas) {
                const rc = t.rect;
                if (!rc || !rc.width) continue;
                if (d.x > rc.left + 3 && d.x < rc.right - 3 &&
                    d.py + d.r <= rc.top + 2 && d.y + d.r >= rc.top) {
                    destino = t;
                    break;
                }
            }

            if (destino) {
                impactarVidrio(destino, d.x - destino.rect.left, d.r);
                salpicar(d.x, destino.rect.top);
                gotasCayendo.splice(i, 1);
                continue;
            }
            if (d.y - d.r > altoVp + 40) gotasCayendo.splice(i, 1);
        }
    }

    function dibujarCaida() {
        for (const d of gotasCayendo) {
            const rx = d.r * 0.82;
            const ry = d.r * (1 + Math.min(0.85, d.vy / 620)); /* se alarga al caer */

            /* estela leve */
            const estela = ctxGoteo.createLinearGradient(0, d.y - ry * 2.6, 0, d.y);
            estela.addColorStop(0, 'rgba(195, 218, 236, 0)');
            estela.addColorStop(1, 'rgba(195, 218, 236, 0.055)');
            ctxGoteo.fillStyle = estela;
            ctxGoteo.fillRect(d.x - d.r * 0.26, d.y - ry * 2.6, d.r * 0.52, ry * 2.2);

            /* cuerpo */
            const grad = ctxGoteo.createRadialGradient(
                d.x - rx * 0.3, d.y - ry * 0.35, rx * 0.15,
                d.x, d.y, ry * 1.05
            );
            grad.addColorStop(0, 'rgba(232, 243, 250, 0.17)');
            grad.addColorStop(0.55, 'rgba(175, 202, 226, 0.09)');
            grad.addColorStop(1, 'rgba(145, 172, 200, 0.02)');
            ctxGoteo.beginPath();
            ctxGoteo.ellipse(d.x, d.y, rx, ry, 0, 0, Math.PI * 2);
            ctxGoteo.fillStyle = grad;
            ctxGoteo.fill();

            /* brillo */
            ctxGoteo.beginPath();
            ctxGoteo.ellipse(d.x - rx * 0.3, d.y - ry * 0.3, rx * 0.28, ry * 0.15, -0.4, 0, Math.PI * 2);
            ctxGoteo.fillStyle = 'rgba(255, 255, 255, 0.16)';
            ctxGoteo.fill();
        }
    }

    function salpicar(x, y) {
        if (gotasSalpicadura.length > 40) return;
        const n = 4 + ((Math.random() * 3) | 0);
        for (let i = 0; i < n; i++) {
            gotasSalpicadura.push({
                x: x + aleatorio(-2, 2), y,
                vx: aleatorio(-65, 65),
                vy: aleatorio(-150, -50),
                r: aleatorio(1.2, 2.5),
                vida: 0, dur: aleatorio(0.3, 0.55)
            });
        }
    }

    function actualizarSalpicadura(dt) {
        for (let i = gotasSalpicadura.length - 1; i >= 0; i--) {
            const s = gotasSalpicadura[i];
            s.vida += dt;
            if (s.vida >= s.dur) { gotasSalpicadura.splice(i, 1); continue; }
            s.vy += 900 * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
        }
    }

    function dibujarSalpicadura() {
        for (const s of gotasSalpicadura) {
            const k = 1 - s.vida / s.dur;
            ctxGoteo.beginPath();
            ctxGoteo.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctxGoteo.fillStyle = 'rgba(200, 222, 238, ' + (0.12 * k).toFixed(3) + ')';
            ctxGoteo.fill();
        }
    }

    /* =====================================================
       5. VIDRIO MOJADO EN LAS TARJETAS
          Escurrimiento lento, a rachas, con rastro tenue.
          ACTUALIZADO: cada pasada registra zonas secadas con
          ciclo de vida — persisten un rato y luego se
          re-empañan con transición, escalonadamente.
    ===================================================== */
    function nuevaGotaVidrio(x, y, r) {
        return {
            x, y, r,
            vy: aleatorio(5, 30),
            deriva: aleatorio(-3.5, 3.5),
            fase: aleatorio(0, Math.PI * 2),
            freq: aleatorio(0.15, 0.45),
            rastro: [], ux: x, uy: y,
            usx: x, usy: y /* NUEVO: última posición de sellado de zona */
        };
    }

    function impactarVidrio(t, x, r, ahora) {
        t.manchas.push({ x, y: 10, r: r * 2.4, vida: 0, dur: 1.8 });
        /* el impacto seca el vaho alrededor (zona con ciclo) */
        secarZona(t, x, 10, r * 3.0, ahora);
        if (t.gotas.length < 12) {
            t.gotas.push(nuevaGotaVidrio(x + aleatorio(-2, 2), aleatorio(6, 14), aleatorio(3.5, 5.5)));
            /* a veces se parte en una gotita secundaria */
            if (Math.random() < 0.45 && t.gotas.length < 12) {
                t.gotas.push(nuevaGotaVidrio(x + aleatorio(-10, 10), aleatorio(4, 10), aleatorio(2, 3.5)));
            }
        }
    }

    function actualizarVidrio(t, dt, ahora) {
        /* condensación ambiental muy espaciada (efecto sutil) */
        t.tCondensacion -= dt;
        if (t.tCondensacion <= 0) {
            t.tCondensacion = aleatorio(2.5, 6.5);
            if (t.gotas.length < 10) {
                t.gotas.push(nuevaGotaVidrio(
                    aleatorio(t.w * 0.06, t.w * 0.94),
                    aleatorio(4, t.h * 0.35),
                    aleatorio(2, 3.5)
                ));
            }
        }

        for (let i = t.gotas.length - 1; i >= 0; i--) {
            const g = t.gotas[i];
            /* avance a rachas: acelera, frena y vuelve a avanzar (vidrio real) */
            const pulso = 0.12 + 0.88 * Math.pow(Math.max(0, Math.sin(ahora * g.freq * 6.283 + g.fase)), 2);
            g.y += g.vy * pulso * dt;
            g.x += Math.sin(ahora * 0.5 + g.fase) * g.deriva * dt;

            /* NUEVO: sellar zonas secadas a lo largo del recorrido
               (cada tramo con su propia hora → se empañan escalonados) */
            const dsx = g.x - g.usx, dsy = g.y - g.usy;
            if (dsx * dsx + dsy * dsy > (g.r * 1.1) * (g.r * 1.1)) {
                secarZona(t, g.x, g.y, g.r * 1.6, ahora);
                g.usx = g.x;
                g.usy = g.y;
            }

            /* registrar rastro */
            const dx = g.x - g.ux, dy = g.y - g.uy;
            if (dx * dx + dy * dy > 1.6) {
                g.rastro.push({ x: g.x, y: g.y, t: ahora });
                if (g.rastro.length > 70) g.rastro.shift();
                g.ux = g.x;
                g.uy = g.y;
            }
            if (g.y - 25 > t.h) t.gotas.splice(i, 1);
        }

        for (let i = t.manchas.length - 1; i >= 0; i--) {
            t.manchas[i].vida += dt;
            if (t.manchas[i].vida >= t.manchas[i].dur) t.manchas.splice(i, 1);
        }
    }

    function dibujarVidrio(t, ahora) {
        const c = t.ctx;
        c.clearRect(0, 0, t.w, t.h);

        /* capa de vaho (textura menos las zonas secadas vivas) */
        if (t.fogCanvas) {
            c.drawImage(t.fogCanvas, 0, 0, t.w, t.h);
        }

        /* brillo de cristal — franja diagonal de luz muy tenue */
        const brillo = c.createLinearGradient(0, 0, t.w, t.h);
        brillo.addColorStop(0.30, 'rgba(255, 255, 255, 0)');
        brillo.addColorStop(0.44, 'rgba(255, 255, 255, 0.045)');
        brillo.addColorStop(0.47, 'rgba(255, 255, 255, 0.07)');
        brillo.addColorStop(0.50, 'rgba(255, 255, 255, 0.045)');
        brillo.addColorStop(0.64, 'rgba(255, 255, 255, 0)');
        c.fillStyle = brillo;
        c.fillRect(0, 0, t.w, t.h);

        /* nube de vapor que deriva muy lento (vaho "vivo") */
        const vx = t.w * (0.5 + 0.32 * Math.sin(ahora * 0.05 + t.desfase));
        const vy = t.h * (0.42 + 0.26 * Math.cos(ahora * 0.04 + t.desfase));
        const vr = Math.max(t.w, t.h) * 0.62;
        const vapor = c.createRadialGradient(vx, vy, 0, vx, vy, vr);
        vapor.addColorStop(0, 'rgba(222, 235, 245, 0.035)');
        vapor.addColorStop(1, 'rgba(222, 235, 245, 0)');
        c.fillStyle = vapor;
        c.fillRect(0, 0, t.w, t.h);

        if (!t.gotas.length && !t.manchas.length) return;

        /* manchas de impacto que se difuminan */
        for (const m of t.manchas) {
            const k = 1 - m.vida / m.dur;
            c.beginPath();
            c.ellipse(m.x, m.y, m.r * (1 + m.vida * 0.7), m.r * 0.45 * (1 + m.vida * 0.5), 0, 0, Math.PI * 2);
            c.fillStyle = 'rgba(175, 205, 225, ' + (0.045 * k).toFixed(3) + ')';
            c.fill();
        }

        c.lineCap = 'round';

        for (const g of t.gotas) {
            /* los rastros húmedos se desvanecen en ~9 s;
               la zona seca persiste según su ciclo y luego se cierra */
            while (g.rastro.length && ahora - g.rastro[0].t > 9) g.rastro.shift();

            /* rastro de escurrimiento */
            const n = g.rastro.length;
            for (let i = 1; i < n; i++) {
                const p0 = g.rastro[i - 1], p1 = g.rastro[i];
                const vida = Math.max(0, 1 - (ahora - p1.t) / 9);
                if (vida <= 0) continue;
                const cerca = i / n; /* 1 = junto a la gota */
                c.beginPath();
                c.moveTo(p0.x, p0.y);
                c.lineTo(p1.x, p1.y);
                c.lineWidth = g.r * (0.55 + 0.85 * cerca);
                c.strokeStyle = 'rgba(205, 226, 240, ' + ((0.02 + 0.045 * cerca) * vida).toFixed(3) + ')';
                c.stroke();
            }

            /* cuerpo de la gota */
            const r = g.r;
            const grad = c.createRadialGradient(
                g.x - r * 0.35, g.y - r * 0.4, r * 0.12,
                g.x, g.y, r * 1.15
            );
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
            grad.addColorStop(0.55, 'rgba(195, 218, 235, 0.055)');
            grad.addColorStop(1, 'rgba(150, 180, 205, 0.01)');
            c.beginPath();
            c.arc(g.x, g.y, r, 0, Math.PI * 2);
            c.fillStyle = grad;
            c.fill();

            /* borde inferior apenas más denso */
            c.beginPath();
            c.arc(g.x, g.y, r * 0.92, Math.PI * 0.2, Math.PI * 0.8);
            c.strokeStyle = 'rgba(215, 235, 250, 0.06)';
            c.lineWidth = 1;
            c.stroke();

            /* brillo */
            c.beginPath();
            c.ellipse(g.x - r * 0.3, g.y - r * 0.35, r * 0.3, r * 0.15, -0.4, 0, Math.PI * 2);
            c.fillStyle = 'rgba(255, 255, 255, 0.08)';
            c.fill();
        }
    }

    /* =====================================================
       6. BUCLE PRINCIPAL (propio e independiente del de ondas)
    ===================================================== */
    let tPrevio = performance.now();

    function cuadro(ahora) {
        const dt = Math.min(0.05, (ahora - tPrevio) / 1000);
        tPrevio = ahora;

        /* posiciones al día (scroll y resize) */
        const r = encabezado.getBoundingClientRect();
        bordeY = r.bottom;
        bordeIzq = r.left;
        bordeAncho = r.width;
        bordeVisible = bordeAncho > 0 && bordeY > -40 && bordeY < altoVp + 40;
        for (const t of tarjetas) t.rect = t.el.getBoundingClientRect();

        crearMicroGotas(dt);
        moverGotasBorde(dt);
        actualizarCaida(dt);
        actualizarSalpicadura(dt);

        const seg = ahora / 1000;
        for (const t of tarjetas) {
            if (!t.rect || !t.rect.width) continue;
            actualizarVidrio(t, dt, seg);

            /* NUEVO: redibujar el vaho solo cuando hace falta
               (zona nueva sellada o alguna en transición), a 10 fps */
            t.tVaho -= dt;
            if ((t.vahoSucio || t.vahoEnTransicion) && t.tVaho <= 0) {
                t.tVaho = VAHO_INTERVALO_REDIBUJO;
                redibujarVaho(t, seg);
            }

            dibujarVidrio(t, seg);
        }

        ctxGoteo.clearRect(0, 0, anchoVp, altoVp);
        dibujarBorde();
        dibujarCaida();
        dibujarSalpicadura();

        requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);
})();
/* Goteo simulado | Final */