import {heroArt} from "../heroes/art.js";
import {HERO_OFFERS} from "../heroes/commerce.js";
import { CREATION_ARTWORK, imageIcon } from "./art.js";
import { walletMarkup } from "./wallet-view.js";
import {
  heroCatalog,
  filterHeroes,
  HERO_ROLES,
  CATALOG_SLOT_COUNT,
} from "./hero-presentation.js";
export function mountHeroShop(
  root,
  wallet,
  onBack,
  { registry, onHero, state = { role: "All", query: "", scrollTop: 0 } },
) {
  const heroes = heroCatalog(registry);
  root.innerHTML = `<section class="front-panel hero-shop catalog-shop" aria-labelledby="hero-shop-title"><header class="front-panel-header"><button id="shop-back" class="front-back" type="button">${imageIcon("back")}<span>Back</span></button><div><p class="menu-kicker">LOCAL HERO COLLECTION</p><h1 id="hero-shop-title">Shop</h1></div><label class="hero-search"><span class="sr-only">Search heroes</span><input id="hero-search" type="search" placeholder="Search heroes" maxlength="40" autocomplete="off"></label>${walletMarkup(wallet)}</header>
 <div class="catalog-body"><nav class="catalog-sidebar" aria-label="Shop categories"><button disabled type="button">Featured<small>NOT AVAILABLE</small></button><button type="button" aria-current="page">${imageIcon("heroes")}Heroes</button><button disabled type="button">Skins<small>NOT AVAILABLE</small></button><p>More heroes will appear here when added.</p></nav><div class="catalog-main"><div class="hero-role-filters" role="group" aria-label="Filter heroes by role">${HERO_ROLES.map((role) => `<button type="button" data-hero-role="${role}" aria-pressed="false">${role}</button>`).join("")}</div><div class="catalog-summary"><span id="hero-result-count" role="status"></span><span>Layla is free & already owned</span></div><div class="hero-catalog-scroll"><div class="hero-catalog-grid" aria-label="Hero catalog"></div></div></div></div><footer class="front-panel-footer">HEROES <span>Inspect both approved heroes · locked heroes can be previewed before buying</span></footer></section>`;
  const input = root.querySelector("#hero-search"),
    grid = root.querySelector(".hero-catalog-grid"),
    scroll = root.querySelector(".hero-catalog-scroll");
  input.value = state.query;
  function populate() {
    const matches = filterHeroes(heroes, state);
    root.querySelector("#hero-result-count").textContent =
      `${matches.length} hero${matches.length === 1 ? "" : "es"} available${matches.length === 0 ? " · No matching heroes yet" : ""}`;
    root
      .querySelectorAll("[data-hero-role]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.heroRole === state.role),
        ),
      );
    grid.replaceChildren();
    for (const hero of matches) {
      const owned=wallet.ownedHeroes.includes(hero.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "catalog-hero-card";
      card.dataset.heroId = hero.id;
      card.setAttribute(
        "aria-label",
        `View ${hero.name}, ${hero.role}, ${owned ? "owned" : "locked, preview available"}`,
      );
      card.innerHTML = `<div class="catalog-portrait"><img id="shop-${hero.id}-portrait" src="${heroArt(hero.id,"banner")}" alt="${hero.name} 2D illustrated banner" draggable="false"><span class="catalog-starter">${hero.id==="layla"?"STARTING HERO": "TANK · ROAM"}</span></div><div class="catalog-card-label"><strong></strong><span></span></div><div class="owned-badge">${owned ? "OWNED" : `${HERO_OFFERS[hero.id].prices.coins.toLocaleString("en-US")} Coins / ${HERO_OFFERS[hero.id].prices.diamonds} Diamonds`} <span>View hero ›</span></div>`;
      card.querySelector("strong").textContent = hero.name;
      card.querySelector(".catalog-card-label>span").textContent = hero.role;
      card.addEventListener("click", () => {
        state.scrollTop = scroll.scrollTop;
        onHero(hero.id);
      });
      grid.append(card);
    }
    for (let i = matches.length; i < CATALOG_SLOT_COUNT; i++) {
      const empty = document.createElement("div");
      empty.className = "catalog-empty-slot";
      empty.setAttribute("aria-label", "Empty future hero slot");
      empty.innerHTML = `<div class="empty-hero-crest" aria-hidden="true">${imageIcon("heroes")}</div><span>EMPTY SLOT</span><small>Future hero</small>`;
      grid.append(empty);
    }
  }
  input.addEventListener("input", () => {
    state.query = input.value;
    state.scrollTop = 0;
    populate();
    scroll.scrollTop = 0;
  });
  root.querySelectorAll("[data-hero-role]").forEach((b) =>
    b.addEventListener("click", () => {
      state.role = b.dataset.heroRole;
      state.scrollTop = 0;
      populate();
      scroll.scrollTop = 0;
    }),
  );
  root.querySelector("#shop-back").addEventListener("click", onBack);
  populate();
  scroll.scrollTop = state.scrollTop;
}
