import {
  directionalAim,
  aimingShape,
  AIM_WHEEL_RADIUS,
} from "./directional-aim.js";
import { listen } from "../core/events.js";
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
    this.buttons = buttons;
    this.wheel = document.createElement("div");
    this.wheel.id = "skill-aim-wheel";
    this.wheel.hidden = true;
    this.knob = document.createElement("span");
    this.wheel.append(this.knob);
    document.querySelector("#hud-root").append(this.wheel);
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
        // A deliberate HUD pointer press leaves the editor; typing stays protected.
        if (this.controls.allowMenuGameplay) b.focus({ preventScroll: true });
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
    listen(window, "pointermove", (e) => this.move(e));
    listen(window, "pointerup", (e) => {
      if (this.active?.pointerId === e.pointerId) this.finish();
    });
    listen(window, "pointercancel", (e) => {
      if (this.active?.pointerId === e.pointerId) this.cancel();
    });
    listen(window, "keyup", (e) => {
      if (this.active?.kind === "key" && this.active.code === e.code) {
        e.preventDefault();
        this.finish();
      }
    });
    listen(
      window,
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
    listen(
      window,
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
    listen(window, "contextmenu", (e) => {
      if (this.active || this.suppressContext || e.target === view.canvas)
        e.preventDefault();
      this.suppressContext = false;
    });
    controls.registerReset(() => this.cancel());
  }
  press(slot, extra) {
    this.cancel(false);
    if (
      this.controls.blocked ||
      (this.controls.combatInputBlocked?.(document.activeElement) ??
        blocksGameplayInput(document.activeElement))
    )
      return false;
    const reason = this.simulation.castAvailability(
      this.simulation.ability(slot),
    );
    if (reason) {
      this.simulation.lastCastResult = reason;
      return false;
    }
    const button = this.buttons.find((x) => x.a.slot === slot)?.b;
    const r = button?.getBoundingClientRect();
    let startX = extra.startX,
      startY = extra.startY;
    if (!Number.isFinite(startX)) {
      const c = this.view.canvas.getBoundingClientRect(),
        p = this.controls.pointer;
      startX =
        p.active && Number.isFinite(p.x)
          ? c.left + ((p.x + 1) * (c.right - c.left)) / 2
          : r
            ? r.left + (r.right - r.left) / 2
            : window.innerWidth / 2;
      startY =
        p.active && Number.isFinite(p.y)
          ? c.top + ((1 - p.y) * (c.bottom - c.top)) / 2
          : r
            ? r.top + (r.bottom - r.top) / 2
            : window.innerHeight / 2;
    }
    this.active = {
      slot,
      held: false,
      overCancel: false,
      ...extra,
      startX,
      startY,
    };
    this.wheel.style.left = startX + "px";
    this.wheel.style.top = startY + "px";
    this.knob.style.transform = "translate(0,0)";
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
      this.wheel.hidden = false;
      this.hint.hidden = false;
      this.hint.textContent =
        "DRAG WHEEL TO AIM · release to cast · Esc / right-click / CANCEL";
      if (g.kind === "pointer")
        this.move({ pointerId: g.pointerId, clientX: g.x, clientY: g.y });
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
      const dx = e.clientX - g.startX,
        dy = e.clientY - g.startY,
        n = Math.hypot(dx, dy),
        scale = Math.min(1, AIM_WHEEL_RADIUS / Math.max(n, 0.001));
      this.knob.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
      const a = this.simulation.ability(g.slot),
        shape = aimingShape(a);
      const point = this.simulation.player
        ? directionalAim(
            this.view,
            this.simulation.player,
            this.simulation.abilityRange(a),
            g.startX,
            g.startY,
            e.clientX,
            e.clientY,
            shape === "circle",
          )
        : this.view.groundAtClient(e.clientX, e.clientY);
      if (point) {
        if (this.simulation.setDirectionalAim)
          this.simulation.setDirectionalAim(point);
        else this.simulation.setAim(point);
      }
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
    this.wheel.hidden = true;
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
  cancel(clearQueued = true) {
    this.clearGesture();
    this.simulation.cancelAim();
    if (clearQueued) this.simulation.queuedSkill = null;
  }
}
