const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// арена: меню, обучение и ручное управление мышью (как пальцем)
const {chromium} = require('playwright');
(async () => {
  const W = +(process.argv[2] || 393), H = +(process.argv[3] || 852);
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: W, height: H}, deviceScaleFactor: 2});
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/arena/index.html'); await p.waitForTimeout(800);
  await p.screenshot({path: __dirname + `/am-menu-${W}.png`, fullPage: false});
  await p.click('.catc >> nth=1'); await p.waitForTimeout(300);
  await p.click('.mode >> nth=0'); await p.waitForTimeout(500); await p.screenshot({path: __dirname + `/am-how-${W}.png`});
  await p.click('#howGo'); await p.waitForTimeout(1500);
  console.log('me', await p.evaluate(() => G.me.kind + ' ' + Math.round(G.me.x) + ',' + Math.round(G.me.y)));
  // бег вверх-вправо 1.2 с
  await p.mouse.move(90, H - 160); await p.mouse.down(); await p.mouse.move(130, H - 210, {steps: 5}); await p.waitForTimeout(1200);
  await p.screenshot({path: __dirname + `/am-move-${W}.png`}); await p.mouse.up();
  console.log('moved to', await p.evaluate(() => Math.round(G.me.x) + ',' + Math.round(G.me.y)));
  // прицел правым пальцем
  await p.mouse.move(W - 140, H - 120); await p.mouse.down(); await p.mouse.move(W - 140, H - 190, {steps: 5}); await p.waitForTimeout(300);
  await p.screenshot({path: __dirname + `/am-aim-${W}.png`}); await p.mouse.up(); await p.waitForTimeout(200);
  console.log('ammo after aim release', await p.evaluate(() => G.me.ammo.toFixed(2)));
  // тап: автоприцел
  await p.mouse.click(W - 100, H - 300); await p.waitForTimeout(400);
  console.log('ammo after tap', await p.evaluate(() => G.me.ammo.toFixed(2)));
  // супер: зарядить и потянуть от кнопки
  await p.evaluate(() => { G.me.sup = 1; }); await p.waitForTimeout(100);
  const sb = await p.evaluate(() => SUPER_BTN()); console.log('superbtn', JSON.stringify(sb));
  await p.mouse.move(sb.x, sb.y); await p.mouse.down(); await p.mouse.move(sb.x - 20, sb.y - 60, {steps: 5}); await p.waitForTimeout(250);
  await p.screenshot({path: __dirname + `/am-super-${W}.png`}); await p.mouse.up(); await p.waitForTimeout(700);
  console.log('super used', await p.evaluate(() => G.me.sup === 0));
  await p.click('#pauseBtn'); await p.waitForTimeout(500); await p.screenshot({path: __dirname + `/am-pause-${W}.png`});
  await p.click('#quit'); await p.waitForTimeout(1800); console.log('result', await p.textContent('#resT'));
  await p.click('#toMenu'); await p.waitForTimeout(500); console.log('cups', await p.textContent('#cups'));
  console.log('ERRORS', errs.join('\n') || 'none'); await b.close();
})();
