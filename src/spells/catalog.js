import data from "../data/spells/spells.json" with { type: "json" };
export const spells = data.spells;
export const getSpell = (id) => spells.find((s) => s.id === id);
export { data as spellData };
const required = {
  execute: "range base perLevel lostHp killCooldownReduction",
  retribution:
    "range base perLevel creepReward creepReduction jungleReduction jungleSeconds noShareSeconds upgradeActions statsActions physicalBonus magicBonus hpBonus",
  inspire: "duration charges speed cap penetration penetrationPerLevel heal",
  sprint: "duration speed",
  revitalize: "duration interval heal bonus radius followsCaster",
  aegis: "duration base perLevel",
  petrify: "radius base perLevel duration slow slowDuration",
  purify: "duration speed",
  flameshot: "range speed radius min max knockbackRadius knockback",
  flicker: "range duration defenseBase defensePerLevel",
  vengeance: "duration reduction reflection",
  arrival: "channel speed speedDuration refund safeRadius",
};
export function validateSpells(source = data) {
  const seen = new Set();
  for (const s of source.spells) {
    if (
      seen.has(s.id) ||
      !s.name ||
      !s.ability ||
      !s.strategy ||
      !s.icon ||
      !s.vfx
    )
      throw Error("Invalid/duplicate spell " + s.id);
    seen.add(s.id);
    if (
      !required[s.id] ||
      !s.parameters ||
      ![
        "enemy-hero",
        "creep-minion",
        "self",
        "self-area",
        "enemy-area",
        "direction",
        "ally-destination",
      ].includes(s.target)
    )
      throw Error("Unknown spell executor/target: " + s.id);
    for (const key of required[s.id].split(" "))
      if (!Object.hasOwn(s.parameters, key))
        throw Error("Missing spell parameter: " + s.id + "." + key);
    if (
      !Number.isFinite(s.cooldown) ||
      s.cooldown <= 0 ||
      !Number.isInteger(s.unlockLevel) ||
      s.unlockLevel < 1 ||
      s.unlockLevel > 25
    )
      throw Error("Invalid cooldown/unlock " + s.id);
    for (const [k, v] of Object.entries(s.parameters))
      if (typeof v !== "boolean" && (!Number.isFinite(v) || v < 0))
        throw Error("Invalid spell parameter " + s.id + "." + k);
    if (!s.roles.length || !s.modes.length)
      throw Error("Missing spell roles/modes " + s.id);
  }
  if (seen.size !== 12) throw Error("Exactly twelve spells required");
  return true;
}
validateSpells();
export const unlocked = (id, accountLevel) =>
  Boolean(
    getSpell(id) &&
      Number.isInteger(accountLevel) &&
      getSpell(id).unlockLevel <= accountLevel,
  );
