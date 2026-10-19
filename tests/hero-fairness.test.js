import test from "node:test";
import assert from "node:assert/strict";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { MatchSimulation } from "../src/match/simulation.js";
import { createMatchConfig } from "../src/match/config.js";
import {
  learnBotSkills,
  advanceHeroBot,
  commandHeroBot,
} from "../src/match/hero-bots.js";
const registry = await loadSourceHeroRegistry(),
  near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
const builds = [
  [],
  [
    "tough-boots",
    "windtalker",
    "haas-claws",
    "berserkers-fury",
    "blade-of-despair",
    "malefic-gun",
  ],
  [
    "magic-shoes",
    "enchanted-talisman",
    "lightning-truncheon",
    "divine-glaive",
    "holy-crystal",
    "blood-wings",
  ],
  [
    "warrior-boots",
    "athenas-shield",
    "blade-armor",
    "thunder-belt",
    "queens-wings",
    "immortality",
  ],
  [
    "swift-boots",
    "golden-staff",
    "demon-hunter-sword",
    "corrosion-scythe",
    "rose-gold-meteor",
    "malefic-gun",
  ],
  [
    "tough-boots",
    "brute-force-breastplate",
    "oracle",
    "guardian-helmet",
    "radiant-armor",
    "dominance-ice",
  ],
];
function pair(level = 8, difficulty = "normal", build = [], heroId="layla") {
  const s = new MatchSimulation(
    registry,
    {...createMatchConfig("brawl", difficulty, 1),heroId,botHeroIds:{player:[],enemy:[heroId]}},
    { username: "Fairness_Test" },
  );
  s.update(3.01);
  s.time = 40;
  s.setPracticeLevel(level);
  learnBotSkills(s);
  const a = s.bots[0],
    e = s.botEngines.get(a.id);
  e.time = 40;
  e.setPracticeLevel(level);
  learnBotSkills(e);
  s.gold = 100000;
  s.structures = [];
  s.minions = [];
  s.waveScheduler.due = () => [];
  s.tickHeroes = () => {};
  s.tickMinions = () => {};
  for (const id of build) assert.equal(s.purchaseItem(id), "ok");
  e.inventory = [...s.inventory];
  e.itemEffects.refresh();
  for (const [p, z] of [
    [s.player, -4.5],
    [a, 4.5],
  ])
    Object.assign(p, {
      x: 0,
      z,
      protected: false,
      spawnProtectedUntil: 0,
      targetable: true,
    });
  s.syncEnemies();
  return { s, a, e };
}
const equal = (s, e) => {
  assert.deepEqual(s.player.attributes, e.player.attributes);
  for (const k of [
    "maxHp",
    "maxMana",
    "hp",
    "mana",
    "hpRegen",
    "manaRegen",
    "damage",
    "speed",
    "range",
    "attackRate",
    "attackCooldown",
    "criticalChance",
    "cooldownReduction",
    "lifesteal",
    "spellVamp",
    "tenacity",
  ])
    near(s.player[k] || 0, e.player[k] || 0);
  assert.deepEqual(s.progression.ranks, e.progression.ranks);
  for (const slot of ["skill-1", "skill-2", "skill-ultimate"])
    assert.deepEqual(s.ability(slot), e.ability(slot));
};
for (const level of [1, 3, 8, 15])
  for (const difficulty of ["easy", "normal", "hard"])
    test(`actual hero-stat parity at level ${level}, ${difficulty}, six identical build fixtures`, () => {
      for (const build of builds) {
        const { s, e } = pair(level, difficulty, build);
        equal(s, e);
        const until = s.time + 3;
        s.buff = { until };
        e.buff = { until };
        s.itemEffects.applyRuntime();
        e.itemEffects.applyRuntime();
        equal(s, e);
      }
    });
function victim(team, z) {
  return {
    id: "victim-" + team,
    kind: "minion",
    team,
    x: 3,
    z,
    hp: 100000,
    maxHp: 100000,
    radius: 0.35,
    targetable: true,
    physicalDefense: 50,
    magicDefense: 50,
    attributes: { physicalDefense: 50, magicDefense: 50 },
  };
}
for (const difficulty of ["easy", "normal", "hard"])
  for (const build of [[], builds[1], builds[2], builds[4]])
    test(
      difficulty +
        " actual paired basic attacks and skill projectiles resolve equal damage, costs and cooldowns: " +
        build.join(","),
      () => {
        const { s, a, e } = pair(15, difficulty, build),
          v = victim("enemy", -4.5),
          w = victim("player", 4.5);
        v.hp = w.hp = 30000;
        s.minions = [v, w];
        s.syncEnemies();
        s.random = () => 0.01;
        s.player.hp = s.player.maxHp * 0.5;
        a.hp = a.maxHp * 0.5;
        assert.equal(s.attack(v.id), "fired");
        assert.equal(commandHeroBot(s, a, w), true);
        const step = (seconds) => {
          for (let i = 0; i < Math.ceil(seconds / 0.02); i++) {
            s.update(0.02);
            advanceHeroBot(s, a, 0.02);
          }
        };
        step(1.5);
        assert.ok(v.hp < 30000);
        near(v.hp, w.hp);
        equal(s, e);
        for (const slot of ["skill-1", "skill-2", "skill-ultimate"]) {
          const hp = v.hp,
            mp = s.player.mana;
          s.manualId = v.id;
          e.manualId = w.id;
          assert.equal(s.cast(slot, { x: v.x, z: v.z }, v.id), "cast");
          assert.equal(e.cast(slot, { x: w.x, z: w.z }, w.id), "cast");
          near(s.player.mana, e.player.mana);
          assert.ok(s.player.mana < mp);
          assert.deepEqual(s.cooldowns, e.cooldowns);
          step(1.5);
          assert.ok(v.hp < hp, slot + " really damages its target");
          near(v.hp, w.hp);
          equal(s, e);
        }
      },
    );

test("equivalent equipment defense, shields, damage recovery and Immortality use both actual hero contexts", () => {
  for (const build of [builds[2], builds[3], builds[5]]) {
    const { s, e, a } = pair(8, "normal", build);
    const neutral = {
      id: "neutral",
      kind: "minion",
      team: "neutral",
      hp: 99999,
      maxHp: 99999,
      x: 0,
      z: 0,
      physicalDefense: 50,
      magicDefense: 50,
    };
    s.minions = [neutral];
    for (const ctx of [s, e]) {
      ctx.expandedEffects.tick(0.02);
      ctx.player.hp = ctx.player.maxHp * 0.4;
      ctx.player.mana = ctx.player.maxMana * 0.4;
    }
    for (const type of ["physical", "magic", "true"]) {
      near(
        s.deal({ ...neutral, team: "enemy" }, s.player, 700, type, true),
        s.deal({ ...neutral, team: "player" }, a, 700, type, true),
      );
      near(s.player.hp, a.hp);
      assert.deepEqual(s.player.shields, a.shields);
    }
    for (const ctx of [s, e]) ctx.itemEffects.tick(0.1);
    equal(s, e);
  }
  const { s, e, a } = pair(8, "normal", ["immortality"]);
  s.minions = [];
  s.tickHeroes = MatchSimulation.prototype.tickHeroes;
  for (const p of [s.player, a]) p.hp = 10;
  const neutral = {
    id: "neutral",
    kind: "minion",
    team: "neutral",
    hp: 1,
    x: 0,
    z: 0,
    physicalDefense: 0,
    magicDefense: 0,
  };
  s.deal({ ...neutral, team: "enemy" }, s.player, 99999, "true");
  s.deal({ ...neutral, team: "player" }, a, 99999, "true");
  assert.equal(s.player.hp, 0);
  assert.equal(a.hp, 0);
  assert.equal(
    s.expandedEffects.t.immortalPendingUntil,
    e.expandedEffects.t.immortalPendingUntil,
  );
  for (let i = 0; i < 130; i++) s.update(0.02);
  assert.ok(s.player.hp > 0);
  assert.ok(a.hp > 0);
  near(s.player.hp, a.hp);
  assert.equal(a.targetable, true);
});
test("NPC item kill/assist credit belongs to its actor, never to the human", () => {
  const { s, e, a } = pair(8, "normal", ["demon-shoes", "fleeting-time"]);
  for (const c of [s, e]) {
    c.player.mana = 10;
    c.cooldowns["destruction-rush"] = 100;
  }
  const minion = { ...victim("player", 4.5), contributors: { [a.id]: 40 } };
  e.itemEffects.minionDeath(minion);
  assert.ok(a.mana > 10);
  assert.equal(s.player.mana, 10);
});

test("incoming NPC item timers use the authoritative hit time, not its previous-frame engine clock", () => {
  const { s, e, a } = pair(8, "normal", ["rose-gold-meteor"]);
  e.time = s.time - 0.02;
  for (const p of [s.player, a]) p.hp = p.maxHp * 0.2;
  const hit = {
    id: "minion-clock",
    kind: "minion",
    hp: 1000,
    maxHp: 1000,
    x: 3,
    z: 0,
  };
  s.deal({ ...hit, team: "enemy" }, s.player, 100, "physical");
  s.deal({ ...hit, team: "player" }, a, 100, "physical");
  assert.equal(e.itemEffects.t.lifelineUntil, s.itemEffects.t.lifelineUntil);
  assert.deepEqual(a.shield, s.player.shield);
});

for(const level of [1,3,8,15])for(const difficulty of ["easy","normal","hard"])test(`Franco item/stat parity at level ${level}, ${difficulty}, all six existing real build fixtures`,()=>{for(const build of builds){const {s,e}=pair(level,difficulty,build,"franco");equal(s,e);assert.equal(s.hero.role,"tank");}});
