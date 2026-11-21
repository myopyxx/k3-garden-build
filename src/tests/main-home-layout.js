// Run after python3 src/main/build.py. Exercises touch targets in the home scene.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const game = fs.readFileSync(path.resolve(__dirname, "../../index.html"), "utf8");
const sizes = [
  { width: 320, height: 568, top: 0, bottom: 0 },
  { width: 375, height: 620, top: 24, bottom: 10 },
  { width: 393, height: 852, top: 47, bottom: 34 },
  { width: 430, height: 932, top: 59, bottom: 34 }
];

async function check(browser, { width, height, top, bottom }) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const html = game.replaceAll("env(safe-area-inset-top)", top + "px")
    .replaceAll("env(safe-area-inset-bottom)", bottom + "px");
  await page.route(/fonts\.googleapis|music\.yandex/, route => route.abort());
  await page.route("http://localhost:8899/", route => route.fulfill({ body: html, contentType: "text/html" }));
  await page.clock.setFixedTime(new Date("2026-11-21T18:00:00Z"));
  await page.goto("http://localhost:8899/");
  // A returning player has already seen today's greeting.
  await page.evaluate(() => { S.lastDay = new Date().toDateString(); S.lastSeen = Date.now(); });
  await page.locator("#btnStart").tap();
  await page.waitForFunction(() => getComputedStyle($("#homeControls")).opacity === "0.62");

  const house = await page.evaluate(() => {
    const rect = selector => $(selector).getBoundingClientRect();
    const house = rect(".ridge.near .house"), dock = rect("#dock"), tabs = rect("#tabs");
    const request = rect("#dailyRequest"), pill = rect(".request-pill");
    return {
      noScroll: $("#v-home").scrollHeight === $("#v-home").clientHeight,
      visibleHouse: dock.bottom < house.top && house.bottom < tabs.top && request.right < house.left,
      compact: pill.height < 32 && request.top > dock.bottom,
      x: house.left + house.width * 0.55, y: house.top + house.height * 0.6
    };
  });
  assert(house.noScroll && house.visibleHouse && house.compact, JSON.stringify(house));
  await page.evaluate(() => document.querySelectorAll("#wins .win").forEach(w => w.classList.remove("off", "nt")));
  await page.touchscreen.tap(house.x, house.y);
  await page.waitForFunction(() => $("#wins .win.off"));

  await page.evaluate(() => {
    S.qd = { d: dayKey(), id: "pet", n: 0, at: 0 };
    bubbleAt = 0;
  });
  await page.waitForFunction(() => askNow());
  const answer = page.getByRole("button", { name: "за ушком", exact: true });
  await answer.waitFor();
  await page.waitForFunction(() => $("#bubble").getBoundingClientRect().top >= $(".hud").getBoundingClientRect().bottom);
  await answer.tap();
  assert(await page.evaluate(() => !!S.answers.pet));

  const star = await page.evaluate(() => {
    const y = $(".hud").getBoundingClientRect().bottom + 8;
    window.__shootStar(20, y, 0.02, true);
    const el = $("#shoot i:last-child"), animation = el.getAnimations()[0];
    animation.pause();
    animation.currentTime = 900;
    const r = el.getBoundingClientRect();
    return { x: r.right - 3, y: r.bottom };
  });
  await page.touchscreen.tap(star.x, star.y);
  assert(await page.evaluate(() => !!S.egg.wish));
  await page.locator("#chipStars").tap();
  await page.locator("#v-map.on").waitFor();
  assert.deepEqual(errors, []);
  await page.close();
  console.log("PASS", width, height);
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  try {
    for (const size of sizes) await check(browser, size);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
