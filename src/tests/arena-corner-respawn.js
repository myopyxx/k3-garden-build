const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// обратный отсчёт после нокаута игрока и угол стены: кошка не застревает краем
const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({viewport: {width: 393, height: 852}, deviceScaleFactor: 2})).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/arena/index.html?mode=gems'); await p.waitForTimeout(900);
  // угол: ставим кошку под левый край стены и ведём строго вверх
  const r = await p.evaluate(() => new Promise(res => {
    G.fighters.forEach(f => { if (f !== G.me) f.ai.t = 99; });
    const m = G.map; let wall = null;
    for (let y = 2; y < m.H - 2 && !wall; y++) for (let x = 1; x < m.W - 1; x++) if (m.g[y][x] === "#" && m.g[y][x - 1] !== "#" && m.g[y + 1][x] === "." && m.g[y + 1][x - 1] === "." && m.g[y][x - 1] === "."){ wall = {x, y}; break; }
    const me = G.me; me.x = wall.x*T + 6; me.y = (wall.y + 1)*T + me.r*.8 + 2; const x0 = me.x, y0 = me.y;
    IN.keys.KeyW = true; setTimeout(() => { IN.keys.KeyW = false; res({wall, dx: Math.round(me.x - x0), dy: Math.round(me.y - y0)}); }, 700);
  }));
  console.log('corner', JSON.stringify(r));
  await p.evaluate(() => { hurt(G.me, 99999, G.fighters.find(f => f.team !== G.me.team)); }); await p.waitForTimeout(1300);
  await p.screenshot({path: __dirname + '/n-dead-393.png'});
  console.log('respawn', await p.evaluate(() => G.me.respawn.toFixed(1)), 'ERRORS', errs.join('|') || 'none'); await b.close();
})();
