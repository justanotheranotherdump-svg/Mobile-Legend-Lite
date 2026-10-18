import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HERO_PRESENTATION,
  HERO_ROLES,
  CATALOG_SLOT_COUNT,
  heroCatalog,
  filterHeroes,
  abilityDescription,
  abilityFacts,
} from "../src/menu/hero-presentation.js";
import { MenuNavigation } from "../src/menu/navigation.js";
const hero = JSON.parse(
  readFileSync(new URL("../src/heroes/layla/hero.json", import.meta.url)),
);
const abilities = JSON.parse(
  readFileSync(new URL("../src/heroes/layla/abilities.json", import.meta.url)),
);
test("catalog contains one approved playable hero, not the historical training fixture", () => {
  const ids = [];
  const catalog = heroCatalog({
    get(id) {
      ids.push(id);
      return hero;
    },
  });
  assert.deepEqual(ids, ["layla"]);
  assert.equal(catalog.length, 1);
  assert.equal(CATALOG_SLOT_COUNT, 15);
});
test("all seven role filters and normalized case-insensitive search are genuine", () => {
  assert.equal(HERO_ROLES.length, 7);
  assert.equal(
    filterHeroes([hero], { role: "Marksman", query: " LAYLA " }).length,
    1,
  );
  assert.equal(filterHeroes([hero], { role: "Tank" }).length, 0);
  assert.equal(filterHeroes([hero], { query: "marksman" }).length, 1);
  assert.equal(filterHeroes([hero], { query: "<script>" }).length, 0);
});
test("four explicitly UI-only editable ratings are bounded and frozen", () => {
  const r = HERO_PRESENTATION.layla.ratings;
  assert.deepEqual(Object.keys(r), [
    "durability",
    "offense",
    "control",
    "difficulty",
  ]);
  for (const n of Object.values(r))
    assert.ok(Number.isInteger(n) && n >= 0 && n <= 10);
  assert.ok(Object.isFrozen(r));
  assert.equal(hero.baseStats.maxHp, 100);
  assert.ok(!("ratings" in hero));
});
test("hero inspection requires Shop and returns to Shop before lobby", () => {
  const nav = new MenuNavigation(true);
  assert.equal(nav.go("hero"), false);
  assert.equal(nav.go("shop"), true);
  assert.equal(nav.go("hero"), true);
  assert.equal(nav.go("training"), false);
  assert.equal(nav.go("shop"), true);
  assert.equal(nav.go("lobby"), true);
});
test("all four abilities provide descriptions and actual current values", () => {
  for (const a of abilities) {
    assert.ok(abilityDescription(a).length > 60);
    assert.ok(abilityFacts(a).length >= 3);
    if (a.slot !== "passive") {
      assert.ok(
        abilityFacts(a).some(
          ([l, v]) => l === "Base damage" && v === String(a.damage),
        ),
      );
      assert.ok(
        abilityFacts(a).some(
          ([l, v]) => l === "Cooldown" && v === `${a.cooldown}s`,
        ),
      );
    }
  }
});
test("skill UI facts follow changed config without hard-coded screenshot values", () => {
  const a = {
    ...abilities[1],
    damage: 123,
    cooldown: 4.2,
    manaCost: 17,
    range: 8,
  };
  const facts = Object.fromEntries(abilityFacts(a));
  assert.equal(facts["Base damage"], "123");
  assert.equal(facts.Cooldown, "4.2s");
  assert.equal(facts["Mana cost"], "17");
  assert.equal(facts.Range, "8 units");
  assert.equal(
    abilityDescription({
      ...abilities[0],
      parameters: { ...abilities[0].parameters, maxMultiplier: 1.2 },
    }).includes("20%"),
    true,
  );
});
test("read-only guide leaves registry configuration byte-equivalent", () => {
  const before = JSON.stringify(abilities);
  abilities.forEach((a) => {
    abilityDescription(a);
    abilityFacts(a);
  });
  assert.equal(JSON.stringify(abilities), before);
});
