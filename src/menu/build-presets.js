import {francoPresets,francoPresetInfo,useFrancoPreset,sameBuildOrder} from "../player/franco-presets.js";
import {getItem} from "../match/recipes.js";
import data from "../data/preparation/layla-presets.json" with { type: "json" };
import { slotsMarkup } from "./visual-build-editor.js";
import { SPELL_ART } from "../spells/art.js";
import { getSpell, unlocked } from "../spells/catalog.js";
export const laylaPresets = Object.freeze(
  data.presets.map((p) =>
    Object.freeze({ ...p, items: Object.freeze([...p.items]) }),
  ),
);
export function renderBuildPresets(root, { hero, open, builds, paint }, account) {
  if(hero === "franco") return renderFrancoPresets(root,{open,builds,paint},account);
  if (hero !== data.hero) return;
  root.innerHTML = `<section class="community-presets"><h2>Community Starting Presets</h2><p>${data.label}</p><p>${data.emblemNote}</p>${laylaPresets.map((p) => `<article class="saved-build preset-build"><header><h3>${p.name}</h3><small>TEMPLATE · EDIT A COPY</small></header><div class="visual-build-slots">${slotsMarkup(p.items)}</div><p>${p.purpose}</p><div class="preset-spell"><img src="${SPELL_ART[p.spell]}" alt=""><span>Suggested ${getSpell(p.spell).name} · ${unlocked(p.spell, account.level) ? "available" : "locked until account level " + getSpell(p.spell).unlockLevel} — equip separately</span></div><button type="button" data-preset-copy="${p.id}">Customize copy</button></article>`).join("")}<small>Original templates never change. Prices and effects in this prototype use the local equipment registry, not a live-patch promise.</small></section>`;
  for (const b of root.querySelectorAll("[data-preset-copy]"))
    b.onclick = () => {
      const p = laylaPresets.find((x) => x.id === b.dataset.presetCopy);
      open({ name: p.name, items: [...p.items] });
    };
}

function renderFrancoPresets(root,{open,builds,paint},account){
 const active=builds?.selected("franco"),saved=builds?.hero("franco").builds||[];
 root.innerHTML=`<section class="community-presets franco-recommendations"><h2>Franco Recommended Builds</h2><p>${francoPresetInfo.label}</p><p>${francoPresetInfo.emblemNote}</p><p>Use saves/selects an editable copy as your active match-shop order. It does not buy or grant equipment.</p>${francoPresets.map(p=>{
  const inUse=!!active&&sameBuildOrder(active.items,p.items),existing=saved.some(b=>sameBuildOrder(b.items,p.items)),full=saved.length>=3&&!existing;
  const cost=p.items.reduce((sum,id)=>sum+getItem(id).cost,0);
  return `<article class="saved-build preset-build ${inUse?"in-use":""}" data-franco-preset="${p.id}"><header><h3>${p.name}</h3><small>${inUse?"IN USE":"RECOMMENDED TEMPLATE"}</small></header><div class="visual-build-slots">${slotsMarkup(p.items)}</div><ol class="preset-item-order">${p.items.map(id=>`<li>${getItem(id).name}</li>`).join("")}</ol><p>${p.purpose}</p><p class="preset-build-cost">Full build: ${cost.toLocaleString("en-US")} match gold · components purchased normally</p><div class="preset-spell"><img src="${SPELL_ART[p.spell]}" alt=""><span>Suggested ${getSpell(p.spell).name} · ${unlocked(p.spell,account.level)?"available":"locked until account level "+getSpell(p.spell).unlockLevel} — equip separately</span></div><div class="build-actions"><button type="button" data-preset-use="${p.id}" ${inUse||full?"disabled":""} ${full?'title="Three custom builds saved. Edit/delete one to make room; existing builds are never overwritten."':""}>${inUse?"In use":"Use build"}</button><button type="button" data-preset-copy="${p.id}">Customize copy</button></div>${full?"<p>Three custom builds saved. Edit or delete one before adding this preset; your setups are never overwritten.</p>":""}</article>`;
 }).join("")}<small>Templates stay unchanged. Six paid equipment slots, one boots item, and the existing three-custom-build limit still apply.</small><p data-preset-result role="status"></p></section>`;
 for(const button of root.querySelectorAll("[data-preset-copy]"))button.onclick=()=>{
  const p=francoPresets.find(p=>p.id===button.dataset.presetCopy);open({name:p.name,items:[...p.items]});
 };
 for(const button of root.querySelectorAll("[data-preset-use]"))button.onclick=()=>{
  const result=useFrancoPreset(builds,button.dataset.presetUse);
  if(result==="ok")paint();else root.querySelector("[data-preset-result]").textContent=result==="three-build-limit"?"Three custom builds saved; edit or delete a build first.":"Cannot use this build for an unowned hero.";
 };
}
