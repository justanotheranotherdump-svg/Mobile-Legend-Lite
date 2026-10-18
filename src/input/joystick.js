import { listen } from '../core/events.js';
export function joystickAxes(dx, dy, radius) {
  if (
    !Number.isFinite(dx) ||
    !Number.isFinite(dy) ||
    !Number.isFinite(radius) ||
    radius <= 0
  )
    return [0, 0];
  const length = Math.hypot(dx, dy);
  if (length < radius * 0.08) return [0, 0];
  const scale = 1 / Math.max(radius, length);
  return [dx * scale, -dy * scale];
}
export function movementAxes(keyboard, virtual) {
  return keyboard.some(Boolean) ? keyboard : virtual;
}
export class Joystick {
  constructor(element, controls) {
    this.element = element;
    this.controls = controls;
    this.pointerId = null;
    this.knob = element.querySelector(".stick-knob");
    controls.registerReset(() => this.reset());
    element.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || this.pointerId !== null || controls.suspended || (!controls.allowMenuGameplay && controls.blocked)) return;
      if(controls.allowMenuGameplay)controls.canvas.focus({preventScroll:true});
      if(controls.blocked)return;
      event.preventDefault();
      this.pointerId = event.pointerId;
      element.setPointerCapture(event.pointerId);
      this.move(event);
    });
    element.addEventListener("pointermove", (event) => {
      if (event.pointerId === this.pointerId) this.move(event);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      element.addEventListener(type, (event) => {
        if (event.pointerId === this.pointerId) this.reset();
      });
    listen(window, "resize", () => this.reset());
  }
  move(event) {
    if (this.controls.blocked) {
      this.reset();
      return;
    }
    const rect = this.element.getBoundingClientRect(),
      radius = rect.width * 0.32;
    const axes = joystickAxes(
      event.clientX - rect.x - rect.width / 2,
      event.clientY - rect.y - rect.height / 2,
      radius,
    );
    this.controls.virtualAxes = axes;
    this.knob.style.transform = `translate(${axes[0] * radius}px, ${-axes[1] * radius}px)`;
    this.element.classList.add("dragging");
  }
  reset() {
    const pointer = this.pointerId;
    this.pointerId = null;
    this.controls.virtualAxes = [0, 0];
    this.knob.style.transform = "";
    this.element.classList.remove("dragging");
    if (pointer !== null && this.element.hasPointerCapture(pointer))
      this.element.releasePointerCapture(pointer);
  }
  setEnabled(enabled) {
    this.reset();
    this.element
      .closest(".movement-dock")
      .classList.toggle("stick-hidden", !enabled);
  }
}
