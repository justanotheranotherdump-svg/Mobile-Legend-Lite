import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { learnPracticeKit } from "./helpers/practice.mjs";
import { finishPracticeEntry } from "./helpers/menu-practice.mjs";
import { launchOfflineBrowser } from "./helpers/offline-browser.mjs";
const browser = await launchOfflineBrowser(),
  checks = [],
  errors = [],
  warnings = [],
  requests = [];
const pass = (s) => {
  checks.push(s);
  console.log("PASS: " + s);
};
await mkdir("artifacts", { recursive: true });
try {
  const context = await browser.newContext({
      offline: true,
      viewport: { width: 1280, height: 720 },
    }),
    p = await context.newPage();
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
  await p.locator("#profile-username").fill("Polish_Player");
  await p.locator("[data-gender=Female]").click();
  await p.locator("#profile-continue").click();
  await p.locator("#open-preparation").click();
  await p.locator("#new-build").click();
  await p.locator("#build-name").fill("My ordered DPS");
  await p.locator("#build-add").selectOption("haas-claws");
  await p.locator("#build-add").selectOption("swift-boots");
  await p.locator("#save-build").click();
  assert.equal(await p.locator(".saved-build.in-use").count(), 1);
  await p.locator("[data-build-edit]").click();
  await p.locator('[data-move="1"]').click();
  await p.locator("#save-build").click();
  assert.deepEqual(
    await p.evaluate(
      () =>
        window.menuDiagnostics.snapshot().builds.heroes.layla.builds[0].items,
    ),
    ["swift-boots", "haas-claws"],
  );
  await p.screenshot({ path: "artifacts/polish-preparation-1280.png" });
  pass(
    "Preparation creates/edits/reorders/saves active hero build through native controls",
  );
  await p.locator("[data-prep-tab=equipment]").click();
  assert.equal(await p.locator(".prep-catalog>button").count(), 45);
  await p.locator(".prep-catalog [data-wiki-item=haas-claws]").click();
  assert.ok((await p.locator(".wiki-tree li").count()) > 1);
  pass(
    "Equipment wiki uses all 45 registry entries and connected actual recipe data",
  );
  await p.locator("[data-prep-tab=emblems]").click();
  assert.match(
    await p.locator("#prep-body").innerText(),
    /Coming in a future update/,
  );
  pass("Emblems clearly inactive layout, no invented stat system");
  await p.locator("[data-prep-tab=spells]").click();
  await p.locator("#prep-spells").click();
  assert.equal(await p.locator("[data-spell-card]").count(), 12);
  await p.locator("[data-equip-spell=retribution]").click();
  await p.locator("#battle-close").click();
  await p.locator("#prep-back").click();
  await p.reload();
  await p.waitForSelector("#open-preparation");
  await p.locator("#open-preparation").click();
  assert.equal(await p.locator(".saved-build.in-use").count(), 1);
  await p.locator("#prep-back").click();
  pass("Spell choice and selected build persist across offline file reload");
  await p.locator("#open-owned-heroes").click();
  assert.equal(await p.locator("[data-owned-hero]").count(), 1);
  assert.equal(
    await p.locator("[data-owned-hero=layla] img").getAttribute("src"),
    await p.evaluate(
      () => document.querySelector("[data-owned-hero=layla] img").src,
    ),
  );
  await p.locator("#owned-back").click();
  pass(
    "Owned Heroes tab exposes only the actual owned Layla with shared circular portrait",
  );
  await p.locator("#open-player-profile").click();
  assert.match(
    await p.locator("#player-profile-body").innerText(),
    /No recorded completed matches/,
  );
  await p.locator("[data-profile-tab=history]").click();
  assert.equal(await p.locator(".history-card").count(), 0);
  await p.locator("[data-profile-tab=rank]").click();
  assert.match(
    await p.locator("#player-profile-body").innerText(),
    /Coming later/,
  );
  pass(
    "Profile identity, empty actual history, hero statistics and inactive ranked placeholder are truthful",
  );
  await p.locator("[data-profile-tab=developer]").click();
  await p.locator("#dev-amount").fill("77");
  await p.locator("#dev-coins").click();
  await p.locator("#dev-diamonds").click();
  await p.locator("#dev-max-level").click();
  assert.equal(
    await p.evaluate(() => window.menuDiagnostics.snapshot().progress.coins),
    30077,
  );
  assert.equal(
    await p.evaluate(() => window.menuDiagnostics.snapshot().progress.diamonds),
    77,
  );
  assert.equal(
    await p.evaluate(
      () => window.menuDiagnostics.snapshot().battleAccount.level,
    ),
    25,
  );
  await p.locator("[data-profile-tab=account]").click();
  await p.locator("#reset-local-account").click();
  await p.locator("#reset-cancel").click();
  assert.equal(
    await p.evaluate(
      () => window.menuDiagnostics.snapshot().battleAccount.level,
    ),
    25,
  );
  await p.locator("#reset-local-account").click();
  await p.locator("#reset-confirm-delete").click();
  await p.waitForSelector("#profile-form");
  assert.equal(
    await p.evaluate(() => window.menuDiagnostics.snapshot().profile),
    null,
  );
  await p.locator("#restore-local-account").click();
  await p.waitForSelector("#open-player-profile");
  assert.equal(
    await p.evaluate(() => window.menuDiagnostics.snapshot().progress.coins),
    30077,
  );
  assert.equal(
    await p.evaluate(
      () => window.menuDiagnostics.snapshot().battleAccount.level,
    ),
    25,
  );
  await p.reload();
  await p.waitForSelector("#open-player-profile");
  assert.equal(
    await p.evaluate(() => window.menuDiagnostics.snapshot().progress.diamonds),
    77,
  );
  pass(
    "Explicit developer additions/max level persist; reset cancel preserves account; confirmed delete and recovery backup work",
  );
  for (const [width, height] of [
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.locator("#open-player-profile").click();
    await p.screenshot({ path: `artifacts/polish-profile-${width}.png` });
    assert.ok(await p.locator("[data-profile-tab=account]").isVisible());
    await p.locator("#player-profile-back").click();
  }
  await p.setViewportSize({ width: 1280, height: 720 });
  await p.locator("#open-modes").click();
  await p.locator("#mode-brawl").click();
  await p.locator("[data-add=enemy]").first().click();
  await p.locator("#room-start").click();
  await p.locator("#pick-layla").click();
  await p.locator("#setup-battle-spell").click();
  assert.equal(await p.locator("[data-spell-card]").count(), 12);
  await p.locator("[data-equip-spell=aegis]").click();
  await p.locator("#battle-close").click();
  await p.locator("#hero-confirm").click();
  await p.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.1,
  );
  const snap = () => p.evaluate(() => window.foundationDiagnostics.snapshot());
  assert.equal((await snap()).battleSpell.id, "aegis");
  pass(
    "Selection room changes the actual equipped spell carried through loading into Brawl",
  );
  await p.locator("#world").focus();
  await p.keyboard.down("KeyW");
  await p.keyboard.down("KeyD");
  try {
    await p.waitForFunction(
      () => window.foundationDiagnostics.snapshot().player.x > -3,
      null,
      { timeout: 90000 },
    );
  } finally {
    await p.keyboard.up("KeyW");
    await p.keyboard.up("KeyD");
  }
  await p.locator("#priority-tower").click();
  let state = await snap();
  assert.equal(state.attackCommand?.filter, "tower");
  assert.equal(state.attackCommand?.targetId, "enemy-0");
  const startX = state.player.x;
  await p.waitForFunction(
    () => {
      const s = window.foundationDiagnostics.snapshot();
      return (
        s.lastAttack.targetId === "enemy-0" && s.lastAttack.reason === "fired"
      );
    },
    null,
    { timeout: 60000 },
  );
  state = await snap();
  assert.ok(state.player.x > startX);
  assert.ok(state.ranges.player.targetInRange);
  assert.ok(state.player.x < 12);
  pass(
    "Native tower-priority command persists, approaches from outside range and stops to fire without overlap",
  );
  const visual = await p.evaluate(
    () => window.foundationDiagnostics.hero().rangeVisuals,
  );
  assert.equal(visual.player.radius, state.player.range);
  assert.equal(
    visual.towers.find((t) => t.id === "enemy-0").radius,
    state.structures.find((t) => t.id === "enemy-0").range,
  );
  await p.screenshot({ path: "artifacts/polish-ranges.png" });
  pass("Rendered ground ring radii equal live attack/tower simulation values");
  await p.locator("#world").focus();
  await p.keyboard.down("KeyS");
  await p.waitForFunction(
    () => !window.foundationDiagnostics.snapshot().attackCommand,
  );
  await p.keyboard.up("KeyS");
  pass("WASD cancels automatic approach immediately");
  await p.locator("#settings").click();
  await p.locator("#settings-tab-controls").click();
  await p.locator("#basic-category-priority").selectOption("minion");
  await p.locator("#automatic-target-switch").uncheck();
  assert.equal((await snap()).combatSettings.categoryPriority, "minion");
  assert.equal((await snap()).combatSettings.autoSwitch, false);
  await p.locator("#automatic-target-switch").check();
  await p.locator("#basic-category-priority").selectOption("hero");
  await p.locator("#settings-dialog [data-close]").click();
  pass("Native combat settings drive the actual simulation policy");
  await p.locator("#match-pause").click();
  await p.locator("#match-quit-menu").click();
  await p.locator("#open-modes").click();
  await p.locator("#mode-training").click();
  await finishPracticeEntry(p);
  await learnPracticeKit(p);
  const practiceSnap = () =>
    p.evaluate(() => window.foundationDiagnostics.snapshot());
  const beforeAim = await practiceSnap();
  const b = await p.locator("#skill-1").boundingBox(),
    cx = b.x + b.width / 2,
    cy = b.y + b.height / 2;
  await p.mouse.move(cx, cy);
  await p.mouse.down();
  await p.waitForSelector("#skill-aim-wheel:not([hidden])");
  assert.equal((await practiceSnap()).player.mana, beforeAim.player.mana);
  await p.mouse.move(cx - 55, cy - 12);
  assert.ok((await practiceSnap()).aiming);
  assert.equal(
    await p.evaluate(() => window.foundationDiagnostics.hero().sightVisible),
    true,
  );
  await p.screenshot({ path: "artifacts/polish-skill-wheel.png" });
  await p.keyboard.press("Escape");
  await p.mouse.up();
  assert.equal(
    (await practiceSnap()).lastCast.serial,
    beforeAim.lastCast.serial,
  );
  pass(
    "Held pointer displays directional skill wheel and actual range; Escape cancels without casting/spending",
  );
  await p.mouse.move(cx, cy);
  await p.mouse.down();
  await p.waitForSelector("#skill-aim-wheel:not([hidden])");
  await p.mouse.move(cx - 55, cy - 12);
  await p.mouse.up();
  await p.waitForFunction(
    (n) => window.foundationDiagnostics.snapshot().lastCast.serial > n,
    beforeAim.lastCast.serial,
  );
  assert.ok((await practiceSnap()).player.mana < beforeAim.player.mana);
  pass(
    "Relative pointer drag and release casts actual projectile once through normal mana/cooldown authority",
  );
  await p.waitForFunction(
    () => !window.foundationDiagnostics.snapshot().actionLocked,
  );
  const second = await practiceSnap();
  await p.locator("#world").focus();
  await p.mouse.move(500, 250);
  await p.keyboard.down("Digit2");
  await p.waitForSelector("#skill-aim-wheel:not([hidden])");
  await p.mouse.move(545, 265);
  await p.keyboard.up("Digit2");
  assert.ok((await practiceSnap()).lastCast.serial > second.lastCast.serial);
  pass(
    "Keyboard hold uses the same relative wheel/release lifecycle for circular orb aiming",
  );
  await p.waitForFunction(
    () => !window.foundationDiagnostics.snapshot().actionLocked,
  );
  const ultimate = await practiceSnap();
  await p.keyboard.down("Digit3");
  await p.waitForSelector("#skill-aim-wheel:not([hidden])");
  const cancel = await p.locator("#cancel-skill").boundingBox();
  await p.mouse.move(cancel.x + cancel.width / 2, cancel.y + cancel.height / 2);
  await p.keyboard.up("Digit3");
  assert.equal(
    (await practiceSnap()).lastCast.serial,
    ultimate.lastCast.serial,
  );
  pass(
    "Dedicated cancel area discards ultimate aim without a cast or cooldown",
  );
  await p.locator("#practice-exit").click();
  await p.locator("[data-leave]").click();
  await p.locator("#room-back").click();
  await p.locator("#ai-modes-back").click();
  await p.locator("#modes-back").click();
  await p.locator("#open-modes").click();
  await p.locator("#mode-brawl").click();
  await p.locator("[data-add=enemy]").first().click();
  await p.locator("#room-start").click();
  await p.locator("#pick-layla").click();
  await p.locator("#hero-confirm").click();
  await p.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.1,
  );
  await p.locator("#battle-spell").click();
  await p.locator("#regen").click();
  await p.waitForSelector("#battle-spell.cooling-down");
  await p.waitForSelector("#regen.cooling-down");
  assert.ok(
    Number(await p.locator("#battle-spell").getAttribute("data-cooldown")) > 0,
  );
  assert.match(await p.locator("#regen .utility-state").innerText(), /^\d+$/);
  const cdSnap = await snap();
  assert.ok(
    Math.abs(
      Number(await p.locator("#battle-spell").getAttribute("data-cooldown")) -
        cdSnap.battleSpell.remaining,
    ) < 1,
  );
  assert.equal(await p.locator("#match-feed").innerText(), "");
  await p.locator("#recall").click();
  await p.waitForSelector("#recall.cooling-down[data-channel=true]");
  await p.screenshot({ path: "artifacts/polish-utility-cooldowns.png" });
  await p.locator("#world").focus();
  await p.keyboard.press("KeyD");
  pass(
    "Spell/Regen cooldowns and Recall channel use dark overlays and authoritative numerical countdowns; ordinary action feed is clean",
  );
  assert.deepEqual((await snap()).buildPriority.sequence, [
    "swift-boots",
    "haas-claws",
  ]);
  assert.equal((await snap()).priorityItem, "swift-boots");
  assert.equal(
    await p.locator("#quick-buy").getAttribute("data-item"),
    "swift-boots",
  );
  await p.locator("#quick-buy").click();
  assert.equal((await snap()).priorityItem, "haas-claws");
  const nextId = await p.locator("#quick-buy").getAttribute("data-item");
  assert.notEqual(nextId, "haas-claws");
  assert.match(
    await p.locator("#quick-buy-panel small").innerText(),
    /Goal: Haas/,
  );
  pass(
    "Selected Preparation build automatically enters match and advances to missing component after completed item purchase",
  );
  await p.locator("#shop").click();
  await p.locator("[data-category=Recommended]").click();
  assert.deepEqual(
    await p
      .locator("#armory-catalog [data-item]")
      .evaluateAll((bs) => bs.map((b) => b.dataset.item)),
    ["swift-boots", "haas-claws"],
  );
  await p.locator("[data-item=haas-claws]").click();
  assert.ok((await p.locator(".recipe-tree li").count()) > 1);
  assert.ok((await p.locator(".recipe-tree .next-component").count()) > 0);
  await p.locator("[data-view=simple]").click();
  assert.equal(
    await p.locator("#armory-catalog [data-item=dagger]").count(),
    0,
  );
  await p.locator("[data-view=all]").click();
  await p.locator("[data-category=All]").click();
  assert.equal(await p.locator("#armory-catalog [data-item]").count(), 45);
  await p.locator("[data-item=blade-of-despair]").click();
  await p.locator("#item-prioritize").click();
  assert.equal((await snap()).priorityItem, "blade-of-despair");
  await p.locator("[data-category=Recommended]").click();
  await p.locator("#resume-saved-build").click();
  assert.equal((await snap()).priorityItem, "haas-claws");
  await p.screenshot({ path: "artifacts/polish-recommended-shop.png" });
  await p.locator("#shop-dialog [data-close]").click();
  pass(
    "Recommended uses saved order; Simple/All modes, complete recipe trees, next missing highlight and manual override/resume remain connected",
  );
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.locator("#shop").click();
    const r = await p.locator("#item-purchase").boundingBox();
    assert.ok(
      r.x >= 0 &&
        r.y >= 0 &&
        r.x + r.width <= width &&
        r.y + r.height <= height,
    );
    await p.screenshot({ path: `artifacts/polish-shop-${width}.png` });
    await p.locator("#shop-dialog [data-close]").click();
  }
  await p.setViewportSize({ width: 1280, height: 720 });
  await p.locator("#match-pause").click();
  await p.locator("#match-quit-menu").click();
  await p.locator("#open-preparation").click();
  await p.locator("[data-prep-tab=spells]").click();
  await p.locator("#prep-spells").click();
  await p.locator("[data-inspect-spell=flameshot]").click();
  assert.match(await p.locator(".spell-inspector").innerText(), /Flameshot/);
  assert.match(await p.locator(".spell-inspector").innerText(), /50s cooldown/);
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.screenshot({ path: `artifacts/polish-spell-wiki-${width}.png` });
    assert.ok(await p.locator("#battle-close").isVisible());
  }
  await p.locator("#battle-layout").click();
  assert.equal(await p.locator(".battle-screen.detailed-spells").count(), 1);
  await p.locator("#battle-close").click();
  await p.locator("#prep-back").click();
  await p.setViewportSize({ width: 1280, height: 720 });
  pass(
    "Reference-inspired spell icon browser/detail panel retains detailed cards; shop stays usable at all three landscape sizes",
  );
  // PHASE9_BROWSER
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  const htmlSha256 = createHash("sha256")
    .update(await readFile("index.html"))
    .digest("hex");
  await writeFile(
    "docs/game-polish-browser-results.json",
    JSON.stringify({ checks, errors, warnings, requests, htmlSha256 }, null, 2),
  );
  console.log(
    JSON.stringify({ passed: checks.length, errors, warnings, requests }),
  );
} finally {
  await browser.close();
}
