const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// главная: тап, поглаживание свайпом, упругая деформация, сверхмурчание, бонус нарядов
const {open} = require('./helper.js');
(async () => {
  const st = {v4:1, v5:1, v9:1, lastDay: new Date().toDateString(), lastSeen: Date.now(), songSeen: 1, salvJoke: 1, giftDay: new Date().toDateString(), teamPicked: 1, pets: 60, drops: 0, purr: 0};
  const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  await p.setViewportSize({width: 393, height: 852}); await p.waitForTimeout(1400);
  await p.click('#btnStart'); await p.waitForTimeout(1600);
  const get = () => p.evaluate(() => ({purr: S.purr, drops: S.drops, pets: S.pets, over: over ? over.left : null, D: perDrop(), k: document.querySelector('#purrK').textContent, n: document.querySelector('#purrN').textContent}));
  const box = await p.locator('#duo .pet[data-cat="alisa"] .cat').boundingBox(), cx = box.x + box.width/2, cy = box.y + box.height*.55;
  // 1. тап: одно поглаживание
  await p.mouse.click(cx, cy); await p.waitForTimeout(200);
  let s = await get(); console.log('после тапа', JSON.stringify(s));
  // 2. свайп взад-вперёд 1,6 с: считаем поглаживания и ловим деформацию
  await p.mouse.move(cx - 40, cy); await p.mouse.down(); let maxScale = 0, maxRot = 0; const t0 = Date.now();
  for (let i = 0; Date.now() - t0 < 1600; i++){ await p.mouse.move(cx + (i % 2 ? -40 : 40), cy + (i % 3)*3, {steps: 6});
    const tr = await p.evaluate(() => { const c = document.querySelector('#duo .pet[data-cat="alisa"] .cat'); return [c.style.scale, c.style.rotate]; });
    if (tr[0]){ maxScale = Math.max(maxScale, Math.abs(parseFloat(tr[0]) - 1)); maxRot = Math.max(maxRot, Math.abs(parseFloat(tr[1]) || 0)); } }
  await p.screenshot({path: __dirname + '/pet-stroke.png'});
  await p.mouse.up(); const s2 = await get();
  console.log('после 1,6 с свайпа', JSON.stringify(s2), 'поглаживаний за свайп:', s2.pets - s.pets - 1, 'макс. растяжение', maxScale.toFixed(3), 'макс. наклон', maxRot.toFixed(1) + '°');
  await p.waitForTimeout(700);
  console.log('пружина успокоилась:', await p.evaluate(() => document.querySelector('#duo .pet[data-cat="alisa"] .cat').style.scale === ''));
  // 3. дотянуть шкалу тапами до полной и продолжить: сверхмурчание
  await p.waitForTimeout(3200);   // если окно уже открылось от свайпа, дать ему закрыться
  let g = await get(); const d0 = g.drops;
  for (let i = g.purr; i < g.D; i++){ await p.mouse.click(cx, cy - 20); await p.waitForTimeout(120); }
  g = await get(); console.log('шкала полная', JSON.stringify(g), 'капель за шкалу:', g.drops - d0);
  await p.waitForTimeout(600); await p.screenshot({path: __dirname + '/pet-over.png'});
  for (let i = 0; i < 5; i++){ await p.mouse.click(cx, cy - 20); await p.waitForTimeout(150); }
  await p.waitForTimeout(250); await p.screenshot({path: __dirname + '/pet-overwin.png'});
  g = await get(); console.log('после 5 поглаживаний в окне', JSON.stringify(g), 'итого за цикл:', g.drops - d0);
  await p.waitForTimeout(1200); g = await get(); console.log('шкала вернулась', JSON.stringify(g));
  // 4. окно без поглаживаний закрывается само, капли не удваиваются
  const d1 = g.drops; for (let i = g.purr; i < g.D; i++){ await p.mouse.click(cx, cy - 20); await p.waitForTimeout(120); }
  await p.waitForTimeout(3400); g = await get(); console.log('окно пропущено', JSON.stringify(g), 'за цикл:', g.drops - d1);
  // 5. наряды: две вещи дают +1 к шкале, бантики укорачивают её
  console.log('с бантиком и плащом', JSON.stringify(await p.evaluate(() => { S.owned.bow = 1; S.owned.cape = 1; putOn('a', 'bow', true); putOn('a', 'cape', true); renderPurr(); return {D: perDrop(), bonus: wearBonus(), worn: wornCount()}; })));
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
