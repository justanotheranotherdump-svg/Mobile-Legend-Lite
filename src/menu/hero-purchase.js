import { HERO_OFFERS } from "../heroes/commerce.js";
// Quotes belong to one store/profile. A second click cannot consume a quote twice.
export function mountHeroPurchase(root, hero, store, onChanged = () => {}) {
  const footer = root.querySelector(".hero-owned-footer");
  const offer = HERO_OFFERS[hero.id];
  const draw = (message = "") => {
    const wallet = store.snapshot(),
      owned = wallet.ownedHeroes.includes(hero.id);
    footer.innerHTML = owned
      ? "<span>OWNED" +
        (hero.id === "layla" ? " · STARTING HERO" : "") +
        "</span><small>Approved local 3D model · playable</small>"
      : `<span>LOCKED · PREVIEW AVAILABLE</span><div class="hero-buy-options">${Object.entries(
          offer.prices,
        )
          .map(
            ([currency, amount]) =>
              `<button type="button" data-buy-currency="${currency}" ${wallet[currency] < amount ? "disabled" : ""}>Buy · ${amount.toLocaleString("en-US")} ${currency === "coins" ? "Coins" : "Diamonds"}</button>`,
          )
          .join(
            "",
          )}</div><small>Choose ONE currency. No top-up or match-gold conversion.</small>`;
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.id = "purchase-status";
    status.textContent = message;
    footer.append(status);
    for (const button of footer.querySelectorAll("[data-buy-currency]"))
      button.onclick = () => confirm(button.dataset.buyCurrency);
  };
  const confirm = (currency) => {
    const quote = store.quotePurchase(hero.id, currency);
    if (quote.error) {
      draw(quote.error.replaceAll("-", " "));
      return;
    }
    const dialog = document.createElement("dialog");
    dialog.id = "hero-purchase-confirm";
    dialog.className = "hero-purchase-dialog";
    dialog.innerHTML = `<h2>Unlock ${hero.name}?</h2><p>Pay <strong>${quote.amount.toLocaleString("en-US")} ${currency === "coins" ? "Coins" : "Diamonds"}</strong> from your account wallet.</p><p>The other currency will not be charged. This is a one-time hero purchase, not a skin or recharge.</p><p role="status" data-purchase-message></p><div><button type="button" data-cancel-purchase>Cancel</button><button type="button" data-confirm-purchase>Confirm purchase</button></div>`;
    root.append(dialog);
    let pending = false,
      complete = false;
    const close = () => {
      if (pending) return;
      store.cancelPurchase(quote);
      dialog.close();
      dialog.remove();
    };
    dialog.querySelector("[data-cancel-purchase]").onclick = close;
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    dialog.querySelector("[data-confirm-purchase]").onclick = async () => {
      if (pending || complete) return;
      pending = true;
      dialog.querySelectorAll("button").forEach((b) => (b.disabled = true));
      const result = await store.confirmPurchase(quote);
      complete = true;
      pending = false;
      dialog.close();
      dialog.remove();
      draw(
        result === "purchased"
          ? "Hero unlocked and saved."
          : result === "storage-unavailable"
            ? "Purchase not completed: writable local storage is required. No session wallet deduction was applied."
            : result.replaceAll("-", " "),
      );
      for (const item of root.querySelectorAll("[data-balance]"))
        item.textContent =
          store.current[item.dataset.balance].toLocaleString("en-US");
      onChanged(result);
    };
    dialog.showModal();
  };
  draw();
}
