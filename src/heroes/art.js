// Explicit URLs keep Node-side UI tests importable and Vite embeds every local PNG.
const art = {
  layla: {
    portrait: new URL("./layla/assets/portrait.png", import.meta.url).href,
    "character-portrait": new URL(
      "./layla/assets/character-portrait.png",
      import.meta.url,
    ).href,
    "showcase-background": new URL(
      "./layla/assets/showcase-background.png",
      import.meta.url,
    ).href,
    passive: new URL("./layla/assets/passive.png", import.meta.url).href,
    "skill-1": new URL("./layla/assets/skill-1.png", import.meta.url).href,
    "skill-2": new URL("./layla/assets/skill-2.png", import.meta.url).href,
    ultimate: new URL("./layla/assets/ultimate.png", import.meta.url).href,
  },
  franco: {
    portrait: new URL("./franco/assets/portrait.png", import.meta.url).href,
    "character-portrait": new URL(
      "./franco/assets/character-portrait.png",
      import.meta.url,
    ).href,
    "showcase-background": new URL(
      "./franco/assets/showcase-background.png",
      import.meta.url,
    ).href,
    passive: new URL("./franco/assets/passive.png", import.meta.url).href,
    "skill-1": new URL("./franco/assets/skill-1.png", import.meta.url).href,
    "skill-2": new URL("./franco/assets/skill-2.png", import.meta.url).href,
    ultimate: new URL("./franco/assets/ultimate.png", import.meta.url).href,
  },
};
export function heroArt(id, kind = "portrait") {
  return art[id]?.[kind] || null;
}
export function heroSkillArt(id, slot) {
  return heroArt(id, slot === "skill-ultimate" ? "ultimate" : slot);
}
