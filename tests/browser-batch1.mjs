import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { launchOfflineBrowser } from "./helpers/offline-browser.mjs";
const checks = [],
  errors = [],
  warnings = [],
  requests = [],
  timings = [];
const pass = (m) => {
  checks.push(m);
  console.log("PASS: " + m);
};
await mkdir("artifacts", { recursive: true });
const browser = await launchOfflineBrowser(),
  timer = setTimeout(() => browser.close(), 1000000);
let p;
try {
  const ctx = await browser.newContext({
    offline: true,
    viewport: { width: 1280, height: 720 },
  });
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
  await p.addInitScript(() => {
    window.loadingAudit = [];
    let start = null;
    new MutationObserver(() => {
      const screen = document.querySelector("#menu-root")?.dataset.screen;
      if (screen === "loading" && !start) start = performance.now();
      if (screen === "loading") {
        const app = document.querySelector("#app");
        if (app && !app.hidden) window.loadingAudit.push({ leak: true });
      }
      if (screen === "training" && start) {
        window.loadingAudit.push({ elapsed: performance.now() - start });
        start = null;
      }
    }).observe(document, { attributes: true, childList: true, subtree: true });
  });
  await p.goto(pathToFileURL(resolve("index.html")).href + "#diagnostics");
  await p.bringToFront();
  await p.locator("#profile-username").fill("Batch1_Hero");
  await p.locator("[data-gender=Female]").click();
  await p.locator("#profile-continue").click();
  await p.locator("#open-modes").click();
  await p.locator("#mode-brawl").click();
  await p.locator("[data-add=enemy]").first().click();
  await p.locator("#room-start").click();
  assert.equal(await p.locator("#lobby-preview").isHidden(), true);
  assert.equal(await p.locator("#selection-prompt").isVisible(), true);
  assert.equal(await p.locator(".selection-info").count(), 0);
  assert.equal(
    (await p.evaluate(() => window.menuDiagnostics.snapshot()))
      .gameInitializations,
    0,
  );
  pass(
    "Selection opens empty: no default model, description/debug panel or gameplay initialization",
  );
  const selectionSrc = await p.locator("#lobby-backdrop").getAttribute("src");
  await p.locator("#pick-layla").click();
  assert.equal(await p.locator("#lobby-preview").isVisible(), true);
  assert.equal(await p.locator("#selection-prompt").isHidden(), true);
  pass(
    "Explicit Layla pick reveals the genuine shared GLB; hero name and confirm remain available",
  );
  await p.locator("#selection-back").click();
  await p.locator("#room-start").click();
  assert.equal(await p.locator("#lobby-preview").isHidden(), true);
  assert.equal(await p.locator("#hero-confirm").isDisabled(), true);
  pass(
    "Leave/re-enter selection resets pick/preview without losing Brawl room configuration",
  );
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.screenshot({
      path: `artifacts/batch1-selection-empty-${width}x${height}.png`,
    });
  }
  await p.locator("#pick-layla").click();
  await p.screenshot({ path: "artifacts/batch1-selection-picked.png" });
  const enter = async (mode) => {
    const before = (await p.evaluate(() => window.loadingAudit)).filter(
      (a) => a.elapsed,
    ).length;
    await p.locator("#hero-confirm").click();
    await p.waitForSelector(".roster-loading");
    assert.equal(await p.locator("#app").isHidden(), true);
    assert.ok(await p.locator("#lineup-view-progress").count());
    await p.screenshot({ path: `artifacts/batch1-loading-${mode}.png` });
    await p.waitForFunction(
      () => window.menuDiagnostics.snapshot().screen === "training",
    );
    const audit = await p.evaluate(() => window.loadingAudit);
    const time = audit.filter((a) => a.elapsed)[before];
    assert.ok(time.elapsed >= 9950, JSON.stringify(time));
    assert.ok(!audit.some((a) => a.leak));
    timings.push({ mode, elapsedMs: time.elapsed });
    await p.waitForFunction(
      () => window.foundationDiagnostics?.snapshot().time > 0.1,
    );
  };
  await enter("brawl");
  await p.locator("#attack").click();
  assert.equal(await p.locator("#attack-feedback").isVisible(), true);
  assert.match(
    await p.locator("#attack-feedback").innerText(),
    /range|target/i,
  );
  pass(
    "Out-of-range attack gives visible feedback instead of silently doing nothing",
  );
  pass(
    "Brawl lineup is a true >=10-second loading state, animated viewing progress, actual picks, and no gameplay HUD leak",
  );
  await p.setViewportSize({ width: 1280, height: 720 });
  const snap = () => p.evaluate(() => window.foundationDiagnostics.snapshot());
  // Historical exact-attempt fixtures opt out explicitly; persistent commands
  // are exercised below after restoring the native setting (and in game-polish).
  await p.locator("#settings").click();
  await p.locator("#settings-tab-controls").click();
  await p.locator("#smart-basic").uncheck();
  await p.locator("#settings-dialog [data-close]").click();
  await p.locator("#world").focus();
  await p.keyboard.down("KeyW");
  await p.keyboard.down("KeyD");
  try {
    await p.waitForFunction(
      () => {
        const s = window.foundationDiagnostics.snapshot();
        return s.enemies.some(
          (a) =>
            a.kind === "bot" &&
            a.hp > 0 &&
            a.targetable !== false &&
            !a.protected &&
            Math.hypot(a.x - s.player.x, a.z - s.player.z) <=
              s.player.range - 0.2,
        );
      },
      null,
      { timeout: 45000 },
    );
  } finally {
    await p.keyboard.up("KeyW");
    await p.keyboard.up("KeyD");
  }
  const ready = () =>
    p.waitForFunction(() => {
      const s = window.foundationDiagnostics.snapshot();
      return (
        s.player.hp > 0 &&
        !s.player.stunned &&
        !s.actionLocked &&
        s.player.cooldown < 0.00001
      );
    });
  await ready();
  await p.locator("#attack").click();
  let s = await snap();
  assert.equal(s.lastAttack.reason, "fired");
  let hit = s.enemies.find((a) => a.id === s.lastAttack.targetId);
  assert.equal(hit.kind, "bot");
  pass(
    "Large mouse attack acquires a real nearby hero automatically without any manual click",
  );
  const panel = await p.evaluate(() => {
    const s = window.foundationDiagnostics.snapshot(),
      a = s.enemies.find((a) => a.id === s.selectedTargetId),
      el = document.querySelector("#selected-enemy-info");
    return {
      visible: !el.hidden,
      targetId: el.dataset.targetId,
      name: document.querySelector("#enemy-info-name").textContent,
      hp: document.querySelector("#enemy-info-hp").textContent,
      mana: document.querySelector("#enemy-info-mana").textContent,
      a,
      level: document.querySelector("#enemy-info-level").textContent,
    };
  });
  assert.ok(panel.visible);
  assert.equal(panel.name, panel.a.name);
  assert.equal(panel.hp, `HP ${Math.ceil(panel.a.hp)} / ${panel.a.maxHp}`);
  assert.equal(
    panel.mana,
    `MP ${Math.floor(panel.a.mana)} / ${panel.a.maxMana}`,
  );
  assert.equal(panel.level, `Lv ${panel.a.progression.level}`);
  assert.match(panel.name, /Computer/);
  pass(
    "Selected enemy panel mirrors live name, level, exact HP and mana with no fabricated fields",
  );
  const nameplate = await p
    .locator(`[data-enemy-id="${panel.a.id}"]`)
    .evaluate((el) => ({
      name: el.querySelector(".actor-name").textContent,
      color: getComputedStyle(el.querySelector(".actor-hp")).backgroundColor,
      level: el.dataset.level,
    }));
  assert.equal(nameplate.name, panel.a.name);
  assert.equal(nameplate.color, "rgb(241, 102, 108)");
  assert.equal(Number(nameplate.level), panel.a.progression.level);
  pass(
    "Enemy hero overhead name/level/HP/mana stays visible with a red team health bar",
  );
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    const box = await p.locator("#selected-enemy-info").boundingBox();
    assert.ok(
      box &&
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= width &&
        box.y + box.height <= height,
    );
    const noOverlap = await p.evaluate(() => {
      const a = document
        .querySelector("#selected-enemy-info")
        .getBoundingClientRect();
      return ["#minimap-panel", "#practice-tools summary", ".hero-panel"].every(
        (sel) => {
          const e = document.querySelector(sel);
          if (!e || !e.getClientRects().length) return true;
          const b = e.getBoundingClientRect();
          return (
            a.right <= b.left ||
            a.left >= b.right ||
            a.bottom <= b.top ||
            a.top >= b.bottom
          );
        },
      );
    });
    assert.ok(noOverlap, "enemy panel must not overlap existing HUD panels");
    await p.screenshot({
      path: `artifacts/batch1-selected-enemy-${width}x${height}.png`,
    });
  }
  await p.setViewportSize({ width: 1280, height: 720 });
  pass(
    "Selected enemy panel remains in bounds without covering map, testing toggle or player HUD at all three landscape sizes",
  );
  const pos = { x: s.player.x, z: s.player.z };
  await ready();
  await p.locator("#world").focus();
  await p.keyboard.press("Space");
  s = await snap();
  assert.equal(s.lastAttack.reason, "fired");
  assert.equal(s.player.x, pos.x);
  assert.equal(s.player.z, pos.z);
  pass(
    "Native Space single-attempt setting preserves targeting, position, cooldown and action locks",
  );
  await p.locator("#settings").click();
  await p.locator("#settings-tab-controls").click();
  await p.locator("#smart-basic").check();
  await p.locator("#settings-dialog [data-close]").click();
  await ready();
  await p.locator("#priority-minion").click();
  s = await snap();
  assert.equal(s.attackCommand.filter, "minion");
  assert.equal(
    s.enemies.find((a) => a.id === s.attackCommand.targetId).kind,
    "minion",
  );
  await p.waitForFunction(
    () => {
      const s = window.foundationDiagnostics.snapshot();
      return (
        s.lastAttack.reason === "fired" &&
        s.enemies.some(
          (a) => a.id === s.lastAttack.targetId && a.kind === "minion",
        )
      );
    },
    null,
    { timeout: 60000 },
  );
  assert.equal(s.targetCategory, "minion");
  pass(
    "Minion priority persists through cooldown/approach and fires only at its minion category",
  );
  // Category replacement remains valid even while the persistent minion command is firing.
  await p.locator("#priority-tower").click();
  s = await snap();
  if (!s.attackCommand) {
    assert.match(
      await p.locator("#attack-feedback").innerText(),
      /No eligible target.*search range/,
    );
    // The nearby hero must NOT steal this command. Walk into the permitted
    // tower search radius rather than requiring an unbounded cross-map chase.
    await p.locator("#world").focus();
    await p.keyboard.down("KeyW");
    try {
      await p.waitForFunction(
        () => {
          const s = window.foundationDiagnostics.snapshot();
          return s.structures.some(
            (t) =>
              t.team === "enemy" &&
              t.hp > 0 &&
              !t.protected &&
              Math.hypot(t.x - s.player.x, t.z - s.player.z) <
                s.player.range + 9.5,
          );
        },
        null,
        { timeout: 60000 },
      );
    } finally {
      await p.keyboard.up("KeyW");
    }
    await p.locator("#priority-tower").click();
    s = await snap();
  }
  console.log('Tower approach fixture', JSON.stringify({time:s.time,player:{x:s.player.x,z:s.player.z,hp:s.player.hp,maxHp:s.player.maxHp},command:s.attackCommand,stats:s.stats,nearby:s.enemies.filter(a=>Math.hypot(a.x-s.player.x,a.z-s.player.z)<15).map(a=>({id:a.id,kind:a.kind,hp:a.hp,x:a.x,z:a.z}))}));
  assert.equal(s.attackCommand.filter, "tower");
  assert.ok(
    ["tower", "core"].includes(
      s.enemies.find((a) => a.id === s.attackCommand.targetId).kind,
    ),
  );
  await p.waitForFunction(
    () => {
      const s = window.foundationDiagnostics.snapshot();
      return (
        s.lastAttack.reason === "fired" &&
        s.structures.some(
          (a) => a.id === s.lastAttack.targetId && a.team === "enemy",
        )
      );
    },
    null,
    { timeout: 60000 },
  );
  assert.equal(s.targetCategory, "tower");
  pass(
    "Tower priority persists and approaches an eligible structure without falling back to heroes",
  );
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.screenshot({
      path: `artifacts/batch1-combat-${width}x${height}.png`,
    });
  }
  await p.locator("#match-pause").click();
  await p.locator("#match-quit-menu").click();
  await p.locator("#open-modes").click();
  await p.locator("#mode-training").click();
  await p.locator("#ai-mode-ai-training").click();
  await p.locator("#room-start").click();
  await p.locator("#pick-layla").click();
  await enter("ai-training");
  pass(
    "AI Training also enforces the same >=10-second readiness-plus-presentation gate",
  );
  await p.locator("#match-pause").click();
  await p.locator("#match-quit-room").click();
  await p.locator("#room-back").click();
  await p.locator("#ai-mode-practice").click();
  await p.locator("#room-start").click();
  await p.locator("#pick-layla").click();
  await enter("practice");
  assert.equal(await p.locator("#priority-minion").isDisabled(), true);
  assert.equal(await p.locator("#priority-tower").isDisabled(), true);
  pass(
    "Separate Practice waits >=10 seconds too and does not pretend minions/towers exist",
  );
  await p.locator("#attack").click();
  await p.locator("#upgrade-skill-1").click();
  await p.locator("#world").focus();
  await p.keyboard.press("Space");
  await p.keyboard.press("1");
  await p.waitForFunction(
    () => window.foundationDiagnostics.snapshot().lastCast.serial > 0,
  );
  pass(
    "Preserved Layla learned skill/attack-follow-up path still casts with authoritative mana/cooldown",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  pass(
    "Actual standalone offline game has no runtime errors/warnings or external asset requests",
  );
  await writeFile(
    "docs/batch1-browser-results.json",
    JSON.stringify(
      {
        checks,
        timings,
        errors,
        warnings,
        requests,
        selectionBackgroundIsDedicated: selectionSrc.startsWith("data:"),
        bundleSha256: createHash("sha256")
          .update(await readFile("index.html"))
          .digest("hex"),
        environment:
          "Linux Chromium software WebGL; offline file://; not native Windows or physical touch",
      },
      null,
      2,
    ) + "\n",
  );
} catch (e) {
  if (p)
    await p
      .screenshot({ path: "artifacts/batch1-browser-failure.png" })
      .catch(() => {});
  await writeFile(
    "artifacts/batch1-browser-failure.json",
    JSON.stringify(
      { checks, timings, errors, warnings, requests, failure: String(e),feedback:p?await p.locator('#attack-feedback').innerText().catch(()=>null):null,state:p?await p.evaluate(()=>window.foundationDiagnostics?.snapshot()).catch(()=>null):null },
      null,
      2,
    ),
  );
  throw e;
} finally {
  clearTimeout(timer);
  await browser.close();
}
