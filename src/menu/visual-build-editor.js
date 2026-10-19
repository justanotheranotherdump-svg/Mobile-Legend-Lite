import {getHeroPortrait} from "../ui/portraits.js";
import { catalogItems, getCatalogItem } from "../match/catalog.js";
import { items, getItem, recipeData, recipeQuote } from "../match/recipes.js";
import { ITEM_ART } from "../ui/item-art.js";
import { COMBAT_ART } from "../ui/combat-art.js";
import { textStats } from "../ui/match-shop.js";
import { placeBuildItem, moveBuildSlot } from "../player/build-editor.js";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (i) => ITEM_ART[i.id] || COMBAT_ART[i.icon];
const slotsMarkup = (slots, interactive = false, selected = -1) =>
  Array.from({ length: 6 }, (_, n) => {
    const i = getItem(slots[n]);
    return `<${interactive ? 'button type="button"' : "span"} class="visual-build-slot ${n === selected ? "selected" : ""}" ${interactive ? `data-build-slot="${n}" aria-label="Equipment slot ${n + 1}${i ? ": " + i.name : ": empty"}"` : ""}><small>${n + 1}</small>${i ? `<img src="${icon(i)}" alt="${i.name}" title="${i.name}">` : '<span class="empty-slot-cross" aria-hidden="true"></span>'}</${interactive ? "button" : "span"}>`;
  }).join("");
export { slotsMarkup };
export function mountVisualBuilds(
  body,
  {
    builds,
    owned,
    account,
    openSpells,
    openEquipment,
    renderRecipe,
    presets = [],
  },
) {
  let hero = owned[0],
    editing = null,
    slots = Array(6).fill(null),
    selected = 0,
    inspected = "swift-boots",
    category = "All",
    query = "",
    message = "";
  const open = (build = {}) => {
    editing = { ...build };
    slots = Array.from({ length: 6 }, (_, n) => build.items?.[n] || null);
    selected = 0;
    message = "";
    paint();
    body.querySelector("#build-editor")?.scrollIntoView({ block: "start" });
  };
  const paint = () => {
    const h = builds.hero(hero),
      role = getCatalogItem(h.roleSetup?.blessingId),
      i = getItem(inspected),
      q = recipeQuote(i.id, Array(6).fill(null));
    body.innerHTML = `<div class="prep-hero-strip"><img class="hero-portrait" src="${getHeroPortrait(hero)}" alt="${hero}"><div><strong>${hero.toUpperCase()}</strong><label>Owned hero<select id="build-hero">${owned.map((id) => `<option ${id === hero ? "selected" : ""}>${esc(id)}</option>`)}</select></label></div><button id="prep-change-spell" type="button">Battle Spell · ${esc(account.value.selected)} · Account Lv ${account.level}</button></div><section class="prep-role-intent"><div>${role ? `<img src="${icon(role)}" alt=""><strong>${role.name}</strong>` : "<strong>No role blessing</strong>"}<small>INTENTION ONLY · requires valid spell, equipped boots and real match progression. Classic boot rules; no immediate bonuses.</small></div><label>Next-match role intention<select id="blessing-intent"><option value="">None / ordinary boots</option>${catalogItems
      .filter((x) => ["jungle_blessing", "roaming_blessing"].includes(x.type))
      .map(
        (x) =>
          `<option value="${x.id}" ${x.id === role?.id ? "selected" : ""}>${x.category} · ${x.name}</option>`,
      )
      .join(
        "",
      )}</select></label>${role ? '<button id="role-details">Requirements & effects</button>' : ""}<p>${role?.type === "jungle_blessing" && account.value.selected !== "retribution" ? "Requires Retribution; your current spell is incompatible." : role?.type === "roaming_blessing" && account.value.selected === "retribution" ? "Roaming is incompatible with Retribution." : "Progress begins in the match; no slot, purchase or sell value."}</p></section><h2>My Setups</h2><p class="active-build-summary">ACTIVE: ${esc(h.builds.find((x) => x.id === h.selected)?.name || "Manual item priority")}</p><p>Choose a slot, then an item. Save to use this order in your match shop.</p><div class="saved-builds">${h.builds.map((b) => `<article class="saved-build ${h.selected === b.id ? "in-use" : ""}"><header><h3>${esc(b.name)}</h3><b>${h.selected === b.id ? "IN USE" : "CUSTOM"}</b></header><div class="visual-build-slots">${slotsMarkup(b.items)}</div><div class="build-actions"><button data-build-use="${b.id}" ${h.selected === b.id ? "disabled" : ""}>Use</button><button data-build-edit="${b.id}">Edit / Rename</button><button data-build-duplicate="${b.id}" ${h.builds.length >= 3 ? "disabled" : ""}>Duplicate</button><button data-build-delete="${b.id}">Delete</button></div></article>`).join("") || "<p>No custom builds saved. Create one below.</p>"}</div><div class="build-actions"><button id="new-build" ${h.builds.length >= 3 ? "disabled" : ""}>Create build</button><button id="no-build">Use manual item priority</button></div><div id="build-presets"></div>${
      editing
        ? `<section id="build-editor" class="visual-build-editor"><header><div><small><img class="editor-hero-mini" src="${getHeroPortrait(hero)}" alt="${hero}"> ${hero.toUpperCase()} · EDITING · ${editing.id === h.selected ? "ACTIVE BUILD" : "UNSAVED CHANGES"}</small><label>Build name<input id="build-name" maxlength="32" value="${esc(editing.name || "My build")}"></label></div><button id="build-close">Close editor</button></header><div class="visual-build-slots editable">${slotsMarkup(slots, true, selected)}</div><div class="build-actions"><button id="slot-earlier" ${selected === 0 ? "disabled" : ""}>Move earlier</button><button id="slot-later" ${selected === 5 ? "disabled" : ""}>Move later</button><button id="slot-remove" ${!slots[selected] ? "disabled" : ""}>Remove item</button><button id="build-reset">Reset draft</button><button id="save-build">Save & use build</button></div><p id="build-message" role="status">${esc(message)}</p><div class="wiki-tools"><h3>Equipment selection · Slot ${selected + 1}</h3><input id="build-search" aria-label="Search build equipment" placeholder="Search equipment" value="${esc(query)}"><select id="build-category" aria-label="Build equipment category">${["All", ...new Set(items.map((x) => x.category))].map((c) => `<option ${c === category ? "selected" : ""}>${c}</option>`).join("")}</select></div><div class="wiki-layout"><div class="prep-catalog">${items
            .filter(
              (x) =>
                x.type === "standard_purchase" &&
                recipeData.items[x.id].tier === "completed" &&
                (category === "All" || x.category === category) &&
                (x.name + " " + x.description)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
            )
            .sort((a,b)=>Number(Boolean(a.legacy))-Number(Boolean(b.legacy)))
            .map(
              (x) =>
                `<button data-build-item="${x.id}" aria-pressed="${x.id === inspected}"><img src="${icon(x)}" alt=""><strong>${x.name}</strong><small>${x.cost} gold</small></button>`,
            )
            .join(
              "",
            )}</div><article class="wiki-detail"><img class="editor-detail-icon" src="${icon(i)}" alt="${i.name}"><h3>${i.name}</h3><b>${i.cost} gold</b><ul>${textStats(
            i,
          )
            .map((s) => `<li>${s}</li>`)
            .join(
              "",
            )}</ul><p>${i.description}</p><ul class="wiki-tree">${renderRecipe(q.tree)}</ul><small>Local prototype recipes; component prices and credit use the match registry.</small></article></div></section>`
        : ""
    }`;
    const editor = body.querySelector("#build-editor");
    if (editor) body.insertBefore(editor, body.querySelector("h2"));
    const bind = (sel, fn) =>
      body.querySelector(sel)?.addEventListener("click", fn);
    body.querySelector("#blessing-intent").onchange = (e) => {
      const i = getCatalogItem(e.target.value);
      builds.setRoleSetup(hero, {
        kind: i?.type === "jungle_blessing" ? "jungle" : "roam",
        blessingId: i?.id,
      });
      paint();
    };
    bind("#role-details", () => openEquipment(role.id));
    body.querySelector("#build-hero").onchange = (e) => {
      hero = e.target.value;
      editing = null;
      paint();
    };
    bind("#prep-change-spell", () => openSpells(() => paint()));
    bind("#new-build", () => open());
    bind("#no-build", () => {
      builds.select(hero, null);
      paint();
    });
    for (const b of body.querySelectorAll("[data-build-use]"))
      b.onclick = () => {
        builds.select(hero, b.dataset.buildUse);
        paint();
      };
    for (const b of body.querySelectorAll("[data-build-edit]"))
      b.onclick = () =>
        open(h.builds.find((x) => x.id === b.dataset.buildEdit));
    for (const b of body.querySelectorAll("[data-build-delete]"))
      b.onclick = () => {
        builds.remove(hero, b.dataset.buildDelete);
        paint();
      };
    for (const b of body.querySelectorAll("[data-build-duplicate]"))
      b.onclick = () => {
        const old = h.builds.find((x) => x.id === b.dataset.buildDuplicate);
        open({ name: old.name.slice(0, 25) + " copy", items: [...old.items] });
      };
    if (editing) {
      body.querySelector("#build-name").oninput = (e) =>
        (editing.name = e.target.value);
      for (const b of body.querySelectorAll("[data-build-slot]"))
        b.onclick = () => {
          selected = +b.dataset.buildSlot;
          if (slots[selected]) inspected = slots[selected];
          paint();
        };
      for (const b of body.querySelectorAll("[data-build-item]"))
        b.onclick = () => {
          inspected = b.dataset.buildItem;
          const r = placeBuildItem(slots, selected, inspected);
          message = r.error || "";
          if (!r.error) {
            slots = r.slots;
            const next = slots.findIndex((x) => !x);
            if (next >= 0) selected = next;
          }
          paint();
        };
      for (const b of body.querySelectorAll("[data-wiki-item]"))
        b.onclick = () => {
          inspected = b.dataset.wikiItem;
          paint();
        };
      for (const [id, delta] of [
        ["#slot-earlier", -1],
        ["#slot-later", 1],
      ])
        bind(id, () => {
          slots = moveBuildSlot(slots, selected, selected + delta);
          selected += delta;
          paint();
        });
      bind("#slot-remove", () => {
        slots[selected] = null;
        paint();
      });
      bind("#build-reset", () => {
        slots = Array(6).fill(null);
        selected = 0;
        message = "Draft cleared; saved build unchanged until Save.";
        paint();
      });
      bind("#build-close", () => {
        editing = null;
        paint();
      });
      bind("#save-build", () => {
        const r = builds.saveBuild(hero, {
          ...editing,
          name: body.querySelector("#build-name").value,
          items: slots.filter(Boolean),
        });
        if (r === "ok") editing = null;
        else
          message =
            r === "three-build-limit"
              ? "Three custom builds already saved. Edit or delete an existing custom build before saving another copy."
              : "Choose 1–6 valid items, at most one pair of boots, one active item and a build name.";
        paint();
      });
      body.querySelector("#build-category").onchange = (e) => {
        category = e.target.value;
        paint();
      };
      body.querySelector("#build-search").onchange = (e) => {
        query = e.target.value;
        paint();
      };
    }
    if (typeof presets === "function")
      presets(body.querySelector("#build-presets"), { hero, open, paint });
  };
  paint();
  return () => {};
}
