import { equipment } from "../match/config.js";
import { COMBAT_ART } from "./combat-art.js";
import { statText } from "../simulation/stats/attributes.js";
export class MatchShop {
  constructor(simulation) {
    this.simulation = simulation;
    this.selected = equipment.items[0].id;
    this.dialog = document.querySelector("#shop-dialog");
    this.dialog.classList.add("match-shop");
    this.dialog.innerHTML = `<header><div><small>ORIGINAL PROTOTYPE EQUIPMENT</small><h2>Match Armory</h2></div><strong id="match-shop-gold"></strong><button type="button" data-close aria-label="Close shop">×</button></header><div class="match-shop-main"><nav>${equipment.items.map((i) => `<button type="button" data-item="${i.id}"><img src="${COMBAT_ART[i.icon]}" alt=""><span>${i.name}<small>${i.cost} gold</small></span></button>`).join("")}</nav><section><h3 id="item-name"></h3><p id="item-description"></p><dl id="item-stats"></dl><label>Equip in<select id="item-replace"><option value="">Free slot</option>${Array.from({ length: 6 }, (_, i) => `<option value="${i}">Replace slot ${i + 1} (60% refund)</option>`).join("")}</select></label><button id="item-purchase" type="button">Purchase</button><p id="item-result" role="status"></p></section></div><footer><p>Six slots · one copy per item · sale refund 60% · account wallet untouched</p><div id="match-inventory"></div></footer>`;
    this.dialog
      .querySelector("[data-close]")
      .addEventListener("click", () => this.dialog.close());
    for (const b of this.dialog.querySelectorAll("[data-item]"))
      b.addEventListener("click", () => {
        this.selected = b.dataset.item;
        this.inspect();
      });
    this.dialog
      .querySelector("#item-purchase")
      .addEventListener("click", () => {
        const value = this.dialog.querySelector("#item-replace").value;
        const result = simulation.purchaseItem(
          this.selected,
          value === "" ? null : Number(value),
        );
        this.dialog.querySelector("#item-result").textContent =
          result === "ok" ? "Equipped. Actual attributes updated." : result;
        this.sync();
      });
    this.inspect();
    this.sync();
  }
  inspect() {
    const i = equipment.items.find((i) => i.id === this.selected);
    this.dialog.querySelector("#item-name").textContent = i.name;
    this.dialog.querySelector("#item-description").textContent = i.description;
    const rows = [
      ...Object.entries(i.modifiers.flat).map(([k, v]) => [k, `+${v}`]),
      ...Object.entries(i.modifiers.percent).map(([k, v]) => [
        k,
        `+${statText(v * 100)}%`,
      ]),
      ...(i.criticalChance
        ? [["Critical chance", `${i.criticalChance * 100}%`]]
        : []),
      ...(i.lifesteal ? [["Basic lifesteal", `${i.lifesteal * 100}%`]] : []),
    ];
    this.dialog.querySelector("#item-stats").innerHTML = rows
      .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
      .join("");
    this.dialog.querySelector("#item-purchase").textContent =
      `Purchase · ${i.cost} gold`;
    for (const b of this.dialog.querySelectorAll("[data-item]"))
      b.setAttribute("aria-pressed", String(b.dataset.item === i.id));
  }
  sync() {
    const s = this.simulation;
    this.dialog.querySelector("#match-shop-gold").textContent =
      `${s.gold} match gold`;
    const signature = JSON.stringify(s.inventory);
    if (signature === this.lastInventory) return;
    this.lastInventory = signature;
    const inventory = this.dialog.querySelector("#match-inventory");
    inventory.innerHTML = s.inventory
      .map((id, index) => {
        const i = equipment.items.find((i) => i.id === id);
        return `<button type="button" data-sell="${index}" ${i ? "" : "disabled"}>${i ? `<img src="${COMBAT_ART[i.icon]}" alt=""><span>${i.name}</span><small>Sell +${Math.floor(i.cost * equipment.refundRatio)}</small>` : `Slot ${index + 1}<small>Empty</small>`}</button>`;
      })
      .join("");
    for (const b of inventory.querySelectorAll("[data-sell]"))
      b.addEventListener("click", () => {
        const result = s.sellItem(Number(b.dataset.sell));
        this.dialog.querySelector("#item-result").textContent =
          result === "ok" ? "Sold. Bonuses removed." : result;
        this.sync();
      });
    const hud = document.querySelector("#equipment-slots");
    hud.innerHTML = s.inventory
      .map((id, index) => {
        const i = equipment.items.find((i) => i.id === id);
        return `<button type="button" class="item-slot" data-equipped="${index}" aria-label="${i ? i.name : "Empty equipment slot " + (index + 1)}">${i ? `<img src="${COMBAT_ART[i.icon]}" alt="">` : "◇"}</button>`;
      })
      .join("");
    for (const b of hud.querySelectorAll("button"))
      b.addEventListener("click", () => {
        if (!this.dialog.open) document.querySelector("#shop").click();
        this.dialog.querySelector("#item-replace").value = b.dataset.equipped;
      });
  }
}
