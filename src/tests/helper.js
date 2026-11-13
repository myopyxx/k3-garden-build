const ROOT = require('path').resolve(__dirname, '../..');   // корень репозитория
const { chromium } = require('playwright');
const fs = require('fs');
const SP = __dirname + '/';
const NM = SP + 'fontsrc/node_modules/@fontsource/';
function css(){ const parts=[['great-vibes',['index.css']],['unbounded',['400.css','600.css']],['cormorant-garamond',['500-italic.css','600-italic.css']]]; let all='';
 for (const [pkg,files] of parts) for (const f of files){ const p=NM+pkg+'/'+f; if(!fs.existsSync(p)) continue; all+=fs.readFileSync(p,'utf8').replace(/url\(\.\/files\/([^)]+)\)/g,(m,x)=>`url(https://fonts.gstatic.com/local/${pkg}/${x})`);} return all; }
module.exports.open = async function(file, opts={}){
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR '+e.message)); p.on('console',m=>{ if(m.type()==='error' && !/ERR_|Failed to load/.test(m.text())) errs.push(m.text()); });
  const CSS=css();
  await p.route(/fonts\.googleapis\.com/, r=>r.fulfill({status:200,contentType:'text/css',body:CSS}));
  await p.route(/fonts\.gstatic\.com\/local\//, r=>{const m=r.request().url().match(/local\/([^/]+)\/(.+)$/); const f=NM+m[1]+'/files/'+m[2]; if(!fs.existsSync(f)) return r.fulfill({status:404,body:''}); r.fulfill({status:200,contentType:'font/woff2',body:fs.readFileSync(f)});});
  await p.route(/music\.yandex/, r=>r.abort());
  if (opts.state) await p.addInitScript(st => { try { localStorage.setItem('alisa-diaries-v3', st); } catch(e){} }, opts.state);
  await p.goto('file://'+file); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(600);
  return {b,p,errs};
};
// Запущенный сам по себе, обходит главные экраны и листы, снимает каждый и печатает ошибки консоли.
// Аргументы: ширина и высота экрана, по умолчанию 393 на 852.
if (require.main === module) (async()=>{
  const W = +(process.argv[2] || 393), H = +(process.argv[3] || 852), today = new Date().toDateString();
  const st = {v4:1, v5:1, v9:1, lastDay: today, lastSeen: Date.now(), songSeen: 1, salvJoke: 1, giftDay: today, teamPicked: 1, pets: 60, drops: 500, stars: {1:3, 2:3, 3:2, 4:2, 5:2, 6:2}, seenPh: 9};
  const {b,p,errs} = await module.exports.open(ROOT + '/index.html', {state: JSON.stringify(st)});
  await p.setViewportSize({width: W, height: H});
  const S = n => p.screenshot({path: SP + 'g-' + W + '-' + n + '.png'});
  await p.waitForTimeout(1200); await S('01-splash');
  await p.click('#btnStart'); await p.waitForTimeout(1500); await S('02-home');
  for (const [v, n] of [['v-map', '03-map'], ['v-album', '04-album'], ['v-awards', '05-awards'], ['v-home', '06-home']]){ await p.evaluate(v => showView(v), v); await p.waitForTimeout(1300); await S(n); }
  for (const [btn, n] of [['#btnWardrobe', '07-wardrobe'], ['#btnShop', '08-shop'], ['#btnSettings', '09-settings']]){
    await p.click(btn); await p.waitForTimeout(1000); await S(n); await p.click('#sheetDone'); await p.waitForTimeout(800); }
  console.log(W + '×' + H, 'ERRORS', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
