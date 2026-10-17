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
function harness(fn) {
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
      controls: new Controls(canvas, () => attacks++),
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
