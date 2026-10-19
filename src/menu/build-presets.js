import data from "../data/preparation/layla-presets.json" with { type: "json" };
import { slotsMarkup } from "./visual-build-editor.js";
import { SPELL_ART } from "../spells/art.js";
import { getSpell, unlocked } from "../spells/catalog.js";
export const laylaPresets = Object.freeze(
  data.presets.map((p) =>
    Object.freeze({ ...p, items: Object.freeze([...p.items]) }),
  ),
);
export function renderBuildPresets(root, { hero, open }, account) {
  if (hero !== data.hero) return;
  root.innerHTML = `<section class="community-presets"><h2>Community Starting Presets</h2><p>${data.label}</p><p>${data.emblemNote}</p>${laylaPresets.map((p) => `<article class="saved-build preset-build"><header><h3>${p.name}</h3><small>TEMPLATE · EDIT A COPY</small></header><div class="visual-build-slots">${slotsMarkup(p.items)}</div><p>${p.purpose}</p><div class="preset-spell"><img src="${SPELL_ART[p.spell]}" alt=""><span>Suggested ${getSpell(p.spell).name} · ${unlocked(p.spell, account.level) ? "available" : "locked until account level " + getSpell(p.spell).unlockLevel} — equip separately</span></div><button type="button" data-preset-copy="${p.id}">Customize copy</button></article>`).join("")}<small>Original templates never change. Prices and effects in this prototype use the local equipment registry, not a live-patch promise.</small></section>`;
  for (const b of root.querySelectorAll("[data-preset-copy]"))
    b.onclick = () => {
      const p = laylaPresets.find((x) => x.id === b.dataset.presetCopy);
      open({ name: p.name, items: [...p.items] });
    };
}
