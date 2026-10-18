export const UTILITY_RULES = Object.freeze({
  recallChannel: 8,
  regenDuration: 6,
  regenCooldown: 60,
  regenHp: 0.18,
  regenMana: 0.09,
});
export function resetUtilities(s) {
  s.utilities = { recall: null, regen: null, regenReadyAt: 0 };
}
export function cancelRecovery(s, reason = "cancelled") {
  if (s.utilities?.recall)
    s.emit("utility-cancelled", { id: "recall", reason });
  if (s.utilities) {
    s.utilities.recall = null;
    s.utilities.regen = null;
  }
}
export function useUtility(s, id) {
  if (!["recall", "regen"].includes(id)) return "unknown-utility";
  if (s.paused || (s.isMatch && s.phase !== "running")) return "paused";
  if (s.player.hp <= 0 || s.player.stunned || s.isActionLocked())
    return "cannot-act";
  if (id === "recall") {
    if (s.utilities.recall) {
      s.utilities.recall = null;
      return "cancelled";
    }
    s.cancelAim();
    s.queuedSkill = null;
    s.utilities.recall = {
      endsAt: s.time + UTILITY_RULES.recallChannel,
      x: s.player.x,
      z: s.player.z,
    };
  } else {
    if (s.time < s.utilities.regenReadyAt) return "cooldown";
    s.utilities.regenReadyAt = s.time + UTILITY_RULES.regenCooldown;
    s.utilities.regen = { until: s.time + UTILITY_RULES.regenDuration };
  }
  s.spells?.cancelArrival("utility");
  s.emit("utility", { id, point: { x: s.player.x, z: s.player.z } });
  return "started";
}
export function tickUtilities(s, dt) {
  const u = s.utilities,
    p = s.player;
  if (!u) return;
  if (p.hp <= 0 || p.stunned) {
    cancelRecovery(s, "cannot-act");
    return;
  }
  if (u.recall) {
    if (Math.hypot(p.x - u.recall.x, p.z - u.recall.z) > 0.01) u.recall = null;
    else if (s.time >= u.recall.endsAt) {
      const home = s.scenario?.spawn.player || s.config.player;
      p.x = home.x;
      p.z = home.z;
      u.recall = null;
      s.emit("recalled", { point: { x: p.x, z: p.z } });
    }
  }
  if (u.regen) {
    const elapsed = Math.max(0, Math.min(dt, u.regen.until - (s.time - dt)));
    p.hp = Math.min(
      p.maxHp,
      p.hp +
        ((p.maxHp * UTILITY_RULES.regenHp) / UTILITY_RULES.regenDuration) *
          elapsed *
          (p.antiHealUntil > s.time ? 0.6 : 1) *
          (p.recoveryBoost || 1),
    );
    p.mana = Math.min(
      p.maxMana,
      p.mana +
        ((p.maxMana * UTILITY_RULES.regenMana) / UTILITY_RULES.regenDuration) *
          elapsed,
    );
    if (s.time >= u.regen.until) u.regen = null;
  }
}
