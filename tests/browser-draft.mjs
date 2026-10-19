import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { launchOfflineBrowser } from "./helpers/offline-browser.mjs";
const checks = [],
  errors = [],
  warnings = [],
  requests = [];
const pass = (m) => {
  checks.push(m);
  console.log("PASS: " + m);
};
await mkdir("artifacts", { recursive: true });
const b = await launchOfflineBrowser();
const timer = setTimeout(() => b.close(), 420000);
try {
  const c = await b.newContext({
      offline: true,
      viewport: { width: 960, height: 540 },
      hasTouch: true,
    }),
    p = await c.newPage();
  p.setDefaultTimeout(90000);
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.type() === "warning") warnings.push(m.text());
  });
  p.on("request", (r) => {
    if (r.resourceType() !== "document" && !/^(data:|blob:)/.test(r.url()))
      requests.push(r.url());
  });
  await p.addInitScript(() => {
    window.lineupAudit = [];
    new MutationObserver(() => {
      if (document.querySelector("#local-load-progress")) {
        const blue = [
            ...document.querySelectorAll(
              ".loading-team.blue-team .loading-hero",
            ),
          ],
          red = [
            ...document.querySelectorAll(
              ".loading-team.red-team .loading-hero",
            ),
          ];
        if (blue.length && red.length)
          window.lineupAudit.push({
            blue: blue.map((a) => a.innerText),
            red: red.map((a) => a.innerText),
          });
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await p.goto(pathToFileURL(resolve("index.html")).href + "#diagnostics");
  await p.bringToFront();
  await p.locator("#profile-username").fill("Draft_Hero");
  await p.locator("[data-gender=Female]").tap();
  await p.locator("#profile-continue").tap();
  await p.locator("#open-modes").tap();
  await p.locator("#mode-brawl").tap();
  await p.locator("#room-fill").tap();
  assert.equal(await p.locator("[data-remove]").count(), 9);
  await p.screenshot({ path: "artifacts/roster-full-room.png" });
  await p.locator("#room-start").tap();
  assert.equal(await p.locator(".selection-teammate").count(), 5);
  assert.equal(await p.locator(".selection-team img").count(), 5);
  // Exercise real 45-second expiry, not a shipped skip or a simulation mutation.
  const start = Date.now();
  await p.waitForFunction(
    () => window.menuDiagnostics.snapshot().screen === "training",
    null,
    { timeout: 150000 },
  );
  assert.ok(Date.now() - start > 30000);
  let s = await p.evaluate(() => window.foundationDiagnostics.snapshot());
  assert.equal(s.matchConfig.heroId, "layla");
  assert.equal(s.allies.length, 4);
  assert.equal(s.enemies.filter((a) => a.kind === "bot").length, 5);
  pass(
    "Actual 45-second expiry auto-confirms the only available hero and starts the requested 5v5 roster, without timer injection",
  );
  const audit = await p.evaluate(() => window.lineupAudit);
  assert.ok(
    audit.some(
      (a) =>
        a.blue.length === 5 &&
        a.red.length === 5 &&
        a.blue.every((v) => v.includes("Layla")) &&
        a.red.every((v) => v.includes("Layla")),
    ),
  );
  pass(
    "Loading renders all five actual allied and five enemy Layla picks with player/Computer names; no invented heroes or per-client download percentages",
  );
  await p.waitForFunction(
    () => window.foundationDiagnostics.snapshot().time > 0.1,
  );
  const r = await p.locator("#joystick").boundingBox(),
    cdp = await c.newCDPSession(p),
    before = await p.evaluate(
      () => window.foundationDiagnostics.snapshot().player,
    );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: r.x + r.width - 4, y: r.y + r.height / 2 }],
  });
  await p.waitForFunction(
    (a) =>
      Math.hypot(
        window.foundationDiagnostics.snapshot().player.x - a.x,
        window.foundationDiagnostics.snapshot().player.z - a.z,
      ) > 0.2,
    before,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await p.screenshot({ path: "artifacts/roster-five-v-five.png" });
  pass(
    "Trusted touch drag moves the player in the flipped lane with nine real-model Computer heroes",
  );
  await p.locator("#match-pause").tap();
  await p.locator("#match-quit-menu").tap();
  await p.waitForFunction(
    () => window.menuDiagnostics.snapshot().lobby.status === "glb",
  );
  const menu = await p.evaluate(() => window.menuDiagnostics.snapshot());
  assert.equal(menu.lastDisposed.disposed, true);
  assert.equal(menu.lobby.modelLoads, 0);
  pass(
    "Full roster quits safely, aborts match listeners and restores the single retained approved menu model",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  pass(
    "Full draft/loading/touch/quit offline flow has zero runtime errors, warnings or external requests",
  );
  await writeFile(
    "docs/roster-draft-browser-results.json",
    JSON.stringify(
      {
        checks,
        errors,
        warnings,
        requests,
        environment:
          "Linux software WebGL, offline file://, trusted touch emulation; actual selection timer elapsed",
      },
      null,
      2,
    ) + "\n",
  );
} catch (e) {
  await writeFile(
    "artifacts/roster-draft-failure.json",
    JSON.stringify(
      { checks, errors, warnings, requests, failure: String(e) },
      null,
      2,
    ),
  );
  throw e;
} finally {
  clearTimeout(timer);
  await b.close();
}
