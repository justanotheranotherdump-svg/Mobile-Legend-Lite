import { blocksGameplayInput } from "./input-policy.js";

export const SKILL_HOLD_MS = 180;
// Pointer and rebound keyboard skills share one press/hold/release lifecycle.
// The simulation alone validates/spends at release, never during a preview.
export class SkillGestures {
  constructor(simulation, controls, view, buttons) {
    this.simulation = simulation;
    this.controls = controls;
    this.view = view;
    this.active = null;
    this.cancelButton = document.createElement("button");
    this.cancelButton.id = "cancel-skill";
    this.cancelButton.type = "button";
    this.cancelButton.dataset.controlKind = "functional";
    this.cancelButton.hidden = true;
    this.cancelButton.textContent = "CANCEL ×";
    this.cancelButton.setAttribute("aria-label", "Cancel skill aim");
    document.querySelector("#hud-root").append(this.cancelButton);
    this.hint = document.createElement("div");
    this.hint.id = "skill-aim-help";
    this.hint.setAttribute("role", "status");
    this.hint.hidden = true;
    document.querySelector("#hud-root").append(this.hint);
    this.cancelButton.addEventListener("click", () => this.cancel());
    for (const { b, a } of buttons) {
      b.style.touchAction = "none";
      b.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        if (
          this.press(a.slot, {
            kind: "pointer",
            pointerId: e.pointerId,
            button: b,
            startX: e.clientX,
            startY: e.clientY,
            x: e.clientX,
            y: e.clientY,
          })
        ) {
          b.setPointerCapture(e.pointerId);
        }
      });
      b.addEventListener("lostpointercapture", (e) => {
        if (this.active?.pointerId === e.pointerId) this.cancel();
      });
      // Native Enter/Space, assistive activation and programmatic button.click().
      // Pointer clicks have already been handled by the release path.
      b.addEventListener("click", (e) => {
        e.preventDefault();
        if (e.detail === 0 && !this.active && !this.controls.blocked) {
          this.simulation.cast(a.slot);
          b.blur();
        }
      });
    }
    window.addEventListener("pointermove", (e) => this.move(e));
    window.addEventListener("pointerup", (e) => {
      if (this.active?.pointerId === e.pointerId) this.finish();
    });
    window.addEventListener("pointercancel", (e) => {
      if (this.active?.pointerId === e.pointerId) this.cancel();
    });
    window.addEventListener("keyup", (e) => {
      if (this.active?.kind === "key" && this.active.code === e.code) {
        e.preventDefault();
        this.finish();
      }
    });
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.code === "Escape" && this.active) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.cancel();
        }
      },
      true,
    );
    window.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button === 2 && this.active) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.suppressContext = true;
          this.cancel();
        }
      },
      true,
    );
    window.addEventListener("contextmenu", (e) => {
      if (this.active || this.suppressContext || e.target === view.canvas)
        e.preventDefault();
      this.suppressContext = false;
    });
    controls.registerReset(() => this.cancel());
  }
  press(slot, extra) {
    this.cancel();
    if (this.controls.blocked || blocksGameplayInput(document.activeElement))
      return false;
    const reason = this.simulation.castAvailability(
      this.simulation.ability(slot),
    );
    if (reason) {
      this.simulation.lastCastResult = reason;
      return false;
    }
    this.active = { slot, held: false, overCancel: false, ...extra };
    this.controls.skillGestureActive = true;
    this.timer = setTimeout(() => {
      const g = this.active;
      if (!g) return;
      if (this.controls.blocked || !this.simulation.beginAim(g.slot)) {
        this.cancel();
        return;
      }
      g.held = true;
      this.cancelButton.hidden = false;
      this.hint.hidden = false;
      this.hint.textContent =
        "AIM · release to cast · Esc / right-click / drag to CANCEL";
      if (g.kind === "pointer")
        this.move({ pointerId: g.pointerId, clientX: g.x, clientY: g.y });
      if (g.kind === "key" && this.controls.pointer.active) {
        const point = this.view.groundAtPointer(this.controls.pointer);
        if (point) this.simulation.setAim(point);
      }
    }, SKILL_HOLD_MS);
    return true;
  }
  keyDown(slot, code) {
    return this.press(slot, { kind: "key", code });
  }
  move(e) {
    const g = this.active;
    if (!g) return;
    if (g.kind === "pointer" && e.pointerId !== g.pointerId) return;
    g.x = e.clientX;
    g.y = e.clientY;
    const r = this.cancelButton.getBoundingClientRect();
    g.overCancel =
      g.held &&
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    this.cancelButton.classList.toggle("cancel-hover", g.overCancel);
    if (
      g.held &&
      !g.overCancel &&
      (g.kind === "key" ||
        Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 6)
    ) {
      const point = this.view.groundAtClient(e.clientX, e.clientY);
      if (point) this.simulation.setAim(point);
    }
  }
  clearGesture() {
    clearTimeout(this.timer);
    const g = this.active;
    this.active = null;
    this.controls.skillGestureActive = false;
    this.cancelButton.hidden = true;
    this.cancelButton.classList.remove("cancel-hover");
    this.hint.hidden = true;
    if (g?.button?.hasPointerCapture(g.pointerId))
      g.button.releasePointerCapture(g.pointerId);
    g?.button?.blur();
    return g;
  }
  finish() {
    const g = this.clearGesture();
    if (!g) return;
    if (this.controls.blocked || g.overCancel) {
      this.simulation.cancelAim();
      return;
    }
    if (g.held) this.simulation.releaseAim();
    else this.simulation.cast(g.slot);
  }
  cancel() {
    this.clearGesture();
    this.simulation.cancelAim();
  }
}
