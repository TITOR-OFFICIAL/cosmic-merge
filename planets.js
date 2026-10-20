/* Отрисовка планет «Космического Мерджа»: процедурные текстуры + кэш спрайтов. */
(function (root) {
    'use strict';
    const TAU = Math.PI * 2;

    const PLANETS = [
        { level: 0,  name: "Метеорит",   radius: 17,  score: 2,    color1: "#b3a79b", color2: "#5a4f47", paint: "meteor",   shade: false },
        { level: 1,  name: "Луна",       radius: 24,  score: 4,    color1: "#dcdcd6", color2: "#8f8f8a", paint: "moon" },
        { level: 2,  name: "Меркурий",   radius: 32,  score: 8,    color1: "#c9ab8c", color2: "#7d6652", paint: "mercury" },
        { level: 3,  name: "Марс",       radius: 40,  score: 16,   color1: "#e07a4a", color2: "#9c3a1a", paint: "mars",    atm: "255,170,130", atmA: 0.3 },
        { level: 4,  name: "Венера",     radius: 49,  score: 32,   color1: "#ffcf7a", color2: "#d9822f", paint: "venus",   atm: "255,200,120", atmA: 0.65 },
        { level: 5,  name: "Земля",      radius: 59,  score: 64,   color1: "#5aa0ff", color2: "#1f5fbf", paint: "earth",   atm: "120,185,255", atmA: 0.65 },
        { level: 6,  name: "Нептун",     radius: 70,  score: 128,  color1: "#6d95f5", color2: "#2547a8", paint: "neptune", atm: "140,185,255", atmA: 0.5 },
        { level: 7,  name: "Сатурн",     radius: 82,  score: 256,  color1: "#ecd6a2", color2: "#c49a58", paint: "saturn",  ring: true },
        { level: 8,  name: "Юпитер",     radius: 95,  score: 512,  color1: "#e9cfa6", color2: "#b8693e", paint: "jupiter" },
        { level: 9,  name: "Сириус",     radius: 109, score: 1024, color1: "#cfe0ff", color2: "#7f9ef5", paint: "sirius",    star: true, shade: false, rotates: false, ext: 1.3 },
        { level: 10, name: "Сверхновая", radius: 124, score: 2048, color1: "#ffe27a", color2: "#ff6a2f", paint: "supernova", star: true, shade: false, rotates: false, ext: 1.3 }
    ];
    PLANETS.forEach(p => {
        if (p.shade === undefined) p.shade = true;
        if (p.rotates === undefined) p.rotates = true;
        if (p.ext === undefined) p.ext = 1.0;
    });

    // ===== Процедурная отрисовка планет =====
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Неровное пятно (материк, море, облако)
    function blobPath(cx, cy, rad, rnd, irr, n) {
        irr = irr === undefined ? 0.35 : irr;
        n = n || 18;
        const ph1 = rnd() * TAU, ph2 = rnd() * TAU, ph3 = rnd() * TAU;
        const k1 = 2 + Math.floor(rnd() * 2), k2 = 4 + Math.floor(rnd() * 3);
        const pts = [];
        for (let i = 0; i < n; i++) {
            const a = i / n * TAU;
            const m = 1 + irr * (0.55 * Math.sin(k1 * a + ph1) + 0.3 * Math.sin(k2 * a + ph2) + 0.15 * Math.sin(7 * a + ph3));
            pts.push([cx + Math.cos(a) * rad * m, cy + Math.sin(a) * rad * m]);
        }
        const path = new Path2D();
        const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const m0 = mid(pts[n - 1], pts[0]);
        path.moveTo(m0[0], m0[1]);
        for (let i = 0; i < n; i++) {
            const p = pts[i], m = mid(p, pts[(i + 1) % n]);
            path.quadraticCurveTo(p[0], p[1], m[0], m[1]);
        }
        path.closePath();
        return path;
    }

    function crater(c, x, y, cr, base) {
        c.beginPath(); c.arc(x, y, cr, 0, TAU);
        c.fillStyle = base; c.fill();
        c.beginPath(); c.arc(x - cr * 0.16, y - cr * 0.16, cr * 0.82, 0, TAU);
        c.fillStyle = 'rgba(0,0,0,0.16)'; c.fill();
        c.beginPath(); c.arc(x, y, cr * 0.9, -0.1 * Math.PI, 0.6 * Math.PI);
        c.strokeStyle = 'rgba(255,255,255,0.22)';
        c.lineWidth = Math.max(0.5, cr * 0.18);
        c.stroke();
    }

    function speckle(c, r, rnd, count, light, dark, size) {
        for (let i = 0; i < count; i++) {
            c.fillStyle = rnd() < 0.5 ? light : dark;
            c.beginPath();
            c.arc((rnd() * 2 - 1) * r, (rnd() * 2 - 1) * r, r * size * (0.5 + rnd()), 0, TAU);
            c.fill();
        }
    }

    // Волнистая полоса (облака, пояса газовых гигантов)
    function wavyBand(c, r, y0, y1, color, rnd, amp, freq) {
        const ph0 = rnd() * TAU, ph1 = rnd() * TAU;
        const steps = 24;
        c.beginPath();
        for (let i = 0; i <= steps; i++) {
            const x = -r + (2 * r) * i / steps;
            const y = y0 + Math.sin(x / r * freq + ph0) * amp;
            if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        for (let i = steps; i >= 0; i--) {
            const x = -r + (2 * r) * i / steps;
            c.lineTo(x, y1 + Math.sin(x / r * freq * 1.3 + ph1) * amp);
        }
        c.closePath();
        c.fillStyle = color;
        c.fill();
    }

    const PAINT = {
        meteor(c, r, rnd) {
            const shape = blobPath(0, 0, r * 0.9, rnd, 0.16, 14);
            const g = c.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
            g.addColorStop(0, '#b8ab9f'); g.addColorStop(0.6, '#7f736a'); g.addColorStop(1, '#4b433d');
            c.fillStyle = g; c.fill(shape);
            c.save(); c.clip(shape);
            for (let i = 0; i < 5; i++) {
                const a = rnd() * TAU, d = rnd() * r * 0.55;
                crater(c, Math.cos(a) * d, Math.sin(a) * d, r * (0.1 + rnd() * 0.13), 'rgba(60,50,45,0.45)');
            }
            speckle(c, r, rnd, 40, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.14)', 0.035);
            const s = c.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.05, -r * 0.1, -r * 0.1, r * 1.15);
            s.addColorStop(0, 'rgba(255,255,255,0.15)');
            s.addColorStop(0.45, 'rgba(0,0,0,0)');
            s.addColorStop(1, 'rgba(0,0,0,0.55)');
            c.fillStyle = s; c.fillRect(-r, -r, r * 2, r * 2);
            c.restore();
            c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 0.8; c.stroke(shape);
        },
        moon(c, r, rnd) {
            const g = c.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
            g.addColorStop(0, '#e2e2dd'); g.addColorStop(1, '#a9a9a4');
            c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
            // «Моря»
            const maria = [[-0.3, -0.25, 0.34], [0.05, -0.35, 0.22], [0.2, -0.05, 0.25], [-0.15, 0.15, 0.2], [-0.45, 0.2, 0.16]];
            maria.forEach(([x, y, s]) => {
                c.fillStyle = 'rgba(110,112,116,0.55)';
                c.fill(blobPath(x * r, y * r, s * r, rnd, 0.3, 14));
            });
            for (let i = 0; i < 14; i++) {
                const a = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.95;
                crater(c, Math.cos(a) * d, Math.sin(a) * d, r * (0.04 + rnd() * 0.09), 'rgba(140,140,138,0.4)');
            }
            // Кратер с лучами
            const tx = r * 0.25, ty = r * 0.5;
            c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = Math.max(0.6, r * 0.025);
            for (let i = 0; i < 10; i++) {
                const a = rnd() * TAU, l = r * (0.3 + rnd() * 0.5);
                c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + Math.cos(a) * l, ty + Math.sin(a) * l); c.stroke();
            }
            crater(c, tx, ty, r * 0.08, 'rgba(235,235,230,0.8)');
        },
        mercury(c, r, rnd) {
            const g = c.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
            g.addColorStop(0, '#c4ab92'); g.addColorStop(1, '#8a735f');
            c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
            for (let i = 0; i < 8; i++) {
                c.fillStyle = rnd() < 0.5 ? 'rgba(255,240,220,0.12)' : 'rgba(70,50,35,0.15)';
                c.fill(blobPath((rnd() * 2 - 1) * r * 0.7, (rnd() * 2 - 1) * r * 0.7, r * (0.2 + rnd() * 0.25), rnd, 0.35, 14));
            }
            for (let i = 0; i < 24; i++) {
                const a = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.98;
                crater(c, Math.cos(a) * d, Math.sin(a) * d, r * (0.035 + rnd() * 0.12), 'rgba(95,75,58,0.35)');
            }
        },
        mars(c, r, rnd) {
            const g = c.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
            g.addColorStop(0, '#d9733f'); g.addColorStop(1, '#a8431f');
            c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
            for (let i = 0; i < 6; i++) {
                c.fillStyle = 'rgba(240,160,105,0.3)';
                c.fill(blobPath((rnd() * 2 - 1) * r * 0.8, (rnd() * 2 - 1) * r * 0.7, r * (0.15 + rnd() * 0.25), rnd, 0.4, 14));
            }
            for (let i = 0; i < 6; i++) {
                c.fillStyle = 'rgba(95,35,18,0.42)';
                c.fill(blobPath((rnd() * 2 - 1) * r * 0.75, -r * 0.15 + rnd() * r * 0.45, r * (0.1 + rnd() * 0.2), rnd, 0.5, 14));
            }
            // Долины Маринер
            c.strokeStyle = 'rgba(90,30,15,0.5)'; c.lineWidth = r * 0.05; c.lineCap = 'round';
            c.beginPath(); c.moveTo(-r * 0.45, r * 0.02); c.quadraticCurveTo(-r * 0.05, -r * 0.08, r * 0.35, r * 0.06); c.stroke();
            for (let i = 0; i < 6; i++) {
                const a = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.9;
                crater(c, Math.cos(a) * d, Math.sin(a) * d, r * (0.03 + rnd() * 0.05), 'rgba(120,45,20,0.3)');
            }
            // Полярные шапки
            c.fillStyle = 'rgba(255,250,245,0.92)';
            c.beginPath(); c.ellipse(-r * 0.05, -r * 0.93, r * 0.42, r * 0.17, 0, 0, TAU); c.fill();
            c.fillStyle = 'rgba(255,250,245,0.7)';
            c.beginPath(); c.ellipse(r * 0.08, r * 0.96, r * 0.28, r * 0.1, 0, 0, TAU); c.fill();
        },
        venus(c, r, rnd) {
            // Сплошной облачный покров: тёплый янтарный тон, мягкие пятна и завихрения, без полос
            const g = c.createRadialGradient(-r * 0.25, -r * 0.25, 0, 0, 0, r);
            g.addColorStop(0, '#fff0c4'); g.addColorStop(0.45, '#f6c26e'); g.addColorStop(1, '#cf7d34');
            c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
            for (let i = 0; i < 16; i++) {
                const x = (rnd() * 2 - 1) * r * 0.85, y = (rnd() * 2 - 1) * r * 0.85, rr = r * (0.2 + rnd() * 0.35);
                const sg = c.createRadialGradient(x, y, 0, x, y, rr);
                sg.addColorStop(0, rnd() < 0.55 ? 'rgba(255,246,220,0.38)' : 'rgba(170,85,30,0.24)');
                sg.addColorStop(1, 'rgba(0,0,0,0)');
                c.fillStyle = sg; c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
            }
            c.lineCap = 'round';
            for (let i = 0; i < 10; i++) {
                const cx = (rnd() * 2 - 1) * r * 0.6, cy = (rnd() * 2 - 1) * r * 0.6;
                const rad = r * (0.25 + rnd() * 0.5), a0 = rnd() * TAU, len = 0.8 + rnd() * 1.6;
                c.strokeStyle = rnd() < 0.5 ? 'rgba(255,240,205,0.26)' : 'rgba(160,80,30,0.2)';
                c.lineWidth = r * (0.04 + rnd() * 0.06);
                c.beginPath(); c.arc(cx, cy, rad, a0, a0 + len); c.stroke();
            }
            // Полярный вихрь
            c.strokeStyle = 'rgba(255,245,215,0.55)'; c.lineWidth = r * 0.045;
            c.beginPath();
            for (let t = 0; t < 4 * Math.PI; t += 0.15) {
                const rr = r * 0.02 + t * r * 0.018;
                const x = r * 0.15 + Math.cos(t) * rr, y = -r * 0.55 + Math.sin(t) * rr * 0.6;
                if (t === 0) c.moveTo(x, y); else c.lineTo(x, y);
            }
            c.stroke();
        },
        earth(c, r, rnd) {
            const g = c.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
            g.addColorStop(0, '#2f80e4'); g.addColorStop(1, '#113d8c');
            c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
            const lands = [[-0.4, -0.25, 0.36], [0.35, 0.05, 0.42], [-0.15, 0.5, 0.25], [0.55, -0.55, 0.2], [-0.65, 0.35, 0.12], [0.1, -0.6, 0.14]];
            lands.forEach(([x, y, s]) => {
                const cx = x * r, cy = y * r, rad = s * r;
                c.fillStyle = '#3d8b3a';
                c.fill(blobPath(cx, cy, rad, rnd, 0.45, 20));
                c.fillStyle = 'rgba(160,135,80,0.75)';
                c.fill(blobPath(cx + rad * 0.15, cy + rad * 0.1, rad * 0.45, rnd, 0.5, 14));
                c.fillStyle = 'rgba(35,95,40,0.7)';
                c.fill(blobPath(cx - rad * 0.3, cy - rad * 0.25, rad * 0.35, rnd, 0.5, 14));
            });
            // Полярные льды
            c.fillStyle = 'rgba(245,250,255,0.95)';
            c.beginPath(); c.ellipse(0, -r * 0.97, r * 0.6, r * 0.16, 0, 0, TAU); c.fill();
            c.beginPath(); c.ellipse(0, r * 0.98, r * 0.55, r * 0.13, 0, 0, TAU); c.fill();
            // Облака
            c.lineCap = 'round';
            for (let i = 0; i < 9; i++) {
                const y = (rnd() * 2 - 1) * r * 0.8, x0 = (rnd() * 2 - 1) * r * 0.9;
                const len = r * (0.3 + rnd() * 0.6);
                c.strokeStyle = 'rgba(255,255,255,' + (0.45 + rnd() * 0.3).toFixed(2) + ')';
                c.lineWidth = r * (0.04 + rnd() * 0.06);
                c.beginPath();
                c.moveTo(x0, y);
                c.bezierCurveTo(x0 + len * 0.3, y - r * 0.12 * (rnd() - 0.5), x0 + len * 0.7, y + r * 0.15 * (rnd() - 0.5), x0 + len, y + (rnd() - 0.5) * r * 0.1);
                c.stroke();
            }
            // Циклон
            c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = r * 0.035;
            c.beginPath();
            for (let t = 0; t < 3.5 * Math.PI; t += 0.2) {
                const rr = r * 0.02 + t * r * 0.012;
                const x = -r * 0.1 + Math.cos(t) * rr, y = r * 0.15 + Math.sin(t) * rr * 0.7;
                if (t === 0) c.moveTo(x, y); else c.lineTo(x, y);
            }
            c.stroke();
        },
        neptune(c, r, rnd) {
            const g = c.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
            g.addColorStop(0, '#5687ee'); g.addColorStop(1, '#2343a3');
            c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
            const n = 9;
            for (let i = 0; i < n; i++) {
                const y = -r + (i + 0.5) * (2 * r / n);
                const h = r * (0.04 + rnd() * 0.07);
                wavyBand(c, r, y - h, y + h, i % 2 ? 'rgba(130,175,255,0.18)' : 'rgba(20,40,120,0.18)', rnd, r * 0.03, 2);
            }
            // Большое тёмное пятно
            c.fillStyle = 'rgba(22,40,110,0.85)';
            c.beginPath(); c.ellipse(-r * 0.25, r * 0.18, r * 0.24, r * 0.13, -0.1, 0, TAU); c.fill();
            c.lineCap = 'round';
            c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = r * 0.035;
            c.beginPath(); c.moveTo(-r * 0.4, r * 0.36); c.quadraticCurveTo(-r * 0.2, r * 0.4, -r * 0.02, r * 0.33); c.stroke();
            for (let i = 0; i < 4; i++) {
                const x = (rnd() * 2 - 1) * r * 0.7, y = (rnd() * 2 - 1) * r * 0.7;
                c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = r * 0.02;
                c.beginPath(); c.moveTo(x, y); c.lineTo(x + r * (0.1 + rnd() * 0.15), y + (rnd() - 0.5) * r * 0.03); c.stroke();
            }
        },
        saturn(c, r, rnd) {
            c.save();
            c.rotate(RING_TILT);
            c.fillStyle = '#e2c890'; c.fillRect(-r * 1.5, -r * 1.5, r * 3, r * 3);
            const bands = [
                [-1.1, -0.78, 'rgba(165,130,80,0.6)'], [-0.62, -0.5, 'rgba(200,160,95,0.55)'],
                [-0.35, -0.2, 'rgba(190,148,85,0.55)'], [-0.08, 0.08, 'rgba(245,228,180,0.6)'],
                [0.18, 0.3, 'rgba(195,150,88,0.5)'], [0.45, 0.58, 'rgba(205,165,100,0.5)'],
                [0.78, 1.1, 'rgba(165,130,80,0.6)']
            ];
            bands.forEach(([a, b, col]) => wavyBand(c, r * 1.2, a * r, b * r, col, rnd, r * 0.012, 3));
            c.restore();
        },
        jupiter(c, r, rnd) {
            c.fillStyle = '#e2c9a2'; c.fillRect(-r, -r, r * 2, r * 2);
            const bands = [
                [-1.05, -0.78, '#a68a6c'], [-0.78, -0.6, '#dcc4a0'], [-0.6, -0.43, '#b27b52'],
                [-0.43, -0.22, '#efe1c6'], [-0.22, -0.05, '#bf7848'], [-0.05, 0.12, '#f3e7cf'],
                [0.12, 0.32, '#b86a3f'], [0.32, 0.5, '#ecdcbf'], [0.5, 0.68, '#b98c64'], [0.68, 1.05, '#a28669']
            ];
            bands.forEach(([a, b, col]) => wavyBand(c, r, a * r, b * r, col, rnd, r * 0.018, 4 + rnd() * 3));
            // Завихрения на границах поясов
            c.lineCap = 'round';
            for (let i = 0; i < 26; i++) {
                const y = (rnd() * 2 - 1) * r * 0.85, x = (rnd() * 2 - 1) * r;
                c.strokeStyle = rnd() < 0.5 ? 'rgba(255,245,225,0.35)' : 'rgba(120,60,30,0.25)';
                c.lineWidth = r * (0.01 + rnd() * 0.02);
                c.beginPath(); c.moveTo(x, y);
                c.quadraticCurveTo(x + r * 0.08, y - r * 0.04, x + r * (0.12 + rnd() * 0.15), y + (rnd() - 0.5) * r * 0.03);
                c.stroke();
            }
            // Большое красное пятно
            c.fillStyle = 'rgba(245,225,200,0.9)';
            c.beginPath(); c.ellipse(r * 0.3, r * 0.4, r * 0.3, r * 0.17, 0, 0, TAU); c.fill();
            const gs = c.createRadialGradient(r * 0.3, r * 0.4, 0, r * 0.3, r * 0.4, r * 0.25);
            gs.addColorStop(0, '#d9673f'); gs.addColorStop(1, '#a8412a');
            c.fillStyle = gs;
            c.beginPath(); c.ellipse(r * 0.3, r * 0.4, r * 0.24, r * 0.13, 0, 0, TAU); c.fill();
            // Белые овалы
            c.fillStyle = 'rgba(255,250,240,0.85)';
            for (let i = 0; i < 3; i++) {
                c.beginPath(); c.ellipse(-r * 0.5 + i * r * 0.28, r * 0.6, r * 0.06, r * 0.035, 0, 0, TAU); c.fill();
            }
        },
        sirius(c, r, rnd) {
            const glow = c.createRadialGradient(0, 0, r * 0.85, 0, 0, r * 1.3);
            glow.addColorStop(0, 'rgba(150,190,255,0.55)'); glow.addColorStop(1, 'rgba(150,190,255,0)');
            c.fillStyle = glow; c.beginPath(); c.arc(0, 0, r * 1.3, 0, TAU); c.fill();
            const g = c.createRadialGradient(-r * 0.15, -r * 0.15, 0, 0, 0, r);
            g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#e6efff'); g.addColorStop(0.85, '#a3c0ff'); g.addColorStop(1, '#7397f0');
            c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
            c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
            speckle(c, r, rnd, 120, 'rgba(255,255,255,0.10)', 'rgba(215,230,255,0.10)', 0.03);
            c.restore();
        },
        supernova(c, r, rnd) {
            const glow = c.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.3);
            glow.addColorStop(0, 'rgba(255,170,70,0.6)'); glow.addColorStop(1, 'rgba(255,120,50,0)');
            c.fillStyle = glow; c.beginPath(); c.arc(0, 0, r * 1.3, 0, TAU); c.fill();
            // Выбросы вещества
            c.lineCap = 'round';
            const cols = ['rgba(255,123,57,0.5)', 'rgba(255,210,94,0.5)', 'rgba(255,79,106,0.45)'];
            for (let i = 0; i < 70; i++) {
                const a = rnd() * TAU, r0 = r * 0.75, r1 = r * (1.0 + rnd() * 0.25);
                c.strokeStyle = cols[i % 3]; c.lineWidth = r * (0.015 + rnd() * 0.03);
                c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
                c.quadraticCurveTo(Math.cos(a + 0.08) * (r0 + r1) / 2, Math.sin(a + 0.08) * (r0 + r1) / 2, Math.cos(a) * r1, Math.sin(a) * r1);
                c.stroke();
            }
            const g = c.createRadialGradient(-r * 0.1, -r * 0.1, 0, 0, 0, r);
            g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#fff4b0'); g.addColorStop(0.6, '#ffc14d');
            g.addColorStop(0.88, '#ff7a2f'); g.addColorStop(1, '#e8452c');
            c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
            c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
            // Мягкая «кипящая» поверхность
            for (let i = 0; i < 16; i++) {
                const x = (rnd() * 2 - 1) * r * 0.8, y = (rnd() * 2 - 1) * r * 0.8, rr = r * (0.12 + rnd() * 0.22);
                const sg = c.createRadialGradient(x, y, 0, x, y, rr);
                sg.addColorStop(0, rnd() < 0.5 ? 'rgba(255,255,235,0.28)' : 'rgba(210,70,25,0.22)');
                sg.addColorStop(1, 'rgba(0,0,0,0)');
                c.fillStyle = sg;
                c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
            }
            c.restore();
        }
    };

    // Кольца Сатурна
    const RING_TILT = -0.32;
    const RING_SQUASH = 0.3;
    const RING_OUTER = 1.6;
    const RING_BANDS = [
        [1.18, 1.27, 'rgba(160,140,110,0.35)'],
        [1.28, 1.44, 'rgba(232,214,170,0.85)'],
        [1.48, 1.58, 'rgba(205,185,140,0.75)']
    ];
    function drawRing(c, r, angle, front) {
        c.save();
        c.rotate(angle + RING_TILT);
        c.scale(1, RING_SQUASH);
        for (let i = 0; i < RING_BANDS.length; i++) {
            const [a, b, col] = RING_BANDS[i];
            c.beginPath();
            c.arc(0, 0, (a + b) / 2 * r, front ? 0 : Math.PI, front ? Math.PI : TAU);
            c.lineWidth = (b - a) * r;
            c.strokeStyle = col;
            c.stroke();
        }
        c.restore();
    }

    // Освещение (не вращается вместе с планетой) + атмосфера
    function paintShade(c, p, r) {
        if (p.atm) {
            const a = c.createRadialGradient(0, 0, r * 0.82, 0, 0, r * 1.09);
            a.addColorStop(0, `rgba(${p.atm},0)`);
            a.addColorStop(0.72, `rgba(${p.atm},${p.atmA})`);
            a.addColorStop(0.84, `rgba(${p.atm},${(p.atmA * 0.5).toFixed(2)})`);
            a.addColorStop(1, `rgba(${p.atm},0)`);
            c.fillStyle = a;
            c.beginPath(); c.arc(0, 0, r * 1.09, 0, TAU); c.fill();
        }
        c.save();
        c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
        const g = c.createRadialGradient(-r * 0.42, -r * 0.45, r * 0.02, -r * 0.12, -r * 0.14, r * 1.22);
        g.addColorStop(0, 'rgba(255,255,255,0.22)');
        g.addColorStop(0.3, 'rgba(255,255,255,0)');
        g.addColorStop(0.62, 'rgba(0,0,0,0.1)');
        g.addColorStop(0.85, 'rgba(0,0,0,0.4)');
        g.addColorStop(1, 'rgba(0,0,0,0.62)');
        c.fillStyle = g;
        c.fillRect(-r, -r, r * 2, r * 2);
        c.restore();
    }

    function paintSurface(c, p, r) {
        const rnd = mulberry32(1337 + p.level * 7919);
        if (p.paint === 'meteor' || p.star) {
            PAINT[p.paint](c, r, rnd);
            return;
        }
        c.save();
        c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
        PAINT[p.paint](c, r, rnd);
        c.restore();
    }

    // Кэш спрайтов: тяжёлая отрисовка делается один раз, а в кадре только drawImage
    let RS = 1; // пикселей холста на единицу игрового поля
    const spriteCache = new Map();
    function makeLayer(r, ext, paintFn) {
        const half = r * ext + 2;
        const px = Math.max(4, Math.ceil(half * 2 * RS));
        const cv = document.createElement('canvas');
        cv.width = px; cv.height = px;
        const c = cv.getContext('2d');
        const k = px / (half * 2);
        c.setTransform(k, 0, 0, k, px / 2, px / 2);
        paintFn(c);
        return { cv, half };
    }
    function getSprites(level) {
        let s = spriteCache.get(level);
        if (s) return s;
        const p = PLANETS[level];
        s = {
            surf: makeLayer(p.radius, p.ext, c => paintSurface(c, p, p.radius)),
            shade: p.shade ? makeLayer(p.radius, 1.1, c => paintShade(c, p, p.radius)) : null
        };
        spriteCache.set(level, s);
        return s;
    }
    function blit(c, layer, scale) {
        const h = layer.half * scale;
        c.drawImage(layer.cv, -h, -h, h * 2, h * 2);
    }

    function drawPlanet(context, x, y, level, angle, scale) {
        const p = PLANETS[level] || PLANETS[0];
        const s = getSprites(p.level);
        const r = p.radius * scale;
        context.save();
        context.translate(x, y);
        if (p.star) {
            // Пульсирующее свечение звёзд
            const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.004 + p.level);
            const g = context.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.4);
            g.addColorStop(0, p.level === 10 ? `rgba(255,190,90,${(0.25 + pulse * 0.25).toFixed(3)})` : `rgba(170,205,255,${(0.2 + pulse * 0.2).toFixed(3)})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = g;
            context.beginPath(); context.arc(0, 0, r * 1.4, 0, TAU); context.fill();
        }
        if (p.ring) drawRing(context, r, angle, false);
        if (p.rotates && angle) {
            context.save();
            context.rotate(angle);
            blit(context, s.surf, scale);
            context.restore();
        } else {
            blit(context, s.surf, scale);
        }
        if (s.shade) blit(context, s.shade, scale);
        if (p.ring) drawRing(context, r, angle, true);
        context.restore();
    }

    // Мини-превью (следующая планета и шкала эволюции)
    function visualExtent(p) {
        if (p.ring) return RING_OUTER;
        return Math.max(p.ext, p.shade ? 1.09 : 1);
    }
    function paintMini(cv, level, cssSize) {
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const px = Math.max(8, Math.round(cssSize * dpr));
        if (cv.width !== px || cv.height !== px) { cv.width = px; cv.height = px; }
        cv.style.width = cssSize + 'px';
        cv.style.height = cssSize + 'px';
        const c = cv.getContext('2d');
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, px, px);
        c.imageSmoothingQuality = 'high';
        const p = PLANETS[level];
        const scale = (px / 2) / (p.radius * visualExtent(p));
        drawPlanet(c, px / 2, px / 2, level, 0, scale);
    }

    root.Planets = {
        PLANETS,
        drawPlanet,
        paintMini,
        visualExtent,
        // Вызывать при изменении масштаба canvas: спрайты перерисуются в нужном разрешении
        setScale(rs) {
            if (Math.abs(rs - RS) > 0.01) {
                RS = rs;
                spriteCache.clear();
                return true;
            }
            return false;
        }
    };
})(window);
