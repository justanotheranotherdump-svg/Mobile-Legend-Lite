// The top number row, NOT Numpad1/2/3. These are interface bindings only:
// current hero has no abilities, so its three buttons remain disabled.
export const SKILL_SLOTS = Object.freeze([
  Object.freeze({
    id: "skill-1",
    label: "Skill I",
    symbol: "arc",
    key: "1",
    code: "Digit1",
  }),
  Object.freeze({
    id: "skill-2",
    label: "Skill II",
    symbol: "spark",
    key: "2",
    code: "Digit2",
  }),
  Object.freeze({
    id: "skill-ultimate",
    label: "Ultimate",
    symbol: "ultimate",
    key: "3",
    code: "Digit3",
  }),
]);
export function skillSlotForCode(code) {
  return SKILL_SLOTS.find((slot) => slot.code === code) ?? null;
}
export function requestSkillButton(button) {
  if (!button || button.disabled) return false;
  button.click(); // Any future verified skill action must share the clickable path.
  return true;
}
export class SkillControls {
  constructor(root) {
    window.addEventListener("keydown", (event) => {
      const slot = skillSlotForCode(event.code);
      if (
        !slot ||
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.target.closest(
          "button,input,textarea,select,dialog,[contenteditable]",
        )
      )
        return;
      event.preventDefault();
      requestSkillButton(root.querySelector(`#${slot.id}`));
    });
  }
}
