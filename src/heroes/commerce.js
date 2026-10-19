import franco from "./franco/commerce.json" with { type: "json" };
export const HERO_OFFERS = Object.freeze({
  franco: Object.freeze({
    ...franco,
    prices: Object.freeze({ ...franco.prices }),
  }),
});
export const playableHeroIds = Object.freeze(["layla", "franco"]);
