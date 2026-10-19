import test from "node:test";
import assert from "node:assert/strict";
import { placeBuildItem, moveBuildSlot } from "../src/player/build-editor.js";
import { BuildStore } from "../src/player/builds.js";
test("visual six-slot edit replaces, rejects duplicates/second boots atomically, reorders and persists compact purchase order", () => {
  let slots = Array(6).fill(null);
  slots = placeBuildItem(slots, 0, "swift-boots").slots;
  slots = placeBuildItem(slots, 1, "haas-claws").slots;
  assert.equal(placeBuildItem(slots, 2, "haas-claws").error, "duplicate-item");
  assert.equal(placeBuildItem(slots, 2, "tough-boots").error, "one-boots-only");
  assert.deepEqual(slots.slice(0, 2), ["swift-boots", "haas-claws"]);
  slots = placeBuildItem(slots, 0, "tough-boots").slots;
  slots = moveBuildSlot(slots, 1, 0);
  const m = new Map(),
    storage = {
      getItem: (k) => m.get(k) || null,
      setItem: (k, v) => m.set(k, v),
    };
  const b = new BuildStore(storage, "Visual_User");
  assert.equal(
    b.saveBuild("layla", {
      name: "Visual order",
      items: slots.filter(Boolean),
    }),
    "ok",
  );
  assert.deepEqual(
    new BuildStore(storage, "Visual_User").selected("layla").items,
    ["haas-claws", "tough-boots"],
  );
});
import presets from "../src/data/preparation/layla-presets.json" with { type: "json" };
import { validBuild } from "../src/player/builds.js";
test("three researched community templates validate and copying cannot overwrite template arrays", () => {
  assert.equal(presets.presets.length, 3);
  for (const p of presets.presets) {
    assert.equal(validBuild(p.items), true);
    const copy = structuredClone(p);
    copy.items.reverse();
    assert.notDeepEqual(copy.items, p.items);
  }
  assert.equal(presets.sampleSize, 6);
  assert.match(presets.label, /no match-outcome/);
});
import { catalogItems, categoryItems } from "../src/match/catalog.js";
import {
  purchaseQuote,
  validateRecipes,
  recipeData,
} from "../src/match/recipes.js";
import { inventoryBonuses, sell } from "../src/match/equipment.js";
test("expanded canonical catalog has requested counts with one Fleeting Time and no free-purchase special entries", () => {
  assert.equal(catalogItems.length, 108);
  assert.equal(categoryItems("Magic").length, 31);
  assert.equal(categoryItems("Defense").length, 25);
  assert.equal(categoryItems("Jungling").length, 3);
  assert.equal(categoryItems("Roaming").length, 4);
  assert.equal(catalogItems.filter((i) => i.id === "fleeting-time").length, 1);
  assert.equal(new Set(catalogItems.map((i) => i.id)).size, 108);
  assert.ok(validateRecipes());
  for (const i of catalogItems.filter((x) => x.cost === 0)) {
    assert.notEqual(i.type, "standard_purchase");
    assert.equal(
      purchaseQuote(10000, Array(6).fill(null), i.id).error,
      "unknown-item",
    );
    assert.equal(
      sell(0, [i.id, null, null, null, null, null], 0).error,
      "empty-slot",
    );
    assert.equal(validBuild([i.id]), false);
  }
  for (const id of ["magic-potion", "rock-potion"]) {
    assert.equal(validBuild([id]), false);
    assert.equal(
      purchaseQuote(10000, Array(6).fill(null), id).error,
      "use-consumable-purchase",
    );
  }
  assert.equal(
    inventoryBonuses(["sky-piercer"]).modifiers.flat.physicalAttack,
    60,
  );
  assert.equal(recipeData.items["holy-crystal"].components.length, 2);
});
test("one active item rule rejects Winter Crown plus Wind of Nature without any transaction", () => {
  assert.equal(
    purchaseQuote(
      10000,
      ["wind-of-nature", null, null, null, null, null],
      "winter-crown",
    ).error,
    "one-active-item-only",
  );
  assert.equal(
    purchaseQuote(
      10000,
      ["winter-crown", null, null, null, null, null],
      "wind-of-nature",
    ).error,
    "one-active-item-only",
  );
});
