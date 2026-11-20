// Run after python3 src/main/build.py. Requires Playwright and Chromium.
const ROOT = require("path").resolve(__dirname, "../..");
const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
for(const [width,height,motion] of [[393,852,'no-preference'],[320,568,'no-preference'],[393,852,'reduce']]){
const p=await b.newPage({viewport:{width,height},reducedMotion:motion});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route(/fonts\.googleapis|music\.yandex/,r=>r.abort());await p.route('http://localhost:8899/',r=>r.fulfill({path:ROOT+'/index.html',contentType:'text/html'}));await p.goto('http://localhost:8899/');await p.click('#btnStart');await p.waitForTimeout(6000);
const idle=await p.evaluate(()=>{let c=getComputedStyle($('#homeControls'));return {opacity:c.opacity,transform:c.transform,children:['purr','dailyRequest','dock'].every(id=>document.getElementById(id).parentElement.id==='homeControls'),bottom:$('#dock').getBoundingClientRect().bottom,tabs:$('#tabs').getBoundingClientRect().top}});assert.equal(idle.opacity,'0.62');assert(idle.children);assert(idle.bottom<=idle.tabs+1,JSON.stringify(idle));

await p.click('#dailyRequest');await p.waitForFunction(()=>getComputedStyle($('#homeControls')).opacity==='1');await p.evaluate(()=>{closeSheet();showView('v-home');S.dailyRequest={...DAILY_PETS[0],day:dayKey(),count:0,done:false};paintDailyRequest();});
assert(await p.locator('#duo .cat.request-ear').count());const earned=await p.evaluate(()=>{const before=wallet();dailyAction('pet',{who:'lapula',zone:1});if(S.dailyRequest.count!==0)throw Error('wrong zone');for(let i=0;i<6;i++)dailyAction('pet',{who:'lapula',zone:0});return wallet()-before;});assert.equal(earned,8);assert.equal(await p.locator('#duo .cat.request-ear').count(),0);
await p.evaluate(()=>{S.owned.bow=true;putOn('l','bow',true);applyLook();save();openDiary();});assert(await p.getByText('Когда на Лапуле бантик',{exact:false}).count());await p.evaluate(()=>{closeSheet();$('#miniPlayer').click();});
await p.locator('.mb-crank').press('ArrowRight');assert.equal(await p.evaluate(()=>!!S.concertMemory),false);await p.locator('.mb-crank').press('ArrowRight');assert.equal(await p.evaluate(()=>!!S.concertMemory),true);assert(await p.evaluate(()=>app.classList.contains('memory-concert')));
await p.waitForTimeout(6200);assert.equal(await p.evaluate(()=>app.classList.contains('memory-concert')),false);
await p.reload();await p.click('#btnStart');await p.evaluate(()=>openDiary());assert(await p.getByText('За левым ухом лучше. Запомни.',{exact:true}).count());await p.getByRole('button',{name:'Концерт для двоих Послушать снова'}).click();assert(await p.evaluate(()=>app.classList.contains('memory-concert')));await p.evaluate(()=>showView('v-album'));assert.equal(await p.evaluate(()=>app.classList.contains('memory-concert')),false);assert.deepEqual(errors,[]);console.log('PASS',width,height,motion,idle);await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
