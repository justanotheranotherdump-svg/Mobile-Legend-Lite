import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Box3 } from "three";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { HeroCombatSimulation } from "../src/simulation/hero-combat.js";
import { createHeroVisual } from "../src/rendering/heroes/hero-visual.js";
import {
  ProgressStore,
  progressKey,
  validateProgress,
} from "../src/menu/progress.js";
import { MatchFlow } from "../src/menu/match-flow.js";
import { HERO_OFFERS } from "../src/heroes/commerce.js";
import { stunActor, cleanse } from "../src/simulation/status.js";
import {
  calculateAttributes,
  runtimeAttributes,
} from "../src/simulation/stats/attributes.js";
import { MatchSimulation } from "../src/match/simulation.js";
import { createMatchConfig } from "../src/match/config.js";
import { learnBotSkills } from "../src/match/hero-bots.js";
const registry = await loadSourceHeroRegistry(),
  near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const target = (id = "target", x = 0, z = 4) => ({
  id,
  kind: "hero",
  team: "enemy",
  targetable: true,
  x,
  z,
  radius: 0.45,
  hp: 20000,
  maxHp: 20000,
  physicalDefense: 0,
  magicDefense: 0,
});
const make = (id = "franco", enemies = [target()]) => {
  const s = new HeroCombatSimulation(
    { halfSize: 60, obstacles: [] },
    {
      player: { heroId: id, x: 0, z: 0 },
      dummies: enemies,
      targeting: { defaultMode: "nearest" },
    },
    registry,
  );
  s.setPracticeLevel(15);
  learnBotSkills(s);
  return s;
};
const step = (s, t) => {
  for (let i = 0; i < Math.round(t * 600); i++) s.update(1 / 600);
};
const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const wallet = (coins = 40000, diamonds = 1000) => {
  const storage = memory(),
    p = new ProgressStore(storage);
  p.loadFor({ username: "PurchaseHarness" });
  storage.setItem(p.key, JSON.stringify({ ...p.current, coins, diamonds }));
  const s = new ProgressStore(storage);
  s.loadFor({ username: "PurchaseHarness" });
  return { s, storage };
};
test("new roster and null/clear ownership gates preserve default locked Franco without currency grants", () => {
  assert.deepEqual(registry.ids(), ["franco", "layla", "training"]);
  const p = new ProgressStore(memory());
  p.loadFor({ username: "FreshAccount" });
  assert.deepEqual(p.snapshot(), {
    version: 1,
    starterGrantApplied: true,
    coins: 30000,
    diamonds: 0,
    ownedHeroes: ["layla"],
  });
  const f = new MatchFlow();
  f.startSelection();
  assert.equal(f.heroId, null);
  assert.equal(f.config.heroId, null);
  assert.throws(() => f.confirm(), /owned/);
  assert.throws(() => f.selectHero("franco"), /Unowned/);
  assert.equal(f.heroId, null);
  assert.deepEqual(f.selectableHeroes(), ["layla"]);
  assert.throws(() => f.confirm(), /owned/);
  f.selectHero(null);
  assert.equal(f.heroId, null);
  f.ownedHeroes = ["layla", "franco"];
  f.selectHero("franco");
  assert.equal(f.confirm({ username: "Test" }).heroId, "franco");
  assert.equal(f.confirm(), null);
});
for (const currency of ["coins", "diamonds"])
  test(`explicit ${currency} confirmation charges only that currency, once, persisted`, async () => {
    const { s, storage } = wallet(),
      q = s.quotePurchase("franco", currency);
    assert.equal(q.amount, HERO_OFFERS.franco.prices[currency]);
    assert.deepEqual([s.current.coins, s.current.diamonds], [40000, 1000]);
    const results = await Promise.all([
      s.confirmPurchase(q),
      s.confirmPurchase(q),
    ]);
    assert.equal(results.filter((x) => x === "purchased").length, 1);
    const expected = currency === "coins" ? [8000, 1000] : [40000, 251];
    assert.deepEqual([s.current.coins, s.current.diamonds], expected);
    assert.deepEqual(s.current.ownedHeroes, ["layla", "franco"]);
    const reloaded = new ProgressStore(storage);
    reloaded.loadFor({ username: "PurchaseHarness" });
    assert.deepEqual(reloaded.snapshot(), s.snapshot());
    assert.equal(
      reloaded.quotePurchase("franco", currency).error,
      "already-owned",
    );
  });
test("two different currency confirmations / independent stores cannot double buy or duplicate ownership", async () => {
  const { s, storage } = wallet(),
    other = new ProgressStore(storage);
  other.loadFor({ username: "PurchaseHarness" });
  const results = await Promise.all([
    s.confirmPurchase(s.quotePurchase("franco", "coins")),
    other.confirmPurchase(other.quotePurchase("franco", "diamonds")),
  ]);
  assert.deepEqual(results, ["purchased", "already-owned"]);
  assert.deepEqual(other.snapshot(), s.snapshot());
  assert.deepEqual(other.current.ownedHeroes, ["layla", "franco"]);
});
test("insufficient, cancelled, forged, wrong-profile, depleted and blocked-storage purchase paths never overdraft", async () => {
  const { s, storage } = wallet(30000, 0);
  assert.equal(s.quotePurchase("franco", "coins").error, "insufficient-funds");
  assert.equal(
    s.quotePurchase("franco", "diamonds").error,
    "insufficient-funds",
  );
  assert.equal(s.quotePurchase("franco", "gold").error, "invalid-offer");
  assert.equal(
    await s.confirmPurchase({ id: "forged", amount: 1 }),
    "invalid-confirmation",
  );
  const rich = wallet();
  let q = rich.s.quotePurchase("franco", "coins");
  rich.s.cancelPurchase(q);
  assert.equal(await rich.s.confirmPurchase(q), "invalid-confirmation");
  q = rich.s.quotePurchase("franco", "coins");
  rich.storage.setItem(
    rich.s.key,
    JSON.stringify({ ...rich.s.current, coins: 0 }),
  );
  assert.equal(await rich.s.confirmPurchase(q), "insufficient-funds");
  const blocked = wallet();
  q = blocked.s.quotePurchase("franco", "coins");
  blocked.storage.setItem = () => {
    throw Error("blocked");
  };
  assert.equal(await blocked.s.confirmPurchase(q), "storage-unavailable");
  assert.deepEqual(
    [blocked.s.current.coins, blocked.s.current.diamonds],
    [40000, 1000],
  );
  assert.deepEqual(blocked.s.current.ownedHeroes, ["layla"]);
});
test("wallet migration retains legitimate ownership but filters unknown/duplicate heroes without re-grants", () => {
  const migrated = validateProgress({
    version: 1,
    starterGrantApplied: true,
    coins: 7,
    diamonds: 3,
    ownedHeroes: ["franco", "franco", "unknown"],
  });
  assert.deepEqual(migrated.ownedHeroes, ["layla", "franco"]);
  assert.equal(migrated.coins, 7);
  assert.equal(validateProgress({ ...migrated, coins: -1 }), null);
  const storage = memory();
  storage.setItem(progressKey("Broken"), "broken");
  const s = new ProgressStore(storage);
  s.loadFor({ username: "Broken" });
  assert.equal(s.current.coins, 0);
  assert.deepEqual(s.current.ownedHeroes, ["layla"]);
});
test("every approved runtime model/PNG is local, separately named, hashed and unmodified from approved GLBs", () => {
  const m = JSON.parse(readFileSync("src/heroes/integration-manifest.json"));
  for (const [p, v] of Object.entries(m.assets)) {
    const b = readFileSync(p);
    assert.equal(b.length, v.bytes);
    assert.equal(createHash("sha256").update(b).digest("hex"), v.sha256);
    if (p.endsWith(".png")) {
      assert.deepEqual(
        [...b.subarray(0, 8)],
        [137, 80, 78, 71, 13, 10, 26, 10],
      );
      assert.equal(b.readUInt32BE(16), v.width);
      assert.equal(b.readUInt32BE(20), v.height);
    }
  }
  for (const id of ["layla", "franco"])
    assert.deepEqual(
      registry.modelBytes(id),
      new Uint8Array(readFileSync(m.heroes[id].sourceApproved)),
    );
  const icons = Object.entries(m.assets).filter(([p]) =>
    /(passive|skill-1|skill-2|ultimate)\.png$/.test(p),
  );
  assert.equal(icons.length, 8);
  assert.equal(new Set(icons.map(([, v]) => v.sha256)).size, 8);
  for (const [, v] of icons) assert.deepEqual([v.width, v.height], [256, 256]);
});
for (const id of ["layla", "franco"])
  test(`${id}: actual GLTF importer finds approved bones, clips, scale and release attachment`, async () => {
    const v = await createHeroVisual(registry.get(id), registry.modelBytes(id)),
      d = v.diagnostics();
    assert.equal(d.status, "glb");
    assert.equal(d.skeletal, true);
    assert.equal(d.clips.length, id === "layla" ? 10 : 11);
    for (const name of [
      "Idle",
      "Walk",
      "Run",
      "BasicAttack",
      "Death",
      "HitReact",
      ...(id === "layla"
        ? ["Aim", "MaleficBomb", "VoidProjectile", "DestructionRush"]
        : ["IronHook", "FuryShock", "BloodyHunt", "HookMechanism", "HookMiss"]),
    ])
      assert.ok(v.animationClips.has(name), name);
    const b = new Box3().setFromObject(v.root);
    assert.ok(b.max.y - b.min.y > 1.5 && b.max.y - b.min.y < 3.5);
    v.sample("skill-1", id === "layla" ? 0.25 : 0.15);
    const anchor = v.socket(id === "layla" ? "muzzle" : "HookSocket");
    assert.ok(anchor && anchor.y > 0.5 && anchor.z > 0.4);
    if (id === "layla") {
      near(anchor.z, 1.183130659);
      near(anchor.y, 1.221784747);
    }
  });
test("Franco passive waits five damage-free seconds, regenerates and stacks to cap; next skill consumes exactly once", () => {
  const s = make();
  s.player.hp = 1000;
  const speed = s.player.speed;
  s.update(4.9);
  assert.equal(s.francoReady, false);
  assert.equal(s.francoStacks, 0);
  s.update(0.1);
  assert.equal(s.francoReady, true);
  near(s.player.speed, speed * 1.1);
  const hp = s.player.hp;
  s.update(1);
  assert.equal(s.francoStacks, 1);
  assert.ok(s.player.hp - hp >= s.player.maxHp * 0.01);
  step(s, 10);
  assert.equal(s.francoStacks, 10);
  s.player.mana = 5000;
  const before = s.player.mana;
  assert.equal(s.cast("skill-2"), "cast");
  assert.equal(s.francoStacks, 0);
  near(
    s.pending[0].a.damage,
    (s.ability("skill-2").damage + s.player.maxHp * 0.04) * 2.5,
  );
  near(s.player.mana, before - s.ability("skill-2").manaCost);
  assert.notEqual(s.cast("skill-2"), "cast");
  s.player.lastDamageAt = s.time;
  s.update(0.01);
  assert.equal(s.francoReady, false);
  near(s.player.speed, speed);
});
test("directional hook sweeps the first enemy (not the selected enemy behind it), applies physical damage, pull and stun once", () => {
  const s = make("franco", [target("front", 0, 3), target("behind", 0, 5)]),
    before = s.player.mana;
  s.francoStacks = 0;
  assert.equal(s.cast("skill-1", { x: 0, z: 5 }, "behind"), "cast");
  assert.equal(s.pending[0].targetId, null);
  step(s, 0.16);
  assert.equal(s.projectiles.length, 1);
  step(s, 0.25);
  const front = s.enemies[0];
  assert.ok(front.hp < 20000);
  assert.equal(s.enemies[1].hp, 20000);
  assert.ok(front.stunned);
  step(s, 0.5);
  assert.ok(front.z < 2);
  assert.ok(front.z >= s.player.radius + front.radius);
  assert.equal(s.hookPull, null);
  assert.equal(s.hits, 0);
  assert.ok(s.player.mana > before - s.ability("skill-1").manaCost);
  step(s, 1);
  assert.equal(front.stunned, false);
});
test("hook miss reaches approved max at .40 seconds and returns without contact; death clears all hook ownership", () => {
  const s = make("franco", []);
  s.cast("skill-1", { x: 0, z: 6.4 });
  s.update(0.15);
  near(s.projectiles[0].z, 0.6433210764);
  s.update(0.249);
  assert.equal(s.projectiles.length, 1);
  s.update(0.002);
  assert.equal(s.projectiles.length, 0);
  assert.ok(s.hookReturn);
  step(s, 0.25);
  assert.equal(s.hookReturn, null);
  const h = make();
  h.cast("skill-1", { x: 0, z: 4 });
  step(h, 0.32);
  h.player.hp = 0;
  h.update(0.01);
  assert.equal(h.projectiles.length, 0);
  assert.equal(h.hookPull, null);
  assert.equal(h.channel, null);
});
test("Fury Shock damages only its approved radius, scales with maximum HP and applies 70% / 1.5s slow", () => {
  const s = make("franco", [target("near", 0, 2), target("outside", 0, 4.2)]),
    a = s.ability("skill-2");
  s.cast("skill-2");
  step(s, 0.29);
  assert.equal(s.enemies[0].hp, 20000);
  step(s, 0.02);
  near(20000 - s.enemies[0].hp, a.damage + s.player.maxHp * 0.04);
  assert.equal(s.enemies[1].hp, 20000);
  assert.equal(s.enemies[0].slow.ratio, 0.7);
  near(s.enemies[0].slow.until - s.time, 1.5, 0.02);
});
test("Bloody Hunt suppresses exactly 1.80s, executes six approved strike timestamps, charges once and prevents normal acting", () => {
  const s = make("franco", [target("victim", 0, 1.4)]),
    strikes = [];
  s.events.subscribe((e) => {
    if (e.type === "hunt-strike") strikes.push(e);
  });
  const mana = s.player.mana,
    a = s.ability("skill-ultimate");
  assert.equal(s.cast("skill-ultimate", { x: 0, z: 1.4 }, "victim"), "cast");
  s.update(0.001);
  assert.equal(s.player.channeling, true);
  assert.ok(s.enemies[0].suppressionUntil > 1.79);
  assert.equal(s.cast("skill-2"), "cannot-act");
  assert.notEqual(s.attack("victim"), "fired");
  const p = { x: s.player.x, z: s.player.z };
  step(s, 1.7);
  assert.equal(strikes.length, 6);
  assert.equal(s.player.channeling, true);
  near(
    s.enemies[0].hp,
    20000 - 6 * (a.damage + 0.7 * s.player.attributes.physicalAttack),
  );
  for (const [e, t] of strikes.map((e, i) => [
    e,
    [0.15, 0.45, 0.75, 1.05, 1.35, 1.65][i],
  ]))
    near(e.at, t);
  assert.deepEqual({ x: s.player.x, z: s.player.z }, p);
  step(s, 0.11);
  assert.equal(s.channel, null);
  assert.equal(s.player.channeling, false);
  assert.equal(s.enemies[0].suppressionUntil, 0);
  assert.equal(s.enemies[0].stunned, false);
  assert.ok(s.player.mana >= mana - a.manaCost);
  assert.equal(strikes.length, 6);
});
for (const reason of [
  "caster-death",
  "caster-stun",
  "target-death",
  "target-invalid",
  "practice-reset",
  "full-reset",
])
  test(`Hunt ${reason} cleanly releases suppression and cannot continue hitting`, () => {
    const s = make("franco", [target("t", 0, 1.4)]);
    s.cast("skill-ultimate", { x: 0, z: 1.4 }, "t");
    step(s, 0.2);
    const t = s.enemies[0];
    assert.ok(t.suppressionUntil > s.time);
    if (reason === "caster-death") s.player.hp = 0;
    if (reason === "caster-stun") stunActor(s, s.player, 0.5);
    if (reason === "target-death") t.hp = 0;
    if (reason === "target-invalid") t.targetable = false;
    if (reason === "practice-reset") s.setPracticeLevel(15);
    if (reason === "full-reset") s.reset();
    s.update(0.01);
    assert.equal(s.channel, null);
    assert.equal(t.suppressionUntil, 0);
    assert.equal(t.suppressionBy, undefined);
    assert.equal(s.player.channeling, false);
  });
test("Hunt cannot target structures/minions or out-of-range enemies; rejected casts charge nothing", () => {
  for (const enemy of [
    target("far", 0, 4),
    { ...target("minion", 0, 1), kind: "minion" },
    { ...target("tower", 0, 1), kind: "tower" },
  ]) {
    const s = make("franco", [enemy]),
      mana = s.player.mana;
    assert.equal(
      s.cast("skill-ultimate", { x: enemy.x, z: enemy.z }, enemy.id),
      "invalid-target",
    );
    assert.equal(s.player.mana, mana);
    assert.equal(s.pending.length, 0);
    assert.equal(s.cooldowns["bloody-hunt"], undefined);
  }
});
test("Layla R2 line is immediate, continuous-configured, hits near/mid/far once and retains distance-passive tower exclusion", () => {
  const s = make("layla", [
      target("near", 0, 3.4),
      target("mid", 0, 24),
      target("far", 0, 45.12),
      target("side", 3, 20),
      { ...target("tower", 0, 30), kind: "tower" },
    ]),
    events = [];
  s.events.subscribe((e) => events.push(e));
  s.cast("skill-ultimate", { x: 0, z: 48 });
  step(s, 0.64);
  assert.ok(s.enemies.every((t) => t.hp === 20000));
  step(s, 0.02);
  const beam = events.filter((e) => e.type === "beam");
  assert.equal(beam.length, 1);
  assert.equal(beam[0].end.z, 48);
  assert.equal(s.projectiles.length, 0);
  const damage =
    s.ability("skill-ultimate").damage +
    1.5 * s.player.attributes.physicalAttack;
  assert.ok(s.enemies.slice(0, 3).every((t) => t.hp < 20000));
  assert.equal(s.enemies[3].hp, 20000);
  near(20000 - s.enemies[4].hp, damage);
  const hp = s.enemies[2].hp;
  step(s, 1);
  assert.equal(s.enemies[2].hp, hp);
});
for (const id of ["layla", "franco"])
  for (const level of [1, 15])
    for (const difficulty of ["easy", "normal", "hard"])
      test(`${id} level ${level}/${difficulty}: player and actual bot engine have identical stats/resources/ranges`, () => {
        const c = {
          ...createMatchConfig("ai-training", difficulty, 3),
          heroId: id,
        };
        const m = new MatchSimulation(registry, c, {
          username: "ParityHarness",
        });
        const bot = m.bots.find((a) => a.heroId === id),
          e = m.botEngines.get(bot.id);
        m.setPracticeLevel(level);
        e.setPracticeLevel(level);
        assert.deepEqual(m.player.attributes, bot.attributes);
        for (const field of [
          "maxHp",
          "maxMana",
          "hpRegen",
          "manaRegen",
          "speed",
          "range",
          "attackCooldown",
        ])
          near(m.player[field], bot[field]);
        assert.deepEqual(m.hero.abilities, e.hero.abilities);
        assert.equal(e.constructor, HeroCombatSimulation);
      });
test("Locked-near Layla ultimate still reaches full range and damages the mid/far targets", () => {
  const s = make("layla", [
    target("near", 0, 3.4),
    target("mid", 0, 24),
    target("far", 0, 45.12),
  ]);
  s.cast("skill-ultimate", { x: 0, z: 3.4 }, "near");
  step(s, 0.66);
  assert.ok(s.enemies.every((t) => t.hp < 20000));
});
test("Suppression survives cleanse immediately and prevents acting, not merely on the next status tick", () => {
  const s = make("franco", [target("t", 0, 1.4)]);
  s.cast("skill-ultimate", { x: 0, z: 1.4 }, "t");
  step(s, 0.2);
  const t = s.enemies[0],
    until = t.suppressionUntil;
  cleanse(t);
  assert.equal(t.suppressionUntil, until);
  assert.equal(t.stunned, true);
});
for (const id of ["layla", "franco"])
  test(`${id} stun during windup cancels the pending action, even if stun expires before release`, () => {
    const s = make(id);
    s.cast("skill-2", { x: 0, z: 4 });
    step(s, 0.05);
    stunActor(s, s.player, 0.1);
    step(s, 0.12);
    assert.equal(s.pending.length, 0);
    const hp = s.enemies[0].hp;
    step(s, 0.5);
    assert.equal(s.enemies[0].hp, hp);
    assert.equal(s.projectiles.length, 0);
  });
for (const slot of ["skill-1", "skill-2", "skill-ultimate"])
  for (const level of [1, 15])
    test(`Franco ${slot} level ${level}: real human/NPC damage, mana, cooldown and CC formulas match`, () => {
      const run = (bot) => {
        const m = new MatchSimulation(
          registry,
          {
            ...createMatchConfig("ai-training", "normal", 3),
            heroId: "franco",
          },
          { username: "KitParity" },
        );
        m.phase = "running";
        m.time = 0;
        const source = bot
            ? m.bots.find((a) => a.team === "player" && a.heroId === "franco")
            : m.player,
          e = bot ? m.botEngines.get(source.id) : m,
          t = m.bots.find((a) => a.team === "enemy" && a.heroId === "layla");
        m.bots = [...(bot ? [source] : []), t];
        m.minions = [];
        m.structures = [];
        e.setPracticeLevel(level);
        const learn = e.upgradeSkill(slot);
        if (slot === "skill-ultimate" && level === 1) {
          assert.match(learn, /requires-level/);
          assert.equal(e.cast(slot, { x: 0, z: 1.4 }, t.id), "unlearned");
          return null;
        }
        assert.equal(learn, "upgraded");
        Object.assign(source, {
          x: 0,
          z: 0,
          protected: false,
          targetable: true,
          spawnProtectedUntil: 0,
        });
        Object.assign(t, {
          x: 0,
          z: slot === "skill-1" ? 4 : 1.4,
          hp: 20000,
          maxHp: 20000,
          protected: false,
          targetable: true,
          spawnProtectedUntil: 0,
        });
        m.syncEnemies();
        e.enemies = [t];
        assert.equal(e.cast(slot, { x: t.x, z: t.z }, t.id), "cast");
        for (let i = 0; i < 1200; i++) {
          if (bot) {
            m.time += 1 / 600;
            e.time = m.time - 1 / 600;
          }
          HeroCombatSimulation.prototype.update.call(e, 1 / 600);
        }
        return {
          hp: t.hp,
          mana: source.mana,
          cooldown: e.cooldowns[e.ability(slot).id],
          stun: t.stunned,
          suppression: t.suppressionUntil || 0,
          slow: t.slow?.ratio || 0,
        };
      };
      assert.deepEqual(run(false), run(true));
    });
test("Franco completed-match history is persisted, deduplicated and kept beside existing Layla records", async () => {
  const { HistoryStore } = await import("../src/player/history.js");
  const storage = memory(),
    h = new HistoryStore(storage, "HistoryHarness"),
    result = {
      outcome: "Victory",
      duration: 120,
      eliminations: 2,
      deaths: 1,
      assists: 4,
      level: 8,
    };
  assert.equal(
    h.record("old", { heroId: "layla", mode: "brawl" }, result, 1000),
    true,
  );
  assert.equal(
    h.record("new", { heroId: "franco", mode: "brawl" }, result, 2000),
    true,
  );
  assert.equal(
    h.record("new", { heroId: "franco", mode: "brawl" }, result, 2001),
    false,
  );
  assert.equal(
    h.record("bad", { heroId: "unknown", mode: "brawl" }, result, 2002),
    false,
  );
  const reload = new HistoryStore(storage, "HistoryHarness");
  assert.equal(reload.value.matches.length, 2);
  assert.equal(reload.stats().find((x) => x.hero === "franco").wins, 1);
});
test("Franco goal persists independently of a moving allied Layla and respects uncovered tower orders", async () => {
  const { francoPolicy } = await import("../src/match/franco-policy.js"),
    a = {
      id: "f",
      heroId: "franco",
      kind: "bot",
      team: "player",
      x: -10,
      z: 0,
      hp: 2600,
      maxHp: 2600,
      range: 1.4,
      radius: 0.6,
      laneOffset: -0.55,
    },
    ally = {
      id: "l",
      kind: "player",
      heroId: "layla",
      team: "player",
      x: -15,
      z: 2,
      hp: 2000,
      maxHp: 2250,
    },
    difficulty = { aimSpread: 0 };
  const first = francoPolicy(a, [a, ally], null, 0, difficulty, () => 0.5);
  ally.x = 0;
  ally.z = -5;
  const second = francoPolicy(a, [a, ally], null, 0.5, difficulty, () => 0.5);
  assert.deepEqual(second, first);
  const order = { type: "move", x: -4, z: 1 };
  assert.deepEqual(
    francoPolicy(
      a,
      [a, ally],
      { covered: false, order },
      0.6,
      difficulty,
      () => 0.5,
    ),
    { ...order, reason: "respect-objective-cover" },
  );
});

test("real minion/tower launches never impersonate the human Layla or enter her approved projectile records", () => {
  const m = new MatchSimulation(
      registry,
      createMatchConfig("brawl", "normal", 1),
      { username: "NpcFxHarness" },
    ),
    source = m.actors.find((a) => a.kind === "tower"),
    target = m.actors.find((a) => a.team !== source.team);
  const events = [];
  m.events.subscribe((e) => events.push(e));
  m.launchNpc(source, target, 10, false, 0);
  const e = events.find((e) => e.type === "launch");
  assert.equal(e.sourceId, source.id);
  assert.equal(e.heroId, null);
  assert.notEqual(e.sourceId, m.player.id);
  assert.ok(e.source && Number.isFinite(e.source.x));
});

test("requested hero hook hit stages use .5 contact hold, .18 collision-aware haul, .08 hit return without a contact teleport", async () => {
  const { hookImpact } = await import("../src/simulation/franco-kit.js"),
    s = make("franco"),
    t = s.enemies[0];
  const original = { x: t.x, z: t.z };
  hookImpact(s, { id: 999, x: t.x, z: t.z - 0.67, a: s.ability("skill-1") }, t);
  near(s.hookPull.start, 0.5);
  near(s.hookPull.end, 0.68);
  assert.equal(s.hookReturn, null);
  s.update(0.499);
  near(t.x, original.x);
  near(t.z, original.z);
  s.update(0.002);
  assert.ok(t.z < original.z);
  s.update(0.18);
  assert.equal(s.hookPull, null);
  near(s.hookReturn.start, 0.68);
  near(s.hookReturn.end, 0.76);
  assert.ok(t.z >= s.player.radius + t.radius + 0.05 - 1e-9);
  s.update(0.08);
  assert.equal(s.hookReturn, null);
  assert.equal(t.displacementBy, undefined);
});
