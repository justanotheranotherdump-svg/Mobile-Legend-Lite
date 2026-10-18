import {
  recipeData,
  recipeQuote,
  purchaseQuote,
  priorityStep,
  getItem,
} from "../match/recipes.js";
import { equipment } from "../match/config.js";
import { ITEM_ART } from "./item-art.js";
import { COMBAT_ART } from "./combat-art.js";
export const catalogItems = equipment.items;
export function filterItems(
  items,
  category = "All",
  query = "",
  sort = "name",
) {
  const key = query.trim().toLowerCase(),
    value = (i) =>
      sort === "price"
        ? i.cost
        : sort === "lifesteal"
          ? i.lifesteal
          : sort === "spellVamp"
            ? i.spellVamp
            : sort === "cooldownReduction"
              ? i.cooldownReduction
              : sort === "penetration"
                ? (i.physicalPenetration || 0) +
                  (i.effects?.includes("armor-buster") ? 30 : 0) +
                  (i.effects?.includes("arcane-penetration") ? 10 : 0)
                : (i.modifiers.flat[sort] || 0) +
                  (i.modifiers.percent[sort] || 0);
  return items
    .filter(
      (i) =>
        (category === "All" || i.category === category) &&
        `${i.name} ${i.description}`.toLowerCase().includes(key),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : (sort === "price-low"
            ? a.cost - b.cost
            : sort === "price-high"
              ? b.cost - a.cost
              : value(b) - value(a)) || a.name.localeCompare(b.name),
    );
}
const image = (i) => ITEM_ART[i.id] || COMBAT_ART[i.icon];
const labels = {
  physicalAttack: "Physical Attack",
  magicPower: "Magic Power",
  maxHp: "HP",
  movementSpeed: "Movement Speed",
  attackSpeed: "Attack Speed",
  physicalDefense: "Physical Defense",
  magicDefense: "Magic Defense",
  criticalDamage: "Crit Damage",
  cooldownReduction: "Cooldown Reduction",
  penetration: "Penetration",
  lifesteal: "Lifesteal",
  spellVamp: "Spell Vamp",
};
const textStats = (i) => [
  ...Object.entries(i.modifiers.flat).map(
    ([k, v]) =>
      `+${k === "criticalDamage" ? Math.round(v * 100) + "%" : v} ${labels[k] || k}`,
  ),
  ...Object.entries(i.modifiers.percent).map(
    ([k, v]) => `+${Math.round(v * 100)}% ${labels[k] || k}`,
  ),
  ...(i.criticalChance
    ? [`+${Math.round(i.criticalChance * 100)}% Crit Chance`]
    : []),
  ...(i.lifesteal ? [`+${Math.round(i.lifesteal * 100)}% Lifesteal`] : []),
  ...(i.spellVamp ? [`+${Math.round(i.spellVamp * 100)}% Spell Vamp`] : []),
  ...(i.cooldownReduction
    ? [`+${Math.round(i.cooldownReduction * 100)}% CD Reduction`]
    : []),
  ...(i.physicalPenetration
    ? [`+${i.physicalPenetration} Physical Penetration`]
    : []),
];
export class MatchShop {
  constructor(simulation) {
    this.simulation = simulation;
    this.selected = "dagger";
    this.category = "All";
    this.view = "all";
    this.query = "";
    this.sort = "name";
    this.selectedSlot = null;
    const d = (this.dialog = document.querySelector("#shop-dialog"));
    d.classList.remove("match-shop");
    d.classList.add("live-armory");
    d.innerHTML = `<header class="shop-header"><div class="shop-wallet"><span id="match-shop-gold"></span></div><div class="shop-view-tabs"><button type="button" data-view="all" aria-pressed="true">All Equipment</button><button type="button" data-view="simple" aria-pressed="false">Simple Mode</button></div><button type="button" class="tool-button" data-close aria-label="Close shop">×</button></header><nav class="shop-categories">${["Recommended", "All", "Attack", "Movement", "Legacy"].map((c) => `<button type="button" data-category="${c}" ${["Recommended"].includes(c) ? 'disabled title="Coming later — no items in this category"' : ""}>${c}</button>`).join("")}</nav><section class="shop-catalog"><div class="armory-search"><input id="item-search" placeholder="Search equipment" aria-label="Search equipment"><select id="item-sort" aria-label="Sort equipment">${[["name", "Name"], ["price-low", "Price: low to high"], ["price-high", "Price: high to low"], ...["maxHp", "physicalAttack", "magicPower", "physicalDefense", "magicDefense", "attackSpeed", "cooldownReduction", "movementSpeed", "penetration", "lifesteal", "spellVamp"].map((k) => [k, labels[k] || k])].map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></div><h3 id="shop-category-title"></h3><div id="armory-catalog" class="shop-slot-grid"></div></section><section class="shop-builder"><div class="armory-builds"><h3>Build tree</h3><small>Local prototype recipes</small></div><div id="item-tree"></div><div class="armory-detail"><div class="armory-item-hero"><img id="item-art" alt=""><div><h3 id="item-name"></h3><small id="item-category"></small></div></div><ul id="item-stats"></ul><p id="item-description"></p><p id="recipe-cost"></p><p id="purchase-validation" role="status"></p><button id="item-prioritize" type="button">Prioritize Item</button><button id="item-active" type="button" hidden>Activate Wind Chant</button><p id="item-result" role="status"></p></div></section><footer class="shop-equipment"><span>Equipment<br><small>Select to sell</small></span><div id="match-inventory" class="shop-equipment-slots"></div></footer><div class="shop-purchase"><button id="item-sell" type="button" hidden>Sell</button><button id="item-purchase" type="button">Purchase</button></div>`;
    d.querySelector("[data-close]").onclick = () => {
      d.close();
      document.querySelector("#world").focus({ preventScroll: true });
    };
    for (const b of d.querySelectorAll("[data-category]"))
      b.onclick = () => {
        this.category = b.dataset.category;
        this.renderCatalog();
      };
    for (const b of d.querySelectorAll("[data-view]"))
      b.onclick = () => {
        this.view = b.dataset.view;
        d.classList.toggle("shop-simple-view", this.view === "simple");
        this.renderCatalog();
        for (const x of d.querySelectorAll("[data-view]"))
          x.setAttribute("aria-pressed", String(x === b));
      };
    d.querySelector("#item-search").oninput = (e) => {
      this.query = e.target.value;
      this.renderCatalog();
    };
    d.querySelector("#item-sort").onchange = (e) => {
      this.sort = e.target.value;
      this.renderCatalog();
    };
    d.querySelector("#item-purchase").onclick = () => {
      this.notice(
        simulation.purchaseItem(this.selected),
        "Equipped / combined. Actual attributes updated.",
      );
    };
    d.querySelector("#item-sell").onclick = () => {
      const result = simulation.sellItem(this.selectedSlot);
      if (result === "ok") this.selectedSlot = null;
      this.notice(result, "Sold. Slot freed and bonuses removed.");
    };
    d.querySelector("#item-active").onclick = () =>
      this.notice(simulation.itemEffects.activeWind(), "Activated");
    d.querySelector("#item-prioritize").onclick = () => {
      this.notice(
        simulation.prioritizeItem(this.selected),
        "Item prioritized.",
      );
    };
    this.quick = document.createElement("section");
    this.quick.id = "quick-buy-panel";
    this.quick.hidden = true;
    this.quick.innerHTML =
      '<button id="quick-buy" type="button"><img alt=""><span></span></button><button id="quick-clear" type="button" aria-label="Clear item priority">×</button><small role="status"></small>';
    document.querySelector("#hud-root").append(this.quick);
    this.quick.querySelector("#quick-buy").onclick = () => {
      const step = priorityStep(
        simulation.gold,
        simulation.inventory,
        simulation.priorityItem,
      );
      if (step.completed) return;
      this.notice(
        simulation.purchaseItem(step.id),
        "Quick buy equipped / combined.",
      );
    };
    this.quick.querySelector("#quick-clear").onclick = () => {
      simulation.prioritizeItem(null);
      this.sync();
    };
    this.renderCatalog();
    this.inspect();
    this.sync();
  }
  notice(result, success) {
    this.dialog.querySelector("#item-result").textContent =
      result === "ok" || result === "activated"
        ? "Last action: " + success
        : result;
    this.lastInventory = null;
    this.sync();
  }
  renderCatalog() {
    const d = this.dialog,
      items = filterItems(
        catalogItems,
        this.category,
        this.query,
        this.sort,
      ).filter(
        (i) =>
          this.view !== "simple" || recipeData.items[i.id].tier === "completed",
      );
    d.querySelector("#shop-category-title").textContent =
      `${this.category} · ${items.length}`;
    d.querySelector("#armory-catalog").innerHTML = items.length
      ? items
          .map(
            (i) =>
              `<button type="button" data-item="${i.id}" aria-label="${i.name}, ${i.cost} gold"><img src="${image(i)}" alt=""><span>${i.name}</span><small>${i.cost} · ${recipeData.items[i.id].tier}</small></button>`,
          )
          .join("")
      : "<p>No matching equipment.</p>";
    for (const b of d.querySelectorAll("[data-item]"))
      b.onclick = () => {
        this.selected = b.dataset.item;
        this.selectedSlot = null;
        this.inspect();
      };
    for (const b of d.querySelectorAll("[data-category]"))
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.category === this.category),
      );
  }
  inspect() {
    this.affordability();
    const d = this.dialog,
      i = equipment.items.find((i) => i.id === this.selected);
    d.querySelector("#item-art").src = image(i);
    d.querySelector("#item-art").alt = i.name;
    d.querySelector("#item-name").textContent = i.name;
    d.querySelector("#item-category").textContent =
      `${i.category} · ${recipeData.items[i.id].tier}${this.simulation.inventory.includes(i.id) ? " · Owned" : ""}`;
    d.querySelector("#item-stats").innerHTML = textStats(i)
      .map((row) => `<li>${row}</li>`)
      .join("");
    d.querySelector("#item-description").textContent = i.description;
    this.updateRecipe();
    d.querySelector("#item-purchase").hidden = this.selectedSlot !== null;
    const sell = d.querySelector("#item-sell");
    sell.hidden = this.selectedSlot === null;
    sell.textContent = `Sell · +${Math.floor(i.cost * equipment.refundRatio)}`;
    d.querySelector("#item-active").hidden =
      i.id !== "wind-of-nature" || !this.simulation.inventory.includes(i.id);
    for (const b of d.querySelectorAll("[data-item]"))
      b.setAttribute("aria-pressed", String(b.dataset.item === i.id));
  }
  updateRecipe() {
    const q = recipeQuote(this.selected, this.simulation.inventory),
      d = this.dialog;
    const completed = this.simulation.inventory.includes(this.selected);
    if (completed) {
      q.tree.ownedSlot = this.simulation.inventory.indexOf(this.selected);
      q.tree.children = [];
    }
    const tree = (n) =>
      `<li class="${n.ownedSlot >= 0 ? "owned-component" : "missing-component"}"><button type="button" data-tree-item="${n.id}"><img src="${image(getItem(n.id))}" alt=""><span>${getItem(n.id).name}<small>${n.total} gold ${n.ownedSlot >= 0 ? "· OWNED" : "· missing / combine"}</small></span></button>${n.children.length ? `<ul>${n.children.map(tree).join("")}</ul>` : ""}</li>`;
    const stamp = JSON.stringify([this.selected, this.simulation.inventory]);
    if (this.treeStamp !== stamp) {
      this.treeStamp = stamp;
      d.querySelector("#item-tree").innerHTML =
        `<ul class="recipe-tree">${tree(q.tree)}</ul>`;
      for (const b of d.querySelectorAll("[data-tree-item]"))
        b.onclick = () => {
          this.selected = b.dataset.treeItem;
          this.selectedSlot = null;
          this.inspect();
        };
    }
    d.querySelector("#recipe-cost").textContent = completed
      ? `Total ${q.total} · Owned / completed · remaining 0`
      : `Total ${q.total} · owned credit ${q.credit} · remaining ${q.remaining}`;
    d.querySelector("#item-purchase").textContent = completed
      ? "Owned"
      : "Purchase · " + q.remaining;
  }
  affordability() {
    const q = purchaseQuote(
      this.simulation.gold,
      this.simulation.inventory,
      this.selected,
    );
    this.dialog.querySelector("#item-purchase").disabled = Boolean(q.error);
    this.dialog.querySelector("#purchase-validation").textContent =
      q.error || "Ready to purchase / combine automatically";
  }
  syncQuick() {
    const s = this.simulation,
      id = s.priorityItem;
    this.quick.hidden = !id;
    if (!id) return;
    const step = priorityStep(s.gold, s.inventory, id),
      i = getItem(id),
      next = getItem(step.id);
    this.quick.querySelector("img").src = image(i);
    this.quick.querySelector("span").textContent =
      `${i.name} · ${step.completed ? "Completed" : step.remaining + " remaining"}`;
    this.quick.querySelector("small").textContent = step.completed
      ? "Priority complete"
      : `${next.name} · ${purchaseQuote(s.gold, s.inventory, step.id).remaining} gold${step.error ? " · " + step.error : ""}`;
    this.quick.querySelector("#quick-buy").disabled = Boolean(
      step.completed || step.error,
    );
  }
  sync() {
    const s = this.simulation,
      d = this.dialog;
    d.querySelector("#match-shop-gold").textContent = `${s.gold} GOLD`;
    this.affordability();
    this.updateRecipe();
    this.syncQuick();
    for (const b of d.querySelectorAll("[data-item]")) {
      const q = purchaseQuote(s.gold, s.inventory, b.dataset.item);
      b.classList.toggle("unaffordable", Boolean(q.error));
      b.classList.toggle("owned-item", s.inventory.includes(b.dataset.item));
      b.title =
        textStats(getItem(b.dataset.item)).join(" · ") +
        " · " +
        getItem(b.dataset.item).description +
        " · " +
        (q.error || "Affordable") +
        " · " +
        (s.inventory.includes(b.dataset.item) ? "Owned" : "Not owned");
    }
    const signature = JSON.stringify(s.inventory);
    if (signature === this.lastInventory) return;
    this.lastInventory = signature;
    const button = (id, index, cls) => {
      const i = equipment.items.find((i) => i.id === id);
      return `${cls === "item-slot" ? '<div class="equipped-control">' : ""}<button type="button" class="${cls}" data-equipped="${index}" aria-label="${i ? i.name : "Empty equipment slot " + (index + 1)}">${i ? `<img src="${image(i)}" alt="${i.name}">` : '<span class="empty-slot-mark"></span>'}</button>${cls === "item-slot" && id === "wind-of-nature" ? '<button type="button" id="wind-chant" data-control-kind="functional" aria-label="Activate Wind Chant">USE</button>' : ""}${cls === "item-slot" ? "</div>" : ""}`;
    };
    d.querySelector("#match-inventory").innerHTML = s.inventory
      .map((id, i) => button(id, i, "shop-slot"))
      .join("");
    document.querySelector("#equipment-slots").innerHTML = s.inventory
      .map((id, i) => button(id, i, "item-slot"))
      .join("");
    for (const b of document.querySelectorAll("[data-equipped]"))
      b.onclick = () => {
        const slot = Number(b.dataset.equipped),
          id = s.inventory[slot];
        if (!d.open) document.querySelector("#shop").click();
        this.selectedSlot = id ? slot : null;
        if (id) this.selected = id;

        this.inspect();
      };
    this.inspect();
    const active = document.getElementById("wind-chant");
    if (active)
      active.onclick = (e) => {
        e.stopPropagation();
        this.notice(s.itemEffects.activeWind(), "Wind Chant activated.");
      };
  }
}
