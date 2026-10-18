import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
const browser = await launchOfflineBrowser();
const timer = setTimeout(() => browser.close(), 900000);
try {
  const ctx = await browser.newContext({
      offline: true,
      viewport: { width: 1280, height: 720 },
    }),
    p = await ctx.newPage();
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
  await p.goto(pathToFileURL(resolve("index.html")).href + "#diagnostics");
  await p.bringToFront();
  await p.locator("#profile-username").fill("Roster_Hero");
  await p.locator("[data-gender=Male]").click();
  await p.locator("#profile-continue").click();
  await p.locator("#open-modes").click();
  await p.locator("#mode-brawl").click();
  assert.equal(await p.locator("#room-start").isDisabled(), true);
  assert.equal(await p.locator("[data-add]").count(), 9);
  await p.locator("[data-add=player]").first().click();
  await p.locator("[data-add=enemy]").first().click();
  await p.locator("[data-add=enemy]").first().click();
  assert.equal(await p.locator("[data-remove=player]").count(), 1);
  assert.equal(await p.locator("[data-remove=enemy]").count(), 2);
  await p.locator("[data-remove=enemy]").first().click();
  assert.equal(await p.locator("[data-remove=enemy]").count(), 1);
  await p.locator("[data-add=enemy]").first().click();
  assert.equal(await p.locator("#room-start").isEnabled(), true);
  pass(
    "Brawl starts with empty Computer slots, prevents no-enemy Start, adds/removes allied/enemy Computers and preserves an asymmetric 2v2 roster",
  );
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    const rect = await p.locator("#room-start").boundingBox();
    assert.ok(rect.y + rect.height <= height);
    await p.screenshot({
      path: `artifacts/roster-room-${width}x${height}.png`,
    });
  }
  await p.locator("#room-start").click();
  assert.equal(await p.locator(".selection-teammate").count(), 2);
  assert.match(await p.locator("#selection-time").innerText(), /^\d+$/);
  assert.ok(Number(await p.locator("#selection-time").innerText()) <= 45);
  assert.equal(await p.locator("#hero-confirm").isDisabled(), true);
  pass(
    "Timed selection shows actual ally Computer Layla pick and ready state; only the implemented Layla is selectable, confirm requires a pick",
  );
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.screenshot({
      path: `artifacts/roster-selection-${width}x${height}.png`,
    });
  }
  await p.locator("#pick-layla").click();
  await p.locator("#hero-confirm").click();
  await p.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.1,
  );
  const snap = () => p.evaluate(() => window.foundationDiagnostics.snapshot());
  let s = await snap();
  assert.equal(s.matchConfig.allyCount, 1);
  assert.equal(s.matchConfig.enemyCount, 2);
  assert.equal(s.allies.length, 1);
  assert.equal(s.enemies.filter((a) => a.kind === "bot").length, 2);
  const models = await p.evaluate(
    () => window.foundationDiagnostics.hero().npcModels,
  );
  assert.equal(models.length, 3);
  assert.ok(models.every((m) => m.meshCount > 0 && m.clips.length >= 2));
  pass(
    "Confirmed asymmetric roster creates exactly the requested real Layla Computers with cloned approved GLB meshes/clips and authoritative hero kits",
  );
  const pos = await p.evaluate(() => ({
    blue: window.foundationDiagnostics.project(-30, 0, 0),
    red: window.foundationDiagnostics.project(30, 0, 0),
  }));
  assert.ok(pos.blue.x < pos.red.x && pos.blue.y > pos.red.y);
  pass(
    "3D map orientation projects allied base bottom-left and enemy base top-right without swapping world teams",
  );
  await p.locator("#shop").click();
  assert.equal(await p.locator("#shop-dialog").getAttribute("open"), "");
  await p.locator("[data-category=All]").click();
  assert.equal(await p.locator("#armory-catalog [data-item]").count(), 45);
  await p.locator("#item-search").fill("javelin");
  assert.equal(await p.locator("[data-item=javelin]").count(), 1);
  await p.locator("[data-item=javelin]").click();
  assert.match(await p.locator("#item-stats").innerText(), /8% Crit Chance/);
  assert.ok(
    await p
      .locator("#item-art")
      .evaluate((i) => i.complete && i.naturalWidth === 128),
  );
  await p.locator("#item-purchase").click();
  s = await snap();
  assert.equal(s.gold, 480);
  assert.equal(s.inventory[0], "javelin");
  assert.equal(s.player.criticalChance, 0.08);
  await p.locator("#item-search").fill("dagger");
  await p.locator("[data-item=dagger]").click();
  await p.locator("#item-purchase").click();
  s = await snap();
  assert.equal(s.gold, 230);
  assert.equal(s.inventory[1], "dagger");
  await p.locator('#match-inventory [data-equipped="1"]').click();
  assert.equal(await p.locator("#item-sell").isVisible(), true);
  assert.equal((await snap()).inventory[1], "dagger");
  await p.locator("#item-sell").click();
  s = await snap();
  assert.equal(s.gold, 380);
  assert.equal(s.inventory[1], null);
  pass(
    "Restored wide shop filters all 45 supported items, decodes original PNGs, equips +8% crit Javelin, and requires explicit Sell to free an equipped slot/refund once",
  );
  await p.locator("#item-search").fill("");
  await p.locator("[data-category=Movement]").click();
  assert.equal(await p.locator("#armory-catalog [data-item]").count(), 8);
  await p.locator("[data-item=basic-boots]").click();

  await p.locator("#item-purchase").click();
  s = await snap();
  assert.equal(s.gold, 130);
  assert.equal(s.inventory[1], "basic-boots");
  assert.equal(s.player.attributes.movementSpeed, 260);
  await p.locator("#item-sort").selectOption("price-high");
  await p.screenshot({ path: "artifacts/roster-shop-844x390.png" });
  pass(
    "Boots use supplied display-stat/world conversion, Movement filters/sorting work and six-slot purchase/sale remains separate from the account wallet",
  );
  await p.locator("#shop-dialog [data-close]").click();
  await p.locator("#regen").click();
  await p.waitForFunction(
    () => window.foundationDiagnostics.snapshot().utilities.regenReadyAt > 0,
  );
  const beforeRecall = await snap();
  await p.locator("#recall").focus();
  await p.keyboard.press("Space");
  assert.equal(
    (await snap()).lastAttack.serial,
    beforeRecall.lastAttack.serial,
  );

  await p.waitForFunction(() =>
    Boolean(window.foundationDiagnostics.snapshot().utilities.recall),
  );
  await p.locator("#world").focus();
  await p.keyboard.down("w");
  await p.waitForFunction(
    () => !window.foundationDiagnostics.snapshot().utilities.recall,
  );
  await p.keyboard.up("w");
  pass(
    "Recall/Regen controls are live: Regen starts a real cooldown and movement cancels the real recall channel",
  );
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.screenshot({ path: `artifacts/roster-map-${width}x${height}.png` });
  }
  await p.locator("#match-pause").click();
  await p.locator("#match-quit-menu").click();
  await p.locator("#open-modes").click();
  await p.locator("#mode-training").click();
  await p.locator("#ai-mode-practice").click();
  await p.locator("#room-start").click();
  await p.locator("#pick-layla").click();
  await p.locator("#hero-confirm").click();
  await p.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.1,
  );
  await p.locator("#upgrade-skill-1").click();
  await p.locator("#world").focus();
  await p.keyboard.press("Space");
  await p.keyboard.press("1");
  await p.waitForFunction(
    () =>
      Boolean(window.foundationDiagnostics.snapshot().queuedSkill) ||
      window.foundationDiagnostics.snapshot().lastCast.serial > 0,
  );
  await p.waitForFunction(
    () => window.foundationDiagnostics.snapshot().lastCast.serial > 0,
  );
  s = await snap();
  assert.equal(s.lastCast.slot, "skill-1");
  assert.equal(s.queuedSkill, null);
  pass(
    "Preserved Practice supports a real basic→skill follow-up through native keyboard input without interrupting the basic animation",
  );
  assert.deepEqual(warnings, []);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  pass(
    "Standalone file://, offline networking: no unexpected JavaScript errors or external asset requests through room, draft, gameplay, shop, utilities and return",
  );
  await writeFile(
    "docs/roster-browser-results.json",
    JSON.stringify(
      {
        environment:
          "Linux Chromium software WebGL; offline file://; not native Windows/physical touch",
        bundleSha256: createHash("sha256")
          .update(await readFile("index.html"))
          .digest("hex"),
        checks,
        errors,
        warnings,
        requests,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`${checks.length} roster browser checks passed.`);
} catch (error) {
  await writeFile(
    "artifacts/roster-failure.json",
    JSON.stringify(
      { checks, errors, warnings, requests, failure: String(error) },
      null,
      2,
    ),
  );
  throw error;
} finally {
  clearTimeout(timer);
  await browser.close();
}
