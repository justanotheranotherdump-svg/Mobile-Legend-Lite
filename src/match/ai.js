import defaults from "../data/match/lane.json" with { type: "json" };
import { distance, validTarget } from "./actions.js";
// Decisions only. The simulation executes these intents through shared actions.
export function botDecision(actor, actors, config, difficulty, time, random) {
  const sign = actor.team === "player" ? 1 : -1,
    hp = actor.hp / actor.maxHp;
  const policy = config.retreat || defaults.bot.retreat;
  const nearby = actors.filter(
    (t) => validTarget(actor, t) && distance(actor, t) <= policy.threatRange,
  );
  const enemyHeroes = nearby.filter((t) =>
    ["bot", "player", "hero"].includes(t.kind),
  );
  const towerDanger = nearby.filter(
    (t) => ["tower", "core"].includes(t.kind) && distance(actor, t) <= t.range,
  ).length;
  const support = actors.filter(
    (t) =>
      t !== actor &&
      t.team === actor.team &&
      t.hp > 0 &&
      distance(actor, t) <= policy.threatRange,
  );
  const pressure =
    enemyHeroes.length +
    towerDanger * 2 +
    nearby.filter((t) => t.kind === "minion").length * 0.16;
  const help =
    0.5 +
    hp +
    support.reduce(
      (n, t) => n + (t.kind === "minion" ? 0.16 : (0.8 * t.hp) / t.maxHp),
      0,
    );
  const finishable =
    towerDanger === 0 &&
    enemyHeroes.length <= 1 &&
    enemyHeroes.some(
      (t) =>
        distance(actor, t) <= actor.range &&
        t.hp / t.maxHp <= policy.finishTargetHp,
    ) &&
    hp > policy.criticalHp;
  const state = (actor.aiState ??= {
    mode: actor.retreating ? "retreat" : "engage",
    since: time,
    commitUntil: actor.retreating ? time + policy.minCommitSeconds : 0,
    graceUntil: 0,
  });
  const critical = hp < policy.criticalHp,
    threatened = pressure >= policy.minEnemyPressure && pressure > help;
  if (
    state.mode === "engage" &&
    hp < policy.safeRecoveryHp &&
    nearby.length === 0 &&
    distance(actor, actor.home || actor) < 3
  ) {
    state.mode = "recover";
    state.since = time;
    state.commitUntil = time + policy.minCommitSeconds;
  }
  if (state.mode !== "engage") {
    const recovered = hp >= policy.recoverHp;
    const safelyReady = nearby.length === 0 && hp >= policy.safeRecoveryHp;
    if (time >= state.commitUntil && (recovered || safelyReady)) {
      state.mode = "engage";
      state.since = time;
      state.graceUntil = time + policy.reengageGrace;
    }
  } else if (
    critical ||
    (hp < difficulty.retreatHp &&
      threatened &&
      !finishable &&
      (time >= state.graceUntil || pressure > help * 2))
  ) {
    state.mode = "retreat";
    state.since = time;
    state.commitUntil = time + policy.minCommitSeconds;
    state.reason = critical ? "critical-health" : "outmatched";
  }
  if (state.mode !== "engage") {
    const home = actor.home || actor,
      atHome = distance(actor, home) < 3;
    if (atHome) state.mode = "recover";
    const homeDirection = Math.sign(home.x - actor.x);
    const blockers = enemyHeroes.filter(
      (t) => (t.x - actor.x) * homeDirection > 0 && distance(actor, t) < 4,
    );
    const flank = blockers.length ? (blockers[0].z >= actor.z ? -1.5 : 1.5) : 0;
    const limit = config.retreatLaneLimit || defaults.bot.retreatLaneLimit;
    return {
      type: "retreat",
      x: home.x,
      z: Math.max(
        -limit,
        Math.min(limit, (home.z || 0) + (actor.laneOffset || 0) + flank),
      ),
    };
  }
  const candidates = actors.filter(
    (t) => validTarget(actor, t) && distance(actor, t) <= config.detectRange,
  );
  candidates.sort((a, b) => {
    const score = (t) =>
      difficulty.targetPolicy === "lowest-hp"
        ? (t.hp / Math.max(1, t.maxHp)) * 4 + distance(actor, t)
        : difficulty.targetPolicy === "threat"
          ? (t.kind === "bot" || t.kind === "player" ? -3 : 0) +
            distance(actor, t)
          : distance(actor, t);
    return score(a) - score(b) || a.id.localeCompare(b.id);
  });
  const target = candidates[0];
  if (target) {
    if (distance(actor, target) <= actor.range)
      return {
        type: "attack",
        targetId: target.id,
        ability:
          actor.canUseAbility ??
          (time >= actor.abilityReadyAt && actor.mana >= config.abilityMana),
        aimOffset: (random() - 0.5) * 2 * difficulty.aimSpread,
      };
    if (distance(actor, target) <= config.detectRange * difficulty.aggression)
      return {
        type: "move",
        x: target.x - sign * (actor.range - 0.2),
        z: target.z,
      };
  }
  const objective = actors
    .filter((t) => ["tower", "core"].includes(t.kind) && validTarget(actor, t))
    .sort((a, b) => distance(actor, a) - distance(actor, b))[0];
  return {
    type: "move",
    x: objective ? objective.x - sign * (actor.range - 0.2) : sign * 30,
    z: (actor.home?.z ?? 0) + (actor.laneOffset || 0),
  };
}
export function towerTarget(tower, actors, time) {
  const eligible = actors.filter(
    (t) =>
      validTarget(tower, t) &&
      !["tower", "core"].includes(t.kind) &&
      distance(tower, t) <= tower.range,
  );
  const retaliation = eligible.find(
    (t) => t.id === tower.retaliateId && time < tower.retaliateUntil,
  );
  return (
    retaliation ||
    eligible.sort(
      (a, b) =>
        (a.kind === "minion" ? 0 : 1) - (b.kind === "minion" ? 0 : 1) ||
        distance(tower, a) - distance(tower, b) ||
        a.id.localeCompare(b.id),
    )[0] ||
    null
  );
}
