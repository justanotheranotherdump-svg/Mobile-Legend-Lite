import {playableHeroIds} from "../heroes/commerce.js";
// UI-only authoring. Ratings are explicitly subjective prototype presentation,
// never simulation inputs, recovered balance, official scores or computed stats.
export const HERO_PRESENTATION = Object.freeze({
  franco: Object.freeze({title:"The Frozen Warrior",specialty:"Tank · Roam · Catch / Protect",ratings:Object.freeze({durability:9,offense:4,control:9,difficulty:6})}),
  layla: Object.freeze({
    title: "The Malefic Gunner",
    specialty: "Ranged damage · Marksman",
    ratings: Object.freeze({
      durability: 3,
      offense: 8,
      control: 4,
      difficulty: 3,
    }),
  }),
});
export const HERO_ROLES = Object.freeze([
  "All",
  "Tank",
  "Fighter",
  "Assassin",
  "Mage",
  "Marksman",
  "Support",
]);
export const RATING_LABELS = Object.freeze({
  durability: "Durability",
  offense: "Offense",
  control: "Control Effect",
  difficulty: "Difficulty",
});
export const CATALOG_SLOT_COUNT = 15;
// Explicit playable catalog; the historical training fixture is not a hero offer.
export function heroCatalog(registry) {
  return playableHeroIds.map((id) => registry.get(id));
}
export function filterHeroes(heroes, { role = "All", query = "" } = {}) {
  const needle = query.trim().toLowerCase();
  return heroes.filter(
    (h) =>
      (role === "All" || h.role.toLowerCase() === role.toLowerCase()) &&
      `${h.name} ${h.role}`.toLowerCase().includes(needle),
  );
}
export function abilityDescription(a) {
  const p = a.parameters;
  switch (a.effectId) {
    case "wasteland-force":
      return `After ${p.noDamageSeconds}s without taking damage, gain ${p.movementBonus*100}% movement speed and recover ${p.hpRatioPerSecond*100}% maximum HP each second. Gain one stack each ${p.stackInterval}s, up to ${p.maxStacks}; the next accepted skill consumes all stacks for ${p.bonusPerStack*100}% extra damage per stack. Stack interval is a local prototype choice.`;
    case "iron-hook":
      return `Throw the approved Plan B hook in a direction: ${a.castTime}s release, 0.25s flight to maximum range. The first enemy hero/minion hit takes physical damage and is pulled toward Franco, stopping before body overlap. Hook stun is ${p.stunDuration}s after a ${p.pullDuration}s pull. Misses return without damage. Geometry and stun are editable local settings, not measured official units.`;
    case "fury-shock":
      return `Slam at ${a.castTime}s, dealing base physical damage + ${p.maxHpScaling*100}% maximum HP within ${p.radius} world units. Slow enemies by ${p.slowRatio*100}% for ${p.slowDuration}s. Radius is the approved local preview geometry.`;
    case "bloody-hunt":
      return `Suppress one enemy hero for ${p.duration}s and strike ${p.strikes} times at ${Array.from({length:p.strikes},(_,i)=>(p.firstStrike+i*p.strikeInterval).toFixed(2)).join(" / ")} seconds. Listed damage/scaling is per strike. Franco cannot move, attack or cast during the channel. Caster death, interruption, target death or invalidation releases the channel cleanly. Suppression cannot be cleansed.`;
    case "distance-scaling":
      return `Damage increases with distance, up to ${Math.round((p.maxMultiplier - 1) * 100)}% extra at ${p.referenceDistance} units. Does not apply to ${p.excludedKinds.join(" or ")} targets.`;
    case "line-projectile":
      return `Fire a targeted projectile. A hit grants +${p.attackRangeBonus} basic-attack range and +${p.skill2RangeBonus} Skill II range for ${p.buffDuration}s, with ${Math.round((p.speedMultiplier - 1) * 100)}% increased movement speed. Auto/locked shots home to their target and pass through obstacles.`;
    case "orb-mark":
      return `Launch an orb that damages enemies within ${p.blastRadius} units and marks affected surviving enemies for ${p.markDuration}s. A subsequent hit on a marked target triggers ${p.bonusDamage} extra damage and a ${p.stunDuration}s area stun within ${p.stunRadius} units.`;
    case "line-blast":
      return `Fire a continuous ${a.range}-unit-long, ${p.width}-unit-wide beam through enemies in a line. A locked target is tracked until firing; free-aimed casts follow the chosen direction. Active ranks upgrade in training; ultimate ranks unlock at hero levels 4, 8 and 12. No passive range upgrades are implemented.`;
    default:
      return "This ability has no authored presentation description yet.";
  }
}
export function abilityFacts(a) {
  return a.slot === "passive"
    ? a.effectId === "wasteland-force" ? [["Type","Passive"],["No-damage delay",`${a.parameters.noDamageSeconds}s`],["Maximum skill bonus",`${a.parameters.maxStacks*a.parameters.bonusPerStack*100}%`]] : [
        ["Type", "Passive"],
        [
          "Maximum bonus",
          `${Math.round((a.parameters.maxMultiplier - 1) * 100)}%`,
        ],
        ["Reference distance", `${a.parameters.referenceDistance} units`],
      ]
    : [
        ["Base damage", String(a.damage)],
        ["Cooldown", `${a.cooldown}s`],
        ["Mana cost", String(a.manaCost)],
        ["Range", `${a.range} units`],
        ["Windup", `${a.castTime}s`],
        ...(a.damageModel ? [["Damage type", a.damageModel.type], ["Scaling", `${a.damageModel.physicalScaling} × physical attack + ${a.damageModel.magicScaling} × magic power`]] : []),
        ...(a.ranks ? [["Rank damage", a.ranks.damage.join(" / ")], ["Rank cooldowns", a.ranks.cooldown.map(n => `${n}s`).join(" / ")], ["Rank mana", a.ranks.manaCost.join(" / ")], ["Rank unlock levels", a.ranks.requiredLevels.join(" / ")]] : []),
      ];
}
