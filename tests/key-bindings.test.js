import test from "node:test";
import assert from "node:assert/strict";
import {
  KeyBindings,
  BUTTON_ACTIONS,
  DEFAULT_BINDINGS,
  keyLabel,
} from "../src/input/key-bindings.js";
test("default key bindings preserve attack/three top-row skills and original utility labels", () => {
  const b = new KeyBindings();
  assert.equal(b.codeFor("attack"), "Space");
  assert.deepEqual(
    ["skill-1", "skill-2", "skill-ultimate"].map((id) => b.codeFor(id)),
    ["Digit1", "Digit2", "Digit3"],
  );
  assert.equal(b.codeFor("recall"), "KeyB");
  assert.equal(b.codeFor("battle-spell"), "KeyF");
  assert.equal(b.actionFor("Numpad1"), null);
  assert.equal(b.showHints, true);
  assert.ok(Object.isFrozen(DEFAULT_BINDINGS));
  assert.ok(BUTTON_ACTIONS.every(Object.isFrozen));
});
test("assigning active/reserved button keys updates lookup without enabling gameplay", () => {
  const b = new KeyBindings();
  assert.ok(b.assign("attack", "KeyJ").ok);
  assert.equal(b.actionFor("Space"), null);
  assert.equal(b.actionFor("KeyJ").id, "attack");
  assert.ok(b.assign("skill-1", "Numpad1").ok);
  assert.equal(b.actionFor("Numpad1").reserved, true);
  assert.equal(b.actionFor("Digit1"), null);
  assert.equal(keyLabel("Numpad1"), "Num 1");
});
test("duplicate keys reject atomically with conflict explanation", () => {
  const b = new KeyBindings();
  assert.equal(b.assign("attack", "Digit1").ok, false);
  assert.match(b.assign("attack", "Digit1").error, /Skill I/);
  assert.equal(b.codeFor("attack"), "Space");
  assert.equal(b.assign("attack", "Space").ok, true);
});
test("movement/navigation/browser keys are protected from rebinding", () => {
  const b = new KeyBindings();
  for (const code of [
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "Escape",
    "Tab",
    "Enter",
    "F1",
    "ControlLeft",
    "ShiftLeft",
    "AltRight",
    "MetaLeft",
  ])
    assert.equal(b.assign("attack", code).ok, false, code);
  assert.equal(b.codeFor("attack"), "Space");
});
test("unbinding releases a key and multiple unbound buttons do not conflict", () => {
  const b = new KeyBindings();
  assert.ok(b.assign("skill-1", "").ok);
  assert.ok(b.assign("attack", "Digit1").ok);
  assert.ok(b.assign("recall", "").ok);
  assert.ok(b.assign("battle-spell", "").ok);
  assert.equal(b.actionFor(""), null);
});
test("restore default keys does not undo the independent visibility preference", () => {
  const b = new KeyBindings();
  b.assign("attack", "KeyJ");
  b.setHints(false);
  b.restoreDefaults();
  assert.equal(b.codeFor("attack"), "Space");
  assert.equal(b.showHints, false);
});
test("key configurations are session-local and independent", () => {
  const a = new KeyBindings(),
    b = new KeyBindings();
  a.assign("attack", "KeyJ");
  a.setHints(false);
  assert.equal(b.codeFor("attack"), "Space");
  assert.equal(b.showHints, true);
});
test("binding and visibility subscribers update immediately and unsubscribe", () => {
  const b = new KeyBindings();
  let count = 0;
  const off = b.subscribe(() => count++);
  b.assign("attack", "KeyJ");
  b.setHints(false);
  assert.equal(count, 2);
  off();
  b.restoreDefaults();
  assert.equal(count, 2);
});
test("unknown and prototype action names never read or overwrite inherited values", () => {
  const b = new KeyBindings();
  for (const id of ["constructor", "__proto__", "not-a-button"]) {
    assert.equal(b.assign(id, "KeyJ").ok, false);
    assert.equal(b.codeFor(id), "");
  }
  assert.equal(b.actionFor("KeyJ"), null);
});
