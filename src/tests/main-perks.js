const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
// перки гардероба: подсказки перед уровнем, плащ на охоте и поляне, кольцо в «Кольце», запуск остальных уровней с перками
const {open} = require('./helper.js');
const SP = __dirname + '/';
(async () => {
  const today = new Date().toDateString(), all = {bow:1, cape:1, ring:1, tiara:1, wreath:1, shades:1, mask:0};
  const st = {v4:1, v5:1, v9:1, lastDay: today, lastSeen: Date.now(), songSeen: 1, salvJoke: 1, giftDay: today, teamPicked: 1, pets: 60, drops: 40,
    stars: {1:2,2:2,3:2,4:2,5:2,6:2,7:2,8:2,9:2}, owned: {bow:1,cape:1,ring:1,tiara:1,wreath:1,shades:1,mask:1}, wearA: all, wearL: Object.assign({}, all, {shades:0, mask:1})};
  const {b, p, errs} = await open(ROOT + '/index.html', {state: JSON.stringify(st)});
  await p.setViewportSize({width: 393, height: 852}); await p.waitForTimeout(1200);
  await p.click('#btnStart'); await p.waitForTimeout(1500);
  console.log('надето', await p.evaluate(() => wornCount()), 'бонус к шкале +' + await p.evaluate(() => wearBonus()), 'шкала', await p.evaluate(() => perDrop()));
  console.log('перки по уровням', JSON.stringify(await p.evaluate(() => LEVELS.map(L => L.n + ':' + perksFor(L.n).map(x => x.id).join('+')).filter(x => !x.endsWith(':')))));
  // карточка эпизода
  await p.evaluate(() => { showView('v-map'); openEpisode(LEVELS[5]); }); await p.waitForTimeout(900);
  console.log('карточка уровня 6:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.sheet .perk .pt')].map(x => x.textContent))));
  await p.screenshot({path: SP + 'perk-episode.png'}); await p.evaluate(() => closeSheet()); await p.waitForTimeout(600);
  const start = async n => { await p.evaluate(n => startLevel(LEVELS[n - 1]), n); await p.waitForTimeout(900); };
  const go = async () => { await p.click('.overlay .go'); await p.waitForTimeout(400); };
  const lives = () => p.evaluate(() => { const m = document.querySelector('#gStat').textContent.match(/❤️\s*(\d)/); return m ? +m[1] : null; });
  // уровень 1: первая вербена не отнимает жизнь, вторая отнимает
  await start(1); await p.screenshot({path: SP + 'perk-intro1.png'});
  console.log('перед уровнем 1:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.overlay .perk .pt')].map(x => x.textContent)))); await go();
  let log = [], t0 = Date.now(), banner = false;
  while (Date.now() - t0 < 26000 && log.length < 3){
    const r = await p.evaluate(() => { const h = document.querySelector('#garea').__hunt; if (!h) return null; const v = h.items.filter(i => !i.v && !i.kind && i.y > 60).sort((a, b) => b.y - a.y)[0]; if (v) h.tx = v.x;
      return /Плащ прикрыл/.test(document.querySelector('#garea').textContent); });
    if (r && !banner){ banner = true; await p.screenshot({path: SP + 'perk-cape.png'}); }
    const l = await lives(); if (l !== null && (log.length === 0 || log[log.length - 1] !== l)) log.push(l);
    await p.waitForTimeout(50);
  }
  console.log('уровень 1, жизни по ходу:', log.join(' → '), '| баннер плаща:', banner);
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);
  // уровень 6: первая мышь прощается
  await start(6); await go(); log = []; t0 = Date.now(); let taps = 0;
  while (Date.now() - t0 < 30000 && taps < 2){
    const bat = await p.$('.garden .item.bat:not(.gone)');
    if (bat){ try { await bat.click({timeout: 300}); taps++; await p.waitForTimeout(150); log.push(await p.evaluate(() => document.querySelector('#garea').__garden.lives)); } catch(e){} }
    await p.waitForTimeout(60);
  }
  console.log('уровень 6, жизни после двух мышей:', log.join(' → '), '| время удержания колючей розы:', await p.evaluate(() => perk('wreath', 6) ? 400 : 600), 'мс');
  await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);
  // уровень 2: в последнем раунде бокал с кольцом блеснёт
  await start(2); await go(); let rounds = 0, glint = [];
  while (rounds < 7){
    await p.waitForFunction(() => { const s = document.querySelector('#garea').__shell; return s && (s.state === 'pick' || s.state === 'end'); }, null, {timeout: 40000});
    if (await p.evaluate(() => document.querySelector('#garea').__shell.state) === 'end') break;
    await p.waitForTimeout(120);
    const g = await p.evaluate(() => { const s = document.querySelector('#garea').__shell.gobs; return {i: s.findIndex(x => x.ring), gl: s.findIndex(x => x.el.classList.contains('ringhint'))}; });
    glint.push(g.gl === -1 ? '-' : (g.gl === g.i ? 'верный' : 'НЕ ТОТ')); if (g.gl !== -1) await p.screenshot({path: SP + 'perk-ring.png'});
    await p.click(`.gob >> nth=${g.i}`); rounds++; await p.waitForTimeout(600);
  }
  console.log('уровень 2, блеск по раундам:', glint.join(' '));
  await p.waitForSelector('#result.on', {timeout: 20000}); await p.waitForTimeout(800); await p.evaluate(() => exitLevel()); await p.waitForTimeout(800);
  // остальные уровни с перками: запускаются и идут без ошибок
  for (const n of [3, 5, 7, 8]){ await start(n); const pills = await p.evaluate(() => [...document.querySelectorAll('.overlay .perk .pt')].map(x => x.textContent)); await go(); await p.waitForTimeout(3500);
    if (n === 5) for (let i = 0; i < 6; i++){ await p.mouse.click(200, 500); await p.waitForTimeout(650); }
    console.log('уровень ' + n + ' идёт, перки:', JSON.stringify(pills)); await p.evaluate(() => exitLevel()); await p.waitForTimeout(800); }
  // гардероб: подпись под вещами
  await p.evaluate(() => { showView('v-home'); openWardrobe(); }); await p.waitForTimeout(900);
  console.log('гардероб, подпись:', await p.evaluate(() => document.querySelector('.wcap').textContent));
  await p.click('.wit >> nth=1'); await p.waitForTimeout(300); console.log('после тапа по плащу:', await p.evaluate(() => document.querySelector('.wcap').textContent));
  await p.screenshot({path: SP + 'perk-wardrobe.png'});
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none'); await b.close();
})();
