import test from "node:test";
import assert from "node:assert/strict";
import {
  items,
  recipeData,
  validateRecipes,
  recipeQuote,
  purchaseQuote,
  priorityStep,
} from "../src/match/recipes.js";
import { purchase, sell } from "../src/match/equipment.js";
const blank = () => Array(6).fill(null);
test("all 45 supported entries including eight legacy items have explicit tier/recipe metadata", () => {
  assert.equal(items.length, 45);
  assert.equal(Object.keys(recipeData.items).length, items.length);
  assert.ok(validateRecipes());
  assert.match(recipeData.provenance, /NOT official/);
  assert.ok(
    items.filter((i) => recipeData.items[i.id].tier === "completed").length >
      10,
  );
});
for (const item of items)
  test("recipe quote / direct automatic purchase: " + item.id, () => {
    const q = purchaseQuote(100000, blank(), item.id);
    assert.equal(q.remaining, item.cost);
    assert.equal(q.inventory[0], item.id);
    assert.equal(q.gold, 100000 - item.cost);
    assert.equal(q.inventory.filter(Boolean).length, 1);
  });
test("component, multiple components, nested ancestor/descendants credit once and combine into next available slot", () => {
  let tx = purchase(1000, blank(), "dagger");
  assert.equal(tx.gold, 750);
  tx = purchase(tx.gold, tx.inventory, "knife");
  const q = recipeQuote("regular-spear", tx.inventory);
  assert.equal(q.credit, 530);
  assert.equal(q.remaining, 70);
  tx = purchase(tx.gold, tx.inventory, "regular-spear");
  assert.equal(tx.gold, 400);
  assert.deepEqual(tx.inventory, [
    "regular-spear",
    null,
    null,
    null,
    null,
    null,
  ]);
  const inv = ["regular-spear", "dagger", null, null, null, null],
    nested = recipeQuote("corrosion-scythe", inv);
  assert.equal(nested.credit, 600);
  assert.equal(new Set(nested.consumed).size, nested.consumed.length);
});
test("full inventory rejects unrelated purchase without spending, but combines valid owned components", () => {
  const inv = [
    "dagger",
    "knife",
    "javelin",
    "vampire-mallet",
    "legion-sword",
    "iron-hunting-bow",
  ];
  const copy = [...inv];
  const fail = purchaseQuote(9999, inv, "boots");
  assert.equal(fail.error, "equipment-full");
  assert.deepEqual(inv, copy);
  const q = purchaseQuote(9999, inv, "regular-spear");
  assert.ok(!q.error);
  assert.equal(q.inventory[0], "regular-spear");
  assert.equal(q.inventory[1], null);
  assert.equal(q.gold, 9999 - 70);
});
test("one actual copy credits only one repeated branch, no free duplicate contribution", () => {
  const q = recipeQuote("blade-of-despair", [
    "legion-sword",
    null,
    null,
    null,
    null,
    null,
  ]);
  assert.equal(q.credit, 910);
  assert.equal(q.remaining, 2100);
  assert.equal(q.consumed.length, 1);
});
test("unaffordable/invalid transactions never mutate input; existing max-copy/one-pair/6-slot constraints preserved", () => {
  const inv = ["dagger", null, null, null, null, null],
    before = [...inv];
  assert.equal(
    purchaseQuote(0, inv, "regular-spear").error,
    "insufficient-gold",
  );
  assert.equal(purchaseQuote(9999, inv, "dagger").error, "unique-item");
  assert.equal(purchaseQuote(-1, inv, "knife").error, "invalid-purchase-state");
  assert.equal(purchaseQuote(9999, inv, "nope").error, "unknown-item");
  assert.deepEqual(inv, before);
});
test("quick buy uses same quotes, offers missing components/upgrade, changes with gold/ownership and completes honestly", () => {
  const inv = blank();
  let step = priorityStep(250, inv, "regular-spear");
  assert.equal(step.id, "dagger");
  let tx = purchase(250, inv, step.id);
  step = priorityStep(350, tx.inventory, "regular-spear");
  assert.equal(step.id, "regular-spear");
  assert.equal(step.remaining, 350);
  tx = purchase(350, tx.inventory, step.id);
  assert.equal(priorityStep(0, tx.inventory, "regular-spear").completed, true);
  assert.equal(
    priorityStep(0, blank(), "regular-spear").error,
    "insufficient-gold",
  );
});
