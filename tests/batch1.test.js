import test from "node:test";
import assert from "node:assert/strict";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { MatchSimulation } from "../src/match/simulation.js";
import { createMatchConfig, lane, difficulties } from "../src/match/config.js";
import { resolveMatchTarget, categoryOf } from "../src/match/targeting.js";
import { respawnDelay, restoreActor } from "../src/match/respawn.js";
import { botDecision } from "../src/match/ai.js";
import { LocalLoadingState } from "../src/menu/loading-state.js";
import { MatchFlow } from "../src/menu/match-flow.js";
const registry = await loadSourceHeroRegistry();
const unit = (id, kind, x, hp = 100, maxHp = 100) => ({
  id,
  name: id,
  kind,
  team: "enemy",
  x,
  z: 0,
  hp,
  maxHp,
  targetable: true,
  radius: 0.4,
  range: 6,
  mana: 500,
  maxMana: 500,
});
const source = {
  id: "player",
  team: "player",
  x: 0,
  z: 0,
  hp: 100,
  maxHp: 100,
  range: 6,
};
function battle() {
  const s = new MatchSimulation(
    registry,
    createMatchConfig("brawl", "normal", 1),
    { username: "Batch_Hero" },
  );
  s.update(3);
  s.bots = [];
  s.botEngines.clear();
  s.minions = [];
  s.structures = [];
  Object.assign(s.player, {
    x: 0,
    z: 0,
    protected: false,
    spawnProtectedUntil: 0,
    targetable: true,
  });
  return s;
}
for (const mode of ["nearest", "current-hp", "hp-percent", "manual"])
  for (const category of ["hero", "minion", "tower"])
    test(`${mode}: ${category} preference always wins across real categories`, () => {
      const actors = [
        unit("h1", "bot", 4, 80),
        unit("h2", "bot", 5, 10, 200),
        unit("m1", "minion", 1, 90),
        unit("m2", "minion", 2, 20, 200),
        unit("t1", "tower", 3, 95),
        unit("t2", "core", 5, 30, 300),
      ];
      const r = resolveMatchTarget(source, actors, mode, category);
      assert.equal(categoryOf(r.target), category);
      assert.equal(
        r.target.id,
        (mode === "nearest" || mode === "manual"
          ? { hero: "h1", minion: "m1", tower: "t1" }
          : { hero: "h2", minion: "m2", tower: "t2" })[category],
      );
    });
test("lowest absolute HP and percentage choose differently inside preferred hero category", () => {
  const actors = [unit("a", "bot", 3, 20, 25), unit("b", "bot", 2, 40, 1000)];
  assert.equal(resolveMatchTarget(source, actors, "current-hp").target.id, "a");
  assert.equal(resolveMatchTarget(source, actors, "hp-percent").target.id, "b");
});
test("valid explicit pin overrides all category/mode policies", () => {
  const actors = [unit("hero", "bot", 2), unit("pinned", "minion", 4)];
  for (const category of ["hero", "tower", "minion"])
    assert.equal(
      resolveMatchTarget(source, actors, "nearest", category, "pinned").target
        .id,
      "pinned",
    );
});
for (const invalid of ["dead", "out-of-range", "removed", "protected"])
  test(`stale manual ${invalid} is discarded and actual eligible enemy reacquired`, () => {
    const a = unit("pin", "bot", 3),
      fallback = unit("fallback", "minion", 2);
    if (invalid === "dead") a.hp = 0;
    if (invalid === "out-of-range") a.x = 9;
    if (invalid === "protected") a.protected = true;
    const r = resolveMatchTarget(
      source,
      invalid === "removed" ? [fallback] : [a, fallback],
      "nearest",
      "hero",
      "pin",
    );
    assert.equal(r.target.id, "fallback");
    assert.equal(r.manualTargetId, null);
  });
test("category with no eligible target falls back safely but never selects allies/protected structures", () => {
  const actors = [
    unit("h", "bot", 3),
    { ...unit("ally", "minion", 1), team: "player" },
    { ...unit("shield", "tower", 2), protected: true },
  ];
  for (const c of ["minion", "tower"])
    assert.equal(
      resolveMatchTarget(source, actors, "nearest", c).target.id,
      "h",
    );
  assert.equal(
    resolveMatchTarget(source, [unit("far", "bot", 10)], "nearest").target,
    null,
  );
});
test("large attack resets prior minion selection, minion/tower commands attack not only toggle, no chase/cooldown bypass", () => {
  const s = battle(),
    h = unit("h", "bot", 5),
    m = unit("m", "minion", 1),
    t = unit("t", "tower", 3);
  s.minions = [h, m, t];
  s.syncEnemies();
  assert.equal(s.attack(null, "minion"), "fired");
  assert.equal(s.lastAttack.targetId, "m");
  assert.equal(s.attack(), "cooldown");
  assert.equal(s.selectedTargetId, "h");
  const pos = { x: s.player.x, z: s.player.z };
  for (let n = 0; n < 100; n++) s.attack();
  assert.deepEqual({ x: s.player.x, z: s.player.z }, pos);
  assert.equal(s.pending.length, 1);
  s.player.cooldown = 0;
  s.lockUntil = 0;
  s.pending = [];
  assert.equal(s.attack(null, "tower"), "fired");
  assert.equal(s.lastAttack.targetId, "t");
});
test("rejected attack emits visible-feedback data without spending mana or moving", () => {
  const s = battle(),
    events = [];
  s.events.subscribe((e) => events.push(e));
  const mana = s.player.mana;
  assert.equal(s.attack(), "no-enemies");
  assert.ok(events.some((e) => e.type === "attack-feedback" && e.message));
  assert.equal(s.player.mana, mana);
  assert.equal(s.player.x, 0);
});
for (const [clock, expected] of [
  [0, 5],
  [30, 5],
  [59.99, 5],
  [60, 7],
  [630, 25],
  [1200, 45],
  [99999, 45],
])
  test(`death at ${clock}s uses ${expected}s shared respawn`, () =>
    assert.equal(respawnDelay(lane, clock), expected));
test("respawn rules are configurable, reject bad time/config and apply once to both hero teams", () => {
  assert.equal(
    respawnDelay(
      { ...lane, respawn: { base: 3, perCompletedMinute: 1, cap: 8 } },
      300,
    ),
    8,
  );
  assert.throws(() => respawnDelay(lane, NaN));
  const s = new MatchSimulation(
    registry,
    createMatchConfig("brawl", "normal", 1),
    { username: "Batch_Hero" },
  );
  s.update(3);
  s.time = 630;
  const b = s.bots[0];
  for (const a of [s.player, b])
    Object.assign(a, {
      x: 0,
      z: 0,
      protected: false,
      targetable: true,
      spawnProtectedUntil: 0,
    });
  s.deal(s.player, b, 99999, "true");
  assert.equal(b.respawnAt, 655);
  s.onDeath(s.player, b);
  assert.equal(b.respawnAt, 655);
  s.time = 654.99;
  s.tickHeroes(0);
  assert.equal(b.hp, 0);
  s.time = 655;
  s.tickHeroes(0);
  assert.equal(b.hp, b.maxHp);
  s.deal(b, s.player, 99999, "true");
  assert.equal(s.player.respawnAt, 680);
  s.reset();
  assert.equal(s.time, 0);
  assert.equal(respawnDelay(lane, s.time), 5);
});
function actor(hp = 25) {
  return {
    ...source,
    id: "bot",
    kind: "bot",
    hp,
    maxHp: 100,
    home: { x: -30, z: 0 },
    mana: 100,
    abilityReadyAt: 0,
    laneOffset: 0,
    attributes: { physicalAttack: 100 },
  };
}
const decide = (a, others, time = 0) =>
  botDecision(
    a,
    [a, ...others],
    lane.bot,
    difficulties.normal,
    time,
    () => 0.5,
  );
test("low but safe NPC keeps fighting minions rather than fleeing because HP is not full", () => {
  const a = actor(20);
  assert.equal(decide(a, [unit("minion", "minion", 2)]).type, "attack");
  assert.equal(a.aiState.mode, "engage");
});
test("low-health NPC can safely finish an almost defeated hero", () => {
  const a = actor(15);
  assert.equal(decide(a, [unit("finish", "bot", 3, 5)]).type, "attack");
});
test("outnumbered low-health NPC commits retreat across small health fluctuations", () => {
  const a = actor(20),
    enemies = [unit("a", "bot", 3), unit("b", "bot", 4)];
  assert.equal(decide(a, enemies).type, "retreat");
  for (const [time, hp] of [
    [0.3, 26],
    [0.7, 23],
    [1.5, 29],
    [2, 25],
  ]) {
    a.hp = hp;
    assert.equal(decide(a, enemies, time).type, "retreat");
  }
  assert.equal(a.aiState.commitUntil, 2.5);
});
test("recovering NPC waits for commitment/recovery then reengages, grace prevents oscillation", () => {
  const a = actor(15),
    enemy = unit("h", "bot", 3);
  decide(a, [enemy]);
  a.hp = 80;
  assert.equal(decide(a, [enemy], 1).type, "retreat");
  assert.equal(decide(a, [enemy], 3).type, "attack");
  a.hp = 20;
  assert.equal(decide(a, [enemy], 3.5).type, "attack");
  a.hp = 3;
  assert.equal(decide(a, [enemy], 3.8).type, "retreat");
});
test("recovery at own safe spawn is real and route flanks a blocking enemy", () => {
  const a = actor(5);
  a.x = 0;
  const blocker = unit("block", "bot", -2);
  const r = decide(a, [blocker]);
  assert.equal(r.x, -30);
  assert.notEqual(r.z, 0);
  a.x = -30;
  a.z = 0;
  a.hp = 20;
  decide(a, [], 3);
  assert.equal(a.aiState.mode, "recover");
  a.hp = 70;
  assert.notEqual(decide(a, [], 6).type, "retreat");
});
test("restore clears retreat commitment, stale marks, death timing and restores actual resources", () => {
  const a = {
    ...actor(0),
    maxMana: 500,
    mana: 0,
    aiState: { mode: "retreat" },
    respawnAt: 40,
    marks: { x: 1 },
  };
  restoreActor(a, { x: -33, z: 0 }, 40, 4);
  assert.equal(a.aiState, null);
  assert.equal(a.respawnAt, null);
  assert.deepEqual(a.marks, {});
  assert.equal(a.mana, 500);
});
test("loading state enforces 10s even if real resources ready early and does not cap slower loading", async () => {
  let time = 0,
    sleeps = [];
  const s = new LocalLoadingState({
    now: () => time,
    sleep: async (ms) => {
      sleeps.push(ms);
      time += ms;
    },
  });
  assert.equal(s.minimumMs, 10000);
  assert.equal(s.canEnter, false);
  s.task(7);
  await s.finish();
  assert.equal(time, 10000);
  assert.equal(s.canEnter, true);
  const slow = new LocalLoadingState({
    now: () => time,
    sleep: async () => assert.fail("already longer than 10s"),
  });
  time += 14000;
  assert.equal(slow.canEnter, false);
  slow.task(7);
  await slow.finish();
  assert.equal(slow.canEnter, true);
});
test("loading cannot finish before actual readiness and disposal invalidates ready state", async () => {
  const s = new LocalLoadingState();
  await assert.rejects(s.finish(), /not ready/);
  s.task(7);
  s.dispose();
  assert.equal(s.canEnter, false);
  await assert.rejects(s.finish(), /cancelled/);
});
test("selection resets hero on re-entry, never constructs simulation, preserves guarded flow", () => {
  const f = new MatchFlow();
  f.chooseMode("brawl");
  f.editComputer("enemy", 1);
  f.startSelection();
  assert.equal(f.heroId, null);
  f.selectHero("layla");
  f.startSelection();
  assert.equal(f.heroId, null);
  assert.equal(f.preparing, false);
});

// Tiny DOM adapter tests: exact UI state changes, with no mutation of a real game.
import {
  EnemyInfo,
  heroNameplate,
  syncHeroNameplate,
} from "../src/ui/enemy-info.js";
function fakeNode() {
  const children = new Map();
  return {
    hidden: false,
    style: {},
    dataset: {},
    classList: { add() {} },
    setAttribute() {},
    append() {},
    querySelector(k) {
      if (!children.has(k)) children.set(k, fakeNode());
      return children.get(k);
    },
  };
}
function withEnemyPanel(run) {
  const old = globalThis.document;
  globalThis.document = { createElement: () => fakeNode() };
  try {
    const panel = new EnemyInfo(fakeNode());
    run(panel);
  } finally {
    if (old === undefined) delete globalThis.document;
    else globalThis.document = old;
  }
}
test("selected enemy HUD updates exact live HP/mana/level and switches target names", () =>
  withEnemyPanel((panel) => {
    const enemy = {
      ...unit("one", "bot", 2, 76, 100),
      name: "Computer 1",
      mana: 42,
      maxMana: 500,
      progression: { level: 3 },
    };
    const s = { player: source, selectedTarget: enemy };
    panel.update(s);
    assert.equal(panel.root.hidden, false);
    assert.equal(
      panel.root.querySelector("#enemy-info-hp").textContent,
      "HP 76 / 100",
    );
    assert.equal(
      panel.root.querySelector("#enemy-info-mana").textContent,
      "MP 42 / 500",
    );
    assert.equal(
      panel.root.querySelector("#enemy-info-level").textContent,
      "Lv 3",
    );
    enemy.hp = 34;
    enemy.mana = 7;
    panel.update(s);
    assert.equal(
      panel.root.querySelector("#enemy-info-hp-bar").style.width,
      "34%",
    );
    assert.equal(
      panel.root.querySelector("#enemy-info-mana").textContent,
      "MP 7 / 500",
    );
    s.selectedTarget = { ...enemy, id: "two", name: "Computer 2" };
    panel.update(s);
    assert.equal(panel.root.dataset.targetId, "two");
    assert.equal(
      panel.root.querySelector("#enemy-info-name").textContent,
      "Computer 2",
    );
  }));
test("enemy panel hides for death/removal/allies/minions and no fake mana row for mana-less actor", () =>
  withEnemyPanel((panel) => {
    const a = unit("one", "bot", 2);
    delete a.mana;
    delete a.maxMana;
    panel.update({ player: source, selectedTarget: a });
    assert.equal(panel.root.querySelector("#enemy-info-mana-row").hidden, true);
    for (const target of [
      null,
      { ...a, hp: 0 },
      { ...a, team: "player" },
      { ...a, kind: "minion" },
      { ...a, protected: true },
    ]) {
      panel.update({ player: source, selectedTarget: target });
      assert.equal(panel.root.hidden, true);
      assert.equal(panel.root.dataset.targetId, "");
    }
  }));
test("hero overhead data tracks actual team/name/level/HP/mana without using fixed values", () => {
  const el = fakeNode(),
    a = {
      ...unit("one", "bot", 2),
      name: "Computer 1",
      mana: 37,
      maxMana: 90,
      progression: { level: 7 },
    };
  heroNameplate(el);
  syncHeroNameplate(el, a);
  assert.equal(el.querySelector(".actor-name").textContent, "Computer 1");
  assert.equal(el.dataset.team, "enemy");
  assert.equal(el.dataset.level, 7);
  a.hp = 23;
  a.mana = 0;
  syncHeroNameplate(el, a);
  assert.equal(el.querySelector(".actor-hp").style.width, "23%");
  assert.equal(el.querySelector(".actor-mana").style.width, "0%");
});
