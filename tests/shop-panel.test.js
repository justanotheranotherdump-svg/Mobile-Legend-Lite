import test from "node:test";
import assert from "node:assert/strict";
import {
  SHOP_CATEGORIES,
  CATALOG_SLOT_COUNT,
  EQUIPMENT_SLOT_COUNT,
  emptyShopSlot,
  shopMarkup,
} from "../src/ui/shop-panel.js";
test("shop has sixteen catalog, four build and six equipment slots without fabricated items", () => {
  const markup = shopMarkup();
  assert.equal(CATALOG_SLOT_COUNT, 16);
  assert.equal(EQUIPMENT_SLOT_COUNT, 6);
  for (const [kind, count] of [
    ["catalog", 16],
    ["build", 4],
    ["equipment", 6],
  ])
    assert.equal(
      (
        markup.match(new RegExp(`class="shop-slot shop-slot-${kind}"`, "g")) ||
        []
      ).length,
      count,
    );
  assert.doesNotMatch(
    markup,
    /<img|<image|src=|Weapon|Guard|Artifact|\+\d|\$\d/,
  );
  assert.match(markup, /No items configured/);
});
test("empty slots and unavailable purchase/build actions are natively disabled and marked reserved", () => {
  const markup = shopMarkup();
  const buttons = [...markup.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]);
  const reserved = buttons.filter((b) =>
    b.includes('data-control-kind="reserved"'),
  );
  assert.equal(reserved.length, 28);
  assert.ok(reserved.every((b) => /\bdisabled\b/.test(b)));
  assert.match(
    emptyShopSlot("equipment", 5),
    /aria-label="Empty equipment slot 6 — reserved"/,
  );
  assert.match(markup, /Gold reserved/);
  assert.match(markup, /Price unavailable/);
});
test("shop category and view controls are explicitly interface-only; initial category is accessible", () => {
  assert.ok(Object.isFrozen(SHOP_CATEGORIES));
  const markup = shopMarkup();
  for (const category of SHOP_CATEGORIES)
    assert.ok(markup.includes(`data-category="${category}"`));
  assert.match(
    markup,
    /data-category="Recommended" aria-pressed="true" data-control-kind="interface-only"/,
  );
  assert.equal((markup.match(/data-shop-view=/g) || []).length, 2);
  assert.match(markup, /id="shop-title"/);
  assert.match(markup, /aria-label="Close shop"/);
});
