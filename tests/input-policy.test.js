import test from "node:test";
import assert from "node:assert/strict";
import { blocksGameplayInput } from "../src/input/input-policy.js";
import { Controls } from "../src/input/controls.js";
const root = (open = false) => ({ querySelector: () => (open ? {} : null) });
const target = (editing = false) => ({
  closest: (selector) => (editing ? {} : null),
});
test("gameplay input policy permits HUD button focus but blocks editors and global open dialogs", () => {
  assert.equal(blocksGameplayInput(target(), root()), false);
  assert.equal(blocksGameplayInput(target(true), root()), true);
  assert.equal(blocksGameplayInput(target(), root(true)), true);
  assert.equal(blocksGameplayInput({}, root(true)), true);
  assert.equal(blocksGameplayInput(null, root()), false);
});
class Events {
  constructor() {
    this.listeners = new Map();
  }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  fire(type, props = {}) {
    const event = { target: target(), preventDefault() {}, ...props };
    for (const fn of this.listeners.get(type) || []) fn(event);
  }
}
function harness(fn, options = { allowMenuGameplay: false }) {
  const oldWindow = globalThis.window,
    oldDocument = globalThis.document;
  const window = new Events(),
    document = new Events(),
    canvas = new Events();
  let modal = false,
    attacks = 0;
  document.activeElement = target();
  document.querySelector = () => (modal ? {} : null);
  canvas.focus = () => {};
  canvas.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  });
  globalThis.window = window;
  globalThis.document = document;
  try {
    fn({
      window,
      document,
      canvas,
      controls: new Controls(canvas, () => attacks++, options), // explicit historical fixture policy
      setModal: (value) => (modal = value),
      attacks: () => attacks,
    });
  } finally {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
}
test("focusing/clicking combat HUD does not clear a held movement key; keyup still stops it", () =>
  harness(({ window, document, controls }) => {
    window.fire("keydown", { code: "KeyD" });
    assert.deepEqual(controls.axes, [1, 0]);
    const button = {
      closest: (selector) => (selector.includes("button") ? {} : null),
    };
    document.activeElement = button;
    document.fire("focusin", { target: button });
    assert.deepEqual(controls.axes, [1, 0]);
    window.fire("keydown", { code: "KeyW", target: target() });
    assert.deepEqual(controls.axes, [1, 1]);
    window.fire("keyup", { code: "KeyD" });
    window.fire("keyup", { code: "KeyW" });
    assert.deepEqual(controls.axes, [0, 0]);
  }));
test("menu lock clears keyboard/virtual axes and blocks keyboard/canvas input until fresh input after closing", () =>
  harness(({ window, canvas, controls, attacks }) => {
    let resets = 0;
    controls.registerReset(() => resets++);
    window.fire("keydown", { code: "KeyD" });
    controls.virtualAxes = [1, 1];
    controls.setMenuBlocked(true);
    assert.deepEqual(controls.axes, [0, 0]);
    assert.deepEqual(controls.virtualAxes, [0, 0]);
    assert.equal(resets, 1);
    window.fire("keydown", { code: "KeyW" });
    canvas.fire("pointerdown", { button: 0, clientX: 50, clientY: 50 });
    assert.equal(controls.keys.size, 0);
    assert.equal(attacks(), 0);
    controls.setMenuBlocked(false);
    window.fire("keydown", { code: "KeyW", repeat: true });
    assert.deepEqual(controls.axes, [0, 0]);
    window.fire("keydown", { code: "KeyW" });
    assert.deepEqual(controls.axes, [0, 1]);
  }));
test("global modal fallback blocks off-dialog key events and virtual movement even without explicit lock", () =>
  harness(({ window, controls, setModal }) => {
    setModal(true);
    controls.virtualAxes = [1, 1];
    window.fire("keydown", { code: "KeyD", target: {} });
    assert.deepEqual(controls.axes, [0, 0]);
    assert.equal(controls.keys.size, 0);
  }));
test("editors, blur and visibility changes clear held movement and virtual input", () =>
  harness(({ window, document, controls }) => {
    for (const clear of [
      () => document.fire("focusin", { target: target(true) }),
      () => window.fire("blur"),
      () => document.fire("visibilitychange"),
    ]) {
      window.fire("keydown", { code: "KeyD" });
      controls.virtualAxes = [1, 1];
      clear();
      assert.deepEqual(controls.axes, [0, 0]);
      assert.deepEqual(controls.virtualAxes, [0, 0]);
    }
  }));

test("late/repeated modal-close notifications do not erase fresh post-close movement", () =>
  harness(({ window, controls }) => {
    controls.setMenuBlocked(true);
    controls.setMenuBlocked(false);
    window.fire("keydown", { code: "KeyW" });
    assert.deepEqual(controls.axes, [0, 1]);
    controls.setMenuBlocked(false);
    assert.deepEqual(controls.axes, [0, 1]);
  }));

// Current default: live panels, separate keyboard movement and editor safety.
test("live panels preserve held WASD on open/close and accept fresh movement while focused inside", () =>
  harness(({ window, document, controls, setModal }) => {
    window.fire("keydown", { code: "KeyD" });
    setModal(true);
    controls.setMenuBlocked(true);
    document.fire("focusin");
    assert.deepEqual(controls.axes, [1, 0]);
    window.fire("keydown", { code: "KeyW" });
    assert.deepEqual(controls.axes, [1, 1]);
    controls.setMenuBlocked(false);
    setModal(false);
    assert.deepEqual(controls.axes, [1, 1]);
    window.fire("keyup", { code: "KeyD" });
    window.fire("keyup", { code: "KeyW" });
    assert.deepEqual(controls.axes, [0, 0]);
  }, {}));
test("live panels keep canvas attacks enabled even when panel-open flag is set", () =>
  harness(({ canvas, controls, setModal, attacks }) => {
    setModal(true);
    controls.setMenuBlocked(true);
    assert.equal(controls.blocked, false);
    canvas.fire("pointerdown", { button: 0, clientX: 50, clientY: 50 });
    assert.equal(attacks(), 1);
  }, {}));
test("opening/closing a live panel does not reset ongoing combat/aim input", () =>
  harness(({ controls }) => {
    let resets = 0;
    controls.registerReset(() => resets++);
    controls.pointer.active = true;
    controls.setMenuBlocked(true);
    controls.setMenuBlocked(false);
    assert.equal(resets, 0);
    assert.equal(controls.pointer.active, true);
  }, {}));
test("text entry suspends movement and combat, while selects keep WASD but own combat keys", () =>
  harness(({ controls, window, document }) => {
    window.fire("keydown", { code: "KeyD" });
    document.activeElement = target(true);
    document.fire("focusin", { target: document.activeElement });
    assert.deepEqual(controls.axes, [0, 0]);
    assert.equal(controls.blocked, true);
    window.fire("keydown", { code: "KeyW", target: document.activeElement });
    assert.equal(controls.keys.size, 0);
    document.activeElement = {
      closest: (s) => (s.startsWith("input,textarea,select") ? {} : null),
    };
    document.fire("focusin", { target: document.activeElement });
    window.fire("keydown", { code: "KeyD", target: document.activeElement });
    assert.deepEqual(controls.axes, [1, 0]);
    assert.equal(controls.blocked, true);
  }, {}));
test("blur/visibility/reset still clear held movement in live panels; repeats cannot revive it", () =>
  harness(({ controls, window, document }) => {
    controls.setMenuBlocked(true);
    for (const clear of [
      () => window.fire("blur"),
      () => document.fire("visibilitychange"),
      () => controls.clear(),
    ]) {
      window.fire("keydown", { code: "KeyD" });
      clear();
      window.fire("keydown", { code: "KeyD", repeat: true });
      assert.deepEqual(controls.axes, [0, 0]);
    }
  }, {}));
test("movement ignores browser modifier shortcuts rather than stealing Ctrl/Alt/Meta WASD", () =>
  harness(({ window, controls }) => {
    for (const modifier of ["ctrlKey", "altKey", "metaKey"])
      window.fire("keydown", { code: "KeyW", [modifier]: true });
    assert.deepEqual(controls.axes, [0, 0]);
  }, {}));

test("explicit canvas pointer attack leaves an editor in live-panel mode on the first click", () =>
  harness(({ canvas, controls, document, attacks }) => {
    document.activeElement = target(true);
    assert.equal(controls.blocked, true);
    canvas.focus = () => {
      document.activeElement = target();
    };
    canvas.fire("pointerdown", { button: 0, clientX: 50, clientY: 50 });
    assert.equal(attacks(), 1);
    assert.equal(controls.blocked, false);
  }, {}));
