const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// пятый спринт: эффекты сетов на главной, туча на середине уровня 7, нить резонанса в третьем раунде уровня 8, луна в дневнике не меняет шкалу
const {open} = require('./helper.js');
(async () => {
  const today = new Date(), T = Date.now();
  const st = {v4:1, v5:1, v9:1, lastDay: today.toDateString(), lastSeen: T, songSeen: 1, salvJoke: 1, giftDay: today.toDateString(), teamPicked: 1, pets: 300, drops: 40, purr: 0,
    stars: {1:3, 2:3, 3:2, 4:2, 5:1, 6:1, 7:1, 8:1}, owned: {bow:1, cape:1, ring:1, tiara:1, wreath:1, shades:1, mask:1}, diary: {}};
  const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  p.on('console', m => { if (m.type() === 'warning' && !/AudioContext|autoplay/i.test(m.text())) errs.push('WARN ' + m.text()); });
  let fail = 0; const ok = (name, cond, info = '') => { if (!cond) fail++; console.log((cond ? 'ok  ' : 'FAIL') + ' ' + name + (info ? '  ' + info : '')); };
  const shot = n => p.screenshot({path: __dirname + '/s5-' + n + '.png'});
  await p.setViewportSize({width: 393, height: 852}); await p.waitForTimeout(1400);
  await p.click('#btnStart'); await p.waitForTimeout(1600);
  const wear = ids => p.evaluate(ids => { S.wearA = {}; S.wearL = {}; ids.forEach(id => { putOn('a', id, true); putOn('l', id, true); }); applyLook(); renderPurr(); }, ids);
  await p.evaluate(() => { window.__fx = []; const o = FX.burst; FX.burst = (x, y, opt) => { window.__fx.push((opt.emojis || []).join('') + '×' + opt.n); return o(x, y, opt); }; });
  const box = await p.locator('#duo .pet[data-cat="alisa"] .cat').boundingBox(), cx = box.x + box.width/2, cy = box.y + box.height*.55;
  const swipe = async () => { await p.mouse.move(cx - 45, cy); await p.mouse.down(); for (let i = 0; i < 14; i++) await p.mouse.move(cx - 45 + (i % 2 ? 0 : 90), cy, {steps: 5}); await p.mouse.up(); await p.waitForTimeout(300); };
  const fx = async () => { const f = await p.evaluate(() => { const r = window.__fx; window.__fx = []; return r; }); return f; };

  // 1. сеты на главной
  await wear(['tiara', 'bow']);
  const prom = await p.evaluate(() => ({cls: document.querySelector('#duo').className, an: getComputedStyle(document.querySelector('#duo .cat .acc-tiara')).animationName, an2: getComputedStyle(document.querySelector('#duo .cat .acc-bow')).animationName}));
  ok('«Королевы Выпускного»: короны и бантики вспыхивают', /set-prom/.test(prom.cls) && prom.an === 'promGlint' && prom.an2 === 'promGlint', JSON.stringify(prom));
  await wear(['ring', 'shades']);
  const day = await p.evaluate(() => ({cls: document.querySelector('#duo').className, an: getComputedStyle(document.querySelector('#duo .cat .sglint')).animationName}));
  ok('«Дневные Бродяги»: зайчик на очках', /set-day/.test(day.cls) && !/set-prom/.test(day.cls) && day.an === 'dayGlint', JSON.stringify(day));
  await p.waitForTimeout(4200); await shot('home-day');
  await wear(['cape', 'mask']); await fx(); const sw0 = Date.now(); await swipe(); const swMs = Date.now() - sw0; let f = await fx();
  ok('«Бал у Сальваторе»: рубиновые искры при свайпе, по три и не чаще раза в 0,45 с', f.some(x => /♦️×3/.test(x)) && f.filter(x => /♦️/.test(x)).length <= Math.ceil(swMs/450) + 1, f.filter(x => /♦️/.test(x)).length + ' вспышек за ' + swMs + ' мс');
  await wear(['wreath', 'ring']); await fx(); await swipe(); f = await fx();
  ok('«Полночь в Форксе»: по одному лепестку', f.some(x => /🌹×1/.test(x)) && !f.some(x => /♦️/.test(x)), f.join(' '));
  await wear(['bow']); await fx(); await swipe(); f = await fx();
  ok('без сета лишних частиц нет', !f.some(x => /♦️|🌹/.test(x)), f.join(' '));

  // 2. уровень 7: туча на середине пути. Бот держит Лапулю в тени, на туче отпускает солнце
  await wear([]);
  await p.evaluate(() => startLevel(LEVELS[6])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(300);
  const res7 = await p.evaluate(() => new Promise(res => { const a = document.querySelector('#garea'), s = a.__sun, log = {storm: 0, burnAtStorm: null, t: 0}; let seen = false;
    const iv = setInterval(() => { if (!a.isConnected || !s.alive){ clearInterval(iv); return res(log); }
      const x = Math.min(s.END, s.START + s.SPEED*s.t); let best = null;
      for (let k = 0; k <= 40; k++){ const an = s.AMIN + (s.AMAX - s.AMIN)*k/40; if (s.shadedAt(x + s.SPEED*.35, an) && s.shadedAt(x, an)){ if (best === null || Math.abs(an - s.a) < Math.abs(best - s.a)) best = an; } }
      if (best !== null) s.setTarget(best);
      const mid = s.START + (s.END - s.START)*.5; if (x >= mid && !seen){ seen = true; log.t = s.t; setTimeout(() => { log.storm = 1; window.__stormShot = 1; }, 1500); }
    }, 40); setTimeout(() => { clearInterval(iv); res(log); }, 70000); }).catch(e => ({err: String(e)})));
  await p.waitForTimeout(2200);
  const r7 = (await p.textContent('#rText').catch(() => '')).replace(/\s+/g, ' ').trim();
  ok('уровень 7 пройден ботом, туча была', res7.storm === 1 && /\S/.test(r7), JSON.stringify(res7) + ' · ' + r7.slice(0, 110));
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);
  // туча в кадре и её действие: ставим Лапулю на середину и выводим солнце на открытое место
  await p.evaluate(() => startLevel(LEVELS[6])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(300);
  const st7 = await p.evaluate(() => new Promise(res => { const s = document.querySelector('#garea').__sun, out = [];
    const iv = setInterval(() => { const x = Math.min(s.END, s.START + s.SPEED*s.t), mid = s.START + (s.END - s.START)*.5;
      let open = null; for (let k = 0; k <= 40; k++){ const an = s.AMIN + (s.AMAX - s.AMIN)*k/40; if (!s.shadedAt(x, an) && !s.cloudCover(s.t, an)){ open = an; break; } }
      let shade = null; for (let k = 0; k <= 40; k++){ const an = s.AMIN + (s.AMAX - s.AMIN)*k/40; if (s.shadedAt(x, an) && s.shadedAt(x + 40, an)){ shade = an; break; } }
      if (x < mid){ if (shade !== null) s.setTarget(shade); } else { if (open !== null) s.setTarget(open); out.push([+(x - mid).toFixed(0), +s.expT.toFixed(2)]); }
      if (!s.alive || x > mid + s.SPEED*9){ clearInterval(iv); res({out: out.filter((_, i) => i % 12 === 0), alive: s.alive}); } }, 50); }));
  await shot('sun-after');
  const e0 = st7.out[0][1], e6 = (st7.out.find(o => o[0] > 0 && o[1] > e0 + .05) || [9999])[0];
  ok('пока туча, солнце на открытом месте не жжёт', st7.out.length > 4 && e6 > 60, 'ожог начал расти через ' + e6 + ' px после середины · ' + JSON.stringify(st7.out.slice(0, 8)));
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);

  // 3. уровень 8, третий раунд: нить между двумя прослушанными с одинаковым ритмом
  await p.evaluate(() => startLevel(LEVELS[7])); await p.waitForTimeout(900); await p.click('.overlay .go'); await p.waitForTimeout(900);
  const g8 = await p.locator('#garea canvas').first().boundingBox(); let m8 = null;
  for (let step = 0; step < 40; step++){
    const stt = await p.evaluate(() => { const m = document.querySelector('#garea').__mask; return {kind: m.kind, busy: m.busy, alive: m.alive, sp: m.guests.filter(g => g.special && !g.sel && g.state !== 'out').map(g => ({x: g.x, y: g.y}))}; });
    if (!stt.alive) break;
    if (stt.busy){ await p.waitForTimeout(400); continue; }
    if (stt.kind === 'pair'){ m8 = await p.evaluate(() => { const m = document.querySelector('#garea').__mask, pr = m.guests.filter(g => g.special); pr.forEach(g => g.known = true); return {pair: pr.map(g => g.bpm), n: m.guests.length}; }); break; }
    for (const g of stt.sp){ await p.mouse.click(g8.x + g.x, g8.y + g.y); await p.waitForTimeout(250); }
    await p.evaluate(() => document.querySelector('#garea').__mask.confirmBtn.click()); await p.waitForTimeout(900);
  }
  ok('уровень 8: дошли до третьего раунда, пара с одним ритмом прослушана', m8 && m8.pair.length === 2 && m8.pair[0] === m8.pair[1], JSON.stringify(m8));
  await p.waitForTimeout(600); await shot('mask-thread');
  const pr = await p.evaluate(() => document.querySelector('#garea').__mask.guests.filter(g => g.special).map(g => ({x: g.x, y: g.y})));
  for (const g of pr){ await p.mouse.click(g8.x + g.x, g8.y + g.y); await p.waitForTimeout(300); }
  ok('обоих выбрали: нить золотая', (await p.evaluate(() => document.querySelector('#garea').__mask.guests.filter(g => g.special && g.sel).length)) === 2); await shot('mask-thread-gold');

  await p.evaluate(() => exitLevel()); await p.waitForTimeout(600);

  // 4. лунный диск не включает бонус полнолуния
  const moon = await p.evaluate(() => { const real = fullMoon(), D = perDrop(); const full = Date.now() + ((.5 - moonPhase() + 1) % 1)*SYNODIC*864e5; previewMoon(full); const r = {real, after: fullMoon(), D, D2: perDrop(), lit: +document.querySelector('#moon').style.getPropertyValue('--lit')}; applyMoon(); return r; });
  ok('диск меняет только вид луны: шкала и полнолуние считают настоящее время', moon.real === moon.after && moon.D === moon.D2 && moon.lit > .95, JSON.stringify(moon));
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none', '| провалов:', fail); await b.close();
})();
