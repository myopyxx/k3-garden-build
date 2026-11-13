// Рендерит объёмных котиков и кольцо из render.html в картинки для образца.
// Запуск: node src/redesign/render-sprites.js [папка]   (по умолчанию sprites/ рядом)
// Нужен Playwright с Chromium: WebGL считается программно, все слои занимают около двух минут.
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'sprites'));
// cat: 0 Алиса, 1 Лапуля, 2 кольцо. show: 1 тело, 2 голова, 4 хвост. lid: 0 глаза открыты, 0.45 прикрыты, 1 закрыты.
// occ: слой обрезается там, где его заслоняют другие части (голова за грудью, хвост Лапули за телом).
const jobs = [];
['a', 'l'].forEach((c, cat) => {
  jobs.push({f: `${c}-body`, o: {cat, show: 1, ground: 1, q: .9}});
  jobs.push({f: `${c}-tail`, o: {cat, show: 4, occ: cat === 1 ? 1 : 0, q: .9}});
  for (const [name, lid] of [['open', 0], ['half', .45], ['shut', 1]]) jobs.push({f: `${c}-head-${name}`, o: {cat, show: 2, lid, occ: 1, q: .92}});
});
jobs.push({f: 'ring', o: {cat: 2, show: 1, ground: 1, q: .9}});
(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const b = await chromium.launch(), p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'render.html')); await p.waitForTimeout(300);
  if (errs.length){ console.log('ОШИБКА ШЕЙДЕРА\n' + errs.join('\n')); await b.close(); process.exit(1); }
  for (const j of jobs){ const t0 = Date.now(), url = await p.evaluate(o => renderCat(o), j.o), file = path.join(OUT, j.f + '.webp');
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64')); console.log(j.f, ((Date.now() - t0)/1000).toFixed(1) + 's', Math.round(fs.statSync(file).size/1024) + 'KB'); }
  await b.close();
})();
