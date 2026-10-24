import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TrainingSimulation } from "../src/simulation/game.js";
import { heroRegistry as testHeroRegistry } from "./helpers/heroes.js";
import { joystickAxes, movementAxes } from "../src/input/joystick.js";
import { mapPoint } from "../src/ui/minimap.js";
import {
  describeCombatEvent,
  NotificationQueue,
} from "../src/ui/combat-notifications.js";
import { CombatEvents } from "../src/simulation/combat-events.js";
import { attackFeedback } from "../src/ui/cooldowns.js";
import { TARGET_CATEGORIES } from "../src/ui/targeting-controls.js";
import { icon } from "../src/ui/components/icons.js";
const arena = JSON.parse(readFileSync("src/data/arena.json"));
const config = JSON.parse(readFileSync("src/data/training.json"));
const sim = () => new TrainingSimulation(arena, config, testHeroRegistry);
const actor = {
  id: "player",
  name: "Test hero",
  kind: "player",
  team: "player",
};
const enemy = {
  id: "enemy",
  name: "Enemy",
  kind: "hero",
  team: "enemy",
  hp: 0,
};
const death = (a = actor, v = enemy) => ({
  type: "death",
  actor: a,
  victim: v,
});

test("joystick maps screen-up to positive vertical and right to positive horizontal", () => {
  assert.deepEqual(joystickAxes(50, 0, 50), [1, -0]);
  assert.deepEqual(joystickAxes(0, -50, 50), [0, 1]);
});
test("joystick diagonal and out-of-radius input is clamped, never speed-boosted", () => {
  const axes = joystickAxes(500, -500, 50);
  assert.ok(Math.abs(Math.hypot(...axes) - 1) < 1e-10);
  assert.ok(Math.abs(axes[0] - Math.SQRT1_2) < 1e-10);
});
test("joystick deadzone, analog partial input and invalid geometry are safe", () => {
  assert.deepEqual(joystickAxes(1, 1, 50), [0, 0]);
  assert.deepEqual(joystickAxes(25, 0, 50), [0.5, -0]);
  for (const [x, y, r] of [
    [Infinity, 0, 50],
    [0, NaN, 50],
    [0, 0, 0],
  ])
    assert.deepEqual(joystickAxes(x, y, r), [0, 0]);
});
test("keyboard takes priority rather than adding joystick speed; release restores virtual movement", () => {
  assert.deepEqual(movementAxes([1, 1], [-1, 0]), [1, 1]);
  assert.deepEqual(movementAxes([0, 0], [-0.5, 0.5]), [-0.5, 0.5]);
});
test("joystick uses exactly the same camera-relative simulation and collision path as WASD", () => {
  const a = sim(),
    b = sim();
  for (let n = 0; n < 120; n++) {
    a.update(1 / 60, 1, 0);
    b.update(1 / 60, ...joystickAxes(50, 0, 50));
  }
  assert.deepEqual(a.snapshot(), b.snapshot());
});
test("minimap rotates world axes to match camera-relative movement and diamond arena bounds", () => {
  assert.deepEqual(mapPoint(0, 0, 15), { x: 100, y: 100 });
  assert.deepEqual(mapPoint(-15, -15, 15), { x: 100, y: 12 });
  assert.deepEqual(mapPoint(15, 15, 15), { x: 100, y: 188 });
  const p = mapPoint(-1, -1, 15);
  assert.equal(p.x, 100);
  assert.ok(p.y < 100);
});
test("cooldown display clamps ring progress and never invents skill resources", () => {
  assert.deepEqual(attackFeedback({ cooldown: 0, attackCooldown: 0.65 }), {
    fraction: 0,
    text: "Ready",
    countdown: "",
  });
  const feedback = attackFeedback({ cooldown: 0.325, attackCooldown: 0.65 });
  assert.equal(feedback.fraction, 0.5);
  assert.match(feedback.text, /cooldown/);
  assert.equal(
    attackFeedback({ cooldown: 0.002, attackCooldown: 0.65 }).countdown,
    "",
  );
});
test("only existing dummy target category is available; minions/towers remain reserved", () => {
  assert.deepEqual(
    TARGET_CATEGORIES.filter((c) => c.available).map((c) => c.id),
    ["dummy"],
  );
  assert.ok(Object.isFrozen(TARGET_CATEGORIES));
});
test("all local icon output is inline SVG and unknown/prototype names are rejected", () => {
  for (const name of [
    "sword",
    "map",
    "settings",
    "shop",
    "recall",
    "minion",
    "tower",
  ]) {
    assert.match(icon(name), /^<svg/);
    assert.doesNotMatch(icon(name), /(?:href|src|https?:)/);
  }
  assert.throws(() => icon("constructor"), /Unknown/);
});
test("real damage emits one death only at a living-to-zero transition with immutable metadata", () => {
  const s = sim(),
    events = [];
  s.events.subscribe((event) => events.push(event));
  s.player.x = 1;
  s.player.z = 1;
  for (let n = 0; n < 4; n++) {
    s.attack("dummy-b");
    s.update(0.65);
  }
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "death");
  assert.equal(events[0].victim.hp, 0);
  assert.equal(events[0].victim.kind, "training-dummy");
  assert.ok(Object.isFrozen(events[0].victim));
  assert.throws(() => {
    events[0].victim.hp = 100;
  }, TypeError);
  s.attack("dummy-b");
  assert.equal(events.length, 1);
  s.reset();
  assert.equal(events.at(-1).type, "reset");
});
test("rejected, nonlethal attacks and selection changes never fabricate notifications", () => {
  const s = sim(),
    events = [];
  s.events.subscribe((event) => events.push(event));
  s.attack();
  s.attack("dummy-a");
  s.setTargetMode("manual");
  s.clearManualTarget();
  assert.deepEqual(events, []);
  s.player.x = 0;
  s.player.z = 3;
  s.attack("dummy-a");
  s.attack();
  assert.deepEqual(events, []);
});
test("combat subscription unsubscribe and presentation errors cannot change gameplay", () => {
  const bus = new CombatEvents();
  let count = 0;
  const off = bus.subscribe(() => count++);
  bus.emit({ type: "reset" });
  off();
  bus.emit({ type: "reset" });
  assert.equal(count, 1);
  const old = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    bus.subscribe(() => {
      throw Error("presentation");
    });
    assert.doesNotThrow(() => bus.emit({ type: "reset" }));
    assert.equal(errors.length, 1);
  } finally {
    console.error = old;
  }
});
test("training deaths are truthfully named and not hero/team kills", () => {
  const message = describeCombatEvent(
    death(actor, { ...enemy, kind: "training-dummy", name: "Dummy A" }),
  );
  assert.equal(message.title, "Target eliminated");
  assert.equal(message.prominent, false);
  assert.match(message.detail, /training target/);
});
test("player kill and death classifications prepare prominent notifications", () => {
  assert.equal(describeCombatEvent(death()).title, "Enemy slain");
  assert.equal(describeCombatEvent(death()).prominent, true);
  const loss = describeCombatEvent(
    death({ ...enemy, hp: 100 }, { ...actor, hp: 0 }),
  );
  assert.equal(loss.title, "You have fallen");
  assert.equal(loss.prominent, true);
});
test("allied kill and allied death classifications are smaller, with no runtime fabricated events", () => {
  const ally = { id: "ally", name: "Ally", team: "ally", kind: "hero", hp: 0 };
  assert.equal(describeCombatEvent(death(ally)).prominent, false);
  assert.equal(
    describeCombatEvent(death(ally)).title,
    "Ally eliminated an enemy",
  );
  assert.equal(
    describeCombatEvent(death(enemy, ally)).title,
    "Ally has fallen",
  );
});
test("non-death, living victim and unrelated event classifications are ignored", () => {
  assert.equal(describeCombatEvent({ type: "reset" }), null);
  assert.equal(describeCombatEvent(death(actor, { ...enemy, hp: 20 })), null);
  assert.equal(describeCombatEvent(death(enemy, enemy)), null);
});
test("notification queue dismisses, bounds backlog, prioritizes prominent events and resets", () => {
  const queue = new NotificationQueue(),
    minor = death(actor, { ...enemy, kind: "training-dummy" });
  queue.push(minor);
  assert.equal(queue.update(0).title, "Target eliminated");
  assert.equal(queue.update(2.5), null);
  for (let i = 0; i < 10; i++) queue.push(minor);
  assert.equal(queue.items.length, 6);
  queue.update(3);
  queue.push(death());
  assert.equal(queue.update(3.1).title, "Enemy slain");
  queue.reset();
  assert.equal(queue.update(4), null);
  assert.deepEqual(queue.items, []);
});

test("default skill HUD has exactly first/second/ultimate slots on top-row Digit1/2/3", async () => {
  const { SKILL_SLOTS } = await import("../src/ui/skill-controls.js");
  assert.deepEqual(
    SKILL_SLOTS.map((s) => [s.id, s.code]),
    [
      ["skill-1", "Digit1"],
      ["skill-2", "Digit2"],
      ["skill-ultimate", "Digit3"],
    ],
  );
  assert.ok(Object.isFrozen(SKILL_SLOTS));
  assert.ok(SKILL_SLOTS.every(Object.isFrozen));
});
test("skill shortcuts explicitly exclude numpad, F keys and old Q/E/R", async () => {
  const { skillSlotForCode } = await import("../src/ui/skill-controls.js");
  assert.equal(skillSlotForCode("Digit3").label, "Ultimate");
  for (const code of [
    "Numpad1",
    "Numpad2",
    "Numpad3",
    "KeyQ",
    "KeyE",
    "KeyR",
    "F1",
    "Digit4",
  ])
    assert.equal(skillSlotForCode(code), null);
});
test("reserved skill requests never cast; a future enabled binding shares native button activation", async () => {
  const { requestSkillButton } = await import("../src/ui/skill-controls.js");
  let count = 0;
  const button = {
    disabled: true,
    click() {
      count++;
    },
  };
  assert.equal(requestSkillButton(button), false);
  assert.equal(count, 0);
  assert.equal(requestSkillButton(null), false);
  button.disabled = false;
  assert.equal(requestSkillButton(button), true);
  assert.equal(count, 1);
});
