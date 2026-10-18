import { icon } from "./components/icons.js";
export const SHOP_CATEGORIES = Object.freeze([
  "Recommended",
  "Attack",
  "Magic",
  "Defense",
  "Movement",
  "Jungle",
  "Roam",
]);
export const CATALOG_SLOT_COUNT = 16;
export const EQUIPMENT_SLOT_COUNT = 6;
export function emptyShopSlot(kind, index) {
  return `<button type="button" class="shop-slot shop-slot-${kind}" disabled data-control-kind="reserved" aria-label="Empty ${kind} slot ${index + 1} — reserved" title="Empty slot — no item configured"><span class="empty-slot-mark" aria-hidden="true"></span></button>`;
}
export function shopMarkup() {
  return `<header class="shop-header"><div class="shop-wallet" aria-label="Gold reserved">${icon("coin")}<span>—</span></div><div class="shop-heading"><span class="eyebrow">LAYOUT PREVIEW</span><h2 id="shop-title">Equipment</h2></div><div class="shop-view-tabs" aria-label="Shop layout"><button type="button" data-shop-view="all" aria-pressed="true" data-control-kind="interface-only">All equipment</button><button type="button" data-shop-view="simple" aria-pressed="false" data-control-kind="interface-only">Simple view</button></div><button type="button" class="tool-button" data-control-kind="interface-only" data-close aria-label="Close shop">${icon("close")}</button></header>
    <nav class="shop-categories" aria-label="Equipment categories">${SHOP_CATEGORIES.map((name, i) => `<button type="button" data-category="${name}" aria-pressed="${i === 0}" data-control-kind="interface-only">${name}</button>`).join("")}</nav>
    <section class="shop-catalog" aria-labelledby="shop-category-title"><div class="shop-section-heading"><h3 id="shop-category-title">Recommended</h3><span>EMPTY SLOTS</span></div><div class="shop-slot-grid">${Array.from({ length: CATALOG_SLOT_COUNT }, (_, i) => emptyShopSlot("catalog", i)).join("")}</div></section>
    <section class="shop-builder" aria-label="Reserved build layout"><div class="shop-build-heading"><h3>Build path</h3><button class="shop-prioritize" type="button" disabled data-control-kind="reserved" title="Reserved — no items or build priorities">Prioritize</button></div><div class="shop-build-tree" aria-label="Empty build-path guides; no recipes configured"><svg viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="M150 45V95M50 148V95H250V148M150 95V148"/></svg><div class="build-root">${emptyShopSlot("build", 0)}</div><div class="build-branches">${[1, 2, 3].map((i) => emptyShopSlot("build", i)).join("")}</div></div><div class="shop-item-details"><span class="eyebrow">ITEM DETAILS</span><div class="shop-detail-placeholder" aria-hidden="true"></div><div class="shop-detail-placeholder short" aria-hidden="true"></div><p class="shop-empty-note">No items configured · Purchases not implemented.</p></div></section>
    <footer class="shop-equipment"><span>Equipment<br><small>RESERVED</small></span><div class="shop-equipment-slots">${Array.from({ length: EQUIPMENT_SLOT_COUNT }, (_, i) => emptyShopSlot("equipment", i)).join("")}</div></footer><div class="shop-purchase"><span class="shop-purchase-gold" aria-label="Price unavailable">${icon("coin")} —</span><button id="shop-purchase" type="button" disabled data-control-kind="reserved" title="Reserved — no items, gold economy or purchases">Purchase</button></div>`;
}
export class ShopPanel {
  constructor(dialog) {
    dialog.classList.add("shop-window");
    dialog.innerHTML = shopMarkup();
    for (const button of dialog.querySelectorAll("[data-category]"))
      button.addEventListener("click", () => {
        for (const option of dialog.querySelectorAll("[data-category]"))
          option.setAttribute("aria-pressed", String(option === button));
        dialog.querySelector("#shop-category-title").textContent =
          button.dataset.category;
      });
    for (const button of dialog.querySelectorAll("[data-shop-view]"))
      button.addEventListener("click", () => {
        dialog.classList.toggle(
          "shop-simple-view",
          button.dataset.shopView === "simple",
        );
        for (const option of dialog.querySelectorAll("[data-shop-view]"))
          option.setAttribute("aria-pressed", String(option === button));
      });
  }
}
