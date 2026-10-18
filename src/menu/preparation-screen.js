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
    root.innerHTML = `<section class="prep-screen"><header><button type="button" id="prep-back">‹ Lobby</button><h1>PREPARATION</h1><small>YOUR LOADOUT · OFFLINE</small></header><nav class="prep-nav">${[
      ["setup", "Battle Setup", "⚔"],
      ["spells", "Battle Spells", "ϟ"],
      ["equipment", "Equipment", "◇"],
      ["emblems", "Emblems", "✦"],
    ]
      .map(
        ([id, n, icon]) =>
          `<button type="button" data-prep-tab="${id}" aria-pressed="${tab === id}"><span>${icon}</span>${n}${id === "emblems" ? "<small>COMING LATER</small>" : ""}</button>`,
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
      body.innerHTML =
        '<h2>Emblems</h2><div class="emblem-preview"><span>✦</span><span>◇</span><span>✧</span></div><h3>Coming in a future update</h3><p>Layout preview only. No emblem stats, talents, upgrades or currency deductions are active.</p>';
      return;
    }
    if (tab === "spells") {
      body.innerHTML =
        '<h2>Battle Spell Wiki</h2><p>Inspect all twelve actual spells, cooldowns, effects and account unlocks.</p><button type="button" id="prep-spells">Browse spells / change equipped spell</button>';
      body.querySelector("button").onclick = () =>
        (closeSpells = openBattleScreen(account, () => {}));
      return;
    }
    if (tab === "equipment") {
      const i = getItem(selectedItem),
        q = recipeQuote(i.id, Array(6).fill(null));
      body.innerHTML = `<div class="wiki-tools"><h2>Equipment Wiki</h2><input id="wiki-search" aria-label="Search equipment wiki" placeholder="Search equipment" value="${esc(query)}"><select id="wiki-category" aria-label="Equipment category">${["All", ...new Set(items.map((i) => i.category))].map((c) => `<option ${c === category ? "selected" : ""}>${c}</option>`).join("")}</select></div><div class="wiki-layout"><div class="prep-catalog">${items
        .filter(
          (i) =>
            (category === "All" || i.category === category) &&
            (i.name + i.description)
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .map(
          (i) =>
            `<button type="button" data-wiki-item="${i.id}"><img src="${itemImage(i)}" alt=""><strong>${i.name}</strong><small>${i.cost} gold · ${recipeData.items[i.id].tier}</small></button>`,
        )
        .join(
          "",
        )}</div><article class="wiki-detail"><ul class="wiki-tree">${recipeMarkup(q.tree)}</ul><h2>${i.name}</h2><ul>${textStats(
        i,
      )
        .map((s) => `<li>${s}</li>`)
        .join(
          "",
        )}</ul><p>${i.description}</p><p>Full price: ${i.cost} gold. Owned components reduce the combine cost in matches.</p><small>Recipes are editable local prototype reconstructions, not official recipes.</small></article></div>`;
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
        paint();
      };
      return;
    }
    const h = builds.hero(hero);
    body.innerHTML = `<div class="prep-hero-strip"><img src="${COMBAT_ART.layla}" alt="Layla"><label>Owned hero<select id="build-hero">${owned.map((id) => `<option value="${id}">${esc(id)}</option>`).join("")}</select></label><button id="prep-change-spell" type="button">Battle Spell · ${account.value.selected} · Lv ${account.level}</button></div><h2>My Setups <small>Hero-specific purchase order</small></h2><p>Saved builds automatically prioritize missing components in matches. Purchases still require your confirmation.</p><div class="saved-builds">${h.builds.map((b) => `<article class="saved-build ${h.selected === b.id ? "in-use" : ""}"><h3>${esc(b.name)}</h3><div class="build-item-row">${b.items.map((id) => `<img src="${itemImage(getItem(id))}" alt="${getItem(id).name}" title="${getItem(id).name}">`).join("")}</div><button type="button" data-build-use="${b.id}" ${h.selected === b.id ? "disabled" : ""}>${h.selected === b.id ? "IN USE" : "USE"}</button><button type="button" data-build-edit="${b.id}">Edit</button><button type="button" data-build-delete="${b.id}">Delete build</button></article>`).join("") || "<p>No custom builds yet. Existing manual item priority remains available.</p>"}</div><button id="new-build" type="button" ${h.builds.length >= 3 ? "disabled" : ""}>＋ Create build</button><button id="no-build" type="button">Use manual item priority</button><section id="build-editor" ${editing === null ? "hidden" : ""}><h3>Edit purchase sequence</h3><label>Build name<input id="build-name" maxlength="32" value="${esc(editing?.name || "My build")}"></label><ol class="build-draft">${draft.map((id, n) => `<li><img src="${itemImage(getItem(id))}" alt="">${getItem(id).name}<button type="button" data-move="${n}" ${n === 0 ? "disabled" : ""}>Move earlier</button><button type="button" data-remove="${n}">Remove</button></li>`).join("")}</ol><label>Add completed item<select id="build-add"><option value="">Choose equipment…</option>${items
      .filter((i) => recipeData.items[i.id].tier === "completed")
      .map((i) => `<option value="${i.id}">${i.name} · ${i.cost}</option>`)
      .join(
        "",
      )}</select></label><button id="save-build" type="button">Save & use build</button><p id="build-message" role="status"></p></section>`;
    body.querySelector("#build-hero").onchange = (e) => {
      hero = e.target.value;
      editing = null;
      paint();
    };
    body.querySelector("#prep-change-spell").onclick = () =>
      (closeSpells = openBattleScreen(account, paint));
    body.querySelectorAll("[data-build-use]").forEach(
      (b) =>
        (b.onclick = () => {
          builds.select(hero, b.dataset.buildUse);
          paint();
        }),
    );
    body.querySelectorAll("[data-build-edit]").forEach(
      (b) =>
        (b.onclick = () => {
          editing = structuredClone(
            h.builds.find((x) => x.id === b.dataset.buildEdit),
          );
          draft = [...editing.items];
          paint();
        }),
    );
    body.querySelectorAll("[data-build-delete]").forEach(
      (b) =>
        (b.onclick = () => {
          builds.remove(hero, b.dataset.buildDelete);
          paint();
        }),
    );
    body.querySelector("#new-build").onclick = () => {
      editing = {};
      draft = [];
      paint();
    };
    body.querySelector("#no-build").onclick = () => {
      builds.select(hero, null);
      paint();
    };
    const preserveName = () => {
      editing.name = body.querySelector("#build-name").value;
    };
    body.querySelectorAll("[data-move]").forEach(
      (b) =>
        (b.onclick = () => {
          preserveName();
          const n = +b.dataset.move;
          [draft[n - 1], draft[n]] = [draft[n], draft[n - 1]];
          paint();
        }),
    );
    body.querySelectorAll("[data-remove]").forEach(
      (b) =>
        (b.onclick = () => {
          preserveName();
          draft.splice(+b.dataset.remove, 1);
          paint();
        }),
    );
    body.querySelector("#build-add").onchange = (e) => {
      preserveName();
      if (e.target.value && draft.length < 6 && !draft.includes(e.target.value))
        draft.push(e.target.value);
      paint();
    };
    body.querySelector("#save-build").onclick = () => {
      const r = builds.saveBuild(hero, {
        ...editing,
        name: body.querySelector("#build-name").value,
        items: draft,
      });
      if (r === "ok") {
        editing = null;
        paint();
      } else
        body.querySelector("#build-message").textContent =
          "Choose 1–6 unique completed items, at most one pair of boots, and a build name.";
    };
  };
  paint();
  return () => {
    closeSpells?.();
  };
}
