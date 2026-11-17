const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// v13: четыре зоны и ревность, параллакс с наклоном, отрыв билета, полевой журнал, парные сценки, комикс, уровень 11 в три фазы
const {open} = require('./helper.js');
(async () => {
  const today = new Date(), T = Date.now();
  const st = {v4:1, v5:1, v9:1, lastDay: today.toDateString(), lastSeen: T, songSeen: 1, salvJoke: 1, giftDay: today.toDateString(), teamPicked: 1, pets: 300, drops: 900, purr: 0,
    stars: {1:3, 2:3, 3:2, 4:2, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1}, owned: {bow:1, cape:1, ring:1, shades:1}, wearA: {ring:1, shades:1}, wearL: {}, diary: {}, guests: {filin: {t: T - 864e5*3, n: 2}}};
  const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  let fail = 0; const ok = (name, cond, info = '') => { if (!cond) fail++; console.log((cond ? 'ok  ' : 'FAIL') + ' ' + name + (info ? '  ' + info : '')); };
  const shot = n => p.screenshot({path: __dirname + '/v13-' + (VW === 393 ? '' : VW + '-') + n + '.png'});
  const VW = +(process.argv[2] || 393), VH = +(process.argv[3] || 852); await p.setViewportSize({width: VW, height: VH}); await p.waitForTimeout(1400);
  await p.click('#btnStart'); await p.waitForTimeout(1600);
  await p.evaluate(() => { if (busyAct) endBusy(); });
  await p.waitForTimeout(800);
  const cat = async w => { const r = await p.locator(`#duo .pet[data-cat="${w}"] .cat`).boundingBox(); return {x: r.x + r.width/2, left: r.x, w: r.width, top: r.y, h: r.height}; };
  const A = await cat('alisa'), Lc = await cat('lapula');
  const cls = w => p.evaluate(w => [...document.querySelector(`#duo .pet[data-cat="${w}"] .cat`).classList], w);
  const purr = () => p.evaluate(() => S.purr);

  // 1. зоны. Каждая зона даёт ровно один шаг шкалы: экономика та же
  let p0 = await purr(); await p.mouse.click(A.x, A.top + A.h*.18); await p.waitForTimeout(120);
  ok('макушка: уши прижаты', (await cls('alisa')).includes('earflat'));
  await p.waitForTimeout(1300);
  await p.mouse.click(A.x + A.w*.15, A.top + A.h*.44); await p.waitForTimeout(150);
  const chin = await p.evaluate(() => { const c = document.querySelector('#duo .pet[data-cat="alisa"] .cat'); return {cls: [...c.classList], hr: c.style.getPropertyValue('--hr')}; });
  ok('подбородок: прищур и голова к пальцу', chin.cls.includes('chin') && parseFloat(chin.hr) > 1, JSON.stringify(chin));
  // спина по шерсти: медленный свайп вниз
  await p.waitForTimeout(1300);
  await p.mouse.move(A.x - 20, A.top + A.h*.56); await p.mouse.down();
  for (let i = 1; i <= 14; i++){ await p.mouse.move(A.x - 20 + i*2, A.top + A.h*.56 + i*6); await p.waitForTimeout(24); }
  const arch = await cls('alisa'); await p.mouse.up();
  ok('спина: волна и хвост трубой', arch.includes('arch'), arch.join(' '));
  // против шерсти: быстро снизу вверх
  await p.waitForTimeout(900);
  await p.mouse.move(A.x + 10, A.top + A.h*.9); await p.mouse.down();
  for (let i = 1; i <= 10; i++){ await p.mouse.move(A.x + 10, A.top + A.h*.9 - i*12); await p.waitForTimeout(8); }
  const rf = await p.evaluate(() => { const c = document.querySelector('#duo .pet[data-cat="alisa"] .cat'); return {cls: [...c.classList], away: (c._away || 0) > performance.now()}; });
  await p.mouse.up();
  ok('против шерсти: встряхнулась и отвернулась', rf.cls.includes('ruffle') && rf.away, JSON.stringify(rf));
  const p1 = await purr();
  ok('зоны не меняют капли: шкала растёт как раньше', p1 > p0, `шкала ${p0} → ${p1}`);
  await shot('zones');

  // 2. ревность: только Алису больше 5 с
  await p.waitForTimeout(2600); await p.evaluate(() => { petFx.jealAt = 0; petFx.soloWho = null; window.__jr = []; const j = jealous; jealous = o => { window.__jr.push(o); const l = catOf('lapula'), pp = document.querySelector('#duo .pet[data-cat="lapula"]'); j(o); setTimeout(() => window.__jr.push({sc: pp.style.getPropertyValue('--scoot'), yawn: l.classList.contains('yawning'), away: (l._away || 0) > performance.now()}), 700); }; });
  for (let i = 0; i < 22; i++){ await p.mouse.click(A.x, A.top + A.h*.6); await p.waitForTimeout(270); }
  const jl = await p.evaluate(() => ({calls: window.__jr, note: (dayNote().jl || []).join()}));
  const fx = jl.calls[1] || {};
  ok('ревность: Лапуля реагирует один раз (смотрит, зевает или подвигается)', jl.calls.filter(x => x === 'lapula').length === 1 && jl.note.includes('lapula') && (parseFloat(fx.sc) < -5 || fx.yawn || fx.away), JSON.stringify(jl));
  await shot('jealous');

  // 3. наклон телефона: слои смещаются, при экономии кадров стоят
  await p.waitForTimeout(4600);
  const lowfx0 = await p.evaluate(() => app.classList.contains('lowfx')); await p.evaluate(() => { try { sessionStorage.removeItem(GLASS_KEY); } catch(e){} app.classList.remove('lowfx'); });   // в headless кадров мало, предохранитель мог выключить стекло
  await p.evaluate(() => { S.tilt = true; DeviceOrientationEvent.requestPermission = () => Promise.resolve('granted'); return tiltOn(true); });   // разрешение iOS подставляем: в Chromium его нет
  for (let i = 0; i < 40; i++){ await p.evaluate(g => dispatchEvent(Object.assign(new Event('deviceorientation'), {gamma: g, beta: 40, alpha: 0})), i ? 12 : 0); await p.waitForTimeout(16); }
  await p.waitForTimeout(400);
  const par = await p.evaluate(() => ({dx: parseFloat(document.querySelector('#stage').style.getPropertyValue('--dx')), duo: getComputedStyle(document.querySelector('#duo')).translate, near: getComputedStyle(document.querySelector('.nearfx')).translate}));
  ok('наклон двигает сцену, котики сдвигаются меньше лепестков', par.dx > 6 && parseFloat(par.duo) > 3 && parseFloat(par.near) > parseFloat(par.duo), JSON.stringify(Object.assign(par, {lowfxБыл: lowfx0})));
  await p.evaluate(() => app.classList.add('lowfx')); await p.waitForTimeout(100);
  ok('при экономии кадров котики на месте', await p.evaluate(() => getComputedStyle(document.querySelector('#duo')).translate === 'none'));
  await p.evaluate(() => { app.classList.remove('lowfx'); S.tilt = false; tiltOff(); });

  // 4. билет: отрыв пальцем вдоль перфорации
  await p.click('#btnShop'); await p.waitForTimeout(900);
  await p.locator('.sheet .btn.price').first().click(); await p.waitForTimeout(1400);
  const tr = await p.locator('.tear-track').boundingBox();
  await p.evaluate(() => { window.__pc = 0; const f = snd.paper; snd.paper = k => { window.__pc++; return f(k); }; });
  await p.mouse.move(tr.x + 16, tr.y + tr.height/2); await p.mouse.down();
  for (let i = 1; i <= 10; i++){ await p.mouse.move(tr.x + 16 + (tr.width - 32)*.05*i, tr.y + tr.height/2); await p.waitForTimeout(30); }
  const half = await p.evaluate(() => ({tk: +getComputedStyle(document.querySelector('.ticket')).getPropertyValue('--tk'), torn: document.querySelector('.ticket').classList.contains('torn'), clicks: window.__pc}));
  ok('на половине корешок отогнут, но держится, щелчки идут', half.tk > .35 && !half.torn && half.clicks >= 3, JSON.stringify(half));
  await shot('ticket-half');
  for (let i = 11; i <= 20; i++){ await p.mouse.move(tr.x + 16 + (tr.width - 32)*.05*i, tr.y + tr.height/2); await p.waitForTimeout(30); }
  await p.mouse.up(); await p.waitForTimeout(900);
  const torn = await p.evaluate(() => ({torn: document.querySelector('.ticket').classList.contains('torn'), saved: Object.keys(S.torn).length}));
  ok('на 85 % корешок оторван и запомнен', torn.torn && torn.saved === 1, JSON.stringify(torn));
  await shot('ticket-torn');
  await p.click('#sheetDone'); await p.waitForTimeout(700);
  // второй билет: тап по линии отрывает сам
  await p.click('#btnShop'); await p.waitForTimeout(900);
  await p.locator('.sheet .btn.price:not(.ghost)').first().click(); await p.waitForTimeout(1400);
  const tr2 = await p.locator('.tear-track').boundingBox(); await p.mouse.click(tr2.x + tr2.width*.5, tr2.y + tr2.height/2); await p.waitForTimeout(1100);
  ok('тап по перфорации отрывает сам', await p.evaluate(() => document.querySelector('.ticket').classList.contains('torn') && Object.keys(S.torn).length === 2));
  await p.click('#sheetDone'); await p.waitForTimeout(700);

  // 5. полевой журнал: филин встречен, сет «Дневные Бродяги» надет
  await p.evaluate(() => { applyLook(); showView('v-album'); }); await p.waitForTimeout(1200);
  await p.click('.desk-box'); await p.waitForTimeout(1500);
  const sj = await p.evaluate(() => ({n: document.querySelectorAll('.stamp').length, got: document.querySelectorAll('.stamp:not(.empty)').length, fresh: document.querySelectorAll('.stamp.fresh').length, seen: Object.keys(S.stampSeen).length, note: document.querySelector('.stamp:not(.empty) .ln').textContent}));
  ok('журнал: 7 штампов, 2 оттиска с пометкой Лапули', sj.n === 7 && sj.got === 2 && sj.fresh === 2 && sj.seen === 2 && sj.note.length > 3, JSON.stringify(sj));
  await shot('journal');
  await p.click('#sheetDone'); await p.waitForTimeout(600);
  await p.evaluate(() => showView('v-home')); await p.waitForTimeout(1200);
  await p.evaluate(() => { if (busyAct) endBusy(); }); await p.waitForTimeout(900);

  // 6. парные сценки: каждая ставит реквизит и пишет в дневник
  const kinds = ['plaid', 'fly', 'scope', 'note', 'tail', 'nod'], vg = {};
  for (const k of kinds){
    await p.evaluate(k => { busyPick = () => k; specialBusy = false; idle.sleeping = false; idle.lapNap = false; return startBusy(null); }, k);
    await p.waitForTimeout(900);
    vg[k] = await p.evaluate(k => ({prop: !!document.querySelector('#duo .vg') || app.classList.contains('vg-nod'), diary: (dayNote().vg || []).includes(k)}), k);
    if (k === 'plaid') await shot('vg-plaid');
    await p.evaluate(() => endBusy()); await p.waitForTimeout(1300);
  }
  ok('шесть сценок: реквизит и запись', kinds.every(k => vg[k].prop && vg[k].diary), JSON.stringify(vg));
  ok('реквизит убран после сценки', await p.evaluate(() => !document.querySelector('#duo .vg') && !app.classList.contains('vg-nod')));
  await p.click('#btnSettings'); await p.waitForTimeout(500); await p.click('#sheetDone'); await p.waitForTimeout(600);
  await p.evaluate(() => openDiary()); await p.waitForTimeout(1000);
  const dn = await p.evaluate(() => { const d = document.querySelector('.dday'); return {lines: d.querySelectorAll('p').length, notes: [...d.querySelectorAll('.lnote')].map(x => x.textContent)}; });
  ok('в дневнике сценка с пометкой Лапули', dn.notes.some(t => /плед был мой|я почти поймала/.test(t)), JSON.stringify(dn));
  await p.click('#sheetDone'); await p.waitForTimeout(600);

  // 7. комикс
  await p.evaluate(() => comic([{art: catBox("a"), cap: "раз"}, {art: catBox("l"), cap: "два", fx: "ШШШ!"}, {art: '<span class="big">🫂</span>', cap: "три"}])); await p.waitForTimeout(1300);
  ok('комикс: три панели въехали', await p.evaluate(() => document.querySelectorAll('#comic .cp.in').length === 3));
  await shot('comic');
  await p.mouse.click(200, 400); await p.waitForTimeout(300);
  ok('касание закрывает комикс', await p.evaluate(() => !document.querySelector('#comic').classList.contains('on')));

  // 8. уровень 11: нить, обрыв, гром, половинки
  await p.evaluate(() => startLevel(LEVELS[10])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(600);
  const cv = await p.locator('#garea canvas').boundingBox();
  const sg = () => p.evaluate(() => { const s = document.querySelector('#garea').__storm; return {src: s.src, dst: s.dst, succ: s.succ, snaps: s.snaps, stage: s.stage, dark: s.dark, halves: s.halves.map(h => [h.x, h.y, h.w, h.h])}; });
  const pull = async (speed) => {               // speed: px за шаг по 16 мс
    const s = await sg(); const [x0, y0] = s.src, [x1, y1] = s.dst, n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)/speed);
    await p.mouse.move(cv.x + x0, cv.y + y0); await p.mouse.down();
    for (let i = 1; i <= n + 30; i++){ const k = Math.min(1, i/n); await p.mouse.move(cv.x + x0 + (x1 - x0)*k, cv.y + y0 + (y1 - y0)*k); await p.waitForTimeout(16); const z = await p.evaluate(() => document.querySelector('#garea').__storm.thread); if (!z) break; }
    await p.mouse.up(); await p.waitForTimeout(500);
  };
  { const s0 = await sg(); const [x0, y0] = s0.src, [x1, y1] = s0.dst;      // рывок: палец пролетает полпути за одно движение
    await p.mouse.move(cv.x + x0, cv.y + y0); await p.mouse.down(); await p.waitForTimeout(30); await p.mouse.move(cv.x + (x0 + x1)/2, cv.y + y0, {steps: 4}); await p.mouse.up(); await p.waitForTimeout(500); }
  let s = await sg(); ok('резкий рывок рвёт нить', s.snaps === 1 && s.succ === 0, JSON.stringify(s));
  await pull(7);                                // ≈440 px/с
  s = await sg(); ok('медленная нить доходит, Лапуля ближе', s.succ === 1, JSON.stringify(s));
  await shot('lv11-thread');
  await pull(7); s = await sg(); ok('вторая нить, теперь от Лапули', s.succ === 2, JSON.stringify(s));
  await p.waitForTimeout(1900); s = await sg(); ok('гром гасит свет', s.dark > 0, 'dark ' + s.dark);
  await shot('lv11-dark');
  await pull(6); await pull(6); s = await sg();
  ok('четыре нити: фаза снимка', s.succ === 4 && s.stage === 'photo', JSON.stringify(s));
  await p.waitForTimeout(700); s = await sg(); await shot('lv11-halves');
  const [h0, h1] = s.halves;
  await p.mouse.move(cv.x + h0[0] + 30, cv.y + h0[1] + 40); await p.mouse.down();
  const tx = h1[0] - h0[2] + 30, ty = h1[1] + 40;
  for (let i = 1; i <= 30; i++){ await p.mouse.move(cv.x + h0[0] + 30 + (tx - h0[0] - 30)*i/30, cv.y + h0[1] + 40 + (ty - h0[1] - 40)*i/30); await p.waitForTimeout(16); }
  await p.mouse.up(); await p.waitForTimeout(600); s = await sg();
  ok('половинки защёлкнулись', s.stage === 'join' || s.stage === 'cover', s.stage);
  await p.waitForSelector('#result.on', {timeout: 8000}); await p.waitForTimeout(2600);
  const res = await p.evaluate(() => ({t: document.querySelector('#rText').textContent, st: S.stars[11]}));
  ok('уровень 11 пройден на 2+ звезды', res.st >= 2, JSON.stringify(res));
  await shot('lv11-result');

  console.log('ERRORS', errs.length ? errs.join('\n') : 'none', '| провалов:', fail);
  await b.close();
})();
