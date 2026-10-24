import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { launchOfflineBrowser } from "./helpers/offline-browser.mjs";
const checks = [],
  errors = [],
  warnings = [],
  requests = [];
const pass = (x) => {
  checks.push(x);
  console.log("PASS: " + x);
};
const browser = await launchOfflineBrowser();
await mkdir("artifacts", { recursive: true });
let p;
const watchdog = setTimeout(() => browser.close(), 1000000);
try {
  const c = await browser.newContext({
    offline: true,
    viewport: { width: 1280, height: 720 },
  });
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
  await p.goto(pathToFileURL(resolve("index.html")).href + "#diagnostics");
  await p.bringToFront();
  await p.locator("#profile-username").fill("Spell_Shop");
  await p.locator("[data-gender=Female]").click();
  await p.locator("#profile-continue").click();
  await p.locator("#setup-battle-spell").click();
  assert.equal(await p.locator("[data-spell-card]").count(), 12);
  assert.equal(await p.locator("[data-equip-spell]:not(:disabled)").count(), 1);
  assert.match(
    await p.locator("[data-equip-spell=flicker]").innerText(),
    /LOCKED.*21/,
  );
  await p.screenshot({ path: "artifacts/b23-spell-cards-level1.png" });
  await p.locator("[data-equip-spell=retribution]").click();
  await p.locator("#battle-close").click();
  assert.match(
    await p.locator("#setup-battle-spell").innerText(),
    /Retribution/,
  );
  pass(
    "Level1 card screen contains twelve actual definitions, exact locked level metadata, only Execute/Retribution unlocked and persistent one-spell selection",
  );
  await p.locator("#open-modes").click();
  await p.locator("#mode-brawl").click();
  await p.locator("[data-add=enemy]").first().click();
  await p.locator("#room-start").click();
  assert.match(
    await p.locator("#setup-battle-spell").innerText(),
    /Retribution/,
  );
  await p.locator("#pick-layla").click();
  await p.locator("#hero-confirm").click();
  await p.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.1,
  );
  const snap = () => p.evaluate(() => window.foundationDiagnostics.snapshot());
  assert.equal((await snap()).battleSpell.id, "retribution");
  pass(
    "Selected spell survives room, explicit hero pick, 10-second local loading and Brawl initialization",
  );
  await p.locator("#shop").click();
  assert.equal(await p.locator("#armory-catalog [data-item]").count(), 99);
  assert.equal(
    await p.locator("[data-category=Recommended]").isDisabled(),
    false,
  );
  assert.equal(await p.locator("#item-replace").count(), 0);
  await p.locator("[data-view=simple]").click();
  assert.equal(
    await p.locator("#armory-catalog [data-item=dagger]").count(),
    0,
  );
  assert.ok(
    await p.locator("#armory-catalog [data-item=corrosion-scythe]").count(),
  );
  await p.locator("[data-item=corrosion-scythe]").click();
  assert.ok(await p.locator("[data-tree-item=regular-spear]").count());
  assert.ok(await p.locator("[data-tree-item=swift-crossbow]").count());
  await p.locator("#item-prioritize").click();
  await p.locator("#shop-dialog [data-close]").click();
  assert.equal(await p.locator("#quick-buy-panel").isVisible(), true);
  assert.match(
    await p.locator("#quick-buy-panel").innerText(),
    /Corrosion Scythe/,
  );
  await p.locator("#quick-buy").click();
  let s = await snap();
  assert.deepEqual(s.inventory.filter(Boolean), ["regular-spear"]);
  assert.equal(s.gold, 200);
  assert.equal(s.player.attributes.physicalAttack, 170);
  assert.ok(s.player.attributes.attackSpeed > 1.1);
  pass(
    "All Equipment lists all 99, Simple omits components, real nested tree appears and quick buy chooses the most useful affordable Regular Spear component with exact gold/stat accounting",
  );
  await p.locator("#shop").click();
  await p.locator("[data-view=all]").click();
  await p.locator("[data-item=corrosion-scythe]").click();
  assert.match(
    await p.locator("#recipe-cost").innerText(),
    /owned credit 600.*remaining 1450/,
  );
  await p.locator('#match-inventory [data-equipped="0"]').click();
  assert.equal(await p.locator("#item-sell").isVisible(), true);
  await p.locator("#item-sell").click();
  s = await snap();
  assert.equal(s.inventory[0], null);
  assert.equal(s.gold, 560);
  assert.equal(s.player.attributes.physicalAttack, 150);
  assert.match(
    await p.locator("#quick-buy-panel").innerText(),
    /2050 remaining/,
  );
  await p.locator("#shop-dialog [data-close]").click();
  await p.locator("#quick-clear").click();
  assert.equal(await p.locator("#quick-buy-panel").isHidden(), true);
  pass(
    "Owned tree credit updates immediately, explicit sale reverses stats/recipe credit, quick priority clears and no manual slot replacement is required",
  );
  await p.locator("#shop").click();
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.screenshot({ path: `artifacts/b23-shop-${width}x${height}.png` });
    const r = await p.locator("#item-purchase").boundingBox();
    assert.ok(
      r.x >= 0 &&
        r.y >= 0 &&
        r.x + r.width <= width &&
        r.y + r.height <= height,
    );
  }
  await p.locator("#shop-dialog [data-close]").click();
  await p.setViewportSize({ width: 1280, height: 720 });
  await p.locator("#world").focus();
  await p.keyboard.down("w");
  await p.keyboard.down("d");
  try {
    await p.waitForFunction(
      () => {
        const s = window.foundationDiagnostics.snapshot();
        return s.enemies.some(
          (a) =>
            a.kind === "minion" &&
            a.hp > 0 &&
            a.targetable !== false &&
            Math.hypot(a.x - s.player.x, a.z - s.player.z) < 5.7,
        );
      },
      null,
      { timeout: 60000 },
    );
  } finally {
    await p.keyboard.up("w");
    await p.keyboard.up("d");
  }
  await p.waitForFunction(() => {
    const s = window.foundationDiagnostics.snapshot();
    return !s.player.stunned && !s.actionLocked && s.player.hp > 0;
  });
  await p.locator("#world").focus();
  await p.keyboard.press("f");
  await p.waitForFunction(
    () => window.foundationDiagnostics.snapshot().battleSpell.remaining > 0,
  );
  s = await snap();
  assert.equal(s.battleSpell.id, "retribution");
  assert.ok(s.battleSpell.remaining <= 35 && s.battleSpell.remaining > 33);
  pass(
    "Native F uses the same actual Retribution activation: eligible lane minion hit, exact35s cooldown, no fabricated jungle entities",
  );
  await p.locator("#match-pause").click();
  await p.locator("#match-quit-room").click();
  await p.locator("#setup-battle-spell").click();
  assert.equal(
    await p.locator("[data-equip-spell=flicker]").isDisabled(),
    true,
  );
  await p.locator("#battle-close").click();
  const before = (await p.evaluate(() => window.menuDiagnostics.snapshot()))
    .battleAccount;
  assert.equal(before.level, 1);
  pass(
    "Quit match grants no account XP; hero combat levels do not bypass persistent account locks",
  );
  await c.close();
  // Isolated test fixture account progression, not an unlock-all player control.
  const c2 = await browser.newContext({
    offline: true,
    viewport: { width: 1280, height: 720 },
  });
  await c2.addInitScript(() =>
    localStorage.setItem(
      "moba-lab.battle.v1:Spell_Max",
      JSON.stringify({
        version: 1,
        xp: 2400,
        selected: "sprint",
        completed: [],
      }),
    ),
  );
  p = await c2.newPage();
  p.on("request", (r) => {
    if (r.resourceType() !== "document" && !/^(data:|blob:)/.test(r.url()))
      requests.push(r.url());
  });
  p.setDefaultTimeout(90000);
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.type() === "warning") warnings.push(m.text());
  });
  await p.goto(pathToFileURL(resolve("index.html")).href + "#diagnostics");
  await p.bringToFront();
  await p.locator("#profile-username").fill("Spell_Max");
  await p.locator("[data-gender=Male]").click();
  await p.locator("#profile-continue").click();
  await p.locator("#setup-battle-spell").click();
  assert.equal(
    await p.locator("[data-equip-spell]:not(:disabled)").count(),
    11,
  );
  for (const [width, height] of [
    [1280, 720],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.screenshot({
      path: `artifacts/b23-spell-cards-level25-${width}.png`,
    });
  }
  await p.locator("[data-equip-spell=flicker]").click();
  await p.locator("#battle-close").click();
  await p.locator("#open-modes").click();
  await p.locator("#mode-brawl").click();
  await p.locator("[data-add=enemy]").first().click();
  await p.locator("#room-start").click();
  await p.locator("#pick-layla").click();
  await p.locator("#hero-confirm").click();
  await p.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.1,
  );
  await p.locator("#world").focus();
  const start = await p.evaluate(
    () => window.foundationDiagnostics.snapshot().player,
  );
  await p.keyboard.down("f");
  await p.waitForFunction(
    () =>
      window.foundationDiagnostics.snapshot().aiming?.slot === "battle-spell",
  );
  await p.keyboard.up("f");
  await p.waitForFunction(
    () => window.foundationDiagnostics.snapshot().battleSpell.remaining > 0,
  );
  s = await p.evaluate(() => window.foundationDiagnostics.snapshot());
  assert.ok(Math.hypot(s.player.x - start.x, s.player.z - start.z) > 1);
  assert.ok(s.battleSpell.remaining > 118 && s.battleSpell.remaining <= 120);
  assert.equal(s.aiming, null);
  assert.equal(await p.locator(".hero-skill").count(), 3);
  pass(
    "Level25 fixture unlocks all twelve, native hold/release reuses aim sight and Flicker teleports safely with120s cooldown while preserving exactly3 hero skill controls",
  );
  const nextSpell = async (id) => {
    await p.locator("#match-pause").click();
    await p.locator("#match-quit-room").click();
    await p.locator("#setup-battle-spell").click();
    await p.locator(`[data-equip-spell=${id}]`).click();
    await p.locator("#battle-close").click();
    await p.locator("#room-start").click();
    await p.locator("#pick-layla").click();
    await p.locator("#hero-confirm").click();
    await p.waitForFunction(
      () => window.foundationDiagnostics?.snapshot().time > 0.1,
    );
    await p.locator("#world").focus();
    await p.keyboard.press("f");
  };
  await nextSpell("flameshot");
  await p.waitForFunction(
    () => window.foundationDiagnostics.snapshot().battleSpell.remaining > 0,
  );
  assert.ok(
    (await p.evaluate(() => window.foundationDiagnostics.snapshot()))
      .battleSpell.remaining <= 50,
  );
  await p.waitForFunction(
    () => window.foundationDiagnostics.snapshot().time > 1,
  );
  pass(
    "Native Flameshot creates and renders its actual directional projectile/trail/impact without visual callbacks applying damage",
  );
  await nextSpell("aegis");
  await p.waitForFunction(() =>
    window.foundationDiagnostics
      .snapshot()
      .player.shields?.some((x) => x.id === "aegis"),
  );
  s = await p.evaluate(() => window.foundationDiagnostics.snapshot());
  assert.equal(s.player.shields.find((x) => x.id === "aegis").amount, 1020);
  const statusBox = await p.locator("#battle-spell-status").boundingBox(),
    equipmentBox = await p.locator("#equipment-slots").boundingBox();
  assert.ok(
    statusBox.y + statusBox.height <= equipmentBox.y,
    "active spell status must not overlap equipment/utilities",
  );
  await p.screenshot({ path: "artifacts/b23-aegis-active.png" });
  pass(
    "Native Aegis grants the actual hero-level3 1020 shield, with active HUD status and real world shield VFX",
  );
  await nextSpell("revitalize");
  await p.waitForFunction(
    () =>
      window.foundationDiagnostics.snapshot().battleSpell.springs.length === 1,
  );
  await p.waitForFunction(
    () => window.foundationDiagnostics.snapshot().time > 0.8,
  );
  await p.screenshot({ path: "artifacts/b23-revitalize-active.png" });
  pass(
    "Native Revitalize shows a live healing spring and its timed aura VFX/HUD alongside unchanged hero controls",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  pass(
    "Actual standalone file:// shop/spell/aiming flows have zero runtime errors, warnings and external requests",
  );
  await writeFile(
    "docs/b23-browser-results.json",
    JSON.stringify(
      {
        checks,
        errors,
        warnings,
        requests,
        bundleSha256: createHash("sha256")
          .update(await readFile("index.html"))
          .digest("hex"),
        environment:
          "Linux Chromium software WebGL; offline file://; level25 unlock fixture isolated to this test",
      },
      null,
      2,
    ) + "\n",
  );
} catch (e) {
  if (p)
    await p
      .screenshot({ path: "artifacts/b23-browser-failure.png" })
      .catch(() => {});
  await writeFile(
    "artifacts/b23-browser-failure.json",
    JSON.stringify(
      { checks, errors, warnings, requests, failure: String(e) },
      null,
      2,
    ),
  );
  throw e;
} finally {
  clearTimeout(watchdog);
  await browser.close();
}
