import { HeroCombatSimulation } from "../simulation/hero-combat.js";
import { validTarget } from "./actions.js";
export function learnBotSkills(engine) {
  for (let i = 0; i < 15 && engine.progression.skillPoints; i++) {
    let learned = false;
    for (const slot of ["skill-ultimate", "skill-1", "skill-2"])
      if (!engine.progression.upgradeReason(slot)) {
        engine.upgradeSkill(slot);
        learned = true;
        break;
      }
    if (!learned) break;
  }
}
// A bot uses the SAME authoritative hero kit, ranks, mana, locks, projectiles and
// cooldowns as the human. Policy only submits intents; no generic fake pulse.
export function makeHeroBot(match, team, index) {
  const e = new HeroCombatSimulation(
    match.scenario,
    {
      player: { heroId: "layla", ...match.scenario.spawn[team] },
      dummies: [],
      targeting: { defaultMode: "nearest" },
    },
    match.registry,
  );
  e.setPracticeLevel(match.matchConfig.level);
  learnBotSkills(e);
  const a = e.player;
  Object.assign(a, {
    id: `${team}-bot-${index}`,
    name: `${team === "player" ? "Ally Computer" : "Computer"} ${index + 1}`,
    heroId: "layla",
    heroName: "Layla",
    kind: "bot",
    team,
    laneOffset: (index - 1.5) * 1.1,
    home: structuredClone(match.scenario.spawn[team]),
    nextThink: 0,
    readyAt: 0,
    abilityReadyAt: 0,
    targetable: true,
    spawnProtectedUntil: match.scenario.spawnProtection,
    progression: e.progression,
  });
  a.z += a.laneOffset;
  e.emit = (type, data = {}) => match.emit(type, { ...data, sourceId: a.id });
  e.damageEnemy = (target, base, type = "physical", meta = {}) => {
    if (validTarget(a, target))
      match.deal(
        a,
        target,
        (base + e.consumeMark(target)) *
          (target.kind === "core" ? 1 : e.passive(target)),
        type,
        Boolean(meta.basic),
      );
  };
  match.botEngines.set(a.id, e);
  return a;
}
export function advanceHeroBot(match, a, dt) {
  const e = match.botEngines.get(a.id);
  e.enemies = match.actors.filter((t) => validTarget(a, t));
  e.time = match.time - dt;
  e.statModifiers.temporary=match.roleEquipment?.actorModifiers(a)||{flat:{},percent:{}};e.recalculateStats();
  e.update(dt);
  if(a.chastisedUntil>match.time){a.attackRate*=.75;a.attackCooldown=1/a.attackRate}
  a.canUseAbility = e.hero.abilities.some(
    (skill) =>
      skill.slot !== "passive" && !e.castAvailability(e.ability(skill.slot)),
  );
  const f = e.currentFacing();
  a.facing = { ...f };
  a.actionLocked = e.isActionLocked();
  if (e.lastAttack.reason === "fired") a.attackSerial = e.lastAttack.serial;
  a.castSerial = e.lastCast.serial;
  a.actionDuration = e.lastAttack.duration;
}
export function commandHeroBot(match, a, target, ability = false, offset = 0) {
  const e = match.botEngines.get(a.id);
  if (!validTarget(a, target)) return false;
  e.time = match.time;
  e.enemies = match.actors.filter((t) => validTarget(a, t));
  e.refreshTarget();
  if (!ability) return e.attack(target.id) === "fired";
  for (const slot of ["skill-ultimate", "skill-2", "skill-1"]) {
    const skill = e.ability(slot);
    if (e.castAvailability(skill)) continue;
    // Actual aimed projectile/beam: difficulty changes aim, not damage.
    const point = { x: target.x, z: target.z + offset };
    return ["cast", "queued"].includes(
      e.cast(slot, point, Math.abs(offset) < 0.1 ? target.id : null),
    );
  }
  return false;
}
