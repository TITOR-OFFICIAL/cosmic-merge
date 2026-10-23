/*
 * Физика «Космического Мерджа». Чистый модуль без DOM — его же использует симуляция баланса.
 *
 * Объекты поля:
 *   balls  — планеты. Флаги: frozen (лёд, не сливается), magnet (притягивает планеты своего вида),
 *            kind:'bomb' (нестабильная звезда, взрывается через fuse бросков)
 *   pegs   — неподвижные астероиды [x, y, r]
 *   walls  — стены-отрезки [x1, y1, x2, y2]
 *   holes  — чёрные дыры [x, y]
 */
(function (root) {
    'use strict';

    const W = 380;
    const H = 520;
    const DANGER_Y = 92;
    const DROP_Y = 50;
    const RADII = [17, 24, 32, 40, 49, 59, 70, 82, 95, 109, 124];
    const SCORES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
    const MAX_LEVEL = RADII.length - 1;
    const DROP_COOLDOWN = 28;
    const DANGER_FRAMES = 95;
    const SHAKE_MIN_FRAMES = 150;
    const SHAKE_MAX_FRAMES = 420;

    const WALL_THICK = 5;          // половина толщины стены
    const HOLE_HORIZON = 16;       // радиус горизонта чёрной дыры
    const HOLE_PULL_R = 95;        // радиус притяжения
    const HOLE_MAX_ABSORB = 2;     // поглощает только мелочь: метеориты, луны, меркурии
    const MAGNET_R = 150;
    const BOMB_R = 20;
    const BOMB_BLAST_R = 250;      // радиус сильного радиального толчка (слабее — дальше, но достаёт почти всё поле)
    const BOMB_THAW_R = 70;        // взрыв размораживает только лёд рядом
    const SPEED_MAX = 30;          // предел скорости за один шаг: страховка от пролёта сквозь стены/астероиды
    const QUAKE_SHAKE_FRAMES = 70; // длительность «землетрясения» после встряски
    const QUAKE_BOMB_FRAMES = 55;  // и после взрыва звезды
    const TAU = Math.PI * 2;
    const COMBO_FRAMES = 75;       // 1.25 сек между слияниями для продолжения комбо
    const COMBO_MAX = 5;

    function makeWorld() {
        // quake* — «землетрясение»: пока quake > 0, поле хаотично швыряет планеты (см. applyQuake).
        // rnd — генератор для хаоса (по умолчанию Math.random; симуляция подставляет детерминированный)
        return { balls: [], pegs: [], walls: [], holes: [], dangerTimer: 0, shakeTime: -1, quake: 0, quakeAmp: 0, quakeLen: 1, gustT: 0, gx: 0, gy: 0, rnd: null };
    }

    function makeBall(level, x, y, vx, vy, age) {
        return { x, y, vx, vy, level, radius: RADII[level], angle: 0, age, merged: false, frozen: false, magnet: false, kind: null };
    }
    function makeBomb(x, y, fuse) {
        return { x, y, vx: 0, vy: 0, level: -1, radius: BOMB_R, angle: 0, age: 0, merged: false, frozen: false, magnet: false, kind: 'bomb', fuse };
    }

    function clampDropX(level, x) {
        const r = RADII[level];
        return Math.max(r + 4, Math.min(W - r - 4, x));
    }

    function dropBall(world, level, x, rnd, magnet) {
        const b = makeBall(level, clampDropX(level, x), DROP_Y, (rnd() - 0.5) * 0.4, 1.5, 0);
        if (magnet) b.magnet = true;
        world.balls.push(b);
        return b;
    }

    // Подготовка уровня: препятствия + заранее расставленные лёд/звёзды, затем «прогрев», чтобы всё улеглось
    function setupLevel(world, feat, rnd) {
        if (!feat) return;
        world.pegs = (feat.pegs || []).map(p => p.slice());
        world.walls = (feat.walls || []).map(w => w.slice());
        world.holes = (feat.holes || []).map(h => h.slice());
        (feat.ice || []).forEach(([lvl, x], i) => {
            const b = makeBall(lvl, clampDropX(lvl, x), H - RADII[lvl] - 2 - (i % 2) * 6, 0, 0, 100);
            b.frozen = true;
            world.balls.push(b);
        });
        (feat.bombs || []).forEach(([x, fuse]) => world.balls.push(makeBomb(x, H - 120, fuse)));
        for (let i = 0; i < 180; i++) step(world, null);
        world.balls.forEach(b => { b.age = 100; b.vx = 0; b.vy = 0; });
        world.dangerTimer = 0;
    }

    function collideStatic(a, cx, cy, cr, bounce) {
        const dx = a.x - cx, dy = a.y - cy;
        const min = a.radius + cr;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min) return;
        const d = Math.sqrt(d2) || 0.01;
        const nx = dx / d, ny = dy / d;
        a.x = cx + nx * min;
        a.y = cy + ny * min;
        const vn = a.vx * nx + a.vy * ny;
        if (vn < 0) {
            a.vx -= (1 + bounce) * vn * nx;
            a.vy -= (1 + bounce) * vn * ny;
        }
    }
    function collideWall(a, w, bounce) {
        const [x1, y1, x2, y2] = w;
        const ex = x2 - x1, ey = y2 - y1;
        const len2 = ex * ex + ey * ey || 1;
        let t = ((a.x - x1) * ex + (a.y - y1) * ey) / len2;
        t = Math.max(0, Math.min(1, t));
        collideStatic(a, x1 + ex * t, y1 + ey * t, WALL_THICK, bounce);
    }

    function canMerge(a, b) {
        return a.level === b.level && a.level >= 0 && a.level < MAX_LEVEL && !a.frozen && !b.frozen;
    }

    /*
     * Один шаг физики (1/60 сек).
     * ev (может быть null): { merge(level, x, y), thaw(ball), absorb(ball) }
     */
    function step(world, ev) {
        const gravity = 0.38;
        const friction = 0.992;
        const wallBounce = 0.35;
        let balls = world.balls;

        // Силы: чёрные дыры и магниты
        for (const h of world.holes) {
            for (const b of balls) {
                const dx = h[0] - b.x, dy = h[1] - b.y;
                const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
                if (d < HOLE_PULL_R + b.radius) {
                    const f = 0.22 * Math.max(0.1, 1 - d / (HOLE_PULL_R + b.radius));
                    b.vx += dx / d * f;
                    b.vy += dy / d * f;
                }
            }
        }
        for (const m of balls) {
            if (!m.magnet) continue;
            for (const b of balls) {
                if (b === m || b.level !== m.level || b.frozen) continue;
                const dx = m.x - b.x, dy = m.y - b.y;
                const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
                if (d < MAGNET_R + b.radius) {
                    const f = 0.3 * (1 - d / (MAGNET_R + b.radius + 1));
                    b.vx += dx / d * f;
                    b.vy += dy / d * f;
                }
            }
        }

        if (world.quake > 0) applyQuake(world);

        let removed = false;   // были ли слияния/поглощения — тогда нужно убрать merged-шары из массива
        for (let i = 0; i < balls.length; i++) {
            const b = balls[i];
            b.px = b.x;
            b.vy += gravity;
            b.vx *= friction;
            b.vy *= friction;
            const sp2 = b.vx * b.vx + b.vy * b.vy;
            if (sp2 > SPEED_MAX * SPEED_MAX) {
                const k = SPEED_MAX / Math.sqrt(sp2);
                b.vx *= k;
                b.vy *= k;
            }
            // Медленные планеты дополнительно гасим — так они быстрее успокаиваются и не «плывут»
            if (b.vx * b.vx + b.vy * b.vy < 0.5) b.vx *= 0.9;
            b.x += b.vx;
            b.y += b.vy;
            b.age++;
        }

        // Поглощение чёрной дырой
        if (world.holes.length) {
            for (const b of balls) {
                if (b.merged || b.frozen) continue;
                if (b.kind !== 'bomb' && b.level > HOLE_MAX_ABSORB) continue;
                for (const h of world.holes) {
                    const dx = b.x - h[0], dy = b.y - h[1];
                    if (dx * dx + dy * dy < Math.pow(HOLE_HORIZON + b.radius * 0.45, 2)) {
                        b.merged = true;
                        removed = true;
                        if (ev && ev.absorb) ev.absorb(b);
                        break;
                    }
                }
            }
            if (removed) { compact(balls); removed = false; }
        }

        for (let iter = 0; iter < 6; iter++) {
            for (let i = 0; i < balls.length; i++) {
                const a = balls[i];
                if (a.merged) continue;

                if (a.x - a.radius < 0) {
                    a.x = a.radius;
                    a.vx = -a.vx * wallBounce;
                } else if (a.x + a.radius > W) {
                    a.x = W - a.radius;
                    a.vx = -a.vx * wallBounce;
                }
                if (a.y + a.radius > H) {
                    a.y = H - a.radius;
                    a.vy = a.vy > 1.2 ? -a.vy * wallBounce : 0;
                    a.vx *= 0.92;
                } else if (a.y - a.radius < 0) {
                    a.y = a.radius;
                    if (a.vy < 0) a.vy = -a.vy * wallBounce;
                }
                for (const p of world.pegs) collideStatic(a, p[0], p[1], p[2], 0.45);
                for (const w of world.walls) collideWall(a, w, 0.3);
                // Большие планеты и лёд не поглощаются — упираются в горизонт
                if (a.frozen || (a.kind !== 'bomb' && a.level > HOLE_MAX_ABSORB)) {
                    for (const h of world.holes) collideStatic(a, h[0], h[1], HOLE_HORIZON, 0.2);
                }

                for (let j = i + 1; j < balls.length; j++) {
                    const b = balls[j];
                    if (b.merged) continue;
                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const distSq = dx * dx + dy * dy;
                    const minDist = a.radius + b.radius;
                    if (distSq >= minDist * minDist) continue;

                    const dist = Math.sqrt(distSq) || 0.01;
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    if (canMerge(a, b)) {
                        a.merged = true;
                        b.merged = true;
                        const lvl = a.level + 1;
                        const r = RADII[lvl];
                        const mx = (a.x + b.x) * 0.5;
                        const my = (a.y + b.y) * 0.5;
                        const nb = makeBall(lvl, Math.max(r, Math.min(W - r, mx)), Math.min(H - r, my), (a.vx + b.vx) * 0.4, -1.8, 30);
                        nb.angle = (a.angle + b.angle) * 0.5;
                        balls.push(nb);
                        removed = true;
                        // Слияние рядом размораживает лёд
                        for (const c of balls) {
                            if (!c.frozen || c.merged) continue;
                            const ddx = c.x - mx, ddy = c.y - my;
                            const rr = c.radius + r + 10;
                            if (ddx * ddx + ddy * ddy < rr * rr) {
                                c.frozen = false;
                                if (ev && ev.thaw) ev.thaw(c);
                            }
                        }
                        if (ev && ev.merge) ev.merge(lvl, mx, my);
                        break;
                    }

                    const totalR = a.radius + b.radius;
                    const ratioA = b.radius / totalR;
                    const ratioB = a.radius / totalR;
                    a.x -= nx * overlap * ratioA;
                    a.y -= ny * overlap * ratioA;
                    b.x += nx * overlap * ratioB;
                    b.y += ny * overlap * ratioB;

                    const rvx = b.vx - a.vx;
                    const rvy = b.vy - a.vy;
                    const van = rvx * nx + rvy * ny;
                    if (van < 0) {
                        // Отскок только при заметном ударе; в покое — «мягкий» контакт без дрожания
                        const restitution = van < -1.2 ? 0.22 : 0;
                        const impulse = -(1 + restitution) * van * 0.5;
                        a.vx -= impulse * nx * ratioA;
                        a.vy -= impulse * ny * ratioA;
                        b.vx += impulse * nx * ratioB;
                        b.vy += impulse * ny * ratioB;
                        // Трение в точке касания гасит боковое скольжение
                        const tx = -ny, ty = nx;
                        const vt = (rvx * tx + rvy * ty) * 0.06;
                        a.vx += vt * tx * ratioA;
                        a.vy += vt * ty * ratioA;
                        b.vx -= vt * tx * ratioB;
                        b.vy -= vt * ty * ratioB;
                    }
                }
            }
            if (removed) { compact(balls); removed = false; }
        }
        // Вращение как у катящегося шара: по фактическому смещению, мелкие подрагивания не крутят планету
        for (const b of balls) {
            if (b.px === undefined) continue;
            const dx = b.x - b.px;
            if (Math.abs(dx) > 0.35) b.angle += dx / b.radius;
        }
        world.balls = balls;
    }

    // Убрать слитые шары из массива «на месте» (порядок сохраняется, новых массивов не создаём)
    function compact(arr) {
        let j = 0;
        for (let i = 0; i < arr.length; i++) {
            const b = arr[i];
            if (!b.merged) arr[j++] = b;
        }
        arr.length = j;
    }

    // «Землетрясение»: каждый кадр поле резко меняет направление тряски (порывы по 2–6 кадров),
    // плюс отдельные планеты получают случайные пинки. К концу затухает.
    function applyQuake(world) {
        const rnd = world.rnd || Math.random;
        const left = world.quake--;
        const amp = world.quakeAmp * (0.3 + 0.7 * Math.min(1, left / (world.quakeLen * 0.5)));
        if (--world.gustT <= 0) {
            world.gustT = 2 + Math.floor(rnd() * 5);
            const a = rnd() * TAU;
            const m = (0.6 + rnd() * 0.9) * amp;
            world.gx = Math.cos(a) * m * 1.7;
            world.gy = Math.sin(a) * m * 1.2 - 0.45 * amp;   // небольшой перекос вверх: поле «подбрасывает»
        }
        const balls = world.balls;
        for (let i = 0; i < balls.length; i++) {
            const b = balls[i];
            const k = 0.5 + rnd() * 1.0;
            b.vx += world.gx * k;
            b.vy += world.gy * k;
            if (rnd() < 0.07) {
                const a = rnd() * TAU, m = (3 + rnd() * 8) * amp;
                b.vx += Math.cos(a) * m;
                b.vy += Math.sin(a) * m - 0.4 * m;
            }
        }
    }

    // Вызывается после каждого броска игрока: тикают звёзды-бомбы. ev.explode(x, y)
    function afterDrop(world, ev) {
        const bombs = world.balls.filter(b => b.kind === 'bomb');
        for (const bomb of bombs) {
            bomb.fuse--;
            if (bomb.fuse <= 0) explode(world, bomb, ev);
        }
    }
    function explode(world, bomb, ev) {
        const rnd = world.rnd || Math.random;
        world.balls = world.balls.filter(b => b !== bomb);
        for (const b of world.balls) {
            const dx = b.x - bomb.x, dy = b.y - bomb.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
            // Радиальный толчок: у центра ~30, на краю поля всё ещё ~10 — и каждому шару с разбросом
            const k = Math.max(0, 1 - d / (BOMB_BLAST_R + b.radius));
            const f = (10 + 22 * k) * (0.7 + rnd() * 0.6);
            b.vx += dx / d * f;
            b.vy += dy / d * f - 4 - 6 * k;
            // Хаос поверх радиальной волны: случайный пинок в любую сторону
            const a = rnd() * TAU, m = (4 + rnd() * 10) * (0.5 + 0.5 * k);
            b.vx += Math.cos(a) * m;
            b.vy += Math.sin(a) * m;
            if (b.frozen && d < BOMB_THAW_R + b.radius) {
                b.frozen = false;
                if (ev && ev.thaw) ev.thaw(b);
            }
        }
        startQuake(world, 0.95, QUAKE_BOMB_FRAMES);
        world.shakeTime = 0;   // разлёт после взрыва не считается поражением
        world.dangerTimer = 0;
        if (ev && ev.explode) ev.explode(bomb.x, bomb.y);
    }

    function startQuake(world, amp, frames) {
        world.quake = frames;
        world.quakeLen = frames;
        world.quakeAmp = amp;
        world.gustT = 0;
    }

    // Встряска: сильный разнонаправленный бросок каждой планеты + «землетрясение» поля
    function shake(world, rnd) {
        world.rnd = rnd || world.rnd;
        const r = rnd || Math.random;
        world.balls.forEach(b => {
            // Направление — в основном вверх, но с большим разбросом (вплоть до боковых и чуть вниз)
            const a = -Math.PI / 2 + (r() * 2 - 1) * Math.PI * 0.85;
            const s = 14 + r() * 18;
            b.vx = Math.cos(a) * s;
            b.vy = Math.sin(a) * s;
        });
        startQuake(world, 1.0, QUAKE_SHAKE_FRAMES);
        world.shakeTime = 0;
        world.dangerTimer = 0;
    }

    function updateDanger(world) {
        if (world.shakeTime >= 0) {
            world.shakeTime++;
            if (world.shakeTime > SHAKE_MIN_FRAMES) {
                let moving = false;
                for (const b of world.balls) {
                    if (b.vx * b.vx + b.vy * b.vy > 2.25) { moving = true; break; }
                }
                if (!moving || world.shakeTime > SHAKE_MAX_FRAMES) world.shakeTime = -1;
            }
            if (world.shakeTime >= 0) {
                world.dangerTimer = 0;
                return false;
            }
        }
        let over = false;
        for (const b of world.balls) {
            if (b.age > 55 && b.y - b.radius < DANGER_Y) { over = true; break; }
        }
        if (over) world.dangerTimer++;
        else world.dangerTimer = Math.max(0, world.dangerTimer - 2);
        return world.dangerTimer > DANGER_FRAMES;
    }

    function clearTop(world) {
        world.balls = world.balls.filter(b => b.y > H * 0.52);
        world.dangerTimer = 0;
        world.shakeTime = -1;
        world.quake = 0;
    }

    // Комбо: слияния подряд с интервалом < COMBO_FRAMES умножают очки (до ×5)
    function makeCombo() { return { timer: 0, count: 0 }; }
    function comboTick(c) { if (c.timer > 0 && --c.timer === 0) c.count = 0; }
    function comboHit(c) {
        c.count = c.timer > 0 ? c.count + 1 : 1;
        c.timer = COMBO_FRAMES;
        return Math.min(c.count, COMBO_MAX);
    }

    const Physics = {
        W, H, DANGER_Y, DROP_Y, RADII, SCORES, MAX_LEVEL, DROP_COOLDOWN,
        WALL_THICK, HOLE_HORIZON, HOLE_PULL_R, HOLE_MAX_ABSORB, MAGNET_R, BOMB_R, BOMB_BLAST_R, BOMB_THAW_R,
        makeWorld, makeBall, clampDropX, dropBall, setupLevel, step, afterDrop, shake, updateDanger, clearTop,
        makeCombo, comboTick, comboHit
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = Physics;
    else root.Physics = Physics;
})(typeof window !== 'undefined' ? window : globalThis);
