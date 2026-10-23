/* «Космический Мердж» — игра на каркасе GameCore. */
(function () {
    'use strict';

    const P = window.Physics;
    const PL = window.Planets;
    const { LEVELS, DAILY_POOL } = window.Levels;
    const { W, H, DANGER_Y, DROP_Y } = P;
    const $ = Core.$;
    const TAU = Math.PI * 2;

    // ======================================================================
    // Тексты
    // ======================================================================
    const I18N = {
        ru: {
            game_title: 'Космический Мердж', title_a: 'Космический', title_b: 'Мердж',
            levels: 'Уровни', daily: 'Задание дня', endless: 'Бесконечный режим',
            stars_total: '★ {n} из {m}', best_n: 'Рекорд: {n}',
            daily_done: 'Выполнено ✓ · серия {n}', daily_new: 'Новое задание!', daily_new_streak: 'Новое задание · серия {n}',
            level_n: 'Уровень {n}', goal: 'Цель', drops: 'Бросков', score: 'Счёт', best: 'Рекорд', next: 'След.',
            goal_reach: 'Собери: {p}', goal_count: 'Собери {n} × {p}', goal_score: 'Набери {s} очков',
            goal_progress_count: '{p}: {c} из {n}', goal_progress_score: 'Очки: {c} из {s}',
            intro_hint: 'Лимит бросков: {d}. ★★★ — до {a}, ★★ — до {b}.',
            tutorial: 'Соединяй две одинаковые планеты — получится планета побольше. Не дай планетам задержаться над пунктирной линией!',
            endless_hint: 'Без ограничений по броскам. Сколько очков наберёшь?',
            play: 'Играть', next_level: 'Дальше', retry: 'Ещё раз', to_menu: 'В меню', to_levels: 'К уровням', new_game: 'Новая игра',
            win: 'Победа!', lose_drops: 'Броски закончились', lose_overflow: 'Космос переполнен!',
            res_used: 'Использовано бросков: {n}', new_record: 'Новый рекорд!', all_done: 'Все уровни пройдены! Скоро будут новые.',
            reward_booster: 'Награда за 3 звезды: +1 {b}', reward_daily: 'Награда: +1 лазер и +1 встряска',
            revive_drops: '+5 бросков', revive_clear: 'Очистить верх',
            laser: 'Лазер', shake: 'Встряска', super: 'Супер-шар', have_n: 'Есть: {n}', for_ad: '🎬 За видео', cancel: 'Отменить',
            laser_gen: 'лазер', shake_gen: 'встряска',
            toast_laser_pick: 'Нажмите на планету, чтобы взорвать её', toast_laser_done: 'Планета уничтожена!',
            toast_laser_cancel: 'Лазер отменён, заряд сохранён', toast_need_planet: 'Сначала сбросьте планету',
            toast_super: 'Супер-шар готов к сбросу!', toast_no_planets: 'На поле пока нет планет', toast_goal: 'Цель выполнена!',
            exit_title: 'Выйти?', exit_desc: 'Прогресс этой попытки будет потерян.', exit_yes: 'Выйти', exit_no: 'Продолжить',
            ad_unavailable: 'Реклама недоступна или не досмотрена — попробуйте позже',
            planet_0: 'Метеорит', planet_1: 'Луна', planet_2: 'Меркурий', planet_3: 'Марс', planet_4: 'Венера', planet_5: 'Земля',
            planet_6: 'Нептун', planet_7: 'Сатурн', planet_8: 'Юпитер', planet_9: 'Сириус', planet_10: 'Сверхновая',
            goal_thaw: 'Разморозь лёд: {n}', combo_text: '×{n}', hint_new: 'Новое!', hint_field: 'На поле:',
            hint_combo: 'Слияния подряд дают множитель очков — до ×5!',
            hint_pegs: 'Астероиды неподвижны: планеты отскакивают от них.',
            hint_walls: 'Стены меняют форму поля — планеты скатываются по ним.',
            hint_magnet: 'Магнитная планета (с фиолетовым кольцом) притягивает планеты своего вида.',
            hint_ice: 'Ледяная планета не сливается. Разморозь её: сделай слияние рядом с ней.',
            hint_holes: 'Чёрная дыра затягивает и поглощает мелкие планеты — до Меркурия. Крупные ей не по зубам.',
            hint_bombs: 'Нестабильная звезда взорвётся через указанное число бросков и раскидает планеты. Взрыв растапливает лёд рядом.'
        },
        en: {
            game_title: 'Cosmic Merge', title_a: 'Cosmic', title_b: 'Merge',
            levels: 'Levels', daily: 'Daily challenge', endless: 'Endless mode',
            stars_total: '★ {n} of {m}', best_n: 'Best: {n}',
            daily_done: 'Done ✓ · streak {n}', daily_new: 'New challenge!', daily_new_streak: 'New challenge · streak {n}',
            level_n: 'Level {n}', goal: 'Goal', drops: 'Drops', score: 'Score', best: 'Best', next: 'Next',
            goal_reach: 'Make: {p}', goal_count: 'Make {n} × {p}', goal_score: 'Score {s} points',
            goal_progress_count: '{p}: {c} of {n}', goal_progress_score: 'Points: {c} of {s}',
            intro_hint: 'Drop limit: {d}. ★★★ — up to {a}, ★★ — up to {b}.',
            tutorial: 'Merge two identical planets to get a bigger one. Don\'t let planets stay above the dashed line!',
            endless_hint: 'No drop limit. How many points can you score?',
            play: 'Play', next_level: 'Next', retry: 'Retry', to_menu: 'Menu', to_levels: 'Levels', new_game: 'New game',
            win: 'Victory!', lose_drops: 'Out of drops', lose_overflow: 'Space is full!',
            res_used: 'Drops used: {n}', new_record: 'New record!', all_done: 'All levels completed! More coming soon.',
            reward_booster: '3-star reward: +1 {b}', reward_daily: 'Reward: +1 laser and +1 shake',
            revive_drops: '+5 drops', revive_clear: 'Clear the top',
            laser: 'Laser', shake: 'Shake', super: 'Super ball', have_n: 'Have: {n}', for_ad: '🎬 Watch ad', cancel: 'Cancel',
            laser_gen: 'laser', shake_gen: 'shake',
            toast_laser_pick: 'Tap a planet to destroy it', toast_laser_done: 'Planet destroyed!',
            toast_laser_cancel: 'Laser cancelled, charge kept', toast_need_planet: 'Drop a planet first',
            toast_super: 'Super ball is ready!', toast_no_planets: 'No planets on the field yet', toast_goal: 'Goal complete!',
            exit_title: 'Leave?', exit_desc: 'Progress of this attempt will be lost.', exit_yes: 'Leave', exit_no: 'Continue',
            ad_unavailable: 'Ad unavailable or not finished — try later',
            planet_0: 'Meteorite', planet_1: 'Moon', planet_2: 'Mercury', planet_3: 'Mars', planet_4: 'Venus', planet_5: 'Earth',
            planet_6: 'Neptune', planet_7: 'Saturn', planet_8: 'Jupiter', planet_9: 'Sirius', planet_10: 'Supernova',
            goal_thaw: 'Thaw the ice: {n}', combo_text: '×{n}', hint_new: 'New!', hint_field: 'On the field:',
            hint_combo: 'Merges in a row multiply your points — up to ×5!',
            hint_pegs: 'Asteroids are fixed in place: planets bounce off them.',
            hint_walls: 'Walls change the shape of the field — planets roll along them.',
            hint_magnet: 'A magnetic planet (purple ring) pulls planets of its kind.',
            hint_ice: 'Frozen planets don\'t merge. Thaw one by merging right next to it.',
            hint_holes: 'A black hole pulls in and swallows small planets — up to Mercury. Bigger ones are too much for it.',
            hint_bombs: 'An unstable star explodes after the shown number of drops and scatters planets. The blast melts nearby ice.'
        }
    };
    const pname = l => Core.t('planet_' + l);

    // ======================================================================
    // Звуки игры
    // ======================================================================
    const snd = {
        drop: () => Core.sfx.tone(260, 'sine', 0.11, 0.12, 140),
        merge: l => { const b = 240 + l * 55; Core.sfx.tone(b, 'triangle', 0.18, 0.18, b * 1.45); },
        laser: () => Core.sfx.tone(720, 'sawtooth', 0.25, 0.15, 110),
        shake: () => {
            Core.sfx.tone(120, 'square', 0.28, 0.12, 220);
            Core.sfx.tone(70, 'sawtooth', 0.7, 0.14, 35, 0.02);
            // Дребезг: серия коротких ударов в случайные моменты
            for (let i = 0; i < 7; i++) Core.sfx.tone(160 + Math.random() * 280, 'square', 0.07, 0.07, null, 0.05 + i * 0.09 + Math.random() * 0.04);
        },
        boom: () => {
            Core.sfx.tone(90, 'sawtooth', 0.5, 0.18, 40);
            Core.sfx.tone(52, 'square', 0.95, 0.2, 24);
            Core.sfx.tone(300, 'sawtooth', 0.28, 0.1, 60);
            for (let i = 0; i < 6; i++) Core.sfx.tone(140 + Math.random() * 240, 'square', 0.08, 0.06, null, 0.12 + i * 0.1 + Math.random() * 0.05);
        }
    };

    // ======================================================================
    // Состояние партии
    // ======================================================================
    let mode = null;            // 'level' | 'daily' | 'endless'
    let level = null;           // описание цели (для level/daily)
    let levelIndex = -1;
    let world = P.makeWorld();
    let particles = [];
    let rnd = Math.random;      // генератор появления планет (в задании дня — одинаковый для всех)
    let currentLevel = 0, nextLevel = 0;
    let pointerX = W / 2;
    let canDrop = true, dropCooldown = 0;
    let playing = false;        // партия идёт (не показан результат)
    let started = false;        // нажата кнопка «Играть» в окне цели
    let dropsUsed = 0, dropsLimit = 0;
    let score = 0;
    let created = [];
    let maxMerged = -1;
    let thawed = 0, iceTotal = 0;
    let laserMode = false;
    let winTimer = -1;          // небольшая пауза перед окном победы
    let settleTimer = -1;       // ожидание после последнего броска
    let goalAnnounced = false;
    let combo = P.makeCombo();
    let floats = [];            // всплывающие надписи «×2» и т.п.
    let currentMagnet = false, nextMagnet = false;

    const bgStars = [];
    for (let i = 0; i < 45; i++) {
        bgStars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4, a: Math.random() * 0.6 + 0.2, s: Math.random() * 0.02 + 0.005 });
    }

    const randomStart = () => Math.floor(rnd() * 4);
    const feat = () => (level && level.f) || {};
    const rollMagnet = () => !!(feat().magnet && rnd() < feat().magnet);

    // ======================================================================
    // Canvas и мини-превью
    // ======================================================================
    const canvas = $('#canvas');
    const ctx = canvas.getContext('2d');
    // Пока экран игры не открыт, рисуем превью в разрешении экрана
    PL.setScale(Math.min(window.devicePixelRatio || 1, 2.5) * 1.5);
    const view = Core.fitCanvas(canvas, $('#wrap'), W, H, rs => { if (PL.setScale(rs)) refreshMinis(); });

    const evoCanvases = PL.PLANETS.map((p, i) => {
        const c = document.createElement('canvas');
        $('#evoBar').appendChild(c);
        return { c, size: Math.round(Math.min(24, 12 + i * 1.25)) };
    });
    const menuEvo = PL.PLANETS.map((p, i) => {
        const c = document.createElement('canvas');
        $('#menuEvo').appendChild(c);
        return { c, size: Math.round(14 + i * 1.6) };
    });

    // Превью с пометками: лёд и магнит
    function paintIcon(cv, lvl, size, opts) {
        PL.paintMini(cv, lvl, size);
        if (!opts) return;
        const c = cv.getContext('2d');
        const px = cv.width, r = px / 2 / PL.visualExtent(PL.PLANETS[lvl]);
        if (opts.ice) drawIce(c, px / 2, px / 2, r * 0.98, 0);
        if (opts.magnet) drawMagnetRing(c, px / 2, px / 2, r * 0.92, 0, px / 30);
    }
    function refreshMinis() {
        evoCanvases.forEach((e, i) => { PL.paintMini(e.c, i, e.size); e.c.title = pname(i); });
        menuEvo.forEach((e, i) => { PL.paintMini(e.c, i, e.size); e.c.title = pname(i); });
        paintIcon($('#nextCanvas'), nextLevel, 30, { magnet: nextMagnet });
        PL.paintMini($('#menuPlanet'), 7, 150);
        if (level) {
            const icon = goalIconLevel();
            const opts = level.g === 'thaw' ? { ice: true } : null;
            paintIcon($('#goalIcon'), icon, 34, opts);
            paintIcon($('#introIcon'), icon, 56, opts);
        }
    }

    // ======================================================================
    // Цели
    // ======================================================================
    function goalIconLevel() {
        if (!level) return 4;
        if (level.g === 'thaw') return level.f.ice[0][0];
        return level.g === 'score' ? 4 : level.l;
    }
    function goalText(lv) {
        if (lv.g === 'reach') return Core.t('goal_reach', { p: pname(lv.l) });
        if (lv.g === 'count') return Core.t('goal_count', { n: lv.n, p: pname(lv.l) });
        if (lv.g === 'thaw') return Core.t('goal_thaw', { n: lv.f.ice.length });
        return Core.t('goal_score', { s: lv.s });
    }
    function goalDone() {
        if (!level) return false;
        if (level.g === 'reach') return maxMerged >= level.l;
        if (level.g === 'count') return created[level.l] >= level.n;
        if (level.g === 'thaw') return thawed >= iceTotal;
        return score >= level.s;
    }
    function starsFor(used) {
        return used <= level.s3 ? 3 : used <= level.s2 ? 2 : 1;
    }

    // Первый уровень, где появляется каждая механика — там показываем подсказку
    const FEATURE_KEYS = ['pegs', 'walls', 'magnet', 'ice', 'holes', 'bombs'];
    const firstLevelWith = {};
    LEVELS.forEach((lv, i) => {
        FEATURE_KEYS.forEach(k => { if (lv.f && lv.f[k] && firstLevelWith[k] === undefined) firstLevelWith[k] = i; });
    });
    const COMBO_HINT_LEVEL = 1;

    // ======================================================================
    // HUD
    // ======================================================================
    function updateHud() {
        const gt = $('#goalText');
        if (mode === 'endless') {
            $('#goalLabel').textContent = Core.t('score');
            gt.textContent = score;
            gt.classList.remove('done');
            $('#statLabel').textContent = Core.t('best');
            $('#statValue').textContent = Core.data.best;
            $('#statValue').classList.remove('low');
        } else if (level) {
            $('#goalLabel').textContent = mode === 'daily' ? Core.t('daily') : Core.t('level_n', { n: levelIndex + 1 });
            // Коротко, чтобы помещалось на узких экранах; полная цель — в окне перед уровнем
            if (level.g === 'reach') gt.textContent = pname(level.l);
            else if (level.g === 'count') gt.textContent = Math.min(created[level.l], level.n) + ' / ' + level.n;
            else if (level.g === 'thaw') gt.textContent = '❄ ' + Math.min(thawed, iceTotal) + ' / ' + iceTotal;
            else gt.textContent = Math.min(score, level.s) + ' / ' + level.s;
            gt.classList.toggle('done', goalDone());
            const left = Math.max(0, dropsLimit - dropsUsed);
            $('#statLabel').textContent = Core.t('drops');
            $('#statValue').textContent = left;
            $('#statValue').classList.toggle('low', left <= 5);
        }
    }
    function updateBoostersUI() {
        const b = Core.data.boosters;
        $('#subLaser').textContent = laserMode ? Core.t('cancel') : (b.laser > 0 ? Core.t('have_n', { n: b.laser }) : Core.t('for_ad'));
        $('#subShake').textContent = b.shake > 0 ? Core.t('have_n', { n: b.shake }) : Core.t('for_ad');
        $('#btnLaser').classList.toggle('active-mode', laserMode);
    }

    // ======================================================================
    // Запуск партии
    // ======================================================================
    function resetBoard() {
        world = P.makeWorld();
        particles = [];
        floats = [];
        waves = [];
        flash = 0;
        shakeScreen = 0;
        combo = P.makeCombo();
        dropsUsed = 0;
        score = 0;
        created = new Array(P.MAX_LEVEL + 1).fill(0);
        maxMerged = -1;
        thawed = 0;
        canDrop = true;
        dropCooldown = 0;
        winTimer = -1;
        settleTimer = -1;
        goalAnnounced = false;
        if (laserMode) { laserMode = false; Core.data.boosters.laser++; }
        P.setupLevel(world, level && level.f, rnd);
        iceTotal = world.balls.filter(b => b.frozen).length;
        currentLevel = randomStart();
        currentMagnet = rollMagnet();
        nextLevel = randomStart();
        nextMagnet = rollMagnet();
    }

    function openLevel(idx) {
        mode = 'level';
        levelIndex = idx;
        level = LEVELS[idx];
        rnd = Math.random;
        prepareAndIntro();
    }
    function openDaily() {
        mode = 'daily';
        levelIndex = -1;
        const seed = Core.daily.seed();
        level = DAILY_POOL[seed % DAILY_POOL.length];
        rnd = Core.rng(seed);
        prepareAndIntro();
    }
    function openEndless() {
        mode = 'endless';
        level = null;
        levelIndex = -1;
        rnd = Math.random;
        prepareAndIntro();
    }

    function prepareAndIntro() {
        resetBoard();
        dropsLimit = level ? level.drops : Infinity;
        playing = true;
        started = false;
        Core.show('scrGame');
        view.resize();
        refreshMinis();
        updateHud();
        updateBoostersUI();
        // Окно с целью
        let hints = [];
        if (mode === 'endless') {
            $('#introTitle').textContent = Core.t('endless');
            $('#introGoal').textContent = Core.t('best_n', { n: Core.data.best });
            hints.push(Core.t('endless_hint'));
            PL.paintMini($('#introIcon'), 10, 56);
        } else {
            $('#introTitle').textContent = mode === 'daily' ? Core.t('daily') : Core.t('level_n', { n: levelIndex + 1 });
            $('#introGoal').textContent = goalText(level);
            if (mode === 'level' && levelIndex === 0) hints.push(Core.t('tutorial'));
            hints.push(Core.t('intro_hint', { d: level.drops, a: level.s3, b: level.s2 }));
        }
        // Подсказки о новых механиках
        const news = [];
        if (mode === 'level' && levelIndex === COMBO_HINT_LEVEL) news.push(Core.t('hint_combo'));
        FEATURE_KEYS.forEach(k => {
            if (!feat()[k]) return;
            if (mode === 'daily' || (mode === 'level' && firstLevelWith[k] === levelIndex)) news.push(Core.t('hint_' + k));
        });
        const box = $('#introHint');
        box.textContent = '';
        news.forEach(text => {
            const d = document.createElement('div');
            d.className = 'new-mech';
            const tag = document.createElement('b');
            tag.textContent = Core.t(mode === 'daily' ? 'hint_field' : 'hint_new') + ' ';
            d.append(tag, document.createTextNode(text));
            box.appendChild(d);
        });
        hints.forEach(text => {
            const d = document.createElement('div');
            d.textContent = text;
            box.appendChild(d);
        });
        $('#introBack').textContent = Core.t(mode === 'level' ? 'to_levels' : 'to_menu');
        Core.modal('mdIntro', true);
    }
    $('#introPlay').onclick = () => {
        Core.modal('mdIntro', false);
        started = true;
        Core.gameplay(true);
    };
    $('#introBack').onclick = () => {
        Core.modal('mdIntro', false);
        playing = false;
        if (mode === 'level') openLevels(); else openMenu();
    };

    // ======================================================================
    // Бросок, слияния и события механик
    // ======================================================================
    function canPlayNow() {
        return playing && started && !Core.isPaused() && !Core.anyModalOpen();
    }
    const events = {
        merge: (lvl, x, y) => onMerge(lvl, x, y),
        thaw: b => {
            thawed++;
            spawnParticles(b.x, b.y, '#bfe8ff', 22);
            Core.sfx.tone(1200, 'triangle', 0.2, 0.1, 1800);
            updateHud();
        },
        absorb: b => {
            spawnParticles(b.x, b.y, '#a26bff', 12);
            Core.sfx.tone(300, 'sine', 0.3, 0.1, 80);
        },
        explode: (x, y) => {
            spawnParticles(x, y, '#ffb347', 90, 2.3);
            spawnParticles(x, y, '#ff6a2f', 50, 1.6);
            spawnParticles(x, y, '#ffffff', 40, 3);
            waves.push({ x, y, life: 0 }, { x, y, life: -7 });
            flash = 9;
            snd.boom();
            kickScreen(SCREEN_SHAKE_AMP, 70);
        }
    };

    // Тряска экрана: kickScreen(амплитуда в px поля, длительность в кадрах). Затухает к концу.
    const SCREEN_SHAKE_AMP = 19;
    let shakeScreen = 0, shakeMax = 1, shakeAmp = 0;
    function kickScreen(amp, frames) {
        const cur = shakeScreen > 0 ? shakeAmp * Math.pow(shakeScreen / shakeMax, 1.3) : 0;
        shakeAmp = Math.max(amp, cur);
        shakeScreen = shakeMax = frames;
    }
    let waves = [];      // кольца ударной волны взрыва
    let flash = 0;       // белая вспышка при взрыве (кадров)

    function dropNow() {
        if (!canPlayNow() || !canDrop || laserMode || winTimer >= 0) return;
        if (dropsUsed >= dropsLimit) return;
        P.dropBall(world, currentLevel, pointerX, rnd, currentMagnet);
        snd.drop();
        dropsUsed++;
        P.afterDrop(world, events);
        canDrop = false;
        dropCooldown = P.DROP_COOLDOWN;
        currentLevel = nextLevel;
        currentMagnet = nextMagnet;
        nextLevel = randomStart();
        nextMagnet = rollMagnet();
        paintIcon($('#nextCanvas'), nextLevel, 30, { magnet: nextMagnet });
        if (dropsUsed >= dropsLimit) settleTimer = 150;
        updateHud();
    }

    function onMerge(lvl, x, y) {
        const mult = P.comboHit(combo);
        score += P.SCORES[lvl] * mult;
        created[lvl]++;
        if (lvl > maxMerged) maxMerged = lvl;
        snd.merge(lvl + (mult - 1) * 2);
        spawnParticles(x, y, PL.PLANETS[lvl].color1, 18);
        if (mult >= 2) floats.push({ x, y: y - 10, text: Core.t('combo_text', { n: mult }), life: 60, big: mult >= 4 });
        if (mode === 'endless' && score > Core.data.best) {
            Core.data.best = score;
            Core.save(false);
        }
        updateHud();
    }

    const MAX_PARTICLES = 320;   // страховка для слабых устройств
    function spawnParticles(x, y, color, count, speed) {
        const k = speed || 1;
        for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
            const a = Math.random() * TAU, s = (Math.random() * 4.5 + 1.2) * k;
            particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: Math.random() * 4 + 2, color, alpha: 1 });
        }
    }

    // ======================================================================
    // Шаг игры
    // ======================================================================
    function update() {
        for (const s of bgStars) {
            s.a += s.s;
            if (s.a > 0.85 || s.a < 0.15) s.s = -s.s;
        }
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.alpha -= 0.032;
            if (p.alpha <= 0) particles.splice(i, 1);
        }
        for (let i = floats.length - 1; i >= 0; i--) {
            floats[i].y -= 0.8;
            if (--floats[i].life <= 0) floats.splice(i, 1);
        }
        if (shakeScreen > 0) shakeScreen--;
        if (flash > 0) flash--;
        for (let i = waves.length - 1; i >= 0; i--) {
            if (++waves[i].life > 30) waves.splice(i, 1);
        }
        if (!canPlayNow()) return;

        if (!canDrop && --dropCooldown <= 0) canDrop = true;

        P.comboTick(combo);
        P.step(world, events);

        if (winTimer >= 0) {
            if (--winTimer < 0) finishWin();
            return;
        }
        if (mode !== 'endless' && goalDone()) {
            winTimer = 45;
            if (!goalAnnounced) { goalAnnounced = true; Core.toast(Core.t('toast_goal'), 1200); }
            return;
        }
        if (P.updateDanger(world)) {
            finishLose('overflow');
            return;
        }
        if (settleTimer >= 0 && --settleTimer < 0) finishLose('drops');
    }

    // ======================================================================
    // Отрисовка механик
    // ======================================================================
    function drawIce(c, x, y, r, t) {
        c.save();
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
        const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
        g.addColorStop(0, 'rgba(235,250,255,0.55)');
        g.addColorStop(0.6, 'rgba(160,215,255,0.45)');
        g.addColorStop(1, 'rgba(110,180,240,0.65)');
        c.fillStyle = g;
        c.fillRect(x - r, y - r, r * 2, r * 2);
        // Трещины
        c.strokeStyle = 'rgba(255,255,255,0.7)';
        c.lineWidth = Math.max(1, r * 0.04);
        c.beginPath();
        c.moveTo(x - r * 0.5, y - r * 0.1); c.lineTo(x - r * 0.1, y + r * 0.05); c.lineTo(x + r * 0.15, y - r * 0.35);
        c.moveTo(x - r * 0.1, y + r * 0.05); c.lineTo(x + r * 0.05, y + r * 0.5);
        c.moveTo(x + r * 0.15, y - r * 0.35); c.lineTo(x + r * 0.55, y - r * 0.2);
        c.stroke();
        c.restore();
        // Снежинка
        c.save();
        c.translate(x, y);
        c.strokeStyle = 'rgba(255,255,255,0.95)';
        c.lineWidth = Math.max(1.2, r * 0.07);
        c.lineCap = 'round';
        const s = r * 0.32;
        for (let i = 0; i < 3; i++) {
            const a = i * Math.PI / 3 + t;
            c.beginPath(); c.moveTo(-Math.cos(a) * s, -Math.sin(a) * s); c.lineTo(Math.cos(a) * s, Math.sin(a) * s); c.stroke();
        }
        c.beginPath(); c.arc(0, 0, r, 0, TAU);
        c.strokeStyle = 'rgba(220,245,255,0.8)';
        c.lineWidth = Math.max(1, r * 0.05);
        c.stroke();
        c.restore();
    }
    function drawMagnetRing(c, x, y, r, t, w) {
        c.save();
        c.translate(x, y);
        c.rotate(t);
        c.setLineDash([r * 0.35, r * 0.2]);
        c.strokeStyle = 'rgba(200,140,255,0.95)';
        c.lineWidth = w || 3;
        c.shadowColor = 'rgba(190,120,255,0.9)';
        c.shadowBlur = 8;
        c.beginPath(); c.arc(0, 0, r + 4, 0, TAU); c.stroke();
        c.restore();
    }
    function drawHoleGlow(c, h) {
        const [x, y] = h;
        const R = P.HOLE_PULL_R;
        const g = c.createRadialGradient(x, y, P.HOLE_HORIZON, x, y, R);
        g.addColorStop(0, 'rgba(120,60,200,0.35)');
        g.addColorStop(1, 'rgba(120,60,200,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
    }
    function drawHole(c, h, t) {
        drawHoleGlow(c, h);
        drawHoleDisk(c, h, t);
    }
    function drawHoleDisk(c, h, t) {
        const [x, y] = h;
        // Аккреционный диск
        c.save();
        c.translate(x, y);
        for (let i = 0; i < 3; i++) {
            c.save();
            c.rotate(t * (1 + i * 0.4) + i * 2);
            c.scale(1, 0.45);
            c.strokeStyle = ['rgba(255,170,80,0.85)', 'rgba(200,120,255,0.7)', 'rgba(255,230,160,0.6)'][i];
            c.lineWidth = 3 - i * 0.6;
            c.beginPath(); c.arc(0, 0, P.HOLE_HORIZON + 8 + i * 6, 0, Math.PI * 1.4); c.stroke();
            c.restore();
        }
        c.fillStyle = '#000';
        c.beginPath(); c.arc(0, 0, P.HOLE_HORIZON, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,200,120,0.9)';
        c.lineWidth = 1.5;
        c.stroke();
        c.restore();
    }
    function drawBomb(c, b, t) {
        const urgent = b.fuse <= 3;
        const pulse = 0.5 + 0.5 * Math.sin(t * (urgent ? 14 : 6));
        const r = b.radius;
        c.save();
        c.translate(b.x, b.y);
        const glow = c.createRadialGradient(0, 0, r * 0.6, 0, 0, r * (1.6 + pulse * 0.3));
        glow.addColorStop(0, urgent ? 'rgba(255,80,60,0.7)' : 'rgba(255,170,70,0.6)');
        glow.addColorStop(1, 'rgba(255,120,50,0)');
        c.fillStyle = glow;
        c.beginPath(); c.arc(0, 0, r * 1.9, 0, TAU); c.fill();
        // Лучи
        c.strokeStyle = urgent ? 'rgba(255,120,90,0.9)' : 'rgba(255,220,140,0.85)';
        c.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4 + t;
            c.beginPath(); c.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
            c.lineTo(Math.cos(a) * r * (1.25 + pulse * 0.2), Math.sin(a) * r * (1.25 + pulse * 0.2)); c.stroke();
        }
        const g = c.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.45, urgent ? '#ffd0b0' : '#fff2b0');
        g.addColorStop(1, urgent ? '#ff4a3a' : '#ff9a3c');
        c.fillStyle = g;
        c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
        c.fillStyle = '#3a1205';
        c.font = '900 17px "Segoe UI", Roboto, Arial, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(String(Math.max(0, b.fuse)), 0, 1);
        c.restore();
    }
    function drawWall(c, w) {
        c.save();
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(90,150,255,0.35)';
        c.lineWidth = P.WALL_THICK * 2 + 6;
        c.beginPath(); c.moveTo(w[0], w[1]); c.lineTo(w[2], w[3]); c.stroke();
        c.strokeStyle = 'rgba(170,215,255,0.95)';
        c.lineWidth = P.WALL_THICK * 2 - 2;
        c.beginPath(); c.moveTo(w[0], w[1]); c.lineTo(w[2], w[3]); c.stroke();
        c.restore();
    }
    // Закреплённый астероид: тёмный, с голубым контуром — не путается с обычными метеоритами
    function drawPeg(c, p) {
        const [x, y, r] = p;
        c.save();
        const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
        g.addColorStop(0, '#5a6680');
        g.addColorStop(1, '#1b2133');
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.beginPath(); c.arc(x + r * 0.25, y + r * 0.15, r * 0.28, 0, TAU); c.fill();
        c.beginPath(); c.arc(x - r * 0.3, y + r * 0.35, r * 0.16, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(120,200,255,0.95)';
        c.lineWidth = 2;
        c.shadowColor = 'rgba(100,180,255,0.9)';
        c.shadowBlur = 6;
        c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
        c.restore();
    }

    // ======================================================================
    // Отрисовка
    // ======================================================================
    // Неподвижные детали поля (свечение дыр, стены, астероиды) рисуются один раз в слои по пикселям экрана
    let stat = null;
    function makeLayer(x0, y0, x1, y1, paint) {
        const sx = canvas.width / W, sy = canvas.height / H;
        const dx0 = Math.max(0, Math.floor(x0 * sx)), dy0 = Math.max(0, Math.floor(y0 * sy));
        const dx1 = Math.min(canvas.width, Math.ceil(x1 * sx)), dy1 = Math.min(canvas.height, Math.ceil(y1 * sy));
        if (dx1 <= dx0 || dy1 <= dy0) return null;
        const cv = document.createElement('canvas');
        cv.width = dx1 - dx0; cv.height = dy1 - dy0;
        const c = cv.getContext('2d');
        c.setTransform(sx, 0, 0, sy, -dx0, -dy0);
        paint(c);
        return { cv, px: dx0, py: dy0 };
    }
    function ensureStatic() {
        if (stat && stat.pegs === world.pegs && stat.walls === world.walls && stat.holes === world.holes &&
            stat.cw === canvas.width && stat.ch === canvas.height) return stat;
        const R = P.HOLE_PULL_R;
        stat = {
            pegs: world.pegs, walls: world.walls, holes: world.holes, cw: canvas.width, ch: canvas.height,
            glows: world.holes.map(h => makeLayer(h[0] - R - 2, h[1] - R - 2, h[0] + R + 2, h[1] + R + 2, c => drawHoleGlow(c, h))),
            solid: null
        };
        if (world.walls.length || world.pegs.length) {
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            const grow = (x, y, m) => { x0 = Math.min(x0, x - m); y0 = Math.min(y0, y - m); x1 = Math.max(x1, x + m); y1 = Math.max(y1, y + m); };
            world.walls.forEach(w => { grow(w[0], w[1], 12); grow(w[2], w[3], 12); });
            world.pegs.forEach(p => grow(p[0], p[1], p[2] + 16));
            stat.solid = makeLayer(x0, y0, x1, y1, c => {
                world.walls.forEach(w => drawWall(c, w));
                world.pegs.forEach(p => drawPeg(c, p));
            });
        }
        return stat;
    }
    function blitLayer(l) {
        if (l) ctx.drawImage(l.cv, l.px, l.py);
    }

    function overlayBall(c, b, x, y, angle) {
        if (b.frozen) drawIce(c, x, y, b.radius, angle * 0.3);
    }

    // Тряска экрана — это CSS-трансформация самого canvas (сдвиг + поворот): браузер двигает готовую картинку,
    // ничего не перерисовывается, поэтому она почти бесплатна даже на слабых устройствах.
    const wrapEl = $('#wrap');
    let shakeApplied = false;
    function applyScreenShake() {
        if (shakeScreen > 0) {
            // Хаотично: случайный сдвиг и небольшой поворот каждый кадр, иногда — резкий «удар»
            let a = shakeAmp * Math.pow(shakeScreen / shakeMax, 1.3);
            if (Math.random() < 0.14) a *= 1.7;
            const k = canvas.clientWidth / W;          // px экрана на единицу поля
            const dx = (Math.random() - 0.5) * 2 * a * k, dy = (Math.random() - 0.5) * 2 * a * k;
            const rot = (Math.random() - 0.5) * 2 * a * 0.0021;
            if (!shakeApplied) { wrapEl.style.overflow = 'visible'; shakeApplied = true; }
            canvas.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${rot.toFixed(4)}rad)`;
        } else if (shakeApplied) clearScreenShake();
    }
    function clearScreenShake() {
        shakeApplied = false;
        canvas.style.transform = '';
        wrapEl.style.overflow = '';
    }

    let modalFrames = 0, drawnW = 0, drawnH = 0;
    function render(now) {
        if (Core.currentScreen !== 'scrGame') { if (shakeApplied) clearScreenShake(); return; }
        // Пока открыто окно (цель, итог, выход), поле под ним не меняется — перерисовываем только пару кадров
        if (Core.anyModalOpen()) {
            if (shakeApplied) clearScreenShake();
            if (modalFrames >= 3 && canvas.width === drawnW && canvas.height === drawnH) return;
            modalFrames++;
        } else modalFrames = 0;
        if (drawnW && (canvas.width !== drawnW || canvas.height !== drawnH)) PL.resetRestCache();
        drawnW = canvas.width; drawnH = canvas.height;

        const t = (now || performance.now()) / 1000;
        const sx = canvas.width / W, sy = canvas.height / H;
        applyScreenShake();
        view.begin(ctx);
        ctx.clearRect(0, 0, W, H);

        ctx.fillStyle = '#fff';
        for (const s of bgStars) {
            ctx.globalAlpha = s.a;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;

        const st = ensureStatic();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        for (const l of st.glows) blitLayer(l);
        ctx.setTransform(sx, 0, 0, sy, 0, 0);
        for (const h of world.holes) drawHoleDisk(ctx, h, t);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        blitLayer(st.solid);
        ctx.setTransform(sx, 0, 0, sy, 0, 0);

        // Линия опасности
        ctx.save();
        ctx.setLineDash([8, 6]);
        if (world.shakeTime >= 0) { ctx.strokeStyle = 'rgba(110,200,255,0.55)'; ctx.lineWidth = 2; }
        else if (world.dangerTimer > 0) {
            ctx.strokeStyle = `rgba(255,75,75,${(0.4 + Math.sin(performance.now() * 0.015) * 0.4).toFixed(3)})`;
            ctx.lineWidth = 2.5;
        } else { ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; }
        ctx.beginPath(); ctx.moveTo(0, DANGER_Y); ctx.lineTo(W, DANGER_Y); ctx.stroke();
        ctx.restore();

        // Прицел и планета в руке
        if (playing && canDrop && !laserMode && dropsUsed < dropsLimit && winTimer < 0) {
            const x = P.clampDropX(currentLevel, pointerX);
            const r = P.RADII[currentLevel];
            ctx.save();
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = 'rgba(160,195,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x, DROP_Y + r); ctx.lineTo(x, H); ctx.stroke();
            ctx.restore();
            PL.drawPlanet(ctx, x, DROP_Y, currentLevel, 0, 1);
            if (currentMagnet) drawMagnetRing(ctx, x, DROP_Y, r, t * 1.5, 3);
        }

        PL.beginFrame();
        for (const b of world.balls) {
            if (b.kind === 'bomb') drawBomb(ctx, b, t);
            else {
                PL.drawBall(ctx, b, sx, sy, true, overlayBall);
                if (b.magnet) drawMagnetRing(ctx, b.x, b.y, b.radius, t * 1.5, 3);
            }
            if (laserMode) {
                ctx.strokeStyle = 'rgba(255,80,80,0.85)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(b.x, b.y, b.radius + 3, 0, TAU); ctx.stroke();
            }
        }

        PL.endFrame();

        let lastColor = null;
        for (const p of particles) {
            ctx.globalAlpha = Math.max(0, p.alpha);
            if (p.color !== lastColor) { ctx.fillStyle = p.color; lastColor = p.color; }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Ударная волна взрыва
        for (const w of waves) {
            if (w.life <= 0) continue;
            const k = w.life / 30;
            ctx.globalAlpha = (1 - k) * 0.85;
            ctx.strokeStyle = '#ffd9a0';
            ctx.lineWidth = 10 * (1 - k) + 1.5;
            ctx.beginPath(); ctx.arc(w.x, w.y, 14 + k * 300, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (flash > 0) {
            ctx.fillStyle = `rgba(255,236,200,${(flash / 9 * 0.32).toFixed(3)})`;
            ctx.fillRect(-40, -40, W + 80, H + 80);
        }

        // Надписи комбо
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const f of floats) {
            ctx.globalAlpha = Math.min(1, f.life / 25);
            ctx.font = `900 ${f.big ? 34 : 26}px "Segoe UI", Roboto, Arial, sans-serif`;
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'rgba(40,20,0,0.75)';
            ctx.strokeText(f.text, f.x, f.y);
            ctx.fillStyle = f.big ? '#ff8a5b' : '#ffd166';
            ctx.fillText(f.text, f.x, f.y);
        }
        ctx.globalAlpha = 1;
    }

    // ======================================================================
    // Результат
    // ======================================================================
    function starsHtml(n) {
        return [1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('');
    }

    function finishWin() {
        playing = false;
        Core.gameplay(false);
        Core.sfx.win();
        let reward = '';
        const stars = starsFor(dropsUsed);
        if (mode === 'level') {
            const prev = Core.data.stars[levelIndex] || 0;
            Core.data.stars[levelIndex] = Math.max(prev, stars);
            if (stars === 3 && prev < 3) {
                const kind = levelIndex % 2 === 0 ? 'laser' : 'shake';
                Core.data.boosters[kind]++;
                reward = Core.t('reward_booster', { b: Core.t(kind + '_gen') });
            }
        } else if (mode === 'daily') {
            if (Core.daily.complete()) {
                Core.data.boosters.laser++;
                Core.data.boosters.shake++;
                reward = Core.t('reward_daily');
            }
        }
        Core.save(true);
        updateBoostersUI();

        $('#resTitle').textContent = Core.t('win');
        $('#resStars').innerHTML = starsHtml(stars);
        $('#resStars').style.display = '';
        $('#resScoreBox').style.display = 'none';
        $('#resDesc').textContent = Core.t('res_used', { n: dropsUsed });
        $('#resReward').textContent = reward;
        $('#resRevive').style.display = 'none';

        const hasNext = mode === 'level' && levelIndex + 1 < LEVELS.length;
        if (mode === 'level' && !hasNext) $('#resDesc').textContent += ' · ' + Core.t('all_done');
        if (hasNext) {
            setMain('next_level', () => betweenGames(() => openLevel(levelIndex + 1)));
        } else if (mode === 'level') {
            setMain('to_levels', () => openLevels());
        } else {
            setMain('to_menu', () => openMenu());
        }
        Core.modal('mdResult', true);
    }

    let loseReason = null;
    function finishLose(reason) {
        loseReason = reason;
        playing = false;
        settleTimer = -1;
        Core.gameplay(false);
        Core.sfx.lose();
        if (mode === 'endless') Core.save(true);

        $('#resStars').style.display = 'none';
        $('#resReward').textContent = '';
        if (mode === 'endless') {
            $('#resTitle').textContent = Core.t('lose_overflow');
            $('#resScoreBox').style.display = '';
            $('#resScore').textContent = score;
            $('#resBest').textContent = Core.data.best;
            $('#resDesc').textContent = score > 0 && score >= Core.data.best ? Core.t('new_record') : '';
            setMain('new_game', () => betweenGames(openEndless));
        } else {
            $('#resTitle').textContent = Core.t(reason === 'drops' ? 'lose_drops' : 'lose_overflow');
            $('#resScoreBox').style.display = 'none';
            $('#resDesc').textContent = goalText(level);
            setMain('retry', () => betweenGames(() => mode === 'daily' ? openDaily() : openLevel(levelIndex)));
        }
        $('#resReviveText').textContent = Core.t(reason === 'drops' ? 'revive_drops' : 'revive_clear');
        $('#resRevive').style.display = '';
        Core.modal('mdResult', true);
    }

    function setMain(key, fn) {
        $('#resMain').textContent = Core.t(key);
        $('#resMain').onclick = () => { Core.modal('mdResult', false); fn(); };
    }
    // Полноэкранная реклама — только между партиями; каркас сам ограничивает частоту
    function betweenGames(fn) {
        Core.data.gamesPlayed = (Core.data.gamesPlayed || 0) + 1;
        if (Core.data.gamesPlayed % 2 === 0) Core.ads.fullscreen(fn);
        else fn();
    }

    $('#resRevive').onclick = () => {
        Core.ads.rewarded(() => {
            Core.modal('mdResult', false);
            settleTimer = -1;
            if (loseReason === 'drops') {
                dropsLimit = dropsUsed + 5;
            } else {
                P.clearTop(world);
                // Переполнение на последнем броске: бросков не осталось — ждём и подводим итог
                if (dropsUsed >= dropsLimit) settleTimer = 150;
            }
            canDrop = true;
            dropCooldown = 0;
            playing = true;
            started = true;
            updateHud();
            snd.laser();
            Core.gameplay(true);
        });
    };
    $('#resMenu').onclick = () => {
        Core.modal('mdResult', false);
        openMenu();
    };

    // ======================================================================
    // Выход из партии
    // ======================================================================
    $('#btnGameBack').onclick = () => {
        if (!playing || !started) { playing = false; mode === 'level' ? openLevels() : openMenu(); return; }
        Core.setPause('exit', true);
        Core.modal('mdExit', true);
    };
    $('#exitNo').onclick = () => { Core.modal('mdExit', false); Core.setPause('exit', false); };
    $('#exitYes').onclick = () => {
        Core.modal('mdExit', false);
        Core.setPause('exit', false);
        playing = false;
        if (laserMode) { laserMode = false; Core.data.boosters.laser++; }
        Core.gameplay(false);
        Core.save(false);
        mode === 'level' ? openLevels() : openMenu();
    };

    // ======================================================================
    // Ввод. Клик левее/правее поля — сброс у стенки (X ограничивается в clampDropX)
    // ======================================================================
    const appScreen = $('#scrGame');
    function isGameArea(t) {
        if (!(t instanceof Element)) return false;
        if (t !== document.body && t !== document.documentElement && !appScreen.contains(t)) return false;
        return !t.closest('button, .hud, .boosters, .evo-bar, .modal-overlay');
    }
    let pressId = null;
    document.addEventListener('pointermove', e => {
        if (Core.currentScreen === 'scrGame') pointerX = view.toLocal(e.clientX, e.clientY).x;
    });
    document.addEventListener('pointerdown', e => {
        if (Core.currentScreen !== 'scrGame') return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (!isGameArea(e.target) || !canPlayNow()) return;
        const pos = view.toLocal(e.clientX, e.clientY);
        pointerX = pos.x;
        if (laserMode) { tryLaser(pos); pressId = null; return; }
        pressId = e.pointerId;
    });
    document.addEventListener('pointerup', e => {
        if (pressId === null || e.pointerId !== pressId) return;
        pressId = null;
        pointerX = view.toLocal(e.clientX, e.clientY).x;
        dropNow();
    });
    document.addEventListener('pointercancel', e => { if (e.pointerId === pressId) pressId = null; });

    // ======================================================================
    // Бустеры
    // ======================================================================
    function tryLaser(pos) {
        for (let i = world.balls.length - 1; i >= 0; i--) {
            const b = world.balls[i];
            const dx = pos.x - b.x, dy = pos.y - b.y;
            if (dx * dx + dy * dy <= b.radius * b.radius) {
                spawnParticles(b.x, b.y, '#ff5e62', 24);
                world.balls.splice(i, 1);
                snd.laser();
                laserMode = false;
                updateBoostersUI();
                Core.toast(Core.t('toast_laser_done'));
                return;
            }
        }
    }
    function boosterAllowed() {
        return playing && started && !Core.ads.busy && winTimer < 0;
    }
    $('#btnLaser').onclick = () => {
        if (!boosterAllowed()) return;
        const b = Core.data.boosters;
        if (laserMode) {
            laserMode = false;
            b.laser++;
            updateBoostersUI();
            Core.toast(Core.t('toast_laser_cancel'));
            return;
        }
        if (!world.balls.length) { Core.toast(Core.t('toast_need_planet')); return; }
        if (b.laser > 0) {
            b.laser--;
            laserMode = true;
            Core.save(false);
            updateBoostersUI();
            Core.toast(Core.t('toast_laser_pick'));
        } else {
            Core.ads.rewarded(() => {
                laserMode = true;
                updateBoostersUI();
                Core.toast(Core.t('toast_laser_pick'));
            });
        }
    };
    $('#btnShake').onclick = () => {
        if (!boosterAllowed()) return;
        if (!world.balls.length) { Core.toast(Core.t('toast_no_planets')); return; }
        const apply = () => {
            snd.shake();
            P.shake(world, Math.random);
            kickScreen(SCREEN_SHAKE_AMP, 75);
            for (const b of world.balls) spawnParticles(b.x, b.y, b.kind === 'bomb' ? '#ffb347' : PL.PLANETS[b.level].color1, 3, 1.8);
            updateBoostersUI();
        };
        const b = Core.data.boosters;
        if (b.shake > 0) { b.shake--; Core.save(false); apply(); }
        else Core.ads.rewarded(apply);
    };
    $('#btnSuper').onclick = () => {
        if (!boosterAllowed()) return;
        Core.ads.rewarded(() => {
            currentLevel = 4;
            currentMagnet = false;
            snd.merge(4);
            Core.toast(Core.t('toast_super'));
        });
    };

    // ======================================================================
    // Меню и выбор уровней
    // ======================================================================
    function totalStars() {
        return Core.data.stars.reduce((s, v) => s + (v || 0), 0);
    }
    function firstUnfinished() {
        for (let i = 0; i < LEVELS.length; i++) if (!(Core.data.stars[i] > 0)) return i;
        return LEVELS.length - 1;
    }
    function openMenu() {
        playing = false;
        Core.gameplay(false);
        Core.show('scrMenu');
        $('#menuTitle').innerHTML = '';
        $('#menuTitle').append(document.createTextNode(Core.t('title_a')));
        const b = document.createElement('b');
        b.textContent = Core.t('title_b');
        $('#menuTitle').append(b);
        $('#subLevels').textContent = Core.t('stars_total', { n: totalStars(), m: LEVELS.length * 3 });
        const streak = Core.daily.streak();
        $('#subDaily').textContent = Core.daily.isDone() ? Core.t('daily_done', { n: streak })
            : (streak ? Core.t('daily_new_streak', { n: streak }) : Core.t('daily_new'));
        $('#subEndless').textContent = Core.t('best_n', { n: Core.data.best });
        PL.paintMini($('#menuPlanet'), 7, 150);
    }
    function openLevels() {
        playing = false;
        Core.gameplay(false);
        const grid = $('#levelGrid');
        grid.innerHTML = '';
        const cur = firstUnfinished();
        LEVELS.forEach((lv, i) => {
            const st = Core.data.stars[i] || 0;
            const unlocked = i === 0 || (Core.data.stars[i - 1] || 0) > 0;
            const btn = document.createElement('button');
            btn.className = 'lvl' + (unlocked ? '' : ' locked') + (i === cur && unlocked ? ' current' : '');
            btn.innerHTML = (unlocked ? String(i + 1) : '🔒') + `<div class="stars">${starsHtml(st)}</div>`;
            if (unlocked) btn.onclick = () => openLevel(i);
            grid.appendChild(btn);
        });
        $('#levelsStars').textContent = '★ ' + totalStars() + '/' + LEVELS.length * 3;
        Core.show('scrLevels');
        const curBtn = grid.children[cur];
        if (curBtn && curBtn.scrollIntoView) curBtn.scrollIntoView({ block: 'center' });
    }
    $('#btnLevels').onclick = openLevels;
    $('#btnDaily').onclick = openDaily;
    $('#btnEndless').onclick = openEndless;
    $('#btnLevelsBack').onclick = openMenu;
    document.querySelectorAll('[data-sound]').forEach(b => { b.onclick = () => Core.sfx.setMuted(!Core.sfx.muted); });
    function updateSoundButtons() {
        document.querySelectorAll('[data-sound]').forEach(b => { b.textContent = Core.sfx.muted ? '🔇' : '🔊'; });
    }

    // ======================================================================
    // Запуск
    // ======================================================================
    Core.init({
        id: 'cosmic_merge',
        i18n: I18N,
        cloudField: 'progress',
        scoreKey: 'best',
        defaultSave: { stars: [], best: 0, boosters: { laser: 2, shake: 2 }, daily: { last: null, streak: 0 }, gamesPlayed: 0 },
        // Объединение сохранений с разных устройств: лучшее по каждому уровню и рекорду
        mergeSaves(a, b) {
            if (!a || !b) return a || b;
            const newer = (b._t || 0) > (a._t || 0) ? b : a;
            const out = Object.assign({}, newer);
            out.stars = [];
            const n = Math.max((a.stars || []).length, (b.stars || []).length);
            for (let i = 0; i < n; i++) out.stars[i] = Math.max((a.stars || [])[i] || 0, (b.stars || [])[i] || 0);
            out.best = Math.max(a.best || 0, b.best || 0);
            const ad = (a.daily && a.daily.last) || '', bd = (b.daily && b.daily.last) || '';
            out.daily = bd > ad ? b.daily : a.daily;
            return out;
        },
        onReady() {
            // Старый рекорд из первой версии игры
            try {
                const old = parseInt(localStorage.getItem('cosmic_merge_best'), 10) || 0;
                if (old > Core.data.best) Core.data.best = old;
            } catch (e) {}
            updateSoundButtons();
            refreshMinis();
            openMenu();
        },
        onSDKReady() {
            // Рекорд из стандартного поля score (первая версия игры сохраняла туда)
            try {
                const cloudBest = Core.gp ? (Number(Core.gp.player.get('score')) || 0) : 0;
                if (cloudBest > Core.data.best) Core.data.best = cloudBest;
            } catch (e) {}
            if (Core.currentScreen === 'scrMenu') openMenu();
            else if (Core.currentScreen === 'scrLevels') openLevels();
        },
        onMuteChange: updateSoundButtons,
        onLangChange() {
            refreshMinis();
            updateBoostersUI();
            if (Core.currentScreen === 'scrMenu') openMenu();
            else if (Core.currentScreen === 'scrLevels') openLevels();
            else updateHud();
        }
    });
    Core.startLoop(update, render);
})();
