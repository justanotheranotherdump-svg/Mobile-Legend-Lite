import { blocksGameplayInput } from "./input-policy.js";
import { movementAxes } from "./joystick.js";
export class Controls {
  constructor(canvas, onAttack) {
    this.keys = new Set();
    this.menuBlocked = false;
    this.virtualAxes = [0, 0];
    this.resetListeners = new Set();
    this.pointer = { x: 0, y: 0, active: false };
    this.canvas = canvas;
    window.addEventListener("keydown", (event) => {
      if (
        ["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code) &&
        !event.repeat &&
        !this.blocked &&
        !blocksGameplayInput(event.target)
      ) {
        event.preventDefault();
        this.keys.add(event.code);
      }
    });
    document.addEventListener("focusin", (event) => {
      if (blocksGameplayInput(event.target)) this.clear();
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    window.addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => this.clear());
    canvas.addEventListener("pointermove", (event) => this.setPointer(event));
    canvas.addEventListener("pointerleave", () => {
      this.pointer.active = false;
    });
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || this.blocked) return;
      canvas.focus({ preventScroll: true });
      this.setPointer(event);
      onAttack(this.pointer);
    });
  }
  setPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer = {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      active: true,
    };
  }
  registerReset(listener) {
    this.resetListeners.add(listener);
    return () => this.resetListeners.delete(listener);
  }
  clear() {
    this.keys.clear();
    this.pointer.active = false;
    this.virtualAxes = [0, 0];
    for (const listener of this.resetListeners) listener();
  }
  setMenuBlocked(blocked) {
    const next = Boolean(blocked);
    if (next === this.menuBlocked) return;
    this.menuBlocked = next;
    this.clear();
  }
  get blocked() {
    return this.menuBlocked || blocksGameplayInput(document.activeElement);
  }
  get axes() {
    if (this.blocked) return [0, 0];
    return movementAxes(
      [
        Number(this.keys.has("KeyD")) - Number(this.keys.has("KeyA")),
        Number(this.keys.has("KeyW")) - Number(this.keys.has("KeyS")),
      ],
      this.virtualAxes,
    );
  }
}
