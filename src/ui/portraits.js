const layla = new URL("./assets/layla-portrait.png", import.meta.url).href;
// One approved-art crop shared across every hero identity location. Training
// fixtures are not playable heroes and deliberately have no invented portrait.
export const HERO_PORTRAITS = Object.freeze({ layla });
export const getHeroPortrait = (id) => HERO_PORTRAITS[id] || null;
