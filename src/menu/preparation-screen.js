import { catalogItems as wikiItems, getCatalogItem } from "../match/catalog.js";
import { emptyEmblemLayout } from "./emblem-layout.js";
import { renderBuildPresets } from "./build-presets.js";
import { mountVisualBuilds } from "./visual-build-editor.js";
import { items, getItem, recipeData, recipeQuote } from "../match/recipes.js";
import { ITEM_ART } from "../ui/item-art.js";
import { COMBAT_ART } from "../ui/combat-art.js";
import { textStats } from "../ui/match-shop.js";
import { openBattleScreen } from "./battle-screen.js";
import "./preparation.css";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const itemImage = (i) => ITEM_ART[i.id] || COMBAT_ART[i.icon];
export function recipeMarkup(node, nextId = null) {
  const i = getItem(node.id);
  return `<li class="${node.ownedSlot >= 0 ? "recipe-owned" : ""} ${node.id === nextId ? "recipe-next" : ""}"><button type="button" data-wiki-item="${i.id}"><img src="${itemImage(i)}" alt=""><b>${i.name}</b><small>${i.cost} gold${node.ownedSlot >= 0 ? " · OWNED" : ""}</small></button>${node.children.length ? `<ul>${node.children.map((n) => recipeMarkup(n, nextId)).join("")}</ul>` : ""}</li>`;
}
export function mountPreparation(
  root,
  { builds, account, owned, onBack, initial = "setup" },
) {
  let tab = initial,
    hero = owned[0],
    selectedItem = "swift-boots",
    editing = null,
    draft = [],
    query = "",
    category = "All";
  let closeSpells = null;
  const paint = () => {
    closeSpells?.dispose?.();
    closeSpells = null;
    root.innerHTML = `<section class="prep-screen"><header><button type="button" id="prep-back">‹ Lobby</button><h1>PREPARATION</h1><small>YOUR LOADOUT · OFFLINE</small></header><nav class="prep-nav">${[
      ["setup", "Battle Setup", "setup"],
      ["spells", "Battle Spells", "spell"],
      ["equipment", "Equipment", "equipment"],
      ["emblems", "Emblems", "emblem"],
    ]
      .map(
        ([id, n, icon]) =>
          `<button type="button" data-prep-tab="${id}" aria-pressed="${tab === id}"><span class="prep-nav-symbol nav-${icon}" aria-hidden="true"></span>${n}${id === "emblems" ? "<small>COMING LATER</small>" : ""}</button>`,
      )
      .join("")}</nav><main class="prep-body" id="prep-body"></main></section>`;
    root.querySelector("#prep-back").onclick = onBack;
    root.querySelectorAll("[data-prep-tab]").forEach(
      (b) =>
        (b.onclick = () => {
          tab = b.dataset.prepTab;
          paint();
        }),
    );
    const body = root.querySelector("#prep-body");
    if (tab === "emblems") {
      body.innerHTML = emptyEmblemLayout();
      return;
    }
    if (tab === "spells") {
      closeSpells = openBattleScreen(
        account,
        () => {
          tab = "setup";
          paint();
        },
        { host: body },
      );
      return;
    }
    if (tab === "equipment") {
      const list = wikiItems.filter(
        (i) =>
          (category === "All" || i.category === category) &&
          (i.name + " " + i.description)
            .toLowerCase()
            .includes(query.toLowerCase()),
      );
      const i = getCatalogItem(selectedItem) || wikiItems[0],
        ordinary = ["standard_purchase", "consumable"].includes(i.type),
        q = ordinary ? recipeQuote(i.id, Array(6).fill(null)) : null;
      const setup = builds.hero(hero).roleSetup,
        selected = setup?.blessingId === i.id;
      body.innerHTML = `<div class="wiki-tools"><h2>Equipment Wiki</h2><label>Role intention for <select id="wiki-role-hero">${owned.map(id=>`<option value="${id}" ${id===hero?"selected":""}>${id}</option>`).join("")}</select></label><input id="wiki-search" aria-label="Search equipment wiki" placeholder="Search equipment" value="${esc(query)}"><select id="wiki-category" aria-label="Equipment category">${["All", ...new Set(wikiItems.map((i) => i.category))].map((c) => `<option value="${c}" ${c === category ? "selected" : ""}>${c} (${c === "All" ? wikiItems.length : wikiItems.filter((i) => i.category === c).length})</option>`).join("")}</select></div><p class="wiki-results-count">${category} · ${list.length} entries. Defense has 25 unique records; duplicate Fleeting Time is listed once under Magic.</p><div class="wiki-layout"><div class="prep-catalog">${list.map((x) => `<button type="button" data-wiki-item="${x.id}" aria-pressed="${x.id === i.id}"><img src="${itemImage(x)}" alt=""><strong>${x.name}</strong><small>${x.cost} gold · ${recipeData.items[x.id]?.tier || x.type.replaceAll("_", " ")}</small></button>`).join("") || "<p>No matching items.</p>"}</div><article class="wiki-detail"><img class="editor-detail-icon" src="${itemImage(i)}" alt="${i.name}"><h2>${i.name}</h2><p>${i.cost} Gold · ${i.type.replaceAll("_", " ")}</p><ul>${textStats(
        i,
      )
        .map((s) => `<li>${s}</li>`)
        .join("")}</ul><p>${i.description}</p>${
        ordinary
          ? `<h3>${i.type === "consumable" ? "Consumed on purchase; no equipment slot or resale" : "Recipe tree"}</h3><ul class="wiki-tree">${recipeMarkup(q.tree)}</ul><p>Full price ${i.cost} Gold. Actual owned components reduce match combine cost.</p><h4>Builds towards</h4>${
              items
                .filter((x) => recipeData.items[x.id].components.includes(i.id))
                .map(
                  (x) =>
                    `<button type="button" data-wiki-item="${x.id}">${x.name}</button>`,
                )
                .join(" ") || "<small>No further upgrade</small>"
            }<p><small>Recipes are explicitly local prototype reconstructions, not official recipes.</small></p>`
          : `<h3>Acquisition requirements</h3><p>0 Gold does not mean free purchase. No ordinary recipe or resale. Blessings attach to valid boots outside the six equipment slots; exactly one role intention is allowed.</p>${i.type === "hero_exclusive" ? '<p class="special-restriction">Unavailable: Floryn does not exist in this two-hero prototype. No effects applied.</p>' : `<p>Selected intent: <strong>${selected ? "THIS BLESSING" : setup?.blessingId || "none"}</strong>. Effects remain inactive until valid spell, boots and match progression. Classic ruleset; see source-conflict notes.</p><button data-choose-blessing="${i.id}" ${selected ? "disabled" : ""}>${selected ? "Selected for next match" : "Choose next-match " + (i.type === "jungle_blessing" ? "Jungle" : "Roam") + " intention"}</button>${selected ? '<button id="clear-blessing">Clear intention</button>' : ""}`}`
      }</article></div>`;
      body.querySelector("#wiki-role-hero").onchange=e=>{hero=e.target.value;paint();};
      body
        .querySelector("[data-choose-blessing]")
        ?.addEventListener("click", () => {
          builds.setRoleSetup(hero, {
            kind: i.type === "jungle_blessing" ? "jungle" : "roam",
            blessingId: i.id,
          });
          paint();
        });
      body.querySelector("#clear-blessing")?.addEventListener("click", () => {
        builds.setRoleSetup(hero, null);
        paint();
      });

      body.querySelectorAll("[data-wiki-item]").forEach(
        (b) =>
          (b.onclick = () => {
            selectedItem = b.dataset.wikiItem;
            paint();
          }),
      );
      body.querySelector("#wiki-search").onchange = (e) => {
        query = e.target.value;
        paint();
      };
      body.querySelector("#wiki-category").onchange = (e) => {
        category = e.target.value;
        selectedItem =
          wikiItems.find((i) => category === "All" || i.category === category)
            ?.id || selectedItem;
        paint();
      };
      return;
    }
    mountVisualBuilds(body, {
      builds,
      owned,
      account,
      openEquipment: (id) => {
        selectedItem = id;
        tab = "equipment";
        paint();
      },
      renderRecipe: recipeMarkup,
      presets: (root, ctx) => renderBuildPresets(root, ctx, account),
      openSpells: (done) => {
        closeSpells = openBattleScreen(account, done);
      },
    });
  };
  paint();
  return () => {
    closeSpells?.dispose?.();
  };
}
