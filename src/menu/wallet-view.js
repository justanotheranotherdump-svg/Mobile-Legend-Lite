import { imageIcon } from "./art.js";
export function walletMarkup(wallet) {
  return `<div class="currency-bar" aria-label="Local wallet"><div class="currency-pill" title="Coins · local starting balance, no earning system yet">${imageIcon("coins")}<span data-balance="coins">${wallet.coins.toLocaleString("en-US")}</span><small>COINS</small></div><div class="currency-pill" title="Diamonds · no purchases or top-ups">${imageIcon("diamonds")}<span data-balance="diamonds">${wallet.diamonds.toLocaleString("en-US")}</span><small>DIAMONDS</small></div></div>`;
}
