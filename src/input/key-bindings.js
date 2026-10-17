// Physical KeyboardEvent.code bindings. Movement and mouse aiming stay fixed.
export const BUTTON_ACTIONS = Object.freeze(
  [
    ["attack", "Basic attack", "Space"],
    ["skill-1", "Skill I", "Digit1", true],
    ["skill-2", "Skill II", "Digit2", true],
    ["skill-ultimate", "Ultimate", "Digit3", true],
    ["recall", "Recall", "KeyB", true],
    ["regen", "Regen", "KeyV", true],
    ["battle-spell", "Battle spell", "KeyF", true],
    ["priority-minion", "Minion priority", "", true],
    ["priority-tower", "Tower priority", "", true],
    ["clear-target", "Clear target lock", ""],
    ["reset", "Reset arena", ""],
    ["shop", "Open shop preview", ""],
    ["settings", "Open settings", ""],
    ["toggle-map", "Toggle minimap", ""],
    ["toggle-map-range", "Toggle minimap range", ""],
  ].map(([id, label, code, reserved = false]) =>
    Object.freeze({ id, label, code, reserved }),
  ),
);
export const DEFAULT_BINDINGS = Object.freeze(
  Object.fromEntries(BUTTON_ACTIONS.map((a) => [a.id, a.code])),
);
export const MOVEMENT_CODES = Object.freeze(["KeyW", "KeyA", "KeyS", "KeyD"]);
export const AVAILABLE_CODES = Object.freeze([
  "Space",
  ...Array.from(
    { length: 26 },
    (_, n) => `Key${String.fromCharCode(65 + n)}`,
  ).filter((c) => !MOVEMENT_CODES.includes(c)),
  ...Array.from({ length: 10 }, (_, n) => `Digit${n}`),
  ...Array.from({ length: 10 }, (_, n) => `Numpad${n}`),
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);
export function keyLabel(code) {
  if (!code) return "Unbound";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Num ${code.slice(6)}`;
  return (
    { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" }[code] ??
    code
  );
}
export class KeyBindings {
  constructor() {
    this.codes = { ...DEFAULT_BINDINGS };
    this.showHints = true;
    this.listeners = new Set();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    for (const listener of this.listeners) listener();
  }
  codeFor(id) {
    return Object.hasOwn(this.codes, id) ? this.codes[id] : "";
  }
  labelFor(id) {
    return keyLabel(this.codeFor(id));
  }
  actionFor(code) {
    return code
      ? (BUTTON_ACTIONS.find((a) => this.codes[a.id] === code) ?? null)
      : null;
  }
  assign(id, code) {
    if (!Object.hasOwn(DEFAULT_BINDINGS, id))
      return { ok: false, error: "Unknown control." };
    if (code !== "" && !AVAILABLE_CODES.includes(code))
      return {
        ok: false,
        error:
          "That key is reserved for movement, browser controls or navigation.",
      };
    const conflict =
      code &&
      BUTTON_ACTIONS.find((a) => a.id !== id && this.codes[a.id] === code);
    if (conflict)
      return {
        ok: false,
        error: `${keyLabel(code)} is already assigned to ${conflict.label}. Unbind or change that control first.`,
      };
    this.codes[id] = code;
    this.notify();
    return { ok: true };
  }
  setHints(visible) {
    this.showHints = Boolean(visible);
    this.notify();
  }
  restoreDefaults() {
    this.codes = { ...DEFAULT_BINDINGS };
    this.notify();
  }
}
