const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// reduce motion: игра идёт без ошибок и без тряски
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({viewport: {width: 393, height: 852}, deviceScaleFactor: 2, reducedMotion: 'reduce'})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/arena/index.html?auto=1&mode=surv'); await p.waitForTimeout(12000);
  console.log('reduced', await p.evaluate(() => reduced()), 'shakeMax', await p.evaluate(() => G.shake.toFixed(2)), 'ERRORS', errs.join('|') || 'none'); await b.close();
})();
