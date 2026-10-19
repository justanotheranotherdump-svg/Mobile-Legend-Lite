import { getItem } from "../src/match/recipes.js";
import { calculateAttributes } from "../src/simulation/stats/attributes.js";
import test from "node:test";
import assert from "node:assert/strict";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { MatchSimulation } from "../src/match/simulation.js";
import { createMatchConfig } from "../src/match/config.js";
import { advanceHeroBot } from "../src/match/hero-bots.js";
import { BuildStore } from "../src/player/builds.js";
import { validTarget } from "../src/match/actions.js";
import { isEligibleEnemy } from "../src/simulation/targeting.js";
import { getSpell } from "../src/spells/catalog.js";
const registry = await loadSourceHeroRegistry(),
  near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
function game(spell = "flicker", roleSetup) {
  const s = new MatchSimulation(
    registry,
    {
      ...createMatchConfig("custom", "normal", 1),
      spellId: spell,
      accountLevel: 25,
      roleSetup,
    },
    { username: "Equipment_Test" },
  );
  s.update(3.01);
  s.time = 40;
  s.gold = 100000;
  s.structures = [];
  const p = s.player,
    e = s.bots[0];
  Object.assign(p, {
    x: 0,
    z: 0,
    targetable: true,
    protected: false,
    spawnProtectedUntil: 0,
  });
  Object.assign(e, {
    x: 2,
    z: 0,
    hp: 10000,
    maxHp: 10000,
    targetable: true,
    protected: false,
    spawnProtectedUntil: 0,
  });
  e.attributes.physicalDefense = 0;
  e.attributes.magicDefense = 0;
  s.syncEnemies();
  return { s, p, e };
}
const buy = (s, ...ids) => {
  for (const id of ids) assert.equal(s.purchaseItem(id), "ok");
};
function killCreeps(s, n) {
  for (let i = 0; i < n; i++) {
    const c = {
      id: "fixture-creep-" + i + "-" + s.spells.progress,
      kind: "creep",
      team: "enemy",
      targetable: true,
      hp: 1,
      maxHp: 1,
      x: 1,
      z: 0,
      radius: 0.3,
      physicalDefense: 0,
      magicDefense: 0,
      gold: 1,
      xp: 1,
    };
    s.minions.push(c);
    s.deal(s.player, c, 1, "true", false);
    assert.equal(c.hp, 0);
  }
  s.syncEnemies();
}
function earnRoam(s) {
  s.time += 300;
  s.roleEquipment.tick();
  assert.equal(s.roleEquipment.progressGold, 600);
  assert.equal(s.roleEquipment.roamReady, true);
}
test("role intention is user-scoped, validated, exclusive and survives blocked or normal saves", () => {
  const m = new Map(),
    storage = {
      getItem: (k) => m.get(k) || null,
      setItem: (k, v) => m.set(k, v),
    },
    b = new BuildStore(storage, "Role_A");
  b.setRoleSetup("layla", { kind: "jungle", blessingId: "ice-retribution" });
  assert.deepEqual(new BuildStore(storage, "Role_A").hero("layla").roleSetup, {
    kind: "jungle",
    blessingId: "ice-retribution",
  });
  assert.equal(
    new BuildStore(storage, "Role_B").hero("layla").roleSetup,
    undefined,
  );
  b.setRoleSetup("layla", { kind: "roam", blessingId: "flame-retribution" });
  assert.equal(b.hero("layla").roleSetup.kind, "none");
  b.setRoleSetup("unknown", { kind: "roam", blessingId: "favor" });
  assert.equal(b.value.heroes.unknown, undefined);
});
for (const id of ["bloody-retribution", "flame-retribution", "ice-retribution"])
  test(
    id +
      ": prerequisite gates, real five-death progress, farm multiplier and distinct hero spell modification",
    () => {
      const { s, p, e } = game("retribution", {
        kind: "jungle",
        blessingId: id,
      });
      const blank = [...s.inventory],
        gold = s.gold;
      assert.equal(s.purchaseItem(id), "unknown-item");
      assert.equal(s.gold, gold);
      assert.deepEqual(s.inventory, blank);
      assert.equal(s.roleEquipment.compatible, false);
      killCreeps(s, 4);
      buy(s, "basic-boots");
      assert.equal(s.roleEquipment.jungleReady, false);
      killCreeps(s, 1);
      assert.equal(s.roleEquipment.jungleReady, true);
      assert.equal(s.spells.snapshot().blessing, id);
      const farm = {
        id: "farm-target",
        kind: "creep",
        team: "enemy",
        hp: 5000,
        maxHp: 5000,
        x: 1,
        z: 1,
        radius: 0.3,
        targetable: true,
        physicalDefense: 0,
        magicDefense: 0,
      };
      s.minions.push(farm);
      s.syncEnemies();
      assert.equal(s.spells.cast(null, farm.id, true), "cast");
      near(
        5000 - farm.hp,
        (getSpell("retribution").parameters.base +
          getSpell("retribution").parameters.perLevel * s.progression.level) *
          1.5,
      );
      s.spells.readyAt = 0;
      const pa = p.attributes.physicalAttack,
        ms = p.attributes.movementSpeed,
        enemyPA = e.attributes.physicalAttack,
        enemyMS = e.attributes.movementSpeed;
      p.hp = p.maxHp - 1000;
      const hp = p.hp,
        before = e.hp;
      assert.equal(s.spells.cast(null, e.id, true), "cast");
      near(before - e.hp, 100);
      if (id === "bloody-retribution") {
        for (let n = 0; n < 4; n++) {
          s.time++;
          s.roleEquipment.tick();
        }
        near(before - e.hp, 350);
        near(p.hp - hp, 250);
      } else {
        const amount = id === "flame-retribution" ? 58 : 72;
        advanceHeroBot(s, e, 0);
        if (id === "flame-retribution") {
          near(p.attributes.physicalAttack - pa, amount);
          near(enemyPA - e.attributes.physicalAttack, amount);
        } else {
          near(p.attributes.movementSpeed - ms, amount);
          near(enemyMS - e.attributes.movementSpeed, amount);
        }
        s.time += 4.01;
        s.itemEffects.tick();
        advanceHeroBot(s, e, 0);
        near(p.attributes.physicalAttack, pa);
        near(p.attributes.movementSpeed, ms);
      }
      assert.equal(s.sellItem(0), "ok");
      assert.equal(s.roleEquipment.jungleReady, false);
    },
  );
test("incompatible spells, missing boots and lane minions cannot manufacture an upgraded jungle spell", () => {
  const { s, p } = game("flicker", {
    kind: "jungle",
    blessingId: "ice-retribution",
  });
  buy(s, "basic-boots");
  killCreeps(s, 6);
  assert.equal(s.spells.progress, 0);
  assert.equal(s.roleEquipment.compatible, false);
  const r = game("retribution", {
    kind: "jungle",
    blessingId: "ice-retribution",
  });
  const minion = { ...r.e, id: "ordinary-minion", kind: "minion", hp: 1 };
  r.s.minions.push(minion);
  r.s.deal(r.p, minion, 1, "true", false);
  assert.equal(r.s.spells.progress, 0);
  assert.equal(r.s.roleEquipment.jungleReady, false);
});
test("fifteen-action stat bonus is gated by actual configured boots, never stacks and disappears if boots sold", () => {
  const { s, p } = game("retribution", {
    kind: "jungle",
    blessingId: "ice-retribution",
  });
  const pa = p.attributes.physicalAttack,
    max = p.maxHp;
  killCreeps(s, 15);
  near(p.attributes.physicalAttack, pa);
  buy(s, "basic-boots");
  s.itemEffects.tick();
  near(p.attributes.physicalAttack, pa + 10);
  near(p.maxHp, max + 100);
  killCreeps(s, 2);
  near(p.attributes.physicalAttack, pa + 10);
  s.sellItem(0);
  near(p.attributes.physicalAttack, pa);
  near(p.maxHp, max);
});
for (const id of ["conceal", "dire-hit", "encourage", "favor"])
  test(
    id +
      ": earned-only 600 unlock, no slot or direct purchase, one intended blessing",
    () => {
      const { s } = game(id === "favor" ? "revitalize" : "flicker", {
        kind: "roam",
        blessingId: id,
      });
      assert.equal(s.roleEquipment.roamReady, false);
      const gold = s.gold;
      assert.equal(s.purchaseItem(id), "unknown-item");
      assert.equal(s.gold, gold);
      buy(s, "basic-boots");
      earnRoam(s);
      assert.deepEqual(s.inventory, [
        "basic-boots",
        null,
        null,
        null,
        null,
        null,
      ]);
      assert.equal(s.roleEquipment.snapshot().active, true);
      assert.equal(s.stats.goldEarned, 600);
      assert.ok(s.progression.totalXp > 0);
    },
  );
test("Devotion suppresses shared farm rewards only while valid roaming boots and first eight minutes", () => {
  const { s, p, e } = game("flicker", {
    kind: "roam",
    blessingId: "encourage",
  });
  buy(s, "basic-boots");
  const ally = s.makeBot("player", 0);
  Object.assign(ally, { x: 1, z: 0, hp: 2000 });
  s.bots.push(ally);
  const creep = { ...e, id: "shared-creep", kind: "creep", gold: 100, xp: 100 };
  let gold = s.gold,
    xp = s.progression.totalXp;
  s.award(p, creep, creep);
  near(s.gold, gold);
  near(s.progression.totalXp, xp);
  s.time = 481;
  s.award(p, creep, creep);
  near(s.gold, gold + 100);
  near(s.progression.totalXp, xp + 100);
});
test("real hero assist awards Thriving bonus only once and does not lower ally reward", () => {
  const { s, p, e } = game("flicker", { kind: "roam", blessingId: "favor" });
  buy(s, "basic-boots");
  const ally = s.makeBot("player", 0);
  Object.assign(ally, { x: 0, z: 0 });
  s.bots.push(ally);
  s.deal(p, e, 10, "true", false);
  s.deal(ally, e, 20000, "true", false);
  assert.equal(s.stats.assists, 1);
  assert.equal(s.roleEquipment.progressGold, 81);
  const before = s.gold;
  s.onDeath(ally, e);
  assert.equal(s.gold, before);
});
test("Conceal has timed allied camouflage, shared speed, near reveal, cooldown and damage break", () => {
  const { s, p, e } = game("flicker", { kind: "roam", blessingId: "conceal" });
  buy(s, "basic-boots");
  earnRoam(s);
  s.itemEffects.tick();
  const speed = p.speed;
  assert.equal(s.roleEquipment.activateConceal(), "activated");
  near(p.speed, speed * 1.24);
  e.x = 4;
  assert.equal(validTarget(e, p), false);
  assert.equal(isEligibleEnemy(p, e), false);
  e.x = 1;
  assert.equal(validTarget(e, p), true);
  s.deal(e, p, 1, "true", false);
  assert.equal(p.camouflaged, false);
  assert.equal(s.roleEquipment.activateConceal(), "cooldown");
});
test("classic Dire Hit really deals hybrid extra damage below threshold and enforces cooldown", () => {
  const { s, p, e } = game("flicker", { kind: "roam", blessingId: "dire-hit" });
  buy(s, "basic-boots");
  earnRoam(s);
  e.hp = 3000;
  const first = e.hp;
  s.deal(p, e, 10, "true", false);
  near(first - e.hp, 710);
  const before = e.hp;
  s.deal(p, e, 10, "true", false);
  near(before - e.hp, 10);
});
test("Encourage actual aura applies once to self and bots, expires out of range or on boot loss", () => {
  const { s, p, e } = game("flicker", {
    kind: "roam",
    blessingId: "encourage",
  });
  buy(s, "basic-boots");
  earnRoam(s);
  const pa = calculateAttributes(s.hero, s.progression.level).physicalAttack;
  s.itemEffects.tick();
  near(p.attributes.physicalAttack, pa + 12);
  s.itemEffects.tick();
  near(p.attributes.physicalAttack, pa + 12);
  const ally = s.makeBot("player", 0);
  Object.assign(ally, { x: 1, z: 1 });
  s.bots.push(ally);
  advanceHeroBot(s, ally, 0);
  near(ally.attributes.physicalAttack, 133 + 12);
  ally.x = 10;
  advanceHeroBot(s, ally, 0);
  near(ally.attributes.physicalAttack, 133);
  s.sellItem(0);
  near(p.attributes.physicalAttack, pa);
  assert.equal(s.roleEquipment.compatible, false);
});
test("Favor only triggers support-capable skill, heals lowest relative HP ally and honors cooldown", () => {
  const { s, p } = game("revitalize", { kind: "roam", blessingId: "favor" });
  buy(s, "basic-boots");
  earnRoam(s);
  const ally = s.makeBot("player", 0);
  Object.assign(ally, { x: 1, z: 0, hp: 100 });
  s.bots.push(ally);
  const before = ally.hp;
  assert.equal(s.spells.cast(), "cast");
  near(ally.hp - before, 480 * 1.25);
  const hp = ally.hp;
  s.roleEquipment.supportSkill();
  near(ally.hp, hp);
  const a = game("aegis", { kind: "roam", blessingId: "favor" });
  buy(a.s, "basic-boots");
  earnRoam(a.s);
  a.p.hp = 100;
  const own = a.p.hp;
  assert.equal(a.s.spells.cast(), "cast");
  near(a.p.hp, own);
});
test("Magic and Rock potions really apply, replace, expire, never occupy slots or create resale value", () => {
  const { s, p } = game();
  const hp = p.maxHp,
    mp = p.attributes.magicPower,
    gold = s.gold;
  p.hp = 1000;
  buy(s, "magic-potion");
  near(p.attributes.magicPower, mp + 30);
  near(p.cooldownReduction, 0.1);
  buy(s, "rock-potion");
  near(p.attributes.magicPower, mp);
  near(p.maxHp, hp + 500);
  near(p.hp, 1000);
  assert.equal(s.inventory.filter(Boolean).length, 0);
  assert.equal(s.gold, gold - 3000);
  s.time += 121;
  s.itemEffects.tick();
  near(p.maxHp, hp);
  near(p.hp, 1000);
  assert.equal(s.sellItem(0), "empty-slot");
});
test("Feather on-hit applies actual magic damage and Scorch/Lifebane; burn is timed and bounded", () => {
  const { s, p, e } = game();
  buy(s, "feather-of-heaven", "glowing-wand");
  const before = e.hp;
  s.deal(p, e, 100, "physical", true);
  near(before - e.hp, 100 + 50 + 0.3 * p.attributes.magicPower);
  assert.ok(e.antiHealUntil > s.time);
  const hit = e.hp;
  for (let n = 0; n < 3; n++) {
    s.time++;
    s.expandedEffects.tick(1);
  }
  near(hit - e.hp, 300);
  assert.equal(s.expandedEffects.burns.size, 0);
});
for (const id of ["azure-blade", "starlium-scythe"])
  test(
    id +
      " uses a real skill-to-basic proc with cooldown, not passive free damage",
    () => {
      const { s, p, e } = game();
      buy(s, id);
      const before = e.hp;
      s.deal(p, e, 100, "true", true);
      near(before - e.hp, 100);
      s.expandedEffects.cast();
      const hp = e.hp;
      s.deal(p, e, 100, "true", true);
      near(
        hp - e.hp,
        100 + (id === "azure-blade" ? 50 : 90 + 0.6 * p.attributes.magicPower),
      );
      const after = e.hp;
      s.deal(p, e, 100, "true", true);
      near(after - e.hp, 100);
    },
  );
test("Divine Glaive and Genius Wand change shared defense; shred refreshes and expires", () => {
  const { s, p, e } = game();
  buy(s, "divine-glaive", "genius-wand");
  e.attributes.magicDefense = 100;
  near(s.spellDefense("magic", e, false).percentPenetration, 0.5);
  s.deal(p, e, 100, "magic", false);
  assert.equal(e.geniusShred.stacks, 1);
  near(s.spellDefense("magic", e, false).flatReduction, 3);
  s.time += 2.01;
  near(s.spellDefense("magic", e, false).flatReduction, 0);
});
test("Clock/Recharging/Holy Crystal/Brute Force stack through real hits and restore after timers", () => {
  const { s, p, e } = game();
  buy(
    s,
    "clock-of-destiny",
    "concentrated-energy",
    "holy-crystal",
    "brute-force-breastplate",
  );
  const magic = p.attributes.magicPower,
    def = p.attributes.magicDefense,
    pa = p.attributes.physicalAttack;
  for (let n = 0; n < 6; n++) {
    s.deal(p, e, 1, "magic", false);
    s.time += 1.01;
    s.itemEffects.tick();
  }
  assert.ok(p.attributes.magicPower > magic);
  assert.ok(p.attributes.magicDefense > def);
  assert.ok(p.attributes.physicalAttack > pa);
  s.time += 6;
  s.itemEffects.tick();
  near(p.attributes.magicPower, magic);
  near(p.attributes.magicDefense, def);
  near(p.attributes.physicalAttack, pa);
});
test("Ice Queen slows on skill hits with the stated interval and maximum stack count", () => {
  const { s, p, e } = game();
  buy(s, "ice-queen-wand");
  for (let n = 0; n < 4; n++) {
    s.deal(p, e, 1, "physical", false);
    s.time += 0.41;
  }
  near(e.slow.ratio, 0.3);
  assert.equal(e.iceBound.stacks, 3);
});
test("Lightning and Wishing Lantern actually trigger bounded magic procs and cooldowns", () => {
  const { s, p, e } = game();
  buy(s, "lightning-truncheon", "wishing-lantern");
  const before = e.hp;
  s.deal(p, e, 900, "magic", false);
  assert.ok(before - e.hp > 900 + 255);
  const after = e.hp;
  s.deal(p, e, 1, "physical", false);
  near(after - e.hp, 1);
  assert.ok(s.expandedEffects.t.resonateReadyAt > s.time);
});
for (const id of [
  "athenas-shield",
  "radiant-armor",
  "antique-cuirass",
  "dreadnaught-armor",
  "blade-armor",
  "chastise-pauldron",
  "queens-wings",
])
  test(
    id + " responds to real incoming damage with its own defensive hook",
    () => {
      const { s, p, e } = game();
      buy(s, id);
      p.hp = p.maxHp;
      const before = p.hp;
      s.deal(
        e,
        p,
        100,
        id === "antique-cuirass" || id === "dreadnaught-armor"
          ? "physical"
          : "magic",
        id === "blade-armor",
      );
      assert.ok(p.hp < before);
      if (id === "athenas-shield")
        assert.ok(s.expandedEffects.t.athenaUntil > s.time);
      if (id === "radiant-armor")
        assert.equal(s.expandedEffects.count("radiant"), 1);
      if (["antique-cuirass", "dreadnaught-armor"].includes(id))
        assert.equal(e.deter.stacks, 1);
      if (id === "blade-armor") assert.ok(e.hp < 10000);
      if (id === "chastise-pauldron") assert.ok(e.chastisedUntil > s.time);
      if (id === "queens-wings") {
        p.hp = p.maxHp * 0.2;
        s.deal(e, p, 1, "physical", false);
        assert.ok(s.expandedEffects.t.demonUntil > s.time);
      }
    },
  );
test("Blood Wings grants real timed shield and recovery, speed is stable not compounded", () => {
  const { s, p, e } = game();
  buy(s, "blood-wings");
  s.expandedEffects.tick();
  const shield = p.shields.find((x) => x.id === "guard");
  near(shield.amount, 890);
  s.itemEffects.applyRuntime();
  const speed = p.speed;
  s.itemEffects.applyRuntime();
  near(p.speed, speed);
  s.deal(e, p, 1000, "true", false);
  assert.equal(shield.amount, 0);
  assert.ok(s.expandedEffects.t.guardBurstUntil > s.time);
  s.time += 20.01;
  s.expandedEffects.tick();
  near(p.shields.find((x) => x.id === "guard").amount, 890);
});
test("Oracle recovery factor stays stable across repeated runtime updates and anti-heal remains multiplicative", () => {
  const { s, p } = game();
  buy(s, "oracle");
  for (let n = 0; n < 5; n++) s.itemEffects.applyRuntime();
  near(p.recoveryBoost, 1.25);
  p.antiHealUntil = s.time + 3;
  assert.ok(p.antiHealUntil > s.time);
});
test("Guardian and burn equipment really heal/burn with out-of-combat condition and aura range", () => {
  const { s, p, e } = game();
  buy(s, "guardian-helmet", "cursed-helmet");
  p.hp = 1000;
  s.expandedEffects.tick(1);
  near(p.hp, 1000 + p.maxHp * 0.025);
  assert.ok(e.hp < 10000);
  assert.equal(e.curseShred.stacks, 1);
  const before = e.hp;
  e.x = 10;
  s.time++;
  s.expandedEffects.tick(1);
  near(e.hp, before);
});
test("Dominance/Black Ice calculate actual proximity defenses and Dominance applies anti-heal", () => {
  const { s, p, e } = game();
  buy(s, "black-ice-shield");
  const d = p.attributes.physicalDefense;
  near(d, registry.get("layla").baseStats.physicalDefense + 24);
  buy(s, "dominance-ice");
  s.itemEffects.tick();
  s.expandedEffects.tick();
  assert.ok(e.antiHealUntil > s.time);
  const armor = p.attributes.physicalDefense;
  e.x = 10;
  s.itemEffects.tick();
  assert.ok(p.attributes.physicalDefense < armor);
});
test("Thunder Belt gives damage and persistent role-scaled defense only on a landed hero proc", () => {
  const { s, p, e } = game();
  buy(s, "thunder-belt");
  const before = e.hp;
  s.deal(p, e, 100, "true", true);
  assert.ok(before - e.hp > 150);
  near(s.expandedEffects.t.thunderDefense, 0.5);
  s.itemEffects.tick();
  const defense = p.attributes.physicalDefense;
  s.time += 5;
  s.itemEffects.tick();
  near(p.attributes.physicalDefense, defense);
});
test("Sky Piercer executes only below threshold and real kills/deaths adjust bounded stacks", () => {
  const { s, p, e } = game();
  buy(s, "sky-piercer");
  e.hp = 300;
  s.deal(p, e, 1, "true", false);
  assert.equal(e.hp, 0);
  assert.equal(s.expandedEffects.t.lethality, 10);
  p.hp = 1;
  const enemy = s.makeBot("enemy", 1);
  Object.assign(enemy, { x: 1, z: 0, targetable: true, protected: false });
  s.deal(enemy, p, 1, "true", false);
  assert.equal(s.expandedEffects.t.lethality, 7);
});
test("Immortality prevents duplicate death/rewards and revives in-place after exactly 2.5s with shield", () => {
  const { s, p, e } = game();
  buy(s, "immortality");
  p.hp = 1;
  const score = s.score.enemy;
  s.deal(e, p, 1, "true", false);
  assert.equal(p.hp, 0);
  assert.equal(s.score.enemy, score);
  assert.equal(s.stats.deaths, 0);
  s.time += 2.49;
  s.expandedEffects.tick();
  assert.equal(p.hp, 0);
  s.time += 0.01;
  s.expandedEffects.tick();
  near(p.hp, p.maxHp * 0.16);
  assert.ok(p.shields.find((x) => x.id === "immortal"));
  p.shields = [];
  p.hp = 1;
  s.deal(e, p, 1, "true", false);
  assert.equal(s.stats.deaths, 1);
  assert.equal(s.score.enemy, score + 1);
});
test("Winter Crown active blocks movement/new casts/damage, keeps existing projectiles, restores targetability and cooldown", () => {
  const { s, p, e } = game();
  buy(s, "winter-crown");
  const gold = s.gold;
  assert.equal(s.purchaseItem("wind-of-nature"), "ok");
  assert.equal(s.gold, gold-getItem("wind-of-nature").cost);
  s.projectiles.push({ id: "already-cast" });
  assert.equal(s.expandedEffects.activeFrozen(), "activated");
  assert.equal(s.isActionLocked(), true);
  assert.equal(s.projectiles.length, 1);
  const hp = p.hp;
  s.deal(e, p, 100, "true", false);
  near(p.hp, hp);
  s.time += 2;
  s.expandedEffects.tick();
  assert.equal(s.isActionLocked(), false);
  assert.equal(p.targetable, true);
  assert.equal(s.expandedEffects.activeFrozen(), "cooldown");
});
test("Fleeting Time reduces only the actual ultimate cooldown on kill/assist, and never once more for duplicate death", () => {
  const { s, p, e } = game();
  buy(s, "fleeting-time");
  const ult = s.hero.abilities.find((a) => a.slot === "skill-ultimate"),
    skill = s.hero.abilities.find((a) => a.slot === "skill-1");
  s.cooldowns[ult.id] = 100;
  s.cooldowns[skill.id] = 10;
  s.deal(p, e, 20000, "true", false);
  near(s.cooldowns[ult.id], 70);
  near(s.cooldowns[skill.id], 10);
  s.onDeath(p, e);
  near(s.cooldowns[ult.id], 70);
});
test("Gift and Mana Spring perform timed resource recovery and respect cooldowns rather than instant fictitious stats", () => {
  const { s, p } = game();
  buy(s, "elegant-gem", "enchanted-talisman");
  p.hp = p.maxHp * 0.4;
  p.mana = p.maxMana * 0.4;
  const hp = p.hp,
    mana = p.mana;
  s.expandedEffects.tick(0);
  for (let n = 0; n < 3; n++) {
    s.time += 1;
    s.expandedEffects.tick(1);
  }
  near(p.hp - hp, p.maxHp * 0.05 * 3);
  near(p.mana - mana, p.maxMana * 0.05 * 3);
  const before = p.mana;
  s.time = 50.01;
  s.expandedEffects.tick(0);
  near(p.mana - before, p.maxMana * 0.15);
  assert.ok(s.expandedEffects.t.hpGiftReadyAt > s.time);
});
test("Flask of Oasis uses actual support skill target/threshold shields and never self-only Aegis", () => {
  const { s, p } = game("revitalize");
  buy(s, "flask-of-the-oasis");
  const ally = s.makeBot("player", 0);
  Object.assign(ally, { x: 1, z: 0, hp: 100 });
  s.bots.push(ally);
  assert.equal(s.spells.cast(), "cast");
  s.expandedEffects.tick();
  assert.ok(ally.shields.find((x) => x.id === "oasis-player"));
  const first = ally.shields.length;
  s.expandedEffects.tick();
  assert.equal(ally.shields.length, first);
  const a = game("aegis");
  buy(a.s, "flask-of-the-oasis");
  a.p.hp = 100;
  assert.equal(a.s.spells.cast(), "cast");
  a.s.expandedEffects.tick();
  assert.equal(
    a.p.shields.some((x) => x.id === "oasis-player"),
    false,
  );
});
test("potion/temporary stat recalculation and match reset cannot refill health, retain buffs or earn free blessing progress", () => {
  const { s, p } = game("flicker", { kind: "roam", blessingId: "encourage" });
  p.hp = 1000;
  buy(s, "rock-potion", "basic-boots");
  for (let n = 0; n < 5; n++) s.itemEffects.tick();
  near(p.hp, 1000);
  s.reset();
  assert.equal(s.potion, null);
  assert.equal(s.inventory.filter(Boolean).length, 0);
  assert.equal(s.roleEquipment.progressGold, 0);
  assert.equal(s.expandedEffects.t.lethality, undefined);
});
test('full Brute Force tenacity composes from boots once, not exponentially per runtime frame',()=>{const{s,p,e}=game();buy(s,'brute-force-breastplate','tough-boots');for(let n=0;n<6;n++){s.deal(p,e,1,'true',false);s.time+=1.01;s.itemEffects.tick()}for(let n=0;n<10;n++)s.itemEffects.applyRuntime();near(p.tenacity,1-(1-.25)*.75);s.time+=5;s.itemEffects.tick();near(p.tenacity,.25)});
test('Frozen blocks actual MatchSimulation input displacement without advancing an attack or spending skill resources',()=>{const{s,p}=game();buy(s,'winter-crown');assert.equal(s.expandedEffects.activeFrozen(),'activated');const before={x:p.x,z:p.z,mana:p.mana,hits:s.hits};s.update(.25,1,1);near(p.x,before.x);near(p.z,before.z);near(p.mana,before.mana);assert.equal(s.hits,before.hits);assert.equal(p.frozen,true);assert.equal(p.targetable,false)});
