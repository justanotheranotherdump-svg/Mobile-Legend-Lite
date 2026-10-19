import base from "../data/match/items.json" with { type: "json" };
import extra from "../data/match/extra-items.json" with { type: "json" };
import special from "../data/match/special-equipment.json" with { type: "json" };
export const equipment = {
  ...base,
  items: [
    ...base.items.map((i) => ({ ...i, type: "standard_purchase" })),
    ...extra.items,
  ],
};
export const catalogItems = [
  ...equipment.items,
  ...special.items.map((i) => ({
    ...i,
    modifiers: { flat: {}, percent: {} },
    effects: [],
    criticalChance: 0,
    lifesteal: 0,
    cooldownReduction: 0,
    spellVamp: 0,
    maxCopies: 1,
  })),
];
export const getCatalogItem = (id) => catalogItems.find((i) => i.id === id);
export const categoryItems = (category) =>
  catalogItems.filter(
    (i) =>
      category === "All" ||
      i.category === category ||
      i.categories?.includes(category),
  );

// Legacy Wayfarer Boots stays in its historical category, but is still footwear.
export const isBootItem = item => Boolean(item && (item.category === "Movement" || item.id === "boots"));
