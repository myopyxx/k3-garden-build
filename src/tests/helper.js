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
if (require.main === module) (async()=>{
  const {b,p,errs} = await module.exports.open(ROOT + '/index.html');
  const S = n => p.screenshot({path:SP+'g-'+n+'.png'});
  await p.waitForTimeout(1600); await S('01-splash');
  await p.click('#btnStart'); await p.waitForTimeout(1300);
  for (let i=0;i<5;i++){ await p.click('#duo .pet >> nth='+(i%2)); await p.waitForTimeout(60); }
  await p.waitForTimeout(700); await S('02-home');
  await p.evaluate(()=>{ for(let i=1;i<=6;i++) S.stars[i]=2; S.drops=500; save(); hud(); });
  await p.click('.tab >> nth=1'); await p.waitForTimeout(1300); await S('03-map');
  await p.evaluate(()=>{ const v=document.querySelector('#v-map'); v.scrollTop=600; }); await p.waitForTimeout(500); await S('04-map-scrolled');
  await p.click('.ep >> nth=6'); await p.waitForTimeout(260); await S('05-zoom-mid'); await p.waitForTimeout(900); await S('06-intro7');
  await p.click('.overlay .go'); await p.waitForTimeout(1500); await S('07-sun');
  await p.mouse.move(60,500); await p.mouse.down(); await p.mouse.move(40,500,{steps:5}); await p.waitForTimeout(1500); await S('08-sun-left'); await p.mouse.up();
  await p.click('#gClose'); await p.waitForTimeout(800);
  await p.click('.tab >> nth=0'); await p.waitForTimeout(800);
  await p.click('#btnShop'); await p.waitForTimeout(900); await S('09-shop');
  await p.click('#sheetDone'); await p.waitForTimeout(700);
  await p.click('#btnSettings'); await p.waitForTimeout(900); await S('10-settings');
  await p.click('#sheetDone'); await p.waitForTimeout(700);
  await p.click('.tab >> nth=2'); await p.waitForTimeout(1200); await S('11-album');
  await p.click('.tab >> nth=3'); await p.waitForTimeout(3500); await S('12-awards');
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
