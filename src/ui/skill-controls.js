// Default three-slot artwork/layout data. Live, customizable keyboard routing
// belongs to ButtonShortcuts; these defaults do not enable any abilities.
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
