const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// альбом: новый снимок проявляется трением пальца; уже открытые снимки старого сохранения остаются открытыми; наклон при просмотре
const {open} = require('./helper.js');
const SP = __dirname + '/';
(async () => {
  const today = new Date().toDateString();
  const base = {v4:1, v5:1, v9:1, lastDay: today, lastSeen: Date.now(), songSeen: 1, salvJoke: 1, giftDay: today, teamPicked: 1, pets: 60, stars: {1:3, 2:2}};   // 5 звёзд: открыты снимки 1 и 2
  // А. старое сохранение: оба снимка уже проявлены раньше
  let {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, {seenPh: 2}))});
  await p.setViewportSize({width: 393, height: 852}); await p.click('#btnStart'); await p.waitForTimeout(1400);
  await p.evaluate(() => showView('v-album')); await p.waitForTimeout(1500);
  console.log('старое сохранение: слоёв проявителя', await p.evaluate(() => document.querySelectorAll('.scratch-layer').length), '| открытых снимков', await p.evaluate(() => document.querySelectorAll('#polas .ph.has').length), '| seenPh', await p.evaluate(() => S.seenPh));
  await b.close();
  // Б. второй снимок только что открылся: его нужно проявить
  ({b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(Object.assign({}, base, {seenPh: 1}))}));
  await p.setViewportSize({width: 393, height: 852}); await p.click('#btnStart'); await p.waitForTimeout(1400);
  await p.evaluate(() => showView('v-album')); await p.waitForTimeout(1500);
  const box = await p.locator('.scratch-layer').boundingBox();
  console.log('новый снимок: слой проявителя', box ? Math.round(box.width) + '×' + Math.round(box.height) : 'НЕТ', '| подпись:', await p.evaluate(() => (document.querySelector('.pola.scratch .drtag') || {}).textContent));
  await p.screenshot({path: SP + 'scratch-0.png'});
  // тап по подписи не открывает снимок раньше времени
  await p.mouse.click(box.x + box.width/2, box.y + box.height + 14); await p.waitForTimeout(300);
  console.log('просмотр открылся до проявки:', await p.evaluate(() => document.querySelector('#viewer').classList.contains('on')));
  // трём зигзагом
  await p.mouse.move(box.x + 8, box.y + 12); await p.mouse.down(); let rows = 0, mid = false;
  for (let y = 12; y < box.height && !(await p.evaluate(() => !document.querySelector('.pola.scratch'))); y += 20, rows++){
    await p.mouse.move(box.x + (rows % 2 ? 8 : box.width - 8), box.y + y, {steps: 8});
    if (rows === 2 && !mid){ mid = true; await p.screenshot({path: SP + 'scratch-1.png'}); } }
  await p.mouse.up(); await p.waitForTimeout(1500);
  console.log('проходов пальцем:', rows, '| проявлен:', await p.evaluate(() => !document.querySelector('.scratch-layer')), '| seenPh', await p.evaluate(() => S.seenPh), '| открытых снимков', await p.evaluate(() => document.querySelectorAll('#polas .ph.has').length));
  await p.screenshot({path: SP + 'scratch-2.png'});
  // просмотр: наклон за пальцем
  await p.click('#polas .pola >> nth=1', {force: true}); await p.waitForTimeout(900);   // снимки качаются на гирлянде, ждать их неподвижности бессмысленно
  const d = await p.locator('#viewer .deck').boundingBox(); await p.mouse.move(d.x + d.width*.85, d.y + d.height*.25); await p.waitForTimeout(300);
  console.log('наклон в просмотре:', await p.evaluate(() => { const s = document.querySelector('#viewer .deck').style; return s.getPropertyValue('--vry') + ' / ' + s.getPropertyValue('--vrx'); }));
  await p.screenshot({path: SP + 'scratch-3.png'});
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
