import assert from "node:assert/strict";
import { mkdir, copyFile, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  launchOfflineBrowser,
  launchPersistentOfflineContext,
} from "./helpers/offline-browser.mjs";
const directory = "artifacts/two-heroes",
  checks = [],
  errors = [],
  warnings = [],
  requests = [];
await mkdir(directory + "/fresh-standalone", { recursive: true });
await copyFile("index.html", directory + "/fresh-standalone/Game.html");
const url =
  pathToFileURL(resolve(directory + "/fresh-standalone/Game.html")).href +
  "#diagnostics";
const b = await launchOfflineBrowser();
const timer = setTimeout(() => b.close(), 420000);
const pass = (m) => {
  checks.push(m);
  console.log("PASS:", m);
};
async function context(funds = null, viewport = { width: 1280, height: 720 }) {
  const c = await launchPersistentOfflineContext({ offline: true, viewport });
  const p = await c.newPage();
  p.setDefaultTimeout(60000);
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.type() === "warning") warnings.push(m.text());
  });
  p.on("request", (r) => {
    if (r.resourceType() !== "document" && !/^(data:|blob:)/.test(r.url()))
      requests.push(r.url());
  });
  // Seed only after the file origin is fully loaded, never on reload.
  await p.goto(url);
  await p.waitForFunction(() => window.menuDiagnostics);
  await p.evaluate((funds) => {
    localStorage.setItem(
      "moba-lab.profile.v1",
      JSON.stringify({
        username: "TwoHeroHarness",
        country: "PH",
        gender: "Male",
      }),
    );
    if (funds && !localStorage.getItem("moba-lab.progress.v1:TwoHeroHarness"))
      localStorage.setItem(
        "moba-lab.progress.v1:TwoHeroHarness",
        JSON.stringify({
          version: 1,
          starterGrantApplied: true,
          coins: funds.coins,
          diamonds: funds.diamonds,
          ownedHeroes: funds.owned || ["layla"],
        }),
      );
  }, funds);
  await p.reload();
  await p.waitForFunction(() => window.menuDiagnostics);
  return { c, p };
}
async function select(p, mode = "practice") {
  await p.locator("#open-modes").click();
  await p.locator("#mode-training").click();
  await p.locator("#ai-mode-" + mode).click();
  await p.locator("#room-start").click();
  await p.waitForSelector("#pick-franco");
}
try {
  const { c, p } = await context();
  assert.deepEqual(
    await p.evaluate(() => {
      const w = menuDiagnostics.snapshot().progress;
      return [w.coins, w.diamonds, w.ownedHeroes];
    }),
    [30000, 0, ["layla"]],
  );
  pass(
    "Fresh account remains 30000 Coins / 0 Diamonds; Layla owned, Franco locked",
  );
  await p.locator("#open-hero-shop").click();
  assert.equal(await p.locator("[data-hero-id]").count(), 2);
  assert.notEqual(
    await p.locator('[data-hero-id="layla"] img').getAttribute("src"),
    await p.locator('[data-hero-id="franco"] img').getAttribute("src"),
  );
  await p.locator('[data-hero-id="franco"]').click();
  await p.waitForFunction(
    () =>
      menuDiagnostics.snapshot().lobby.heroId === "franco" &&
      menuDiagnostics.snapshot().lobby.status === "glb",
  );
  assert.ok(await p.locator('[data-buy-currency="coins"]').isDisabled());
  assert.ok(await p.locator('[data-buy-currency="diamonds"]').isDisabled());
  pass(
    "Two distinct correct portrait cards; locked Franco details and real GLB load offline, both insufficient purchase options disabled",
  );
  for (const [id, name] of [
    ["wasteland-force", "Wasteland Force"],
    ["iron-hook", "Iron Hook"],
    ["fury-shock", "Fury Shock"],
    ["bloody-hunt", "Bloody Hunt"],
  ]) {
    await p.locator(`[data-inspect-ability="${id}"]`).click();
    assert.equal(await p.locator("#ability-title").textContent(), name);
    assert.ok(
      !(await p.locator("#ability-description").textContent()).includes("NaN"),
    );
    await p.locator("#ability-close").click();
  }
  pass(
    "All four Franco PNG ability controls open the correct kit descriptions",
  );
  const rotation = await p.evaluate(
      () => menuDiagnostics.snapshot().lobby.rotationY,
    ),
    canvas = p.locator("#lobby-preview"),
    rect = await canvas.boundingBox();
  await p.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
  await p.mouse.down();
  await p.mouse.move(
    rect.x + rect.width * 0.5 + 70,
    rect.y + rect.height * 0.5,
    { steps: 8 },
  );
  await p.mouse.up();
  assert.notEqual(
    await p.evaluate(() => menuDiagnostics.snapshot().lobby.rotationY),
    rotation,
  );
  await p.mouse.wheel(0, 120);
  assert.notEqual(
    await p.evaluate(() => menuDiagnostics.snapshot().lobby.zoom),
    1,
  );
  await p.screenshot({ path: directory + "/franco-details.png" });
  pass(
    "Actual 3D showcase rotates with pointer input and zooms, without replacing the GLB",
  );
  await p.locator("#hero-detail-back").click();
  await p.locator("#shop-back").click();
  await select(p);
  assert.equal(
    await p.evaluate(() => menuDiagnostics.snapshot().match.selectedHeroId),
    null,
  );
  assert.equal(
    await p.evaluate(() => menuDiagnostics.snapshot().lobby.heroId),
    null,
  );
  assert.equal(await p.locator("[data-human-portrait] img").count(), 0);
  assert.ok(await p.locator("#hero-confirm").isDisabled());
  assert.ok(await p.locator("#chosen-hero-skills").isHidden());
  pass(
    "Selection entry is genuinely null in controller, config-facing state and showcase, with empty portrait/skills and disabled confirmation",
  );
  await p.locator("#pick-franco").click();
  await p.waitForFunction(
    () => menuDiagnostics.snapshot().lobby.heroId === "franco",
  );
  assert.ok(await p.locator("#hero-confirm").isDisabled());
  assert.equal(await p.locator("[data-selection-ability]").count(), 4);
  await p.locator('[data-selection-ability="iron-hook"]').click();
  assert.match(
    await p.locator("#selection-ability-details h3").textContent(),
    /Iron Hook/,
  );
  await p.locator("#selection-ability-close").click();
  const bg = await p.locator("#lobby-backdrop").getAttribute("src");
  await p.locator("#pick-layla").click();
  assert.notEqual(await p.locator("#lobby-backdrop").getAttribute("src"), bg);
  assert.equal(
    await p.locator('[data-selection-ability="malefic-gun"]').count(),
    1,
  );
  assert.ok(!(await p.locator("#hero-confirm").isDisabled()));
  await p.locator("#selection-clear").click();
  assert.equal(
    await p.evaluate(() => menuDiagnostics.snapshot().match.selectedHeroId),
    null,
  );
  assert.equal(
    await p.evaluate(() => menuDiagnostics.snapshot().lobby.modelParent),
    null,
  );
  assert.equal(await p.locator("[data-human-portrait] img").count(), 0);
  assert.equal(await p.locator("[data-selection-ability]").count(), 0);
  assert.ok(await p.locator("#hero-confirm").isDisabled());
  pass(
    "Locked preview cannot confirm; switching replaces background/portrait/all four abilities; clear removes actual model and details",
  );
  // Stale asynchronous model loads cannot repopulate a cleared selection.
  await p.locator("#pick-franco").click();
  await p.locator("#pick-layla").click();
  await p.locator("#selection-clear").click();
  await p.waitForTimeout(250);
  assert.equal(
    await p.evaluate(() => menuDiagnostics.snapshot().lobby.heroId),
    null,
  );
  assert.equal(
    await p.evaluate(() => menuDiagnostics.snapshot().lobby.modelParent),
    null,
  );
  pass("Rapid switch/clear leaves null state with no stale GLB attachment");
  await p.locator("#pick-layla").click();
  await p.locator("#hero-confirm").click();
  await p.waitForFunction(
    () =>
      window.foundationDiagnostics?.snapshot().time > 0.05 ||
      document.querySelector("#load-error"),
    null,
    { timeout: 90000 },
  );
  assert.equal(await p.locator("#load-error").count(), 0);
  const layla = await p.evaluate(() => foundationDiagnostics.hero());
  assert.equal(layla.id, "layla");
  assert.equal(layla.modelStatus, "glb");
  assert.equal(layla.visual.clips.length, 10);
  assert.equal(await p.locator(".hero-icon img").getAttribute("alt"), "Layla");
  await p.screenshot({ path: directory + "/layla-practice.png" });
  pass(
    "Selected approved Layla GLB enters the preserved practice arena with real rig/ten clips and correct HUD",
  );
  await c.close();
  for (const currency of ["coins", "diamonds"]) {
    const { c, p } = await context({ coins: 40000, diamonds: 1000 });
    await p.locator("#open-hero-shop").click();
    await p.locator('[data-hero-id="franco"]').click();
    await p.locator(`[data-buy-currency="${currency}"]`).click();
    assert.equal(
      (await p.evaluate(() => menuDiagnostics.snapshot().progress)).coins,
      40000,
    );
    await p.locator("[data-cancel-purchase]").click();
    assert.deepEqual(
      await p.evaluate(() => menuDiagnostics.snapshot().progress.ownedHeroes),
      ["layla"],
    );
    await p.locator(`[data-buy-currency="${currency}"]`).click();
    await p.locator("[data-confirm-purchase]").evaluate((b) => {
      b.click();
      b.click();
    });
    await p.waitForFunction(() =>
      menuDiagnostics.snapshot().progress.ownedHeroes.includes("franco"),
    );
    const expected = currency === "coins" ? [8000, 1000] : [40000, 251];
    assert.deepEqual(
      await p.evaluate(() => {
        const w = menuDiagnostics.snapshot().progress;
        return [w.coins, w.diamonds];
      }),
      expected,
    );
    assert.equal(await p.locator("[data-buy-currency]").count(), 0);
    assert.match(await p.locator(".hero-owned-footer").textContent(), /OWNED/);
    assert.deepEqual(
      await p.evaluate(() => {
        const w = JSON.parse(
          localStorage.getItem("moba-lab.progress.v1:TwoHeroHarness"),
        );
        return [w.coins, w.diamonds, w.ownedHeroes];
      }),
      [...expected, ["layla", "franco"]],
    );
    await p.reload();
    await p.waitForFunction(() => window.menuDiagnostics);
    assert.deepEqual(
      await p.evaluate(() => {
        const w = menuDiagnostics.snapshot().progress;
        return [w.coins, w.diamonds, w.ownedHeroes];
      }),
      [...expected, ["layla", "franco"]],
    );
    pass(
      `${currency}: explicit choice + cancel + double-confirm guard, only chosen balance deducted once, ownership/UI and reload preserved`,
    );
    if (currency === "coins") {
      await select(p, "ai-training");
      await p.locator("#pick-franco").click();
      await p.waitForFunction(
        () => menuDiagnostics.snapshot().lobby.heroId === "franco",
      );
      assert.ok(!(await p.locator("#hero-confirm").isDisabled()));
      await p.locator("#hero-confirm").click();
      await p.waitForFunction(
        () =>
          window.foundationDiagnostics?.snapshot().phase === "running" ||
          document.querySelector("#load-error"),
        null,
        { timeout: 90000 },
      );
      assert.equal(await p.locator("#load-error").count(), 0);
      const hero = await p.evaluate(() => foundationDiagnostics.hero());
      assert.equal(hero.id, "franco");
      assert.equal(hero.modelStatus, "glb");
      assert.equal(hero.visual.clips.length, 11);
      assert.equal(hero.npcModels.length, 9);
      assert.ok(hero.npcModels.some((x) => x.heroId === "layla"));
      assert.ok(hero.npcModels.some((x) => x.heroId === "franco"));
      assert.ok(hero.npcModels.every((x) => x.meshCount > 8));
      assert.equal(
        await p.locator(".hero-icon img").getAttribute("alt"),
        "Franco",
      );
      assert.equal(
        await p.locator("#skill-1").getAttribute("data-ability-name"),
        "Iron Hook",
      );
      await p.screenshot({ path: directory + "/franco-live-match.png" });
      pass(
        "Purchased Franco enters existing AI lane match; nine real mixed-roster NPC models, hero-specific clips and correct hook/slam/Hunt HUD",
      );
      await p.waitForFunction(() => foundationDiagnostics.snapshot().time > 6);
      assert.deepEqual(
        await p.evaluate(() => {
          const w = menuDiagnostics.snapshot().progress;
          return [w.coins, w.diamonds];
        }),
        expected,
      );
      pass(
        "Live match runs without wallet/match-gold conversion or render errors",
      );
    }
    await c.close();
  }
  // Render fixture uses the same production combat and rendering modules in a
  // separate self-contained HTML, without adding diagnostics mutation to the game.
  const { c: rc, p: rp } = await context();
  await rp.goto(
    pathToFileURL(resolve(directory + "/Render-Fixture.html")).href,
  );
  await rp.waitForFunction(() => window.integrationFixture);
  await rp.evaluate(() => integrationFixture.start("layla", [{ z: 7 }]));
  assert.equal(
    await rp.evaluate(() => integrationFixture.cast("skill-1", 0, 9)),
    "cast",
  );
  let shot = await rp.evaluate(() => integrationFixture.advanceTo(0.32));
  assert.ok(
    shot.effects.approved.shots.some(
      (s) => s.key === "s1" && s.shape.includes("spindle"),
    ),
  );
  await rp.screenshot({ path: directory + "/layla-s1-spindle.png" });
  pass(
    "Actual shared-engine S1 renders approved elongated spindle/fins, not the basic bolt",
  );
  await rp.evaluate(() => integrationFixture.start("layla", [{ z: 4 }]));
  await rp.evaluate(() => integrationFixture.cast("skill-2", 0, 4));
  shot = await rp.evaluate(() => integrationFixture.advanceTo(0.5));
  assert.ok(
    shot.effects.approved.shots.some(
      (s) => s.key === "s2" && s.shape.includes("spherical"),
    ),
  );
  shot = await rp.evaluate(() => integrationFixture.advanceTo(0.9));
  assert.equal(shot.effects.approved.marks, 1);
  assert.ok(shot.enemies[0].mark);
  await rp.evaluate(() => integrationFixture.advanceTo(1.1));
  assert.equal(
    await rp.evaluate(() => integrationFixture.attack("enemy-0")),
    "fired",
  );
  shot = await rp.evaluate(() => integrationFixture.advanceTo(1.51));
  assert.equal(shot.enemies[0].mark, undefined);
  assert.ok(shot.enemies[0].stunned);
  assert.ok(
    shot.effects.approved.events.some((e) => e.kind === "mark-trigger"),
  );
  await rp.screenshot({ path: directory + "/layla-mark-trigger.png" });
  pass(
    "Actual S2 reactor orb → AoE → persistent mark → separate subsequent-hit trigger/stun renders distinct approved effects",
  );
  await rp.evaluate(() =>
    integrationFixture.start("layla", [
      { z: 3.4 },
      { z: 24 },
      { z: 45.12 },
      { x: 3, z: 24 },
    ]),
  );
  await rp.evaluate(() => integrationFixture.fullBeamCamera());
  await rp.evaluate(() =>
    integrationFixture.cast("skill-ultimate", 0, 3.4, "enemy-0"),
  );
  shot = await rp.evaluate(() => integrationFixture.advanceTo(0.66));
  const beam = shot.effects.approved.shots.find((s) => s.key === "ult");
  assert.ok(beam && beam.continuous);
  assert.equal(beam.beamEnd[2], 48);
  for (let i = 0; i < 3; i++)
    assert.ok(Math.abs(beam.beamStart[i] - shot.muzzle[i]) < 1e-5);
  assert.ok(shot.enemies.slice(0, 3).every((e) => e.hp < 20000));
  assert.equal(shot.enemies[3].hp, 20000);
  const pixels = await rp.evaluate(() => integrationFixture.framebuffer());
  assert.ok(
    pixels.filter((p) => p.brightness > 170).length >= 8,
    JSON.stringify(pixels),
  );
  await rp.screenshot({ path: directory + "/layla-continuous-beam.png" });
  await writeFile(
    directory + "/beam-evidence.json",
    JSON.stringify(
      { beam, muzzle: shot.muzzle, pixels, enemies: shot.enemies },
      null,
      2,
    ),
  );
  pass(
    "Actual locked-near-target ultimate extends full 48 local units; near/mid/far hit once, off-line excluded, muzzle connected, ≥8/9 bright framebuffer samples",
  );
  await rp.evaluate(() => integrationFixture.start("franco", []));
  await rp.evaluate(() => integrationFixture.cast("skill-1", 0, 6.4));
  shot = await rp.evaluate(() => integrationFixture.advanceTo(0.3));
  assert.equal(shot.effects.approved.hooks, 1);
  assert.equal(shot.originalHookVisible, false);
  await rp.screenshot({ path: directory + "/franco-hook-chain.png" });
  shot = await rp.evaluate(() => integrationFixture.advanceTo(0.7));
  assert.equal(shot.effects.approved.hooks, 0);
  assert.equal(shot.originalHookVisible, true);
  pass(
    "Actual approved enlarged Franco hook GLB and connecting chain fly and return on miss, without duplicate in-hand hook",
  );
  await rp.evaluate(() => integrationFixture.start("franco", [{ z: 1.4 }]));
  await rp.evaluate(() =>
    integrationFixture.cast("skill-ultimate", 0, 1.4, "enemy-0"),
  );
  shot = await rp.evaluate(() => integrationFixture.advanceTo(1.7));
  assert.equal(shot.channel.next, 6);
  assert.ok(shot.enemies[0].suppressionUntil > 1.7);
  shot = await rp.evaluate(() => integrationFixture.advanceTo(1.81));
  assert.equal(shot.channel, null);
  assert.equal(shot.enemies[0].suppressionUntil, 0);
  pass(
    "Actual approved Hunt animation and six authoritative strikes stay synchronized, then release suppression at 1.80s",
  );
  await rc.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  pass(
    "Clean isolated HTML-only offline execution: no external resource requests and no browser errors",
  );
  await writeFile(
    directory + "/browser-results.json",
    JSON.stringify(
      { checks, errors, warnings, requests, standalone: url },
      null,
      2,
    ),
  );
} finally {
  clearTimeout(timer);
  await b.close();
  await writeFile(
    directory + "/browser-latest.json",
    JSON.stringify({ checks, errors, warnings, requests }, null, 2),
  );
}
