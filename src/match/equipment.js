import { purchaseQuote } from "./recipes.js";
import { equipment } from "./config.js";
import { calculateAttributes } from "../simulation/stats/attributes.js";
import { number, integer } from "../simulation/stats/validation.js";
export function validateEquipment(hero) {
  integer(equipment.slots, "items.slots", 6, 6);
  number(equipment.refundRatio, "items.refundRatio", 0, 1);
  const ids = new Set();
  for (const item of equipment.items) {
    if (ids.has(item.id)) throw Error(`items.${item.id}: duplicate ID`);
    ids.add(item.id);
    integer(item.cost, `items.${item.id}.cost`, 1);
    integer(item.maxCopies, `items.${item.id}.maxCopies`, 1, 6);
    number(item.criticalChance, `items.${item.id}.criticalChance`, 0, 1);
    number(item.lifesteal, `items.${item.id}.lifesteal`, 0, 1);
    calculateAttributes(hero, 1, { items: item.modifiers });
  }
}
export function inventoryBonuses(inventory) {
  const flat = {},
    percent = {};
  let criticalChance = 0,
    lifesteal = 0;
  for (const id of inventory) {
    if (!id) continue;
    const item = equipment.items.find((i) => i.id === id);
    if (!item) throw Error(`inventory.${id}: unknown item`);
    for (const [k, v] of Object.entries(item.modifiers.flat))
      flat[k] = (flat[k] || 0) + v;
    for (const [k, v] of Object.entries(item.modifiers.percent))
      percent[k] = (percent[k] || 0) + v;
    criticalChance += item.criticalChance;
    lifesteal += item.lifesteal;
  }
  const chosen = inventory
    .filter(Boolean)
    .map((id) => equipment.items.find((i) => i.id === id));
  const effects = [...new Set(chosen.flatMap((i) => i.effects || []))];
  if (effects.includes("swift")) {
    percent.attackSpeed = (percent.attackSpeed || 0) + criticalChance;
    criticalChance = 0;
  }
  return {
    effects,
    cooldownReduction: Math.min(
      0.4,
      chosen.reduce((v, i) => v + (i.cooldownReduction || 0), 0),
    ),
    spellVamp: chosen.reduce((v, i) => v + (i.spellVamp || 0), 0),
    physicalPenetration: chosen.reduce(
      (n, i) => n + (i.physicalPenetration || 0),
      0,
    ),
    modifiers: { flat, percent },
    criticalChance: Math.min(1, criticalChance),
    lifesteal: Math.min(0.5, lifesteal),
  };
}
// Compute transaction first; caller commits gold/inventory/attributes together.
export function purchase(gold, inventory, id, replace = null) {
  if (replace !== null) return { error: "manual-replacement-removed" };
  return purchaseQuote(gold, inventory, id);
}

export function sell(gold, inventory, slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= 6)
    return { error: "invalid-slot" };
  const item = equipment.items.find((i) => i.id === inventory[slot]);
  if (!item) return { error: "empty-slot" };
  const next = [...inventory];
  next[slot] = null;
  return {
    gold: gold + Math.floor(item.cost * equipment.refundRatio),
    inventory: next,
  };
}
