const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// третий спринт: формула капель, камера диорамы, док с ушками, закон растяжения, взгляд, лунный диск в дневнике
const {open} = require('./helper.js');
(async () => {
  const today = new Date(), dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const y3 = new Date(today.getTime() - 3*864e5);
  const st = {v4:1, v5:1, v9:1, lastDay: today.toDateString(), lastSeen: Date.now(), songSeen: 1, salvJoke: 1, giftDay: today.toDateString(), teamPicked: 1, pets: 300, drops: 0, purr: 0,
    stars: {1:3, 2:3, 3:2}, diary: {[dk(y3)]: {u: 1, pa: 4}, [dk(today)]: {u: 2, pl: 2}}};
  const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  let fail = 0; const ok = (name, cond, info = '') => { if (!cond) fail++; console.log((cond ? 'ok  ' : 'FAIL') + ' ' + name + (info ? '  ' + info : '')); };
  await p.setViewportSize({width: 393, height: 852}); await p.waitForTimeout(1400);
  await p.click('#btnStart'); await p.waitForTimeout(1600);

  // 1. формула: round((1 + 0,25n)·B)
  const tab = await p.evaluate(() => [0,1,2,3,4,5,6,7].map(n => [cyclePay(false, n), cyclePay(true, n)]));
  ok('таблица капель', JSON.stringify(tab) === '[[1,2],[1,2],[2,3],[2,3],[2,4],[2,4],[3,5],[3,5]]', JSON.stringify(tab));
  const box = await p.locator('#duo .pet[data-cat="alisa"] .cat').boundingBox(), cx = box.x + box.width/2, cy = box.y + box.height*.5;
  const get = () => p.evaluate(() => ({purr: S.purr, drops: S.drops, over: over ? over.left : null, D: perDrop(), k: document.querySelector('#purrK').textContent}));
  let g = await get();
  for (let i = g.purr; i < g.D; i++){ await p.mouse.click(cx, cy); await p.waitForTimeout(110); }
  g = await get(); ok('полная шкала без вещей: 1 капля, окно на 5', g.drops === 1 && g.over === 5, JSON.stringify(g));
  await p.waitForTimeout(520);
  for (let i = 0; i < 5; i++){ await p.mouse.click(cx, cy); await p.waitForTimeout(140); }
  await p.waitForTimeout(200); g = await get(); ok('сверхмурчание: итого 2 за 20 поглаживаний', g.drops === 2, JSON.stringify(g));
  await p.screenshot({path: __dirname + '/s3-over.png'});
  await p.waitForTimeout(1200);
  // окно 2,6 с: без поглаживаний закрывается
  for (let i = 0; i < g.D; i++){ await p.mouse.click(cx, cy); await p.waitForTimeout(110); }
  await p.waitForTimeout(3300); g = await get(); ok('окно пропущено: +1, окно закрыто', g.drops === 3 && g.over === null, JSON.stringify(g));
  // полный гардероб
  const full = await p.evaluate(() => { ACCS.forEach(id => { S.owned[id] = 1; if (id !== 'mask') putOn('a', id, true); if (id !== 'shades') putOn('l', id, true); }); renderPurr(); return {n: wornCount(), D: perDrop(), b: cyclePay(false), t: cyclePay(true)}; });
  ok('полный гардероб (очки на Алисе, маска на Лапуле): 3 и 5 капель', full.n === 7 && full.b === 3 && full.t === 5, JSON.stringify(full) + ' поглаживаний на каплю: ' + ((full.D + 5)/full.t).toFixed(2));
  await p.evaluate(() => { ACCS.forEach(id => { delete S.owned[id]; }); S.wearA = {}; S.wearL = {}; applyLook(); renderPurr(); });

  // 2. закон растяжения: быстрый горизонтальный свайп, площадь сохраняется
  await p.waitForTimeout(600);
  await p.mouse.move(cx - 50, cy + 30); await p.mouse.down(); let mx = 0, area = [];
  for (let i = 0; i < 26; i++){ await p.mouse.move(cx - 50 + (i % 2 ? 0 : 100), cy + 30, {steps: 5});
    const sc = await p.evaluate(() => document.querySelector('#duo .pet[data-cat="alisa"] .cat').style.scale);
    if (sc){ const [x, y] = sc.split(' ').map(Number); mx = Math.max(mx, x); area.push(x*y); } }
  await p.mouse.up();
  ok('растяжение вдоль пальца', mx > 1.04 && mx <= 1.2, 'макс. λx ' + mx.toFixed(3));
  ok('площадь сохраняется', area.length > 5 && area.every(a => Math.abs(a - 1) < .004), 'λx·λy от ' + Math.min(...area).toFixed(4) + ' до ' + Math.max(...area).toFixed(4));
  // вертикальный свайп: X сжимается
  await p.waitForTimeout(700); await p.mouse.move(cx, cy - 30); await p.mouse.down(); let mn = 9;
  for (let i = 0; i < 20; i++){ await p.mouse.move(cx, cy - 30 + (i % 2 ? 0 : 90), {steps: 5});
    const sc = await p.evaluate(() => document.querySelector('#duo .pet[data-cat="alisa"] .cat').style.scale); if (sc) mn = Math.min(mn, +sc.split(' ')[0]); }
  await p.mouse.up(); ok('вертикальный свайп тянет по Y', mn < .97, 'мин. λx ' + mn.toFixed(3));
  await p.waitForTimeout(800);
  ok('пружина успокоилась', await p.evaluate(() => document.querySelector('#duo .pet[data-cat="alisa"] .cat').style.scale === ''));

  // 3. взгляд: зрачки быстрее корпуса, корпус с задержкой 60 мс
  const gz = await p.evaluate(() => { const c = document.querySelector('#duo .cat'), pu = getComputedStyle(c.querySelector('.pup')), tu = getComputedStyle(c.querySelector('.turn'));
    return {pup: pu.transitionDuration, turnProp: tu.transitionProperty, turnDelay: tu.transitionDelay}; });
  ok('зрачки 0,16 с, корпус с задержкой 0,06 с', gz.pup === '0.16s' && /translate/.test(gz.turnProp) && /0\.06s/.test(gz.turnDelay), JSON.stringify(gz));
  for (let i = 0; i < 14; i++){ await p.mouse.move(60 - i, 320 - i); await p.waitForTimeout(45); }      /* палец всё время в движении: взгляд не успевает вернуться */
  const lean = await p.evaluate(() => getComputedStyle(document.querySelector('#duo .pet[data-cat="lapula"] .turn')).rotate);
  ok('корпус наклоняется к пальцу', lean !== 'none' && parseFloat(lean) < -.3, lean);

  // 4. камера
  const cam = async () => p.evaluate(() => { const w = document.querySelector('#world'), cs = s => getComputedStyle(w.querySelector(s)); return {cam: w.dataset.cam, near: cs('.ridge.near').scale, nearT: cs('.ridge.near').translate, stars: cs('.stars').scale, moon: cs('.moon').scale}; });
  for (const v of ['v-map', 'v-album', 'v-awards', 'v-home']){ await p.evaluate(v => showView(v), v); await p.waitForTimeout(1100); const c = await cam(); console.log('    камера', JSON.stringify(c));
    if (v === 'v-album') ok('альбом: наезд на дом', c.near === '1.17'); if (v === 'v-awards') ok('награды: взгляд в небо', c.stars === '1.11' && c.near === '1'); if (v === 'v-home') ok('главная: ноль', c.near === '1' && c.nearT === '0px'); }
  await p.click('#btnWardrobe'); await p.waitForTimeout(1000); ok('лист гардероба двигает камеру', (await cam()).cam === 's-wardrobe');
  await p.click('#sheetDone'); await p.waitForTimeout(900); ok('закрыли лист: камера вернулась', (await cam()).cam === 'v-home');
  await p.click('#btnShop'); await p.waitForTimeout(900); ok('лавка двигает камеру', (await cam()).cam === 's-shop'); await p.screenshot({path: __dirname + '/s3-shop.png'});
  await p.click('#sheetDone'); await p.waitForTimeout(900);

  // 5. док с ушками на трёх размерах
  for (const [W, H] of [[375, 667], [393, 852], [440, 956]]){
    await p.setViewportSize({width: W, height: H}); await p.waitForTimeout(700);
    const d = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(), m = r('#purr'), tabs = r('#tabs');
      const bs = [...document.querySelectorAll('#dock .dk')].map(b => { const q = b.getBoundingClientRect(), e = b.querySelector('.ear').getBoundingClientRect(); return {w: Math.round(q.width), h: Math.round(q.height), earTop: e.top, bottom: q.bottom}; });
      return {meterBottom: m.bottom, tabsTop: tabs.top, bs, mini: document.querySelector('#miniPlayer') ? r('#miniPlayer').top : null}; });
    const earTop = Math.min(...d.bs.map(x => x.earTop)), bottom = Math.max(...d.bs.map(x => x.bottom));
    ok(`док ${W}×${H}`, d.bs.every(x => x.w >= 80 && x.h >= 52) && earTop >= d.meterBottom + 2 && bottom < d.tabsTop - 4, `кнопки ${d.bs.map(x => x.w + '×' + x.h).join(', ')}; ушки на ${(earTop - d.meterBottom).toFixed(1)} px ниже шкалы; до таб-бара ${(d.tabsTop - bottom).toFixed(0)} px`);
    await p.screenshot({path: __dirname + `/s3-home-${W}.png`});
  }
  await p.setViewportSize({width: 393, height: 852}); await p.waitForTimeout(500);

  // 6. лунный диск в дневнике
  await p.evaluate(() => showView('v-album')); await p.waitForTimeout(900);
  const moonD = () => p.evaluate(() => { const m = document.querySelector('#moonPhase path').getAttribute('d').match(/A([\d.]+) 1 0 0 (\d) 0 -1Z/); return +m[1]*(m[2] === '1' ? -1 : 1); });
  const moon0 = await moonD();
  await p.click('#diaryG .desk-book'); await p.waitForTimeout(1800);
  const info = () => p.evaluate(() => [...document.querySelectorAll('.vinfo > *')].map(x => x.textContent));
  let inf = await info(); ok('диск открыт на сегодня', inf[0] === 'сегодня', JSON.stringify(inf));
  await p.screenshot({path: __dirname + '/s3-diary.png'});
  const disc = await p.locator('.vdisc').boundingBox(), ox = disc.x + disc.width/2, oy = disc.y + disc.height/2, R = disc.width*.4;
  const turn = async (a0, a1) => { const pt = a => [ox + Math.sin(a*Math.PI/180)*R, oy - Math.cos(a*Math.PI/180)*R]; await p.mouse.move(...pt(a0)); await p.mouse.down(); const n = Math.ceil(Math.abs(a1 - a0)/6); for (let i = 1; i <= n; i++){ await p.mouse.move(...pt(a0 + (a1 - a0)*i/n)); } await p.mouse.up(); await p.waitForTimeout(600); };
  await turn(0, 73);   // 73° по часовой ≈ 6 дней вперёд
  inf = await info(); const moon1 = await moonD();
  ok('повернули вперёд: дата и луна на небе сменились', /^через 6 дней$/.test(inf[0]) && Math.abs(moon1 - moon0) > .3, JSON.stringify(inf));
  await p.screenshot({path: __dirname + '/s3-diary-turn.png'});
  // найти полнолуние: крутим по дню с клавиатуры
  await p.focus('.vdisc'); let fullTxt = '';
  for (let i = 0; i < 30 && !fullTxt; i++){ await p.keyboard.press('ArrowRight'); const t = await info(); if (/прилетит/.test(t[2])) fullTxt = t.join(' | '); }
  ok('в полнолуние обещан гость', !!fullTxt, fullTxt);
  await p.keyboard.press('Home'); await p.waitForTimeout(300);
  for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(700);
  inf = await info(); const sel = await p.evaluate(() => { const e = document.querySelector('.dday.vsel'); return e ? e.dataset.k : null; });
  ok('три дня назад: запись найдена и подсвечена', /^3 дня назад$/.test(inf[0]) && sel === dk(y3), JSON.stringify(inf) + ' ' + sel);
  await p.screenshot({path: __dirname + '/s3-diary-back.png'});
  await p.click('#sheetDone'); await p.waitForTimeout(900);
  ok('закрыли дневник: луна настоящая', Math.abs(await moonD() - moon0) < .002);
  ok('фаза для шкалы не тронута', await p.evaluate(() => typeof fullMoon() === 'boolean'));
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none', '| провалов:', fail); await b.close();
})();
