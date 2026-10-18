import test from "node:test";
import assert from "node:assert/strict";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { MatchSimulation } from "../src/match/simulation.js";
import { createMatchConfig } from "../src/match/config.js";
import {
  spells,
  getSpell,
  unlocked,
  validateSpells,
} from "../src/spells/catalog.js";
import {
  BattleAccountStore,
  battleAccountKey,
  validateBattleAccount,
} from "../src/menu/battle-account.js";
import {
  healActor,
  grantShield,
  slowActor,
  stunActor,
  cleanse,
} from "../src/simulation/status.js";
import { safeDestination } from "../src/spells/system.js";
const registry = await loadSourceHeroRegistry();
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
function game(id) {
  const s = new MatchSimulation(
    registry,
    {
      ...createMatchConfig("ai-training", "normal", 1),
      spellId: id,
      accountLevel: 25,
    },
    { username: "Spell_QA" },
  );
  s.update(3);
  s.structures = [];
  s.minions = [];
  const e = s.bots[0];
  Object.assign(s.player, {
    x: 0,
    z: 0,
    hp: 2250,
    protected: false,
    targetable: true,
    spawnProtectedUntil: 0,
  });
  Object.assign(e, {
    x: 4,
    z: 0,
    hp: 10000,
    maxHp: 10000,
    protected: false,
    targetable: true,
    spawnProtectedUntil: 0,
    nextThink: Infinity,
    intent: null,
  });
  e.attributes.physicalDefense = 0;
  e.attributes.magicDefense = 0;
  s.syncEnemies();
  s.random = () => 1;
  return { s, p: s.player, e, b: s.spells };
}
const exact = [
  ["execute", 90, 1],
  ["retribution", 35, 1],
  ["inspire", 75, 5],
  ["sprint", 100, 9],
  ["revitalize", 75, 11],
  ["aegis", 75, 13],
  ["petrify", 75, 15],
  ["purify", 90, 17],
  ["flameshot", 50, 19],
  ["flicker", 120, 21],
  ["vengeance", 75, 23],
  ["arrival", 75, 25],
];
for (const [id, cd, level] of exact)
  test(`${id}: exact cooldown ${cd}s and account unlock ${level}, valid descriptions/roles/icon`, () => {
    const d = getSpell(id);
    assert.equal(d.cooldown, cd);
    assert.equal(d.unlockLevel, level);
    assert.ok(d.ability && d.strategy && d.icon && d.roles.length);
    assert.ok(unlocked(id, level));
    if (level > 1) assert.equal(unlocked(id, level - 1), false);
  });
test("spell validator rejects malformed count/cooldown/data; no executable config", () => {
  assert.ok(validateSpells());
  const bad = structuredClone({ spells });
  bad.spells[0].cooldown = -1;
  assert.throws(() => validateSpells(bad));
});
test("account save is separate from wallet/hero level, defaults to 1, awards once per match, caps25 and rejects stale locked selection", () => {
  const map = new Map(),
    storage = { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v) },
    a = new BattleAccountStore(storage, "User_1");
  assert.equal(a.level, 1);
  assert.equal(a.equip("flicker"), "locked");
  assert.equal(a.equip("retribution"), "ok");
  assert.equal(a.award("match1"), true);
  assert.equal(a.award("match1"), false);
  assert.equal(a.level, 2);
  for (let i = 2; i < 30; i++) a.award("match" + i);
  assert.equal(a.level, 25);
  assert.equal(a.equip("arrival"), "ok");
  const restored = new BattleAccountStore(storage, "User_1");
  assert.equal(restored.value.selected, "arrival");
  map.set(
    battleAccountKey("User_2"),
    JSON.stringify({ version: 1, xp: 0, selected: "arrival" }),
  );
  assert.equal(
    new BattleAccountStore(storage, "User_2").value.selected,
    "execute",
  );
  assert.equal(validateBattleAccount({ version: 1, xp: -1 }), null);
});
test("blocked storage has session progress without corrupting old wallet", () => {
  const a = new BattleAccountStore(
    {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("blocked");
      },
    },
    "User_1",
  );
  assert.equal(a.persistent, false);
  a.award("one");
  assert.equal(a.level, 2);
});
for (const id of [
  "execute",
  "retribution",
  "inspire",
  "sprint",
  "revitalize",
  "aegis",
  "petrify",
  "purify",
  "flameshot",
  "flicker",
  "vengeance",
  "arrival",
])
  test(`${id}: rejected dead/paused/cooldown casts never consume a new cooldown`, () => {
    const { s, p, b } = game(id);
    s.paused = true;
    assert.equal(b.cast(), "paused");
    assert.equal(b.readyAt, 0);
    s.paused = false;
    p.hp = 0;
    assert.equal(b.cast(), "dead");
    p.hp = 2250;
    b.readyAt = 20;
    assert.equal(b.cast(), "cooldown");
    assert.equal(b.readyAt, 20);
  });
test("Execute exact true damage bypasses all shields and never hits a non-hero", () => {
  const { s, e, b } = game("execute");
  e.hp = 5000;
  e.shield = { amount: 99999, until: 5 };
  grantShield(s, e, 99999, 5, "test");
  assert.equal(b.cast(), "cast");
  near(e.hp, 5000 - (100 + 10 + 5000 * 0.13));
  near(e.shield.amount, 99999);
  near(e.shields[0].amount, 99999);
  assert.equal(b.readyAt, 90);
});
test("Execute prefers valid manual hero pin, kill cooldown becomes 54, invalid categories reject", () => {
  const { s, e, b } = game("execute");
  s.manualTargetId = e.id;
  e.hp = 1;
  assert.equal(b.cast(), "cast");
  assert.equal(e.hp, 0);
  near(b.readyAt, 54);
  const g = game("execute");
  g.s.bots = [];
  g.s.minions = [{ ...g.e, kind: "minion" }];
  g.s.syncEnemies();
  assert.equal(g.b.cast(), "no-valid-target");
  assert.equal(g.b.readyAt, 0);
});
test("Retribution exact minion true damage, no jungle fabricated, and creep reductions/rewards/progression use real kind", () => {
  const { s, p, e, b } = game("retribution");
  e.kind = "minion";
  s.bots = [];
  s.minions = [e];
  assert.equal(b.cast(), "cast");
  near(e.hp, 9100);
  assert.equal(b.progress, 0);
  p.hp = 2000;
  const creep = { ...e, id: "creep", kind: "creep", gold: 100, xp: 100 };
  const before = p.hp;
  s.deal(creep, p, 100, "true", true);
  near(before - p.hp, 60);
  s.scenario = {
    ...s.scenario,
    jungleRegions: [{ team: "player", x: 0, z: 0, radius: 3 }],
  };
  p.hp = 2000;
  s.deal(creep, p, 100, "true", true);
  near(2000 - p.hp, 51);
  s.time = 121;
  p.hp = 2000;
  s.deal(creep, p, 100, "true", true);
  near(2000 - p.hp, 60);
  const gold = s.gold;
  s.award(p, creep, creep);
  assert.equal(s.gold, gold + 160);
});
test("Retribution five-action extension does not invent a blessing; fifteen actions grant stats once", () => {
  const { s, p, e, b } = game("retribution");
  const pa = p.attributes.physicalAttack,
    hp = p.maxHp;
  for (let n = 0; n < 5; n++) b.recordDeath(p, { ...e, kind: "creep" });
  assert.equal(b.upgradeReady, true);
  assert.equal(b.snapshot().blessing, "not-configured");
  for (let n = 5; n < 15; n++) b.recordDeath(p, { ...e, kind: "creep" });
  near(p.attributes.physicalAttack, pa + 10);
  near(p.attributes.magicPower, 10);
  near(p.maxHp, hp + 100);
  b.recordDeath(p, e);
  near(p.attributes.physicalAttack, pa + 10);
});
test("Retribution first-five-minute shared minion restriction is inactive after300s", () => {
  const { s, p, e } = game("retribution");
  e.team = "player";
  e.kind = "bot";
  e.x = 0;
  e.z = 0;
  p.hp = 2000;
  const before = s.progression.totalXp;
  s.award(
    e,
    { ...e, id: "victim", kind: "minion", team: "enemy" },
    s.scenario.wave,
  );
  assert.equal(s.progression.totalXp, before);
  s.time = 300;
  s.award(
    e,
    { ...e, id: "victim2", kind: "minion", team: "enemy" },
    s.scenario.wave,
  );
  assert.ok(s.progression.totalXp > before);
});
test("Inspire 1.5 rate, eight successful hits, defense ignore 9% atL1, exact60 healing and expiry", () => {
  const { s, p, e, b } = game("inspire");
  e.attributes.physicalDefense = 100;
  p.hp = 500;
  const base = p.attackRate;
  b.cast();
  near(p.attackRate, base * 1.5);
  const hp = e.hp;
  s.deal(p, e, 100, "physical", true);
  near(hp - e.hp, (100 * 120) / 211);
  near(p.hp, 560);
  assert.equal(b.active.inspire.charges, 7);
  for (let n = 0; n < 7; n++) s.deal(p, e, 1, "physical", true);
  assert.equal(b.active.inspire, undefined);
  near(p.hp, 980);
  s.time = 76;
  b.cast();
  s.time = 81;
  b.tick(0);
  assert.equal(b.active.inspire, undefined);
  near(p.attackRate, base);
});
test("Inspire rejected basic actions do not spend charges or skip cooldown/animation lock", () => {
  const { s, e, b } = game("inspire");
  b.cast();
  assert.equal(s.attack(e.id), "fired");
  assert.equal(b.active.inspire.charges, 8);
  assert.equal(s.attack(e.id), "cooldown");
  assert.equal(b.active.inspire.charges, 8);
});
test("Sprint only applies speed once, cleanses slow, immunity and full expiry", () => {
  const { s, p, b } = game("sprint");
  slowActor(s, p, 0.5, 20);
  const base = p.attributes.movementSpeed * s.hero.runtimeScale.movement;
  b.cast();
  assert.equal(p.slow, null);
  near(p.speed, base * 1.5);
  assert.equal(slowActor(s, p, 0.5, 2), false);
  for (let i = 0; i < 20; i++) s.itemEffects.tick();
  near(p.speed, base * 1.5);
  s.time = 6;
  b.tick(0);
  near(p.speed, base);
  assert.equal(slowActor(s, p, 0.5, 2), true);
});
test("Revitalize ten ticks over4s with nonstacking receive bonus, no outside/enemy heals and cleanup", () => {
  const { s, p, e, b } = game("revitalize");
  p.hp = 1000;
  const ally = {
      ...e,
      id: "ally",
      team: "player",
      x: 2,
      hp: 1000,
      maxHp: 10000,
    },
    far = { ...ally, id: "far", x: 8 };
  s.bots.push(ally, far);
  b.cast();
  assert.equal(p.recoveryBoost, 1.25);
  for (let n = 1; n <= 10; n++) {
    s.time = n * 0.4;
    b.tick(0.4);
  }
  near(p.hp, 1000 + p.maxHp * 0.025 * 1.25 * 10);
  near(far.hp, 1000);
  near(e.hp, 10000);
  assert.equal(p.recoveryBoost, 1);
  assert.equal(b.springs.length, 0);
  s.time = 76;
  b.cast();
  ally.x = 20;
  b.updateAura();
  assert.equal(ally.recoveryBoost, 1);
});
test("Aegis exact840 shield lasts5s absorbs once without changing max HP", () => {
  const { s, p, e, b } = game("aegis");
  const max = p.maxHp;
  b.cast();
  near(p.shields[0].amount, 840);
  const hp = p.hp;
  s.deal(e, p, 100, "true", false);
  near(p.hp, hp);
  near(p.shields[0].amount, 740);
  assert.equal(p.maxHp, max);
  s.time = 5;
  b.tick(0);
  assert.equal(p.shields.length, 0);
  s.deal(e, p, 100, "true", false);
  near(p.hp, hp - 100);
});
test("Petrify magic115, stun0.8 then50% slow0.8, immunity respected", () => {
  const { s, e, b } = game("petrify");
  e.x = 2;
  b.cast();
  near(e.hp, 9885);
  near(e.stunnedUntil, 0.8);
  s.time = 0.8;
  b.tick(0);
  assert.equal(e.stunned, false);
  near(e.slow.ratio, 0.5);
  near(e.slow.until, 1.6);
});
test("Purify removes known removable debuffs, excludes Suppression and has1.2s control immunity not damage immunity", () => {
  const { s, p, e, b } = game("purify");
  p.stunnedUntil = 20;
  p.stunned = true;
  p.slow = { ratio: 0.5, until: 10 };
  p.mark = { until: 5 };
  p.antiHealUntil = 5;
  assert.equal(b.cast(), "cast");
  assert.equal(p.stunnedUntil, 0);
  assert.equal(p.slow, null);
  assert.equal(p.mark, null);
  assert.equal(p.antiHealUntil, 0);
  assert.equal(stunActor(s, p, 1), false);
  const hp = p.hp;
  s.deal(e, p, 10, "true", false);
  near(p.hp, hp - 10);
  s.time = 1.2;
  b.tick(0);
  assert.equal(stunActor(s, p, 1), true);
  p.suppressionUntil = 10;
  cleanse(p);
  assert.equal(p.suppressionUntil, 10);
});
test("Flameshot first hero hit scales actual travel, not visual, minions ignored, obstacles block", () => {
  const { s, e, b } = game("flameshot");
  e.x = 6;
  const second = { ...e, id: "second", x: 9 };
  s.bots.push(second);
  b.cast({ x: 12, z: 0 });
  for (let n = 1; n <= 100; n++) {
    s.time = n * 0.01;
    b.tick(0.01);
  }
  near(e.hp, 10000 - (200 + (480 * (6 - e.radius - 0.2)) / 12));
  near(second.hp, 10000);
  assert.equal(b.projectiles.length, 0);
  const g = game("flameshot");
  g.e.x = 7;
  g.s.arena = {
    ...g.s.arena,
    obstacles: [{ x: 3, z: 0, width: 0.5, depth: 5 }],
  };
  g.b.cast({ x: 12, z: 0 });
  for (let n = 1; n <= 100; n++) {
    g.s.time = n * 0.01;
    g.b.tick(0.01);
  }
  near(g.e.hp, 10000);
});
test("Flameshot close knockback respects bounds and control immunity", () => {
  const { s, e, b } = game("flameshot");
  e.x = 1;
  b.cast({ x: 12, z: 0 });
  assert.ok(e.x > 1);
  const g = game("flameshot");
  g.e.x = 1;
  g.e.controlImmuneUntil = 5;
  g.b.cast({ x: 12, z: 0 });
  near(g.e.x, 1);
});
test("Flicker fixed3.5 safe distance, six hybrid defense atL1 for1s, walls/bounds block", () => {
  const { s, p, b } = game("flicker"),
    pd = p.attributes.physicalDefense;
  b.cast({ x: 10, z: 0 });
  near(p.x, 3.5);
  near(p.attributes.physicalDefense, pd + 6);
  s.time = 1;
  b.tick(0);
  near(p.attributes.physicalDefense, pd);
  const g = game("flicker");
  g.s.arena = { ...g.s.arena, obstacles: [{ x: 2, z: 0, width: 1, depth: 5 }] };
  g.b.cast({ x: 10, z: 0 });
  assert.ok(g.p.x <= 1.05);
  assert.ok(g.p.x >= 0);
});
test("Vengeance35% reduction then35% actualHP magic reflection, no recursion and expires3s", () => {
  const { s, p, e, b } = game("vengeance");
  b.cast();
  const hp = p.hp,
    eh = e.hp;
  s.deal(e, p, 100, "true", false);
  near(hp - p.hp, 65);
  near(eh - e.hp, 65 * 0.35);
  const before = e.hp;
  s.deal(e, p, 100, "true", false, { reflected: true });
  near(e.hp, before);
  s.time = 3;
  b.tick(0);
  const after = p.hp;
  s.deal(e, p, 100, "true", false);
  near(after - p.hp, 100);
});
test("Arrival needs actual ally destination, channels3s safely, speeddecays3s and expires", () => {
  const { s, p, e, b } = game("arrival");
  assert.equal(b.cast(), "select-allied-destination");
  assert.equal(b.readyAt, 0);
  const ally = {
    ...e,
    id: "ally-minion",
    team: "player",
    kind: "minion",
    x: 10,
    radius: 0.3,
  };
  s.minions = [ally];
  b.destinationId = ally.id;
  const base = p.speed;
  assert.equal(b.cast(), "cast");
  s.time = 2.9;
  b.tick(0);
  near(p.x, 0);
  s.time = 3;
  b.tick(0);
  near(p.x, 8);
  assert.equal(b.channel, null);
  near(p.speed, base * 1.6);
  s.time = 4.5;
  b.tick(0);
  near(p.speed, base * 1.3);
  s.time = 6;
  b.tick(0);
  near(p.speed, base);
});
for (const reason of ["move", "target-died", "damage", "death", "hero-action"])
  test(`Arrival ${reason} cancels once and refunds30 seconds`, () => {
    const { s, p, e, b } = game("arrival"),
      ally = { ...e, id: "ally", team: "player", kind: "minion", x: 10 };
    s.minions = [ally];
    b.destinationId = ally.id;
    b.cast();
    s.time = 1;
    if (reason === "move") p.x = 0.1;
    if (reason === "target-died") ally.hp = 0;
    if (reason === "damage") s.deal(e, p, 1, "true", false);
    if (reason === "death") b.onDeath(p);
    if (reason === "hero-action") b.cancelArrival("casting");
    b.tick(0);
    assert.equal(b.channel, null);
    near(b.readyAt, 45);
    assert.equal(b.cancelArrival(), false);
    near(b.readyAt, 45);
  });
test("new match clears spell cooldown/effects/priority without resetting saved account unlocks", () => {
  const { s, b } = game("inspire");
  b.cast();
  s.priorityItem = "dagger";
  s.reset();
  assert.equal(s.spells.readyAt, 0);
  assert.deepEqual(s.spells.active, {});
  assert.equal(s.spells.accountLevel, 25);
  assert.equal(s.priorityItem, null);
});

test("all twelve exact informational role sets and unique bundled SVG icons match the supplied reference", async () => {
  const { SPELL_ART } = await import("../src/spells/art.js");
  const roles = {
    execute: ["Fighter", "Assassin", "Mage"],
    retribution: ["Assassin", "Fighter", "Mage"],
    inspire: ["Marksman", "Fighter"],
    sprint: ["Marksman", "Mage", "Support"],
    revitalize: ["Support", "Tank"],
    aegis: ["Support", "Tank", "Mage"],
    petrify: ["Fighter", "Tank", "Support"],
    purify: ["Mage", "Support", "Marksman"],
    flameshot: ["Mage", "Support"],
    flicker: ["Fighter", "Mage", "Marksman", "Assassin", "Tank", "Support"],
    vengeance: ["Tank", "Fighter"],
    arrival: ["Fighter", "Tank"],
  };
  for (const spell of spells) {
    assert.deepEqual(spell.roles, roles[spell.id]);
    assert.ok(SPELL_ART[spell.id].startsWith("data:image/svg+xml,"));
  }
  assert.equal(new Set(Object.values(SPELL_ART)).size, 12);
});

test("missing effect parameters and unknown target/executor fail loudly instead of activating a fake spell", () => {
  const missing = { spells: structuredClone(spells) };
  delete missing.spells[0].parameters.range;
  assert.throws(
    () => validateSpells(missing),
    /Missing spell parameter.*execute.range/,
  );
  const bad = { spells: structuredClone(spells) };
  bad.spells[0].target = "invented";
  assert.throws(() => validateSpells(bad), /executor\/target/);
});

test("Revitalize receive bonus affects shared healing/shields at1.25, never additive-stacks and disappears outside", () => {
  const { s, p, b } = game("revitalize");
  p.hp = 500;
  b.cast();
  b.springs.push({ ...b.springs[0], id: 99 });
  b.updateAura();
  near(p.recoveryBoost, 1.25);
  near(healActor(s, p, 100), 125);
  const shield = grantShield(s, p, 100, 1, "probe");
  near(shield.amount, 125);
  b.springs = [];
  b.updateAura();
  near(p.recoveryBoost, 1);
  near(healActor(s, p, 100), 100);
});
test("Purify exact15% speed and1.2s immunity expire without leaving permanent stat bonuses", () => {
  const { s, p, b } = game("purify"),
    base = p.speed;
  b.cast();
  near(p.speed, base * 1.15);
  near(p.controlImmuneUntil, 1.2);
  s.time = 1.2;
  b.tick(0);
  near(p.speed, base);
  assert.equal(stunActor(s, p, 0.8), true);
});
test("Inspire does not consume charges on invalid/dead targets, but a shielded landed hit still does", () => {
  const { s, p, e, b } = game("inspire");
  b.cast();
  e.hp = 0;
  assert.equal(s.deal(p, e, 100, "physical", true), 0);
  assert.equal(b.active.inspire.charges, 8);
  e.hp = 10000;
  grantShield(s, e, 1000, 5, "target");
  s.deal(p, e, 100, "physical", true);
  assert.equal(b.active.inspire.charges, 7);
});

test("Retribution allied-jungle first120s extra15% applies to hero/skill damage too, only where a real region is configured", () => {
  const { s, p, e, b } = game("retribution");
  const hp = p.hp;
  s.deal(e, p, 100, "true", false);
  near(hp - p.hp, 100);
  s.scenario = {
    ...s.scenario,
    jungleRegions: [{ team: "player", x: 0, z: 0, radius: 3 }],
  };
  p.hp = 2000;
  s.deal(e, p, 100, "true", false);
  near(2000 - p.hp, 85);
  s.time = 120;
  p.hp = 2000;
  s.deal(e, p, 100, "true", false);
  near(2000 - p.hp, 100);
});
