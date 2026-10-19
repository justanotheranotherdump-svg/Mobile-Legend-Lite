import test from "node:test";
import assert from "node:assert/strict";
import { SkillGestures, SKILL_HOLD_MS } from "../src/input/skill-gestures.js";
class Element extends EventTarget {
  constructor() {
    super();
    this.hidden = false;
    this.style = {};
    this.dataset = {};
    this.classList = { toggle() {}, remove() {} };
  }
  setAttribute() {}
  append() {}
  closest() {
    return null;
  }
  hasPointerCapture() {
    return false;
  }
  blur() {}
  getBoundingClientRect() {
    return { left: 100, top: 100, right: 200, bottom: 150 };
  }
}
function scenario(fn) {
  const saved = {
    window: globalThis.window,
    document: globalThis.document,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };
  const timers = new Map();
  let id = 0;
  const root = new Element(),
    button = new Element(),
    state = { aiming: null, mana: 100, casts: 0, begins: 0, cancels: 0 };
  globalThis.window = new EventTarget();
  globalThis.document = {
    activeElement: new Element(),
    createElement: () => new Element(),
    querySelector: (q) => (q === "#hud-root" ? root : null),
  };
  globalThis.setTimeout = (f, ms) => {
    assert.equal(ms, SKILL_HOLD_MS);
    timers.set(++id, f);
    return id;
  };
  globalThis.clearTimeout = (n) => timers.delete(n);
  const sim = {
    ability: (slot) => ({ slot }),
    castAvailability: () => null,
    cancelAim() {
      state.aiming = null;
      state.cancels++;
    },
    beginAim(slot) {
      state.aiming = { slot };
      state.begins++;
      return true;
    },
    setAim(p) {
      state.point = p;
    },
    cast() {
      state.casts++;
      state.mana -= 20;
    },
    releaseAim() {
      state.aiming = null;
      this.cast();
    },
  };
  const controls = {
      blocked: false,
      registerReset(f) {
        this.reset = f;
      },
      pointer: { active: true },
    },
    view = {
      canvas: new Element(),
      groundAtPointer: () => ({ x: 0, z: 5 }),
      groundAtClient: (x, z) => ({ x, z }),
    };
  try {
    const g = new SkillGestures(sim, controls, view, [
      { a: { slot: "skill-1" }, b: button },
    ]);
    fn({
      g,
      state,
      controls,
      button,
      tick() {
        const callbacks = [...timers.values()];
        timers.clear();
        callbacks.forEach((f) => f());
      },
      event(type, props) {
        const e = new Event(type, { cancelable: true });
        Object.assign(e, props);
        window.dispatchEvent(e);
      },
    });
  } finally {
    Object.assign(globalThis, saved);
  }
}
test("quick press/release auto-casts once on release, not press or synthetic pointer click", () =>
  scenario(({ g, state, tick, button }) => {
    g.keyDown("skill-1", "Digit1");
    assert.equal(state.casts, 0);
    g.finish();
    assert.equal(state.casts, 1);
    assert.equal(state.mana, 80);
    tick();
    assert.equal(state.begins, 0);
    const e = new Event("click", { cancelable: true });
    Object.defineProperty(e, "detail", { value: 1 });
    button.dispatchEvent(e);
    assert.equal(state.casts, 1);
  }));
test("held key previews with no spend; release casts once and clears lifecycle", () =>
  scenario(({ g, state, tick, event, controls }) => {
    g.keyDown("skill-1", "Digit1");
    tick();
    assert.equal(state.begins, 1);
    assert.equal(state.mana, 100);
    assert.equal(g.cancelButton.hidden, false);
    event("keyup", { code: "Digit1" });
    assert.equal(state.casts, 1);
    assert.equal(g.active, null);
    assert.equal(controls.skillGestureActive, false);
    event("keyup", { code: "Digit1" });
    assert.equal(state.casts, 1);
  }));
test("Escape, right click and drag-to-cancel each cancel without costs", () => {
  for (const type of ["Escape", "right", "drag"])
    scenario(({ g, state, tick, event }) => {
      g.keyDown("skill-1", "Digit1");
      tick();
      if (type === "Escape") event("keydown", { code: "Escape" });
      if (type === "right") event("pointerdown", { button: 2 });
      if (type === "drag") {
        g.move({ clientX: 150, clientY: 120 });
        g.finish();
      }
      assert.equal(state.casts, 0);
      assert.equal(state.mana, 100);
      assert.equal(state.aiming, null);
    });
});
test("menu/reset input clear and pointer cancellation never cast on stale release", () =>
  scenario(({ g, state, tick, event, controls }) => {
    g.press("skill-1", { kind: "pointer", pointerId: 7, startX: 0, startY: 0 });
    tick();
    event("pointercancel", { pointerId: 7 });
    g.finish();
    assert.equal(state.casts, 0);
    g.keyDown("skill-1", "Digit1");
    controls.reset();
    tick();
    event("keyup", { code: "Digit1" });
    assert.equal(state.casts, 0);
    g.keyDown("skill-1", "Digit1");
    controls.blocked = true;
    tick();
    g.finish();
    assert.equal(state.casts, 0);
  }));
test("another skill cancels old preview; only matching rebound-key release casts", () =>
  scenario(({ g, state, tick, event }) => {
    g.keyDown("skill-1", "Digit1");
    tick();
    g.keyDown("skill-2", "Numpad2");
    event("keyup", { code: "Digit1" });
    assert.equal(state.casts, 0);
    tick();
    event("keyup", { code: "Numpad2" });
    assert.equal(state.casts, 1);
  }));

// A drag often begins before the hold threshold; do not lose its last pointer position.
test("pointer movement before hold threshold is retained when preview opens", () =>
  scenario(({ g, state, tick }) => {
    g.press("skill-1", {
      kind: "pointer",
      pointerId: 7,
      startX: 0,
      startY: 0,
      x: 0,
      y: 0,
    });
    g.move({ pointerId: 7, clientX: 80, clientY: 70 });
    assert.equal(state.casts, 0);
    tick();
    assert.deepEqual(state.point, { x: 80, z: 70 });
    g.finish();
    assert.equal(state.casts, 1);
  }));
