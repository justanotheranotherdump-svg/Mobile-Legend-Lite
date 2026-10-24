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
  await p.goto(pathToFileURL(resolve(process.env.PREP_ENTRY || "index.html")).href + "#diagnostics");
  await p.locator("#profile-username").fill("Visual_Builds");
  await p.locator("[data-gender=Female]").click();
  await p.locator("#profile-continue").click();
  await p.locator("#open-preparation").click();
  await p.locator("#new-build").click();
  assert.equal(await p.locator("[data-build-slot]").count(), 6);
  await p.locator("#build-name").fill("Six slot visual");
  await p.locator("[data-build-item=swift-boots]").click();
  await p.locator("[data-build-item=haas-claws]").click();
  assert.equal(await p.locator("[data-build-slot] img").count(), 2);
  await p.locator('[data-build-slot="1"]').click();
  await p.locator("#slot-earlier").click();
  await p.locator("#save-build").click();
  assert.equal(await p.locator(".saved-build.in-use").count(), 1);
  pass(
    "Native visual six-slot icon catalog places/reorders and saves actual build",
  );
  await p.locator("[data-build-duplicate]").click();
  await p.locator("#build-name").fill("Independent copy");
  await p.locator("#save-build").click();
  assert.equal(await p.locator(".saved-build:not(.preset-build)").count(), 2);
  await p.reload();
  await p.locator("#open-preparation").click();
  assert.equal(await p.locator(".saved-build:not(.preset-build)").count(), 2);
  assert.match(
    await p.locator(".saved-build.in-use h3").innerText(),
    /Independent copy/,
  );
  pass(
    "Duplicate is independent and selected custom build survives offline reload",
  );
  if (process.env.PREP_PHASE !== "2") {
    await p.locator("[data-preset-copy=balanced]").click();
    assert.equal(await p.locator("[data-build-slot] img").count(), 6);
    await p.locator("#save-build").click();
    assert.equal(await p.locator(".saved-build:not(.preset-build)").count(), 3);
    assert.equal(await p.locator("[data-preset-copy]").count(), 3);
    pass(
      "Three immutable community templates create editable six-icon custom copies",
    );
  }
  if (!["2", "3"].includes(process.env.PREP_PHASE)) {
    await p.locator("[data-prep-tab=spells]").click();
    assert.equal(await p.locator("[data-spell-card]").count(), 12);
    assert.equal(await p.locator("#prep-spells").count(), 0);
    await p.locator("[data-equip-spell=retribution]").click();
    await p.locator("#battle-close").click();
    pass(
      "Battle Spells opens all twelve cards directly and equips without an intermediate button",
    );
  }
  if (!["2", "3", "4"].includes(process.env.PREP_PHASE)) {
    await p.locator("[data-prep-tab=emblems]").click();
    assert.equal(await p.locator(".empty-emblem-slot img").count(), 0);
    assert.equal(await p.locator(".empty-emblem-slot").count(), 6);
    pass(
      "Structured Emblem interface has only intentionally empty future slots and no applied bonuses",
    );
  }
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await p.setViewportSize({ width, height });
    await p.locator("[data-prep-tab=setup]").click();
    await p.locator("[data-build-edit]").first().click();
    const box = await p.locator(".visual-build-slots.editable").boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
    await p.screenshot({ path: `artifacts/visual-build-${width}.png` });
  }
  pass("Six-slot editor remains bounded at all three landscape sizes");
  if (!process.env.PREP_PHASE) {
    await p.setViewportSize({ width: 1280, height: 720 });
    await p.locator("[data-prep-tab=equipment]").click();
    assert.equal(await p.locator(".prep-catalog>button").count(), 108);
    for (const [category, count] of [
      ["Magic", 31],
      ["Defense", 25],
      ["Jungling", 3],
      ["Roaming", 4],
    ]) {
      await p.locator("#wiki-category").selectOption(category);
      assert.equal(await p.locator(".prep-catalog>button").count(), count);
      const decoded = await p
        .locator(".prep-catalog img")
        .evaluateAll(async (imgs) => {
          await Promise.all(imgs.map((i) => i.decode()));
          return imgs.every(
            (i) => i.naturalWidth > 0 && i.src.startsWith("data:"),
          );
        });
      assert.equal(decoded, true);
    }
    pass(
      "All 108 canonical wiki entries, exact category counts and individual embedded PNGs decode offline",
    );
    await p.locator("#wiki-category").selectOption("Magic");
    await p.locator(".prep-catalog [data-wiki-item=flower-of-hope]").click();
    assert.match(
      await p.locator(".wiki-detail").innerText(),
      /Unavailable: Floryn/,
    );
    assert.equal(await p.locator("[data-choose-blessing]").count(), 0);
    await p.locator(".prep-catalog [data-wiki-item=holy-crystal]").click();
    assert.ok(
      await p.locator(".wiki-tree [data-wiki-item=magic-wand]").count(),
    );
    await p.locator("#wiki-category").selectOption("Jungling");
    await p.locator(".prep-catalog [data-wiki-item=ice-retribution]").click();
    assert.match(
      await p.locator(".wiki-detail").innerText(),
      /0 Gold does not mean free purchase/,
    );
    await p.locator("[data-choose-blessing=ice-retribution]").click();
    await p.locator("[data-prep-tab=setup]").click();
    assert.equal(
      await p.locator("#blessing-intent").inputValue(),
      "ice-retribution",
    );
    pass(
      "Floryn exclusives are truthful unavailable references; typed Jungle selection saves intention, not free inventory",
    );
    await p.locator("[data-build-edit]").first().click();
    await p.locator("#build-reset").click();
    await p.locator("#build-name").fill("Match six icons");
    for (const id of [
      "tough-boots",
      "windtalker",
      "haas-claws",
      "berserkers-fury",
      "blade-of-despair",
      "malefic-gun",
    ])
      await p.locator("[data-build-item=" + id + "]").click();
    assert.equal(await p.locator("[data-build-slot] img").count(), 6);
    await p.locator("#save-build").click();
    await p.reload();
    await p.locator("#open-preparation").click();
    assert.equal(
      await p.locator("#blessing-intent").inputValue(),
      "ice-retribution",
    );
    assert.equal(
      await p.locator(".saved-build.in-use .visual-build-slot img").count(),
      6,
    );
    await p.locator("#prep-back").click();
    await p.locator("#open-modes").click();
    await p.locator("#mode-brawl").click();
    await p.locator("[data-add=enemy]").first().click();
    await p.locator("#room-start").click();
    await p.locator("#pick-layla").click();
    assert.match(await p.locator("#selection-build").inputValue(), /build-/);
    await p.locator("#hero-confirm").click();
    await p.waitForFunction(
      () => window.foundationDiagnostics?.snapshot().time > 0.1,
    );
    const snap = () =>
      p.evaluate(() => window.foundationDiagnostics.snapshot());
    let s = await snap();
    assert.deepEqual(s.buildPriority.sequence, [
      "tough-boots",
      "windtalker",
      "haas-claws",
      "berserkers-fury",
      "blade-of-despair",
      "malefic-gun",
    ]);
    assert.equal(s.battleSpell.id, "retribution");
    assert.equal(s.roleEquipment.blessingId, "ice-retribution");
    assert.equal(s.roleEquipment.active, false);
    assert.equal(s.inventory.filter(Boolean).length, 0);
    await p.locator("#shop").click();
    await p.locator("[data-category=Recommended]").click();
    assert.ok(
      await p.locator("#armory-catalog [data-item=tough-boots]").count(),
    );
    await p.locator("#armory-catalog [data-item=tough-boots]").click();
    const gold = (await snap()).gold;
    await p.locator("#item-purchase").click();
    s = await snap();
    assert.equal(s.inventory[0], "tough-boots");
    assert.equal(s.gold, gold - 720);
    assert.equal(s.roleEquipment.compatible, true);
    assert.equal(s.roleEquipment.active, false);
    assert.equal(s.priorityItem, "windtalker");
    await p.screenshot({ path: "artifacts/visual-build-match-carry.png" });
    pass(
      "Native offline reload → selection → real loading → Brawl carries six-item Recommended, actual spell and restricted blessing; purchasing boots charges real Gold and advances the saved order",
    );
    await p.locator('[data-category=Magic]').click();
    const limitedInventory=(await snap()).inventory;
    for(const id of ['winter-crown','magic-potion']){
      await p.locator('#armory-catalog [data-item='+id+']').click();
      assert.equal(await p.locator('#item-purchase').isDisabled(),true);
      assert.match(await p.locator('#purchase-validation').innerText(),/insufficient-gold/);
      assert.deepEqual((await snap()).inventory,limitedInventory);
    }
    assert.equal(await p.locator('#winter-frozen').count(),0);
    assert.equal((await snap()).potion,null);
    pass('Native expanded shop enforces real affordability for Winter and consumables: no granted item, active USE button or potion effect from merely selecting a catalog card');
    await p.locator('#shop-dialog [data-close]').click();
    await p.locator('#match-pause').click();
    await p.locator('#match-quit-menu').click();
    await p.locator('#open-preparation').click();
    await p.locator('#blessing-intent').selectOption('conceal');
    await p.locator('[data-prep-tab=spells]').click();
    await p.locator('[data-equip-spell=execute]').click();
    await p.locator('#battle-close').click();
    await p.locator('#prep-back').click();
    await p.locator('#open-modes').click();
    await p.locator('#mode-brawl').click();
    await p.locator('[data-add=enemy]').first().click();
    await p.locator('#room-start').click();
    await p.locator('#pick-layla').click();
    await p.locator('#hero-confirm').click();
    await p.waitForFunction(()=>window.foundationDiagnostics?.snapshot().time>.1);
    s=await snap();
    assert.equal(s.roleEquipment.blessingId,'conceal');
    assert.equal(s.roleEquipment.active,false);
    assert.deepEqual(s.inventory,[null,null,null,null,null,null]);
    assert.equal(await p.locator('#activate-conceal').isDisabled(),true);
    await p.locator('#shop').click();
    await p.locator('[data-category=All]').click();
    await p.locator('#armory-catalog [data-item=tough-boots]').click();
    await p.locator('#item-purchase').click();
    s=await snap();
    assert.equal(s.roleEquipment.compatible,true);
    assert.equal(s.roleEquipment.active,false);
    assert.ok(s.roleEquipment.progressGold<600);
    await p.locator('#shop-dialog [data-close]').click();
    assert.equal(await p.locator('#activate-conceal').isDisabled(),true);
    await p.screenshot({path:'artifacts/preparation-roam-requires-real-progress.png'});
    pass('Native fresh Brawl carries Conceal intention and real non-Retribution spell; buying boots still cannot activate Conceal without earned Thriving progress');
    await p.locator('#match-pause').click();
    await p.locator('#match-quit-menu').click();
    await p.locator('#open-modes').waitFor();
    assert.equal(await p.locator('#role-equipment-panel').count(),0);
    assert.equal(await p.locator('#winter-frozen').count(),0);
    assert.equal(await p.locator('#quick-buy').count(),0);
    assert.equal(await p.evaluate(()=>window.menuDiagnostics.snapshot().lastDisposed.disposed),true);
    pass('Leaving a real role-equipped match disposes role/active-item/Quick Buy controls rather than leaking or duplicating HUD into the lobby');
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  pass(
    "Actual file:// standalone loads without runtime errors/warnings or external requests",
  );
  await writeFile(
    "docs/preparation-expansion-browser-results.json",
    JSON.stringify({ checks, errors, warnings, requests }, null, 2),
  );
} finally {
  await browser.close();
}
