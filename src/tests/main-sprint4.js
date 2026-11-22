const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// четвёртый спринт: голова в 2,5D и зрачки, рисунки вещей, созвездия наград, столик в альбоме, шкатулка с ручкой, сеты, уровни 4–9, подъём в эпилог
const {open} = require('./helper.js');
(async () => {
  const today = new Date(), dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const T = Date.now(), ach = {pet1: T - 9e8, both: T - 8e8, pet100: T - 7e8, hug: T - 6e8, hunt: T - 5e8, ring: T - 4e8, astral: T - 3e8, blood: T - 2e8};
  const st = {v4:1, v5:1, v9:1, lastDay: today.toDateString(), lastSeen: T, songSeen: 1, salvJoke: 1, giftDay: today.toDateString(), teamPicked: 1, pets: 300, drops: 40, purr: 0,
    stars: {1:3, 2:3, 3:2, 4:2, 5:1, 6:1, 7:1, 8:1}, ach, achSeen: {pet1:1, both:1, pet100:1, hug:1, hunt:1, ring:1, blood:1}, giftBox: {0: 1, 2: 1, 5: 1}, guests: {},
    owned: {bow:1, cape:1, ring:1, tiara:1, wreath:1, shades:1, mask:1}, diary: {[dk(today)]: {u: T, pl: 2}}, diarySeen: 0};
  const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  p.on('console', m => { if (m.type() === 'warning' && !/AudioContext|autoplay/i.test(m.text())) errs.push('WARN ' + m.text()); });
  let fail = 0; const ok = (name, cond, info = '') => { if (!cond) fail++; console.log((cond ? 'ok  ' : 'FAIL') + ' ' + name + (info ? '  ' + info : '')); };
  const shot = n => p.screenshot({path: __dirname + '/s4-' + n + '.png'});
  await p.setViewportSize({width: 393, height: 852}); await p.waitForTimeout(1400);
  await p.click('#btnStart'); await p.waitForTimeout(1600);
  const wear = (ids) => p.evaluate(ids => { S.wearA = {}; S.wearL = {}; ids.forEach(id => { putOn('a', id, true); putOn('l', id, true); }); applyLook(); renderPurr(); }, ids);

  // 1. голова в 2,5D и зрачки
  await p.mouse.move(330, 500); await p.mouse.move(360, 520, {steps: 4}); await p.waitForTimeout(700);
  const hl = await p.evaluate(() => { const c = document.querySelector('#duo .pet[data-cat="alisa"] .cat'), m = s => new DOMMatrix(getComputedStyle(c.querySelector(s)).transform).m41; return {gx: parseFloat(getComputedStyle(c).getPropertyValue('--gx')), ear: m('.hl-ear'), top: m('.hl-top'), eyes: m('.hl-eyes'), muz: m('.hl-muz')}; });
  ok('слои головы едут на разную глубину', hl.gx > 1 && hl.ear < -.2 && hl.top > 0 && hl.eyes > hl.top && hl.muz > hl.eyes, JSON.stringify(hl));
  const pd = async () => p.evaluate(() => { const d = document.querySelector('#duo'); return {pd: +d.style.getPropertyValue('--pd'), sx: new DOMMatrix(getComputedStyle(d.querySelector('.pup')).transform).a}; });
  const pd0 = await pd(); await p.evaluate(() => { S.purr = Math.round(perDrop()*.6); renderPurr(); }); await p.waitForTimeout(400); const pd1 = await pd();
  ok('зрачки шире с заполнением шкалы', pd0.pd === 1 && pd1.pd > 1.2 && pd1.sx > 1.15, JSON.stringify([pd0, pd1]));
  await shot('home'); await p.evaluate(() => { S.purr = 0; renderPurr(); });

  // 2. сеты и рисунки вещей в гардеробе
  await wear(['tiara', 'bow']);
  const s1 = await p.evaluate(() => ({prom: setOn('prom'), need: overNeed(), ms: overMs(), day: setOn('day'), p7: perksFor(7).map(x => x.t), p4: perksFor(4).length}));
  ok('«Королевы Выпускного»: 4 поглаживания, 3,2 с', s1.prom && s1.need === 4 && s1.ms === 3200 && !s1.day, JSON.stringify(s1));
  await p.click('#btnWardrobe'); await p.waitForTimeout(1100);
  const wd = await p.evaluate(() => ({items: [...document.querySelectorAll('.witems .wit .e svg')].map(el => el.dataset.item), sets: [...document.querySelectorAll('.oset')].map(x => (x.classList.contains('on') ? '+' : '-') + x.querySelector('b').textContent)}));
  ok('в гардеробе рисунки вещей и 4 плашки сетов', new Set(wd.items).size === 7 && wd.items.every(Boolean) && wd.sets.length === 4 && wd.sets.filter(x => x[0] === '+').length === 1, wd.items.join(', ') + ' | ' + wd.sets.join(', '));
  // надеваем кольцо и очки: собирается «Дневные Бродяги»
  for (const id of ['ring', 'shades']){ await p.evaluate(id => { const i = WEAR.findIndex(w => w.id === id); document.querySelectorAll('.witems .wit')[i].click(); }, id); await p.waitForTimeout(350); }
  const wd2 = await p.evaluate(() => ({on: [...document.querySelectorAll('.oset.on b')].map(x => x.textContent), cap: document.querySelector('.wcap').textContent}));
  ok('сет собрался в гардеробе', wd2.on.includes('Дневные Бродяги') && /Дневные Бродяги/.test(wd2.cap), JSON.stringify(wd2));
  await shot('wardrobe'); await p.click('#sheetDone'); await p.waitForTimeout(800);
  const s2 = await p.evaluate(() => ({p7: perksFor(7).map(x => x.t), p5: perksFor(5).map(x => x.t)}));
  ok('перед уровнем 7 показан бонус сета', s2.p7.some(t => /Дневные Бродяги/.test(t)), JSON.stringify(s2.p7));
  // сверхмурчание с сетом: 4 поглаживания
  await p.evaluate(() => { S.purr = perDrop() - 1; renderPurr(); });
  const box = await p.locator('#duo .pet[data-cat="alisa"] .cat').boundingBox(), cx = box.x + box.width/2, cy = box.y + box.height*.5;
  const d0 = await p.evaluate(() => S.drops); await p.mouse.click(cx, cy); await p.waitForTimeout(650);
  const ov = await p.evaluate(() => over ? over.left : null);
  for (let i = 0; i < 4; i++){ await p.mouse.click(cx, cy); await p.waitForTimeout(150); } await p.waitForTimeout(300);
  const d1 = await p.evaluate(() => ({drops: S.drops, n: wornCount(), t: cyclePay(true)}));
  ok('с сетом хватает 4 поглаживаний', ov === 4 && d1.drops - d0 === d1.t, 'окно ' + ov + ', капель +' + (d1.drops - d0) + ' при ' + d1.n + ' вещах');
  await p.waitForTimeout(1500);

  // 3. награды: созвездия
  await p.evaluate(() => showView('v-awards')); await p.waitForTimeout(2600);
  const aw = () => p.evaluate(() => ({name: document.querySelector('#awName').textContent, count: document.querySelector('#awCount').textContent, nodes: document.querySelectorAll('#starMap .snode').length, got: document.querySelectorAll('#starMap .snode.got').length,
    lines: document.querySelectorAll('#starMap line').length, on: document.querySelectorAll('#starMap line.on').length, det: document.querySelector('#awDetail').textContent.replace(/\s+/g, ' ').trim(), sel: (document.querySelector('.snode.sel') || {dataset: {}}).dataset.id}));
  let a = await aw(); ok('новая награда открыла своё созвездие', a.name === 'Хроники Мистик Фоллс' && a.nodes === 13 && a.got === 3 && a.on === 2 && a.sel === 'astral', JSON.stringify(a));
  await shot('awards-falls');
  const nodeBox = await p.evaluate(() => [...document.querySelectorAll('#starMap .snode')].map(n => { const r = n.getBoundingClientRect(); return [r.left, r.top, r.width]; }));
  let overlap = 0; for (let i = 0; i < nodeBox.length; i++) for (let j = i + 1; j < nodeBox.length; j++){ const [x1, y1, w] = nodeBox[i], [x2, y2] = nodeBox[j]; if (Math.hypot(x1 - x2, y1 - y2) < w + 4) overlap++; }
  ok('медальоны не наезжают друг на друга и не меньше 44', overlap === 0 && nodeBox.every(n => n[2] >= 44 && n[0] >= 4 && n[0] + n[2] <= 389), 'размер ' + nodeBox[0][2]);
  await p.click('#starMap .snode[data-id="forks"]'); await p.waitForTimeout(500); a = await aw();
  ok('тап по закрытой звезде показывает карточку', a.sel === 'forks' && /ещё впереди|из/.test(a.det), a.det);
  await p.click('#awSeg button[data-i="0"]'); await p.waitForTimeout(700); a = await aw();
  ok('сегмент: Созвездие Ласки', a.name === 'Созвездие Ласки' && a.nodes === 7 && a.got === 4 && a.count === '4 из 7', JSON.stringify(a));
  await shot('awards-care');
  const mb = await p.locator('#starMap').boundingBox();
  await p.mouse.move(mb.x + mb.width*.8, mb.y + mb.height*.33); await p.mouse.down(); await p.mouse.move(mb.x + mb.width*.3, mb.y + mb.height*.35, {steps: 6}); await p.mouse.up(); await p.waitForTimeout(700);
  a = await aw(); ok('свайп листает к следующему созвездию', a.name === 'Хроники Мистик Фоллс', a.name);
  await p.click('#awSeg button[data-i="2"]'); await p.waitForTimeout(700); a = await aw();
  ok('Тайны Полнолуния: секреты закрыты вопросом', a.nodes === 4 && a.got === 1 && (await p.evaluate(() => document.querySelectorAll('#starMap .snode.hid').length)) === 3, JSON.stringify(a));
  await shot('awards-moon');

  // 4. альбом: книга и шкатулка
  await p.evaluate(() => showView('v-album')); await p.waitForTimeout(1200);
  const desk = await p.evaluate(() => { const bk = document.querySelector('.desk-book'), bx = document.querySelector('.desk-box'), r = e => { const q = e.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; };
    return {book: r(bk), box: r(bx), fresh: bk.classList.contains('fresh'), gifts: [...bx.querySelectorAll('.glass > .e')].map(e => e.textContent).join(''), empty: bx.querySelectorAll('.glass .no').length, cap: bx.querySelector('small').textContent, rows: document.querySelectorAll('#diaryG .li').length}; });
  ok('столик: книга с печатью и шкатулка с подарками', desk.fresh && desk.gifts.length >= 3 && desk.empty === 4 && /3 из 7/.test(desk.cap) && desk.rows === 0 && desk.book[1] >= 140, JSON.stringify(desk));
  await shot('album');
  await p.click('.desk-book'); await p.waitForTimeout(1300);
  ok('книга открывает дневник с лунным диском', await p.evaluate(() => !!document.querySelector('#sheet.on .volv') && !document.querySelector('.desk-book.fresh')));
  await p.click('#sheetDone'); await p.waitForTimeout(800);
  await p.click('.desk-box'); await p.waitForTimeout(1000);
  ok('шкатулка открывается', await p.evaluate(() => document.querySelector('#sheet').classList.contains('on') && /Шкатулка/.test(document.querySelector('#sheetTitle').textContent)));
  await p.click('#sheetDone'); await p.waitForTimeout(800);

  // 5. музыкальная шкатулка с ручкой
  await p.evaluate(() => showView('v-home')); await p.waitForTimeout(900);
  await wear(['bow', 'cape', 'tiara']);
  await p.evaluate(() => { S.music = true; S.sound = true; Music.start(7); }); await p.waitForTimeout(300);
  await p.click('#miniPlayer'); await p.waitForTimeout(1200);
  let mbx = await p.evaluate(() => ({hams: document.querySelectorAll('.mb-ham').length, on: [...document.querySelectorAll('.mb-ham.on')].map(h => h.dataset.id), playing: Music.playing, bpm: Math.round(Music.bpm), em: [...document.querySelectorAll('.mb-ham .e')].map(e => e.textContent).join('')}));
  ok('шкатулка: 7 молоточков, надетые горят', mbx.hams === 7 && mbx.on.join() === 'bow,cape,tiara' && mbx.bpm === 80, JSON.stringify(mbx));
  const roll0 = await p.evaluate(() => document.querySelector('#mbox').style.getPropertyValue('--roll')); await p.waitForTimeout(500);
  ok('валик крутится, пока шкатулка играет', mbx.playing && roll0 !== await p.evaluate(() => document.querySelector('#mbox').style.getPropertyValue('--roll')));
  const anim = await p.evaluate(() => new Promise(res => { let n = 0; const iv = setInterval(() => { n += document.querySelectorAll('.mb-ham.on').length && [...document.querySelectorAll('.mb-ham')].filter(h => h.getAnimations().length).length; }, 60); setTimeout(() => { clearInterval(iv); res(n); }, 4200); }));
  ok('молоточки вздрагивают на своих партиях', anim > 0, 'замечено срабатываний: ' + anim);
  const cr = await p.locator('.mb-crank').boundingBox(), ox = cr.x + cr.width/2, oy = cr.y + cr.height/2;
  const spin = async (turns, dir, ms) => { const n = Math.round(turns*24); await p.mouse.move(ox + 24, oy); await p.mouse.down(); for (let i = 1; i <= n; i++){ const an = dir*i/24*2*Math.PI; await p.mouse.move(ox + Math.cos(an)*24, oy + Math.sin(an)*24); await p.waitForTimeout(ms/24); } };
  await spin(3, 1, 700); const fast = await p.evaluate(() => Music.bpm); await shot('musicbox'); await p.mouse.up();
  ok('по часовой темп растёт', fast > 96 && fast <= 112, fast.toFixed(1));
  await p.waitForTimeout(4200); const back = await p.evaluate(() => Music.bpm);
  ok('отпустили: темп вернулся к 80', Math.abs(back - 80) < 2.5, back.toFixed(1));
  await spin(2, -1, 1000); const slow = await p.evaluate(() => Music.bpm); await p.mouse.up();
  ok('против часовой темп падает, но не ниже 68', slow < 76 && slow >= 68, slow.toFixed(1));
  await p.click('#songSheet .shead button'); await p.waitForTimeout(700);
  ok('закрыли лист: темп 80', await p.evaluate(() => Music.bpm === 80));
  await p.evaluate(() => Music.stop());

  // 6. уровень 5: второй прыжок весь забег, три золотые рыбки на высоте второго прыжка
  await wear([]);
  await p.evaluate(() => startLevel(LEVELS[4])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(300);
  let seenGold = 0, dj = 0, gshot = false; const t0 = Date.now(); let last = null;
  while (Date.now() - t0 < 45000){
    const r = await p.evaluate(() => { const a = document.querySelector('#garea'); const s = a && a.__run ? a.__run() : null; if (!s) return null;
      const dx = l => l.x - s.CX, log = s.logs.find(l => dx(l) > -30 && dx(l) <= s.speed*.36 - 14), gold = s.fish.find(f => f.gold), gdx = gold ? gold.x - s.CX : 1e9;
      const fishUp = s.fish.find(f => !f.gold && f.x - s.CX > s.speed*.2 && f.x - s.CX < s.speed*.4), clear = k => !s.logs.some(l => dx(l) > -40 && dx(l) < s.speed*.72*k + 70);
      let act = '';
      if (s.onGround && (log || (gold && gdx > s.speed*.52 && gdx < s.speed*.66) || (fishUp && clear(1)))){ a.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true})); act = 'j'; }
      else if (!s.onGround && gold && s.y < -112 && gdx < s.speed*.5 && gdx > -20 && !window.__dj){ window.__dj = 1; a.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true})); act = 'd'; }
      if (s.onGround) window.__dj = 0;
      return {gust: s.gust, got: s.got, lives: s.lives, run: s.running, gold: s.fish.filter(f => f.gold).length, y: s.y, act, time: s.time}; });
    if (r){ last = r; if (r.gold) seenGold = Math.max(seenGold, 1); if (r.act === 'd') dj++; if (r.gust === 1 && r.gold && !gshot){ gshot = true; await shot('forks-gold'); } }
    if (!r || !r.run){ if (Date.now() - t0 > 3000) break; }
    await p.waitForTimeout(22); }
  const r5 = (await p.textContent('#rText')).replace(/\s+/g, ' ').trim();
  ok('уровень 5 пройден, золотые рыбки были, второй прыжок сработал', seenGold === 1 && dj >= 1 && /\d/.test(r5), 'вторых прыжков ' + dj + ' · ' + r5.slice(0, 110));
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);
  // второй прыжок вне просвета
  await p.evaluate(() => startLevel(LEVELS[4])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(500);
  const ga = () => p.evaluate(() => document.querySelector('#garea').__run().y);
  await p.evaluate(() => document.querySelector('#garea').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}))); await p.waitForTimeout(330);
  await p.evaluate(() => document.querySelector('#garea').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}))); let top = 0; for (let i = 0; i < 14; i++){ top = Math.min(top, await ga()); await p.waitForTimeout(25); }
  ok('второй прыжок в первые секунды поднимает выше одиночного (130)', top < -165, 'высота ' + (-top).toFixed(0));
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);

  // 7. уровень 7 с сетом: фора 1,2 с; превью тени рисуется без ошибок
  await wear(['ring', 'shades']);
  await p.evaluate(() => startLevel(LEVELS[6])); await p.waitForTimeout(900);
  const pills7 = await p.evaluate(() => [...document.querySelectorAll('.overlay .perk .pt')].map(x => x.textContent));
  await p.click('.overlay .go'); await p.waitForTimeout(400);
  const g7 = await p.locator('#garea').boundingBox();
  await p.mouse.move(g7.x + g7.width*.5, g7.y + g7.height*.3); await p.mouse.down(); await p.mouse.move(g7.x + g7.width*.9, g7.y + g7.height*.3, {steps: 5}); await p.waitForTimeout(250); await shot('sun-preview');
  await p.mouse.move(g7.x + g7.width*.15, g7.y + g7.height*.3, {steps: 8}); await p.waitForTimeout(2500); await p.mouse.up();
  const sun = await p.evaluate(() => { const s = document.querySelector('#garea').__sun; return {t: s.t, expT: s.expT, alive: s.alive}; });
  ok('уровень 7: плашка сета перед стартом, игра идёт', pills7.some(t => /Дневные Бродяги/.test(t)) && sun.t > 2, JSON.stringify(pills7) + ' ' + JSON.stringify(sun));
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);

  // 8. уровень 4 с сетом: первая ошибка прощается
  await wear(['cape', 'mask']);
  await p.evaluate(() => startLevel(LEVELS[3])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(600);
  const e4 = await p.evaluate(() => new Promise(res => { const s = document.querySelector('#garea').__sort; let n = 0; const iv = setInterval(() => { const it = s.items.find(i => !i.gone && !i.done && !i.tossed); if (it && n < 2){ const before = s.errs; s.toss(it, it.d[1] ? 0 : 1); n++; } if (n >= 2){ clearInterval(iv); setTimeout(() => res({errs: s.errs, right: s.right}), 1500); } }, 900); }));
  ok('уровень 4: из двух неверных бросков засчитана одна ошибка', e4.errs === 1, JSON.stringify(e4));
  await shot('rules'); await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);

  // 9. уровень 8: дуга на лупе и подпись ритма
  await p.evaluate(() => startLevel(LEVELS[7])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(900);
  const g8 = await p.locator('#garea canvas').first().boundingBox();
  const gs = await p.evaluate(() => document.querySelector('#garea').__mask.guests.map(g => ({x: g.x, y: g.y, bpm: g.bpm})));
  const v = gs.find(g => g.bpm === 0) || gs[0];
  await p.mouse.move(g8.x + v.x, g8.y + v.y + 74); await p.mouse.down(); await p.waitForTimeout(450); await shot('mask-arc'); await p.waitForTimeout(650);
  const kn = await p.evaluate(() => document.querySelector('#garea').__mask.guests.filter(g => g.known).length);
  for (const g of gs.slice(0, 4)){ await p.mouse.move(g8.x + g.x, g8.y + g.y + 74, {steps: 4}); await p.waitForTimeout(1300); }
  await shot('mask-bpm'); await p.mouse.up();
  ok('уровень 8 с сетом: гость без пульса распознан за 0,75–1,1 с', kn >= 1, 'распознано ' + kn);
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);

  // 10. уровень 9: затвор открыт, тики идут
  await wear([]);
  await p.evaluate(() => { window.__ticks = 0; window.__rat = 0; const t = snd.tick, r = snd.ratchet; snd.tick = k => { window.__ticks++; (window.__tk = window.__tk || []).push(+k.toFixed(2)); return t(k); }; snd.ratchet = k => { window.__rat++; return r(k); }; });
  await p.evaluate(() => startLevel(LEVELS[8])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(4300);
  const a9 = await p.locator('#garea').boundingBox(); await p.mouse.move(a9.x + a9.width/2, a9.y + a9.height*.8); await p.mouse.down(); await p.waitForTimeout(1500); await shot('shot'); await p.waitForTimeout(1700); await p.mouse.up();
  const tk = await p.evaluate(() => ({ticks: window.__ticks, rat: window.__rat, tk: (window.__tk || []).slice(0, 12)}));
  ok('уровень 9: тики на контуре с растущим тоном', tk.ticks >= 3 && tk.tk[tk.tk.length - 1] >= tk.tk[0], JSON.stringify(tk));
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);

  // 11. уровень 6 с сетом: зона попадания шире
  await wear(['wreath', 'ring']);
  await p.evaluate(() => startLevel(LEVELS[5])); await p.waitForTimeout(900); await p.click('.overlay .go');
  const wide = await p.evaluate(() => new Promise(res => { const t0 = Date.now(), iv = setInterval(() => { const it = document.querySelector('.bush .item:not(.bat)'); if (it || Date.now() - t0 > 6000){ clearInterval(iv); res(it ? {wide: it.classList.contains('wide'), slop: parseFloat(getComputedStyle(it, '::before').top)} : null); } }, 60); }));
  ok('уровень 6: розы с расширенной зоной', wide && wide.wide && wide.slop < -8, JSON.stringify(wide));
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);

  // 12. эпилог: камера поднимается, сцена проявляется, после закрытия камера дома
  await p.evaluate(() => showView('v-album')); await p.waitForTimeout(900);
  await p.evaluate(() => playEpilogue()); await p.waitForTimeout(380);
  const e1 = await p.evaluate(() => ({rise: app.classList.contains('epi-rise'), cam: document.querySelector('#world').dataset.cam, epi: !!document.querySelector('#epi'), near: getComputedStyle(document.querySelector('#world .ridge.near')).translate, ui: getComputedStyle(document.querySelector('.views')).opacity}));
  await shot('epi-rise'); await p.waitForTimeout(1500);
  const e2 = await p.evaluate(() => ({epi: !!document.querySelector('#epi'), near: getComputedStyle(document.querySelector('#world .ridge.near')).translate}));
  ok('эпилог: сначала подъём камеры, потом сцена', e1.rise && e1.cam === 'epi' && !e1.epi && +e1.ui < .7 && e2.epi && /220px/.test(e2.near), JSON.stringify(e1) + ' → ' + JSON.stringify(e2));
  await shot('epi'); await p.click('#epi .eclose'); await p.waitForTimeout(1300);
  const e3 = await p.evaluate(() => ({rise: app.classList.contains('epi-rise'), cam: document.querySelector('#world').dataset.cam, epi: !!document.querySelector('#epi'), ui: getComputedStyle(document.querySelector('.views')).opacity}));
  ok('закрыли эпилог: камера и интерфейс на месте', !e3.rise && e3.cam === 'v-album' && !e3.epi && e3.ui === '1', JSON.stringify(e3));

  console.log('ERRORS', errs.length ? errs.join('\n') : 'none', '| провалов:', fail); await b.close();
})();
