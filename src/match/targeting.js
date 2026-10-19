import {
  isEligibleEnemy,
  inAttackRange,
  selectAutomaticTarget,
} from "../simulation/targeting.js";
export const categoryOf = (a) =>
  ["player", "hero", "bot"].includes(a.kind)
    ? "hero"
    : a.kind === "minion"
      ? "minion"
      : ["tower", "core"].includes(a.kind)
        ? "tower"
        : "other";
export function resolveMatchTarget(
  source,
  actors,
  mode,
  category = "hero",
  manualId = null,
) {
  const eligible = actors.filter(
    (a) => isEligibleEnemy(a, source) && !a.protected,
  );
  const pin = eligible.find((a) => a.id === manualId),
    validPin = pin && inAttackRange(source, pin);
  if (validPin) return { target: pin, manualTargetId: pin.id, discarded: null };
  const preferred = eligible.filter((a) => categoryOf(a) === category);
  return {
    target:
      selectAutomaticTarget(source, preferred, mode) ||
      selectAutomaticTarget(source, eligible, mode),
    manualTargetId: null,
    discarded: manualId ? (pin ? "range" : "invalid") : null,
  };
}
export const attackFeedback = (reason) =>
  ({
    range: "Target is out of attack range. Move manually closer.",
    "no-enemies": "No eligible enemy target available.",
    "invalid-target": "That target is no longer available.",
    cooldown: "Basic attack is recharging.",
    animation: "Finish the current attack or skill first.",
    casting: "Skill is being cast.",
    "cannot-act": "Cannot attack while dead or stunned.",
    countdown: "Wait for the match countdown.",
    paused: "Match paused.",
  })[reason] || "";
