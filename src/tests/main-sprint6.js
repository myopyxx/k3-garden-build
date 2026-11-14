const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// шестой спринт: зоны и росинка, серия, дуэт, полёт капель и перекат цифр, терраса, капсула шкалы, созерцание, купон, слово дня, тропа, постер, примерка
const {open} = require('./helper.js');
(async () => {
  const today = new Date(), T = Date.now();
  const st = {v4:1, v5:1, v9:1, lastDay: today.toDateString(), lastSeen: T, songSeen: 1, salvJoke: 1, giftDay: today.toDateString(), teamPicked: 1, pets: 300, drops: 700, purr: 0,
    stars: {1:3, 2:3, 3:2, 4:2, 5:1}, owned: {bow:1, cape:1}, diary: {}};
  const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  let fail = 0; const ok = (name, cond, info = '') => { if (!cond) fail++; console.log((cond ? 'ok  ' : 'FAIL') + ' ' + name + (info ? '  ' + info : '')); };
  const shot = n => p.screenshot({path: __dirname + '/s6-' + n + '.png'});
  await p.setViewportSize({width: 393, height: 852}); await p.waitForTimeout(1400);
  await p.click('#btnStart'); await p.waitForTimeout(1600);
  const cat = async w => { const r = await p.locator(`#duo .pet[data-cat="${w}"] .cat`).boundingBox(); return {x: r.x + r.width/2, top: r.y, h: r.height}; };
  const A = await cat('alisa'), L = await cat('lapula');
  const tap = async (c, ry, ms = 130) => { await p.mouse.click(c.x, c.top + c.h*ry); await p.waitForTimeout(ms); };
  const g = () => p.evaluate(() => ({purr: S.purr, drops: S.drops, shown: +document.querySelector('#hDrops').textContent, streak: document.querySelector('#purr').dataset.streak, over: over ? over.left : null, D: perDrop()}));

  // 1. зоны: тон по ушам выше, лапки мнут внизу
  await p.evaluate(() => { window.__tk = []; const t = snd.tick; snd.tick = k => { window.__tk.push(+k.toFixed(3)); return t(k); }; });
  await tap(A, .2); await tap(A, .5); await tap(A, .86, 60);
  const z = await p.evaluate(() => ({tk: window.__tk, knead: document.querySelector('#duo .pet[data-cat="alisa"] .cat').classList.contains('paws')}));
  ok('уши звучат выше, внизу лапки мнут', z.tk.length === 3 && z.tk[0] - 1/15 > .12 && z.knead, JSON.stringify(z));
  await p.waitForTimeout(1100);
  ok('лапки успокоились', !(await p.evaluate(() => document.querySelector('#duo .pet[data-cat="alisa"] .cat').classList.contains('paws'))));
  // росинка: подставляем удачу, вторая за 25 с не выпадает
  let s0 = await g(); await p.evaluate(() => { window.__r = Math.random; Math.random = () => .01; }); await tap(A, .88, 700);
  let s1 = await g(); await tap(A, .88, 300); let s2 = await g(); await p.evaluate(() => { Math.random = window.__r; });
  ok('янтарная росинка: +1 капля, повторно не выпадает', s1.drops === s0.drops + 1 && s2.drops === s1.drops && s1.shown === s1.drops, JSON.stringify([s0.drops, s1.drops, s2.drops, s1.shown]));

  // 2. дуэт: Алиса и Лапуля подряд дают шаг шкалы один раз за шкалу
  await p.waitForTimeout(1500); await p.evaluate(() => { S.purr = 0; petFx.duet = false; petFx.who = null; renderPurr(); });
  await tap(A, .5, 200); await tap(L, .5, 120); const d1 = await p.evaluate(() => ({purr: S.purr, duet: app.classList.contains('duet')})); await tap(A, .5, 200); await tap(L, .5, 200); const d2 = await g();
  ok('дуэт ласки: +1 шаг один раз', d1.purr === 3 && d1.duet && d2.purr === 5, JSON.stringify([d1, d2.purr]));
  await shot('duet');

  // 3. полёт капель и серия
  const fill = async () => { let s = await g(); while (s.over === null && s.purr < s.D){ await tap(A, .5, 105); s = await g(); if (s.purr === 0) break; } };
  const before = await g(); await fill(); await p.waitForTimeout(450);
  const mid = await g(); await p.waitForTimeout(1500); const aft = await g();
  ok('капли долетают по одной: счётчик догоняет баланс', mid.drops > before.drops && aft.shown === aft.drops, JSON.stringify({было: before.drops, стало: aft.drops, чип: aft.shown}));
  await p.waitForTimeout(2300);                                   // окно сверхмурчания закрылось
  await tap(A, .5, 105); await tap(A, .5, 105); await tap(A, .5, 105); const h2 = await g();
  ok('серия: новая шкала сразу после прошлой даёт вторую ступень', h2.streak === '2', JSON.stringify(h2));
  await fill(); await p.waitForTimeout(3000); await tap(A, .5, 105); await tap(A, .5, 105); await tap(A, .5, 105); const h3 = await g(); await shot('streak');
  ok('третья ступень', h3.streak === '3', JSON.stringify(h3));
  const gold = await p.evaluate(() => +getComputedStyle(document.querySelector('#purrBar'), '::after').opacity);
  ok('на третьей ступени полоска золотая', gold === 1, 'непрозрачность золота ' + gold);
  await p.waitForTimeout(4400); ok('4 с тишины остужают серию', (await g()).streak === '1');

  // 4. терраса, капсула, созерцание
  const home = await p.evaluate(() => { const d = document.querySelector('#duo'), bg = getComputedStyle(d, '::before'), m = document.querySelector('#purr').getBoundingClientRect(), dr = d.getBoundingClientRect(), paws = document.querySelector('#duo .cat').getBoundingClientRect();
    return {svg: /svg/.test(bg.backgroundImage), tw: parseFloat(bg.width), mw: Math.round(m.width), gap: Math.round(m.top - paws.bottom), gaze: app.classList.contains('gaze'), op: getComputedStyle(document.querySelector('#purr')).opacity}; });
  ok('терраса нарисована, шкала узкая и ниже лап', home.svg && home.tw > 340 && home.mw <= 249 && home.gap >= 6, JSON.stringify(home));
  ok('после 3,5 с тишины главная в созерцании', home.gaze && +home.op < .8, 'opacity ' + home.op);
  await shot('home-gaze');
  await p.mouse.click(A.x, A.top - 60); await p.waitForTimeout(260);
  ok('касание возвращает шкалу и док', await p.evaluate(() => !app.classList.contains('gaze') && +getComputedStyle(document.querySelector('#purr')).opacity > .95));

  // 5. перекат цифр и купон с корешком
  await p.click('#btnShop'); await p.waitForTimeout(1000);
  const d0 = await p.evaluate(() => S.drops);
  await p.evaluate(() => { const bs = [...document.querySelectorAll('#sheet .btn.price')].filter(x => !x.disabled); bs[0].click(); });
  const roll = await p.evaluate(() => ({cls: document.querySelector('#hDrops').className, old: document.querySelector('#hDrops').dataset.old, txt: document.querySelector('#hDrops').textContent, drops: S.drops}));
  ok('баланс перекатывается вниз при покупке', /rolldn/.test(roll.cls) && +roll.old === d0 && +roll.txt === roll.drops && roll.drops < d0, JSON.stringify(roll));
  await p.waitForTimeout(1500);
  const tk = await p.evaluate(() => { const t = document.querySelector('.ticket'); if (!t) return null; const m = t.querySelector('.tk-main'), s = t.querySelector('.tk-stub'); return {main: !!m, stub: !!s, mask: /radial/.test(getComputedStyle(m).webkitMaskImage || getComputedStyle(m).maskImage), dash: getComputedStyle(s, '::before').borderTopStyle, tear: t.classList.contains('tear'), title: m.querySelector('b').textContent}; });
  ok('купон: вырезы, пунктир и отрывной корешок', tk && tk.main && tk.stub && tk.mask && tk.dash === 'dashed' && tk.tear, JSON.stringify(tk));
  await shot('ticket'); await p.click('#sheetDone'); await p.waitForTimeout(800);

  // 6. уровни: фишки слова дня, импульс по тропе, наклон постера
  await p.evaluate(() => showView('v-map')); await p.waitForTimeout(1300);
  const mp = await p.evaluate(() => { const gl = document.querySelector('.wmini i.glint'), tp = document.querySelector('.trail .tpulse'); return {glint: !!gl, first: gl ? [...gl.parentElement.children].indexOf(gl) : -1, an: gl ? getComputedStyle(gl, '::after').animationName : '', pulse: tp ? getComputedStyle(tp).animationName : '', len: tp ? tp.getAttribute('d').split('C').length - 1 : 0, ms: tp ? (tp.getAttribute('d').match(/M/g) || []).length : 0}; });
  ok('слово дня: блик на первой пустой фишке', mp.glint && mp.first === 0 && mp.an === 'chipGlint', JSON.stringify(mp));
  ok('тропа: импульс идёт одной нитью по пройденным уровням', mp.pulse === 'trailPulse' && mp.len === 5 && mp.ms === 1, 'сегментов ' + mp.len);
  await shot('map');
  await p.evaluate(() => document.querySelectorAll('#map .node')[2].click()); await p.waitForTimeout(1100);
  const pb = await p.locator('.poster').boundingBox(); await p.mouse.move(pb.x + pb.width*.85, pb.y + pb.height*.2); await p.mouse.down(); await p.mouse.move(pb.x + pb.width*.9, pb.y + pb.height*.25); await p.waitForTimeout(150);
  const tilt = await p.evaluate(() => { const e = document.querySelector('.poster'); return {t: e.classList.contains('tilt'), ry: e.style.getPropertyValue('--pry'), m: getComputedStyle(e).transform.slice(0, 9)}; }); await shot('poster'); await p.mouse.up(); await p.waitForTimeout(600);
  ok('постер наклоняется за пальцем и возвращается', tilt.t && parseFloat(tilt.ry) > 5 && tilt.m === 'matrix3d(' && await p.evaluate(() => !document.querySelector('.poster').classList.contains('tilt')), JSON.stringify(tilt));
  await p.click('#sheetDone'); await p.waitForTimeout(800);

  // 7. гардероб: вещь качается, кошка подпрыгивает
  await p.evaluate(() => showView('v-home')); await p.waitForTimeout(900);
  await p.click('#btnWardrobe'); await p.waitForTimeout(1100);
  const wr = await p.evaluate(() => { const b = document.querySelectorAll('.witems .wit')[0]; b.click(); return {e: b.querySelector('.e').getAnimations().length, cat: [...document.querySelectorAll('#duo .pet')].filter(x => x.getAnimations().length).length, sq: document.querySelectorAll('#duo .cat.content').length}; });
  ok('примерка: маятник на вещи, отскок и прищур у кошек', wr.e === 1 && wr.cat >= 1 && wr.sq >= 1, JSON.stringify(wr));
  await p.click('#sheetDone'); await p.waitForTimeout(700);
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none', '| провалов:', fail); await b.close();
})();
