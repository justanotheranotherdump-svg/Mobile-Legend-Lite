import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
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
  const c = await browser.newContext({
      offline: true,
      viewport: { width: 1280, height: 720 },
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
  await p.goto(
    pathToFileURL(resolve(process.env.POLISH_ENTRY || "index.html")).href +
      "#diagnostics",
  );
  await p.locator("#profile-username").fill("Final_Polish");
  await p.locator("[data-gender=Female]").click();
  await p.locator("#profile-continue").click();
  await p.locator("#open-modes").click();
  await p.locator("#mode-brawl").click();
  await p.locator("[data-add=enemy]").first().click();
  await p.locator("#room-start").click();
  const human = p.locator("[data-roster-kind=PLAYER]");
  assert.equal(await human.locator("img").count(), 0);
  assert.equal(await p.locator("#pick-layla img").count(), 1);
  assert.equal(await p.locator("#hero-confirm").isDisabled(), true);
  assert.equal(await p.locator("#chosen-hero-skills").isHidden(), true);
  await p.locator("#pick-layla").hover();
  assert.equal(await human.locator("img").count(), 0);
  await p.screenshot({ path: "artifacts/final-polish-selection-empty.png" });
  await p.locator("#pick-layla").click();
  assert.equal(await human.locator("img").count(), 1);
  assert.match(await human.innerText(), /Layla.*selected/);
  assert.equal(await p.locator("#hero-confirm").isDisabled(), false);
  await p.locator("#selection-clear").click();
  assert.equal(await human.locator("img").count(), 0);
  assert.equal(await p.locator("#hero-confirm").isDisabled(), true);
  assert.equal(await p.locator("#lobby-preview").isHidden(), true);
  assert.equal(await p.locator("#chosen-hero-skills").isHidden(), true);
  await p.locator("#selection-back").click();
  await p.locator("#room-start").click();
  assert.equal(await human.locator("img").count(), 0);
  assert.equal(await p.locator("#hero-confirm").isDisabled(), true);
  pass(
    "Real null selection: roster stays visible; selected portrait/details/preview and confirm follow explicit pick, clear and re-entry",
  );
  if (process.env.POLISH_STAGE !== "selection") {
    await p.locator("#pick-layla").click();
    await p.locator("#hero-confirm").click();
    await p.waitForFunction(
      () => window.foundationDiagnostics?.snapshot().phase === "running",
    );
    const snap = () =>
      p.evaluate(() => window.foundationDiagnostics.snapshot());
    const initial = await snap(),
      npc = initial.enemies.find((a) => a.kind === "bot");
    assert.deepEqual(initial.player.attributes, npc.attributes);
    for (const k of [
      "maxHp",
      "maxMana",
      "speed",
      "range",
      "attackRate",
      "attackCooldown",
    ])
      assert.equal(initial.player[k], npc[k], k);
    pass(
      "Actual fresh Brawl player/NPC share all effective base attributes and runtime HP/mana, movement, range and attack speed; no display-only parity",
    );
    await p.waitForFunction(
      () => {
        const s = window.foundationDiagnostics.snapshot();
        window.polishAiSamples ??= [];
        const list = window.polishAiSamples;
        if (!list.length || s.time - list.at(-1).time > 0.25) {
          const a = s.enemies.find((a) => a.kind === "bot");
          if (a)
            list.push({
              time: s.time,
              x: a.x,
              z: a.z,
              hp: a.hp,
              plan: a.lanePlan,
              intent: a.intent,
              towers: s.structures
                .filter((t) => t.team === "player")
                .map((t) => ({
                  id: t.id,
                  x: t.x,
                  z: t.z,
                  range: t.range,
                  hp: t.hp,
                  maxHp: t.maxHp,
                })),
            });
        }
        return (
          list.some(
            (a) =>
              a.plan?.mode === "hold" && a.intent?.reason === "wait-for-wave",
          ) &&
          list.some((a) => a.plan?.mode === "push") &&
          s.structures.some((t) => t.team === "player" && t.hp < t.maxHp)
        );
      },
      null,
      { timeout: 240000 },
    );
    const trace = await p.evaluate(() => window.polishAiSamples);
    const settled = trace.filter(
      (a) =>
        a.plan?.mode === "hold" &&
        a.intent?.reason === "wait-for-wave" &&
        Math.hypot(a.x - a.plan.goal.x, a.z - a.plan.goal.z) < 0.25,
    );
    assert.ok(
      settled.length > 1,
      "actual NPC settles at a safe waiting point, not just a policy label",
    );
    for (const a of settled) {
      const t = a.towers.find((t) => t.id === a.plan.towerId);
      assert.ok(Math.hypot(a.x - t.x, a.z - t.z) > t.range + 1.5);
    }
    await writeFile(
      "docs/final-gameplay-polish-ai-browser-trace.json",
      JSON.stringify(trace, null, 2) + "\n",
    );
    await p.screenshot({ path: "artifacts/final-polish-wave-push.png" });
    pass(
      "Actual unattended offline Brawl: NPC settles outside real tower range without wave, then commits with arriving minions and damages a structure",
    );
    await p.locator("#settings").click();
    const tabs = await p
      .locator("#settings-dialog [role=tab]")
      .allTextContents();
    assert.equal(tabs.at(-1), "Cheats");
    await p.locator("#settings-tab-cheats").click();
    const before = (await snap()).gold;
    await p.locator("#cheat-add-gold").click();
    assert.equal((await snap()).gold, before + 9999);
    await p.waitForFunction(
      (g) =>
        document.querySelector(".gold>span").textContent.startsWith(String(g)),
      before + 9999,
    );
    await p.locator("#settings-dialog [data-close]").click();
    await p.locator("#shop").click();
    assert.match(
      await p.locator("#match-shop-gold").innerText(),
      new RegExp("^" + (before + 9999) + " GOLD"),
    );
    await p.locator("[data-category=All]").click();
    await p.locator("#armory-catalog [data-item=dagger]").click();
    const quote = await p.locator("#item-purchase").innerText();
    const cost = Number(quote.match(/\d+$/)[0]);
    const funds = (await snap()).gold;
    await p.locator("#item-purchase").click();
    assert.equal((await snap()).gold, funds - cost);
    assert.ok((await snap()).inventory.includes("dagger"));
    await p.locator("#shop-dialog [data-close]").click();
    await p.locator("#settings").click();
    await p.locator("#settings-tab-cheats").click();
    const second = (await snap()).gold;
    await p.locator("#cheat-add-gold").click();
    assert.equal((await snap()).gold, second + 9999);
    await p.screenshot({ path: "artifacts/final-polish-cheats.png" });
    await p.locator("#settings-dialog [data-close]").click();
    const t = (await snap()).time;
    await p.waitForFunction(
      (t) => window.foundationDiagnostics.snapshot().time > t + 0.2,
      t,
    );
    assert.equal((await snap()).phase, "running");
    pass(
      "Final in-match Cheats tab adds exactly 9999 real Gold twice, updates HUD/shop, preserves normal purchase deduction and resumes live simulation",
    );
    // The bounded smart-search deliberately cannot pull an enemy 27m away
    // from spawn. Move with trusted native input before issuing the command.
    await p.locator("#world").focus();
    // The approved larger roster still uses real body collision. Take the
    // existing open flank instead of trying to walk through the center wave.
    await p.keyboard.down("KeyD");
    try {await p.waitForFunction(()=>foundationDiagnostics.snapshot().player.z > 3,null,{timeout:90000});}
    finally {await p.keyboard.up("KeyD");}
    await p.keyboard.down("KeyW");
    await p.keyboard.down("KeyD");
    try {
      await p.waitForFunction(
        () => window.foundationDiagnostics.snapshot().player.x > 0,
        null,
        { timeout: 90000 },
      );
    } finally {
      await p.keyboard.up("KeyW");
      await p.keyboard.up("KeyD");
    }
    await p.locator("#attack").click();
    await p
      .waitForFunction(
        () => {
          const s = window.foundationDiagnostics.snapshot();
          return (
            s.enemies.some(
              (a) => a.kind === "bot" && a.contributors?.player !== undefined,
            ) &&
            Object.keys(s.player.contributors || {}).some((id) =>
              id.includes("bot"),
            )
          );
        },
        null,
        { timeout: 150000 },
      )
      .catch(async (error) => {
        await writeFile(
          "docs/final-gameplay-polish-combat-failure.json",
          JSON.stringify(await snap(), null, 2) + "\n",
        );
        await p.screenshot({
          path: "artifacts/final-polish-combat-failure.png",
        });
        throw error;
      });
    const combat = await snap();
    assert.ok(combat.hits > 0);
    assert.ok(combat.enemies.some((a) => a.kind === "bot" && a.castSerial > 0));
    await writeFile(
      "docs/final-gameplay-polish-combat-browser-snapshot.json",
      JSON.stringify(combat, null, 2) + "\n",
    );
    await p.screenshot({ path: "artifacts/final-polish-actual-combat.png" });
    pass(
      "Native main attack (hero priority) command approaches and deals real damage to an NPC; that NPC casts its real kit and deals damage to the human in the live offline match",
    );
  }
  // MATCH_CHECKS
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  await writeFile(
    "docs/final-gameplay-polish-browser-results.json",
    JSON.stringify({ checks, errors, warnings, requests }, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
