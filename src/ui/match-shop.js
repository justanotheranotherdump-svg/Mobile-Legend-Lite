import { equipment } from "../match/config.js";
import { ITEM_ART } from "./item-art.js";
import { COMBAT_ART } from "./combat-art.js";
export const catalogItems = equipment.items.filter((i) => !i.legacy);
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
        (category === "All" ||
          (category === "Recommended"
            ? i.category === "Attack" && i.cost >= 1800
            : i.category === category)) &&
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
    this.category = "Recommended";
    this.query = "";
    this.sort = "name";
    this.selectedSlot = null;
    const d = (this.dialog = document.querySelector("#shop-dialog"));
    d.classList.remove("match-shop");
    d.classList.add("live-armory");
    d.innerHTML = `<header class="shop-header"><div class="shop-wallet"><span id="match-shop-gold"></span></div><div class="shop-view-tabs"><button type="button" data-view="all" aria-pressed="true">All Equipment</button><button type="button" data-view="simple" aria-pressed="false">Simple Mode</button></div><button type="button" class="tool-button" data-close aria-label="Close shop">×</button></header><nav class="shop-categories">${["Recommended", "All", "Attack", "Magic", "Defense", "Movement"].map((c) => `<button type="button" data-category="${c}" ${["Magic", "Defense"].includes(c) ? 'disabled title="Coming later — no items in this category"' : ""}>${c}</button>`).join("")}</nav><section class="shop-catalog"><div class="armory-search"><input id="item-search" placeholder="Search equipment" aria-label="Search equipment"><select id="item-sort" aria-label="Sort equipment">${[["name", "Name"], ["price-low", "Price: low to high"], ["price-high", "Price: high to low"], ...["maxHp", "physicalAttack", "magicPower", "physicalDefense", "magicDefense", "attackSpeed", "cooldownReduction", "movementSpeed", "penetration", "lifesteal", "spellVamp"].map((k) => [k, labels[k] || k])].map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></div><h3 id="shop-category-title"></h3><div id="armory-catalog" class="shop-slot-grid"></div></section><section class="shop-builder"><div class="armory-builds"><h3>Builds</h3>${["swift-boots", "berserkers-fury", "haas-claws", "malefic-gun", "blade-of-despair", "windtalker"].map((id) => `<button type="button" data-recommend="${id}" title="Inspect recommended item"><img src="${ITEM_ART[id]}" alt="${catalogItems.find((i) => i.id === id).name}"></button>`).join("")}</div><div class="armory-detail"><div class="armory-item-hero"><img id="item-art" alt=""><div><h3 id="item-name"></h3><small id="item-category"></small></div></div><ul id="item-stats"></ul><p id="item-description"></p><small>Direct purchase · recipes not configured · unique named passives do not stack</small><label>Equip in <select id="item-replace"><option value="">Free slot</option>${Array.from({ length: 6 }, (_, i) => `<option value="${i}">Slot ${i + 1} · replace / 60% refund</option>`).join("")}</select></label><button id="item-active" type="button" hidden>Activate Wind Chant</button><p id="item-result" role="status"></p></div></section><footer class="shop-equipment"><span>Equipment<br><small>Select to sell</small></span><div id="match-inventory" class="shop-equipment-slots"></div></footer><div class="shop-purchase"><button id="item-sell" type="button" hidden>Sell</button><button id="item-purchase" type="button">Purchase</button></div>`;
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
        d.classList.toggle("shop-simple-view", b.dataset.view === "simple");
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
    for (const b of d.querySelectorAll("[data-recommend]"))
      b.onclick = () => {
        this.selected = b.dataset.recommend;
        this.selectedSlot = null;
        this.inspect();
      };
    d.querySelector("#item-purchase").onclick = () => {
      const slot = d.querySelector("#item-replace").value;
      this.notice(
        simulation.purchaseItem(
          this.selected,
          slot === "" ? null : Number(slot),
        ),
        "Equipped. Actual attributes updated.",
      );
    };
    d.querySelector("#item-sell").onclick = () => {
      const result = simulation.sellItem(this.selectedSlot);
      if (result === "ok") this.selectedSlot = null;
      this.notice(result, "Sold. Slot freed and bonuses removed.");
    };
    d.querySelector("#item-active").onclick = () =>
      this.notice(simulation.itemEffects.activeWind(), "Activated");
    d.querySelector("#item-replace").onchange = () => this.affordability();
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
      items = filterItems(catalogItems, this.category, this.query, this.sort);
    d.querySelector("#shop-category-title").textContent =
      `${this.category} · ${items.length}`;
    d.querySelector("#armory-catalog").innerHTML = items.length
      ? items
          .map(
            (i) =>
              `<button type="button" data-item="${i.id}" aria-label="${i.name}, ${i.cost} gold"><img src="${image(i)}" alt=""><span>${i.name}</span><small>${i.cost}</small></button>`,
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
    d.querySelector("#item-category").textContent = i.category;
    d.querySelector("#item-stats").innerHTML = textStats(i)
      .map((row) => `<li>${row}</li>`)
      .join("");
    d.querySelector("#item-description").textContent = i.description;
    d.querySelector("#item-purchase").textContent = `Purchase · ${i.cost}`;
    d.querySelector("#item-purchase").hidden = this.selectedSlot !== null;
    const sell = d.querySelector("#item-sell");
    sell.hidden = this.selectedSlot === null;
    sell.textContent = `Sell · +${Math.floor(i.cost * equipment.refundRatio)}`;
    d.querySelector("#item-active").hidden =
      i.id !== "wind-of-nature" || !this.simulation.inventory.includes(i.id);
    for (const b of d.querySelectorAll("[data-item]"))
      b.setAttribute("aria-pressed", String(b.dataset.item === i.id));
  }
  affordability() {
    const s = this.simulation,
      d = this.dialog;
    const item = equipment.items.find((i) => i.id === this.selected),
      replace = d.querySelector("#item-replace").value,
      old =
        replace === ""
          ? null
          : equipment.items.find((i) => i.id === s.inventory[Number(replace)]);
    d.querySelector("#item-purchase").disabled =
      s.gold + (old ? Math.floor(old.cost * equipment.refundRatio) : 0) <
      item.cost;
  }
  sync() {
    const s = this.simulation,
      d = this.dialog;
    d.querySelector("#match-shop-gold").textContent = `${s.gold} GOLD`;
    this.affordability();
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
        d.querySelector("#item-replace").value = String(slot);
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
