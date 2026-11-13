const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// новые детали: дорожки прицела, пустой магазин, вспышка, нокаут, кнопка супера
const {chromium} = require('playwright');
(async () => {
  const W = +(process.argv[2] || 393), H = +(process.argv[3] || 852);
  const b = await chromium.launch(), p = await (await b.newContext({viewport: {width: W, height: H}, deviceScaleFactor: 2})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/arena/index.html'); await p.waitForTimeout(600);
  await p.evaluate(() => { S.how = true; }); await p.click('.catc >> nth=0'); await p.click('.mode >> nth=0'); await p.waitForTimeout(700);
  await p.screenshot({path: __dirname + `/n-start-${W}.png`});
  // прицел вверх, к стене
  await p.mouse.move(W - 140, H - 130); await p.mouse.down(); await p.mouse.move(W - 150, H - 200, {steps: 4}); await p.waitForTimeout(250);
  await p.screenshot({path: __dirname + `/n-aim-${W}.png`});
  // вернуть палец в центр: отмена
  await p.mouse.move(W - 140, H - 132, {steps: 3}); await p.waitForTimeout(120); await p.screenshot({path: __dirname + `/n-cancel-${W}.png`}); await p.mouse.up();
  const ammo0 = await p.evaluate(() => G.me.ammo);
  // три выстрела подряд и четвёртый в пустой магазин
  for (let i = 0; i < 4; i++){ await p.mouse.move(W - 140, H - 130); await p.mouse.down(); await p.mouse.move(W - 140, H - 190, {steps: 2}); await p.mouse.up(); await p.waitForTimeout(340); }
  const st = await p.evaluate(() => ({ammo: G.me.ammo, emptyAgo: +(G.t - G.me.emptyT).toFixed(2)}));
  await p.waitForTimeout(60); await p.screenshot({path: __dirname + `/n-empty-${W}.png`});
  // вспышка и нокаут ближайшего врага, супер заряжен
  await p.evaluate(() => { const foe = G.fighters.find(f => f.team !== G.me.team); foe.x = G.me.x + 90; foe.y = G.me.y - 120; foe.ai.t = 99; G.me.sup = .99; hurt(foe, 400, G.me); hurt(foe, 9999, G.me); });
  await p.waitForTimeout(90); await p.screenshot({path: __dirname + `/n-ko-${W}.png`});
  await p.waitForTimeout(250); await p.screenshot({path: __dirname + `/n-super-${W}.png`});
  console.log('ammo before', ammo0, 'after 4 shots', JSON.stringify(st), 'sup', await p.evaluate(() => G.me.sup), 'ERRORS', errs.join('|') || 'none');
  await b.close();
})();
