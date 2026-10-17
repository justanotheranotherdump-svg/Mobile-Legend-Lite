import { BUTTON_ACTIONS, keyLabel } from "../input/key-bindings.js";
import { requestSkillButton } from "./skill-controls.js";
// One dispatcher for all HUD button shortcuts: never duplicate gameplay rules.
export class ButtonShortcuts {
  constructor(root, bindings) {
    this.root = root;
    this.bindings = bindings;
    window.addEventListener("keydown", (event) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey ||
        event.target.closest(
          "button,input,textarea,select,dialog,[contenteditable]",
        )
      )
        return;
      const action = bindings.actionFor(event.code);
      if (!action) return;
      event.preventDefault();
      requestSkillButton(root.querySelector(`#${action.id}`));
    });
    bindings.subscribe(() => this.render());
    this.render();
  }
  render() {
    const bindings = this.bindings;
    document.documentElement.classList.toggle(
      "key-hints-hidden",
      !bindings.showHints,
    );
    for (const action of BUTTON_ACTIONS) {
      const button = this.root.querySelector(`#${action.id}`);
      if (!button) continue;
      const code = bindings.codeFor(action.id),
        label = keyLabel(code);
      button.dataset.keyCode = code;
      // aria-keyshortcuts uses KeyboardEvent.key spelling, not physical codes.
      if (code)
        button.setAttribute(
          "aria-keyshortcuts",
          code === "Space"
            ? "Space"
            : code.startsWith("Numpad")
              ? code.slice(6)
              : code.startsWith("Arrow")
                ? code
                : label,
        );
      else button.removeAttribute("aria-keyshortcuts");
      button.title = `${action.label} · ${label}${action.reserved ? " · Reserved, not implemented" : ""}${action.id === "attack" ? " · Mouse LMB also available" : ""}`;
      let badge = button.querySelector(".slot-key");
      if (!badge && code) {
        badge = document.createElement("span");
        badge.className = "slot-key shortcut-extra";
        badge.dataset.dynamicHint = "true";
        button.append(badge);
        button.classList.add("has-shortcut");
      }
      if (badge?.dataset.dynamicHint) badge.hidden = !code;
      if (badge)
        badge.textContent =
          action.id === "attack"
            ? `${code ? label + " / " : ""}LMB`
            : code
              ? label
              : "—";
    }
    const help = this.root.querySelector("[data-key-help]");
    if (help)
      help.textContent = `Attack: ${bindings.labelFor("attack")} (+ mouse) · Skill I: ${bindings.labelFor("skill-1")} · Skill II: ${bindings.labelFor("skill-2")} · Ultimate: ${bindings.labelFor("skill-ultimate")}. Skill and utility gameplay is still reserved.`;
    const title = this.root.querySelector(".movement-hint");
    if (title)
      title.title =
        "Movement stays WASD / joystick. Button key changes do not alter movement.";
  }
}
