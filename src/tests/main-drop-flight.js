// A finished flight must clear its last pixels even while a distant burst keeps the canvas alive.
const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium" });
  try {
    const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
    await page.route(/fonts\.googleapis/, route => route.abort());
    await page.route("http://localhost:8899/", route => route.fulfill({
      path: path.resolve(__dirname, "../../index.html"), contentType: "text/html"
    }));
    await page.goto("http://localhost:8899/");
    const result = await page.evaluate(async () => {
      const canvas = document.querySelector("#fx"), ctx = canvas.getContext("2d");
      const r = canvas.getBoundingClientRect(), scale = canvas.width/r.width;
      const x = r.left + 160, y = r.top + 380, tx = r.left + 50, ty = r.top + 48;
      function painted(cx, cy){
        const data = ctx.getImageData((cx - r.left - 15)*scale, (cy - r.top - 15)*scale, 30*scale, 30*scale).data;
        return data.some((value, i) => i % 4 === 3 && value > 0);
      }
      FX.burst(x, y, {emojis:["💕"], n:4, speed:[0,0], grav:0, life:[4,4]});
      let arrivals = 0;
      await new Promise(resolve => FX.fly(x, y, tx, ty, {dur:.15, done(){
        arrivals++;
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }}));
      return { arrivals, atCounter:painted(tx,ty), atHearts:painted(x,y) };
    });
    assert.deepEqual(result, { arrivals:1, atCounter:false, atHearts:true });
    console.log("PASS drop absorbed while hearts remain visible");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
