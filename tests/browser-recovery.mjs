import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { launchOfflineBrowser } from "./helpers/offline-browser.mjs";
const checks = [],
  errors = [],
  expectedGraphicsErrors = [],
  requests = [];
await mkdir("artifacts", { recursive: true });
const browser = await launchOfflineBrowser();
const timer = setTimeout(() => browser.close(), 420000);
try {
  const context = await browser.newContext({
    offline: true,
    viewport: { width: 960, height: 540 },
  });
  // Test-only graphics failure injection, never a shipped mutation/cheat API.
  await context.addInitScript(() => {
    window.failWorld = true;
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (this.id === "world" && type === "webgl2" && window.failWorld)
        return null;
      return native.call(this, type, ...args);
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90000);
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") expectedGraphicsErrors.push(m.text());
  });
  page.on("request", (r) => {
    if (r.resourceType() !== "document") requests.push(r.url());
  });
  const pass = (m) => {
    checks.push(m);
    console.log("PASS: " + m);
  };
  await page.goto(pathToFileURL(resolve("index.html")).href + "#diagnostics");
  await page.locator("#profile-username").fill("Retry_Hero");
  await page.locator('[data-gender="Male"]').click();
  await page.locator("#profile-continue").click();
  await page.locator("#open-modes").click();
  await page.locator("#mode-brawl").click();
  await page.locator("[data-add=enemy]").first().click();
  await page.locator("#room-start").click();
  await page.locator("#pick-layla").click();
  await page.locator("#hero-confirm").click();
  await page.locator("#load-error").waitFor();
  assert.match(await page.locator("#load-error").innerText(), /WebGL|context/i);
  assert.equal(await page.locator("#app").isHidden(), true);
  assert.equal(
    await page.evaluate(
      () => window.menuDiagnostics.snapshot().gameInitializations,
    ),
    0,
  );
  assert.equal(
    await page.evaluate(() => typeof window.foundationDiagnostics),
    "undefined",
  );
  pass(
    "actual local graphics-preparation failure shows honest reason and Retry / Back, disposes partial input/HUD and never counts a started match",
  );
  await page.evaluate(() => (window.failWorld = false));
  await page.locator("#load-retry").click();
  await page.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 1,
  );
  assert.equal(
    await page.evaluate(
      () => window.menuDiagnostics.snapshot().gameInitializations,
    ),
    1,
  );
  assert.equal(
    await page.evaluate(() => window.foundationDiagnostics.hero().modelStatus),
    "glb",
  );
  pass(
    "Retry revalidates the confirmed pick and reruns actual preparation, starting exactly one healthy match with the retained approved model",
  );
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.screenshot({
      path: `artifacts/match-hud-${width}x${height}.png`,
    });
  }
  await page.locator("#match-pause").click();
  await page.locator("#match-quit-menu").click();
  await page.locator("#open-modes").click();
  await page.locator("#mode-brawl").click();
  await page.locator("[data-add=enemy]").first().click();
  await page.locator("#room-start").click();
  await page.locator("#pick-layla").click();
  await page.evaluate(() => (window.failWorld = true));
  await page.locator("#hero-confirm").click();
  await page.locator("#load-error").waitFor();
  await page.locator("#load-back").click();
  assert.equal(
    await page.evaluate(() => window.menuDiagnostics.snapshot().screen),
    "room",
  );
  assert.equal(
    await page.evaluate(
      () => window.menuDiagnostics.snapshot().gameInitializations,
    ),
    1,
  );
  assert.equal(
    await page.locator("#hud-root").evaluate((e) => e.childElementCount),
    0,
  );
  assert.equal(
    await page.evaluate(() => typeof window.foundationDiagnostics),
    "undefined",
  );
  pass(
    "Back from a second real failure returns safely to the configured room with no duplicate runtime, input or HUD",
  );

  const touch = await browser.newContext({
      offline: true,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 844, height: 390 },
    }),
    tp = await touch.newPage();
  tp.setDefaultTimeout(90000);
  tp.on("pageerror", (e) => errors.push(String(e)));
  tp.on("request", (r) => {
    if (r.resourceType() !== "document") requests.push(r.url());
  });
  tp.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await tp.goto(
    pathToFileURL(resolve("index.html")).href + "?screen=training#diagnostics",
  );
  await tp.bringToFront();
  await tp.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.1,
  );
  await tp.locator("#shop").click();
  const cdp = await touch.newCDPSession(tp),
    r = await tp.locator("#joystick").boundingBox(),
    before = await tp.evaluate(() => window.foundationDiagnostics.snapshot());
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: r.x + r.width - 4, y: r.y + r.height / 2 }],
  });
  await tp.waitForFunction(
    (p) =>
      Math.hypot(
        window.foundationDiagnostics.snapshot().player.x - p.x,
        window.foundationDiagnostics.snapshot().player.z - p.z,
      ) > 0.3,
    before.player,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  assert.equal(await tp.locator("#shop-dialog").getAttribute("open"), "");
  await tp.locator("#shop-dialog [data-close]").click();
  pass(
    "trusted emulated touch drag still moves the hero with a centered non-modal Shop open; modal fixture protection and editor isolation remain separate",
  );
  const pre = await tp.evaluate(() => window.foundationDiagnostics.snapshot());
  await tp.locator("#upgrade-skill-1").focus();
  await tp.keyboard.press("Space");
  await tp.waitForFunction(
    () =>
      window.foundationDiagnostics.snapshot().progression.ranks[
        "malefic-bomb"
      ] === 1,
  );
  const post = await tp.evaluate(() => window.foundationDiagnostics.snapshot());
  assert.equal(post.progression.skillPoints, pre.progression.skillPoints - 1);
  assert.equal(post.lastAttack.serial, pre.lastAttack.serial);
  assert.equal(post.lastCast.serial, pre.lastCast.serial);
  pass(
    "native keyboard activation of a focused + spends exactly one point without leaking Space into an attack or skill cast",
  );
  await touch.close();
  assert.deepEqual(errors, []);
  assert.ok(expectedGraphicsErrors.length > 0);
  assert.ok(expectedGraphicsErrors.every((s) => /WebGL|context/i.test(s)));
  assert.deepEqual(
    requests.filter((u) => !u.startsWith("data:") && !u.startsWith("blob:")),
    [],
  );
  await writeFile(
    "docs/match-recovery-browser-results.json",
    JSON.stringify(
      {
        environment:
          "Linux Chromium; standalone file://; offline; test-only world-context failure injection",
        checks,
        errors,
        expectedGraphicsErrors,
        requests,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  clearTimeout(timer);
  await browser.close();
}
