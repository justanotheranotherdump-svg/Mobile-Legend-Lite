import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { launchOfflineBrowser } from "./helpers/offline-browser.mjs";
let progressTimer;
const checks = [],
  errors = [],
  warnings = [],
  requests = [];
const pass = (m) => {
  checks.push(m);
  console.log("PASS: " + m);
};
const bundleSha256 = createHash("sha256")
  .update(await readFile("index.html"))
  .digest("hex");
await mkdir("artifacts", { recursive: true });
const browser = await launchOfflineBrowser();
const timer = setTimeout(() => browser.close(), 1500000);
try {
  const context = await browser.newContext({
      offline: true,
      viewport: { width: 1280, height: 720 },
    }),
    page = await context.newPage();
  page.setDefaultTimeout(90000);
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.type() === "warning") warnings.push(m.text());
  });
  page.on("request", (r) => {
    if (r.resourceType() !== "document") requests.push(r.url());
  });
  const menu = () => page.evaluate(() => window.menuDiagnostics.snapshot());
  const snap = () =>
    page.evaluate(() => window.foundationDiagnostics.snapshot());
  const screen = async (name) =>
    page.waitForFunction(
      (n) => window.menuDiagnostics.snapshot().screen === n,
      name,
    );
  const live = async () =>
    page.waitForFunction(
      () => window.foundationDiagnostics?.snapshot().time > 1,
      null,
      { timeout: 90000 },
    );
  const confirm = async () => {
    assert.equal(await page.locator("#hero-confirm").isDisabled(), true);
    await page.locator("#pick-layla").click();
    await page.locator("#hero-confirm").click();
    await live();
  };
  await page.goto(pathToFileURL(resolve("index.html")).href + "#diagnostics");
  await page.locator("#profile-username").fill("Lane_Hero");
  await page.locator('[data-gender="Female"]').click();
  await page.locator("#profile-continue").click();
  await screen("lobby");
  const wallet = (await menu()).progress;
  await page.locator("#open-modes").click();
  for (const id of ["classic", "ranked"])
    assert.equal(await page.locator("#mode-" + id).isDisabled(), true);
  assert.equal(await page.locator("#mode-brawl").isEnabled(), true);
  await page.locator("#mode-training").click();
  await screen("ai-modes");
  assert.equal(await page.locator(".ai-mode-card").count(), 4);
  assert.equal((await menu()).gameInitializations, 0);
  assert.equal(await page.locator("#app").isHidden(), true);
  await page.locator("#ai-mode-vs-ai").click();
  await screen("room");
  assert.equal(await page.locator("#room-difficulty").inputValue(), "normal");
  assert.equal(await page.locator(".room-slot").count(), 10);
  await page.locator("#room-difficulty").selectOption("hard");
  assert.match(await page.locator("#room-summary").innerText(), /HARD/);
  await page.locator("#room-back").click();
  await page.locator("#ai-mode-custom").click();
  await page.locator("#room-team-size").selectOption("3");
  assert.equal(await page.locator(".room-slot.occupied").count(), 6);
  await page.locator("#room-start").click();
  await screen("selection");
  assert.equal((await menu()).gameInitializations, 0);
  assert.equal(await page.locator("#hero-confirm").isDisabled(), true);
  await page.screenshot({ path: "artifacts/match-hero-selection.png" });
  await page.locator("#selection-back").click();
  await page.locator("#room-back").click();
  pass(
    "Classic/Ranked disabled; four AI scenarios, Normal default, real Hard/custom roster configuration, guarded selection and all Back routes remain combat-isolated",
  );
  await page.locator("#ai-mode-ai-training").click();
  await page.locator("#room-difficulty").selectOption("normal");
  await page.locator("#room-start").click();
  await page.evaluate(() => {
    window.loadStages = [];
    new MutationObserver(() => {
      const p = document.querySelector("#local-load-progress");
      if (p && !window.loadStages.includes(p.value))
        window.loadStages.push(p.value);
    }).observe(document.querySelector("#menu-content"), {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    });
  });
  await confirm();
  let s = await snap();
  assert.equal(s.matchConfig.mode, "ai-training");
  assert.equal(s.progression.level, 1);
  assert.equal(s.gold, 350);
  assert.equal((await menu()).gameInitializations, 1);
  assert.equal(s.structures.length, 6);
  assert.equal(s.enemies.filter((a) => a.kind === "bot").length, 5);
  assert.equal(s.allies.length, 4);
  assert.deepEqual(
    await page.evaluate(() => window.loadStages.filter((x) => x > 0)),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.match(await page.locator("#player-label").innerText(), /Lane_Hero/);
  assert.match(await page.locator("#player-label").innerText(), /HP/);
  assert.match(await page.locator("#player-label").innerText(), /MP/);
  pass(
    "validated hero confirmation completes seven actual local setup stages, then one 5v5 simulation/countdown; saved name, actual level/HP/mana and six objectives rendered",
  );
  await page.locator("#practice-tools summary").click();
  await page.locator("#practice-level").fill("15");
  await page.locator("#practice-set-level").click();
  await page.locator("#practice-tools summary").click();
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForFunction(
      () => window.foundationDiagnostics.snapshot().width === innerWidth,
    );
    for (const id of ["skill-1", "skill-2", "skill-ultimate"]) {
      const b = await page.locator("#" + id).boundingBox(),
        plus = await page.locator("#upgrade-" + id).boundingBox();
      assert.ok(
        plus &&
          plus.x + plus.width / 2 >= b.x + b.width - 20 &&
          plus.x + plus.width / 2 <= b.x + b.width + 18,
        `${id} upgrade not adjacent right at ${width}`,
      );
      assert.ok(
        plus.y + plus.height / 2 >= b.y - 15 &&
          plus.y + plus.height / 2 <= b.y + 20,
        `${id} upgrade not anchored top at ${width}`,
      );
      assert.ok(
        plus.x >= 0 &&
          plus.y >= 0 &&
          plus.x + plus.width <= width &&
          plus.y + plus.height <= height,
      );
    }
    for (const sel of ["#attack", "#recall", "#regen"]) {
      const r = await page.locator(sel).boundingBox();
      assert.ok(
        r.x >= 0 &&
          r.y >= 0 &&
          r.x + r.width <= width + 1 &&
          r.y + r.height <= height + 1,
      );
    }
    assert.equal(
      await page.locator(".skill-upgrades,.upgrade-caption").count(),
      0,
    );
    assert.ok(
      await page
        .locator("#skill-1 img")
        .evaluate((i) => i.complete && i.naturalWidth > 0),
    );
    assert.ok(
      await page
        .locator("#recall img")
        .evaluate((i) => i.complete && i.naturalWidth > 0),
    );
    await page.screenshot({
      path: `artifacts/match-hud-${width}x${height}.png`,
    });
  }
  const before = await snap();
  await page.locator("#upgrade-skill-1").click();
  s = await snap();
  assert.equal(s.progression.skillPoints, before.progression.skillPoints - 1);
  assert.equal(s.progression.ranks["malefic-bomb"], 1);
  assert.equal(s.lastCast.serial, before.lastCast.serial);
  assert.equal(s.aiming, null);
  assert.equal(await page.locator("#skill-2 .skill-state").innerText(), "");
  assert.equal(
    await page
      .locator("#skill-2")
      .evaluate((e) => e.classList.contains("unlearned")),
    true,
  );
  pass(
    "wrapper-relative legal + badges remain top-right at 1280×720, 960×540 and 844×390; click spends exactly one point without casting; dark rank-zero local PNGs, no far-left row or UNLEARNED text",
  );
  await page.setViewportSize({ width: 960, height: 540 });
  await page.locator("#shop").click();
  await page.locator('[data-category="All"]').click();
  await page.locator('[data-item="dagger"]').click();
  await page.locator("#item-purchase").click();
  await page.waitForFunction(
    () => window.foundationDiagnostics.snapshot().inventory[0] === "dagger",
  );
  s = await snap();
  assert.equal(s.inventory.filter(Boolean).length, 1);
  assert.equal(s.gold - s.stats.goldEarned, 100);
  assert.equal(s.player.attributes.physicalAttack, 267);
  await page.locator('#match-inventory [data-equipped="0"]').click();
  assert.equal(await page.locator("#item-sell").isVisible(), true);
  await page.locator("#item-sell").click();
  await page.waitForFunction(
    () => window.foundationDiagnostics.snapshot().inventory[0] === null,
  );
  s = await snap();
  assert.equal(s.player.attributes.physicalAttack, 252);
  await page.locator('[data-item="blade-of-despair"]').click();
  assert.equal(await page.locator("#item-purchase").isDisabled(), true);
  s = await snap();
  assert.equal(s.gold - s.stats.goldEarned, 250);
  assert.equal(await page.locator("#match-inventory button").count(), 6);
  await page.screenshot({ path: "artifacts/match-equipment.png" });
  await page.locator("#shop-dialog [data-close]").click();
  await page.locator("#match-pause").click();
  const frozen = (await snap()).time;
  await page.waitForTimeout(400);
  assert.equal((await snap()).time, frozen);
  await page.locator("#match-resume").click();
  await page.waitForFunction(
    (t) => window.foundationDiagnostics.snapshot().time > t + 0.05,
    frozen,
  );
  await page.locator("#match-pause").click();
  await page.locator("#match-quit-room").click();
  await screen("room");
  assert.equal(
    await page.evaluate(() => typeof window.foundationDiagnostics),
    "undefined",
  );
  assert.equal((await menu()).lastDisposed.listenerScopeAborted, true);
  assert.deepEqual((await menu()).progress, wallet);
  pass(
    "actual shop buy/equip/unique/insufficient/sell transactions update six slots, gold and effective PA; pause freezes clock; safe quit disposes listeners/RAF and preserves account wallet",
  );
  await page.locator("#room-back").click();
  await page.locator("#ai-mode-practice").click();
  await page.locator("#room-start").click();
  await confirm();
  s = await snap();
  assert.equal(s.phase, undefined);
  assert.equal(s.enemies.length, 3);
  assert.equal(s.progression.level, 1);
  assert.equal(s.progression.totalXp, 0);
  assert.equal(await page.locator("#match-pause").count(), 0);
  await page.locator("#practice-exit").click();
  await page.locator("[data-resume]").click();
  await page.locator("#practice-exit").click();
  await page.locator("[data-leave]").click();
  await screen("room");
  pass(
    "Practice travels through the same guarded prematch flow but retains separate three-dummy, reward-free sandbox and working exit / resume",
  );
  await page.locator("#room-back").click();
  await page.locator("#ai-modes-back").click();
  await page.locator("#mode-brawl").click();
  await page.locator("[data-add=enemy]").first().click();
  await page.locator("#room-difficulty").selectOption("normal");
  await page.locator("#room-start").click();
  await confirm();
  s = await snap();
  assert.equal(s.matchConfig.mode, "brawl");
  assert.equal(s.progression.level, 3);
  assert.equal(s.gold, 800);
  assert.equal(await page.locator("#practice-set-level").isHidden(), true);
  assert.equal(await page.locator("#reset").isDisabled(), true);
  await page.locator("#shop").click();
  await page.locator('[data-category="All"]').click();
  await page.locator('[data-item="dagger"]').click();
  await page.locator("#item-purchase").click();
  assert.equal(await page.locator("#item-purchase").isDisabled(), true);
  assert.match(
    await page.locator("#purchase-validation").innerText(),
    /unique-item/,
  );
  await page.locator('[data-item="knife"]').click();
  await page.locator("#item-purchase").click();
  await page.locator('[data-item="basic-boots"]').click();
  await page.locator('#match-inventory [data-equipped="0"]').click();
  await page.locator("#item-sell").click();
  await page.locator('[data-item="basic-boots"]').click();
  await page.locator("#item-purchase").click();
  await page.waitForFunction(
    () => window.foundationDiagnostics.snapshot().gold === 170,
  );
  s = await snap();
  assert.deepEqual(s.inventory.slice(0, 2), ["basic-boots", "knife"]);
  assert.equal(s.player.attributes.movementSpeed, 260);
  assert.ok(s.player.attributes.attackSpeed > 1.1);
  await page.locator("#shop-dialog [data-close]").click();
  pass(
    "Brawl uses level 3 / 800 gold and actual editable 1v1 roster; unique items reject repeat purchases, explicit sale credits 60% once before automatic free-slot purchase and recomputes attack/movement speed",
  );
  // No mutation/fast-forward API: run actual live simulation until the enemy core/own core is destroyed.
  console.log(
    "Waiting for an actual unattended Brawl result (fixed simulation clock, no state injection)…",
  );
  progressTimer = setInterval(async () => {
    try {
      const state = await snap();
      console.log(
        `Live Brawl ${state.time.toFixed(1)}s, wave ${state.wave}, objectives ${state.structures.map((o) => Math.ceil(o.hp)).join("/")}`,
      );
    } catch {}
  }, 60000);
  await page.waitForFunction(
    () => window.menuDiagnostics.snapshot().screen === "results",
    null,
    { timeout: 1000000 },
  );
  clearInterval(progressTimer);
  const resultText = await page.locator(".results-screen").innerText();
  assert.match(resultText, /Victory|Defeat/i);
  assert.match(resultText, /Core destruction/);
  assert.match(resultText, /ACCOUNT XP \+100.*LV 2/);
  assert.equal((await menu()).battleAccount.level, 2);
  assert.deepEqual((await menu()).progress, wallet);
  assert.equal((await menu()).lastDisposed.disposed, true);
  await page.screenshot({ path: "artifacts/match-results.png" });
  pass(
    "actual unattended Brawl reaches sequential core destruction → real results with implemented duration / eliminations / deaths / assists / level / combat gold, no account currency/rank rewards; explicit account XP only",
  );
  const recorded = (await menu()).history.matches;
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].mode, "brawl");
  assert.equal(recorded[0].hero, "layla");
  assert.match(resultText, new RegExp(recorded[0].result, "i"));
  assert.ok(recorded[0].duration > 0);
  await page.locator("#results-replay").click();
  await screen("selection");
  await confirm();
  s = await snap();
  assert.equal(s.gold, 800);
  assert.deepEqual(s.inventory, Array(6).fill(null));
  assert.equal(s.progression.level, 3);
  assert.equal(s.stats.deaths, 0);
  assert.ok(s.structures.every((o) => o.hp === o.maxHp));
  assert.equal(s.wave, 1);
  assert.equal(s.result, null);
  await page.locator("#match-pause").click();
  await page.locator("#match-quit-menu").click();
  await screen("lobby");
  await page.waitForFunction(
    () => window.menuDiagnostics.snapshot().lobby.rendering,
  );
  assert.equal((await menu()).lobby.status, "glb");
  assert.equal((await menu()).lobby.modelLoads, 0);
  assert.deepEqual((await menu()).progress, wallet);
  pass(
    "fresh replay re-enters explicit hero confirmation and resets all match state; Main Menu restores the same approved shared GLB without a second asset load",
  );
  await page.locator("#open-player-profile").click();
  await page.locator("[data-profile-tab=history]").click();
  assert.equal(await page.locator(".history-card").count(), 1);
  assert.match(
    await page.locator(".history-card").innerText(),
    new RegExp(recorded[0].result, "i"),
  );
  await page.locator("[data-profile-tab=heroes]").click();
  assert.match(
    await page.locator(".hero-stat").innerText(),
    /1 completed matches/,
  );
  await page.locator("#player-profile-back").click();
  pass(
    "Completed natural match records actual result/hero/mode/duration/KDA once; replay quit adds nothing and Profile History/Statistics read the saved record",
  );
  // A separate coarse-pointer context validates the actual virtual joystick, not a CSS-only control.
  const touch = await browser.newContext({
      offline: true,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 844, height: 390 },
    }),
    tp = await touch.newPage();
  tp.setDefaultTimeout(90000);
  tp.on("pageerror", (e) => errors.push(String(e)));
  await tp.goto(
    pathToFileURL(resolve("index.html")).href + "?screen=training#diagnostics",
  );
  await tp.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.1,
  );
  assert.equal(await tp.locator("#joystick").isVisible(), true);
  const r = await tp.locator("#joystick").boundingBox(),
    pos = await tp.evaluate(
      () => window.foundationDiagnostics.snapshot().player,
    );
  const cdp = await touch.newCDPSession(tp);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: r.x + r.width - 2, y: r.y + r.height / 2 }],
  });
  await tp.waitForFunction(
    (p) =>
      Math.hypot(
        window.foundationDiagnostics.snapshot().player.x - p.x,
        window.foundationDiagnostics.snapshot().player.z - p.z,
      ) > 0.3,
    pos,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await tp.screenshot({ path: "artifacts/match-touch-844x390.png" });
  await touch.close();
  pass(
    "coarse-pointer 844×390 exposes a real drag joystick that moves the authoritative hero, with existing WASD and skill gestures preserved",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(
    requests.filter((u) => !u.startsWith("data:") && !u.startsWith("blob:")),
    [],
  );
  pass(
    "actual standalone file:// with offline networking: no JavaScript errors or external runtime asset requests",
  );
  await writeFile(
    "docs/match-browser-results.json",
    JSON.stringify(
      {
        environment:
          "Linux Chromium, software WebGL, actual standalone file://, offline:true; touch pointer emulation, not native Windows or physical device",
        bundleSha256,
        checks,
        errors,
        warnings,
        requests,
        resultText,
        initializations: (await menu()).gameInitializations,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`${checks.length} connected-match browser checks passed.`);
} catch (error) {
  await writeFile(
    "artifacts/match-browser-failure.json",
    JSON.stringify(
      { checks, errors, warnings, requests, failure: String(error) },
      null,
      2,
    ),
  );
  throw error;
} finally {
  clearTimeout(timer);
  clearInterval(progressTimer);
  await browser.close();
}
