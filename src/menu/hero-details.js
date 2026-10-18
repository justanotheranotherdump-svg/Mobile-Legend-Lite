import { CREATION_ARTWORK, imageIcon } from "./art.js";
import { walletMarkup } from "./wallet-view.js";
import {
  HERO_PRESENTATION,
  RATING_LABELS,
  abilityDescription,
  abilityFacts,
} from "./hero-presentation.js";
import { abilityIcon, abilityLabel } from "./hero-icons.js";
export function mountHeroDetails(root, hero, wallet, onBack) {
  const info = HERO_PRESENTATION[hero.id];
  root.innerHTML = `<section class="hero-detail-screen" aria-labelledby="hero-detail-title"><div class="hero-detail-art" aria-hidden="true"><img src="${CREATION_ARTWORK}" alt="" draggable="false"></div><div class="hero-detail-shade" aria-hidden="true"></div><header class="hero-detail-header"><button id="hero-detail-back" class="front-back" type="button">${imageIcon("back")}<span>Shop</span></button>${walletMarkup(wallet)}</header>
 <aside class="hero-detail-info"><p class="menu-kicker">${info.title}</p><h1 id="hero-detail-title"></h1><p class="hero-role-label"></p><p class="hero-specialty">${info.specialty}</p><div class="hero-ratings"><p>PROTOTYPE RATINGS <span title="Authored UI-only ratings. Not official values or gameplay modifiers." aria-hidden="true">?</span></p>${Object.entries(
   RATING_LABELS,
 )
   .map(
     ([key, label]) =>
       `<div class="hero-rating"><div><span>${label}</span><b>${info.ratings[key]} / 10</b></div><div class="rating-track" role="meter" aria-label="${label}, prototype rating" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${info.ratings[key]}"><i style="width:${info.ratings[key] * 10}%"></i></div></div>`,
   )
   .join(
     "",
   )}<small class="ratings-disclaimer">UI-only ratings · not combat stats.</small></div><details class="hero-stats-details"><summary>Level 1 training stats</summary><div class="hero-base-facts"><span>HP <b>${hero.baseStats.maxHp}</b></span><span>Mana <b>${hero.baseStats.maxMana}</b></span><span>Physical attack <b>${hero.baseStats.physicalAttack}</b></span><span>Range <b>${hero.baseStats.attackRange} (${hero.basicAttack.range} world)</b></span></div></details><p class="hero-kit-label">Reconstructed kit · rank 1 previews</p><nav class="hero-ability-buttons" aria-label="Inspect abilities">${hero.abilities.map((a) => `<button type="button" data-inspect-ability="${a.id}" aria-label="Inspect ${a.name}" aria-pressed="false"><span class="ability-icon">${abilityIcon(a.slot)}</span><span>${abilityLabel(a.slot)}</span></button>`).join("")}</nav><p class="hero-skill-hint">Select an ability to read its details.</p></aside>
 <aside class="hero-appearance" aria-label="Available appearance"><p>APPEARANCE</p><div><img id="hero-detail-portrait" src="${CREATION_ARTWORK}" alt="${hero.name} original illustration"><span>Original illustration</span></div><small>Only this artwork is available.<br>No skins or purchases.</small></aside><div class="hero-owned-footer"><span>OWNED · STARTING HERO</span><small>Artwork preview · training keeps the approved 3D model</small></div>
 <section class="hero-ability-sheet" data-ability-sheet role="dialog" aria-modal="false" aria-labelledby="ability-title" hidden><header><div><p class="menu-kicker" data-ability-slot></p><h2 id="ability-title"></h2></div><button id="ability-close" type="button" aria-label="Close ability details">×</button></header><div class="ability-sheet-scroll"><p class="ability-version-note">Prototype rank 1 preview + editable rank tables · not official balance</p><p id="ability-description"></p><dl class="ability-facts"></dl><details class="ability-note"><summary>Notes & controls</summary><p data-ability-notes></p><p>Physical damage uses this prototype’s damage rules. Levels 1–15 and active ranks work in training. Crit chance, lifesteal, spell vamp and equipment are not implemented. No commercial gameplay videos are bundled.</p></details></div><footer><span>READ-ONLY HERO GUIDE</span><small>Escape or × closes details</small></footer></section></section>`;
  root.querySelector("#hero-detail-title").textContent = hero.name;
  root.querySelector(".hero-role-label").textContent = hero.role;
  const sheet = root.querySelector("[data-ability-sheet]");
  let lastButton = null;
  const close = () => {
    sheet.hidden = true;
    root
      .querySelectorAll("[data-inspect-ability]")
      .forEach((b) => b.setAttribute("aria-pressed", "false"));
    lastButton?.focus({ preventScroll: true });
  };
  root.querySelector("#ability-close").addEventListener("click", close);
  for (const button of root.querySelectorAll("[data-inspect-ability]"))
    button.addEventListener("click", () => {
      const a = hero.abilities.find(
        (a) => a.id === button.dataset.inspectAbility,
      );
      lastButton = button;
      root
        .querySelectorAll("[data-inspect-ability]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      root.querySelector("[data-ability-slot]").textContent = abilityLabel(
        a.slot,
      );
      root.querySelector("#ability-title").textContent = a.name;
      root.querySelector("#ability-description").textContent =
        abilityDescription(a);
      const facts = root.querySelector(".ability-facts");
      facts.replaceChildren();
      for (const [label, value] of abilityFacts(a)) {
        const pair = document.createElement("div"),
          dt = document.createElement("dt"),
          dd = document.createElement("dd");
        dt.textContent = label;
        dd.textContent = value;
        pair.append(dt, dd);
        facts.append(pair);
      }
      root.querySelector("[data-ability-notes]").textContent =
        a.slot === "passive"
          ? "This passive applies automatically. Inspecting it does not activate or simulate a match."
          : "In Training: tap the bound skill button/key to auto-target; hold to preview aim, release to cast. Escape, right-click or the CANCEL area cancels. A rejected cast spends no mana or cooldown. Accepted casts use the full Shoot movement lock.";
      root.querySelector(".ability-note").open = false;
      sheet.hidden = false;
      root.querySelector(".ability-sheet-scroll").scrollTop = 0;
      root.querySelector("#ability-close").focus({ preventScroll: true });
    });
  root.querySelector("#hero-detail-back").addEventListener("click", onBack);
  root.querySelector("#hero-detail-back").focus({ preventScroll: true });
}
