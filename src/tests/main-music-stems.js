const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// музыка: уровень громкости шкатулки без нарядов и со всеми нарядами. Слухом это не заменяет, но ловит перегруз и тишину
const {open} = require('./helper.js');
(async () => {
  const today = new Date().toDateString();
  const st = {v4:1, v5:1, v9:1, lastDay: today, lastSeen: Date.now(), songSeen: 1, salvJoke: 1, giftDay: today, teamPicked: 1, pets: 60, owned: {bow:1,cape:1,ring:1,tiara:1,wreath:1,shades:1,mask:1}};
  const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  await p.setViewportSize({width: 393, height: 852}); await p.click('#btnStart'); await p.waitForTimeout(2500);
  console.log('звук запущен:', await p.evaluate(() => ctx && ctx.state), 'музыка играет:', await p.evaluate(() => Music.playing));
  const measure = sec => p.evaluate(sec => new Promise(res => { const an = ctx.createAnalyser(); an.fftSize = 2048; musicBus.connect(an); const buf = new Float32Array(an.fftSize); let peak = 0, sum = 0, n = 0; const t0 = performance.now();
    const iv = setInterval(() => { an.getFloatTimeDomainData(buf); for (let i = 0; i < buf.length; i++){ const v = Math.abs(buf[i]); if (v > peak) peak = v; sum += v*v; n++; }
      if (performance.now() - t0 > sec*1000){ clearInterval(iv); musicBus.disconnect(an); res({peak: +peak.toFixed(3), rms: +Math.sqrt(sum/n).toFixed(4)}); } }, 40); }), sec);
  const wear = ids => p.evaluate(ids => { S.wearA = {}; S.wearL = {}; ids.forEach(id => { S.wearA[id] = true; }); return wornCount(); }, ids);
  await wear([]); await p.waitForTimeout(3200); console.log('без нарядов      ', JSON.stringify(await measure(13)));
  for (const id of ['bow', 'cape', 'ring', 'tiara', 'wreath', 'shades', 'mask']){ await wear([id]); await p.waitForTimeout(3200); console.log(('только ' + id).padEnd(17), JSON.stringify(await measure(7))); }
  await wear(['bow', 'cape', 'ring', 'tiara', 'wreath', 'shades']); await p.evaluate(() => { S.wearL.mask = true; }); await p.waitForTimeout(3200);
  console.log('все семь вещей   ', JSON.stringify(await measure(13)), 'надето', await p.evaluate(() => wornCount()));
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
