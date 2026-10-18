import { imageIcon, flagImage } from "./art.js";
import { walletMarkup } from "./wallet-view.js";
const preview = (name, label) =>
  `<button class="preview-control" type="button" disabled data-placeholder="${name}" title="${label} — visual preview only">${imageIcon(name)}<span>${label}</span></button>`;
export function mountLobby(root, profile, persistent, actions, wallet) {
  root.innerHTML = `<section class="lobby-ui" aria-label="Main menu"><header class="lobby-top"><div class="local-account">${imageIcon("profile", "account-avatar")}<div><strong id="local-username"></strong><span>${flagImage(profile.country)}<b class="offline-dot"></b> OFFLINE</span></div></div>${walletMarkup(wallet)}<nav class="lobby-top-tools" aria-label="Account controls">${preview("profile", "Profile")}${preview("mail", "Mail")}${preview("friends", "Friends")}<button id="open-lobby-settings" class="preview-control active-menu-tool" type="button">${imageIcon("settings")}<span>Settings</span></button></nav></header>
 <nav class="lobby-side" aria-label="Lobby navigation"><button id="open-hero-shop" class="preview-control active-menu-tool" type="button">${imageIcon("shop")}<span>Shop</span></button>${preview("events", "Events")}${preview("starlight", "Starlight")}</nav>
 <div class="hero-signature"><span class="menu-kicker">THE MALEFIC GUNNER</span><h2>Layla</h2><p>Your starting hero · Marksman</p></div>
 <div class="lobby-invitation"><span class="menu-kicker">WELCOME TO THE CITADEL</span><h1>Make every<br>shot count.</h1><p>Find your rhythm. Master your aim.<br>Your training ground awaits.</p><div class="lobby-rule"></div><span class="lobby-tag">OFFLINE · AI TRAINING ROOM</span></div>
 <footer class="lobby-bottom"><nav aria-label="Collection previews">${preview("daily", "Daily")}${preview("preparation", "Preparation")}${preview("heroes", "Heroes")}${preview("achievements", "Achievements")}${preview("inventory", "Inventory")}</nav><button id="open-modes" class="gold-button mode-button" type="button"><span>MODE<small>CHOOSE YOUR EXPERIENCE</small></span><span aria-hidden="true">›</span></button></footer>
 <p class="lobby-storage">${persistent ? "Profile stored locally in this browser." : "Session-only profile · persistent storage unavailable."} <span>Shop & Settings available · other icons are previews</span></p></section>`;
  root.querySelector("#local-username").textContent = profile.username;
  root.querySelector("#open-modes").addEventListener("click", actions.modes);
  root.querySelector("#open-hero-shop").addEventListener("click", actions.shop);
  root
    .querySelector("#open-lobby-settings")
    .addEventListener("click", actions.settings);
  return () => {};
}
