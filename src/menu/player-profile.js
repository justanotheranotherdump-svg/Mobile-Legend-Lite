import { COMBAT_ART } from "../ui/combat-art.js";
import { flagImage } from "./art.js";
import { getHeroPortrait } from "../ui/portraits.js";
export function mountOwnedHeroes(root, { owned, registry, onBack, onHero }) {
  root.innerHTML = `<section class="prep-screen"><header><button id="owned-back" type="button">‹ Lobby</button><h1>OWNED HEROES</h1></header><nav class="prep-nav"><button aria-pressed="true">All owned</button><small>Only available, owned heroes are selectable.</small></nav><main class="prep-body"><div class="owned-heroes">${owned
    .filter((id) => registry.get(id))
    .map(
      (id) =>
        `<button type="button" data-owned-hero="${id}"><img class="hero-portrait" src="${getHeroPortrait(id)}" alt="${registry.get(id).name}"><strong>${registry.get(id).name}</strong><small>${registry.get(id).role} · OWNED</small></button>`,
    )
    .join("")}</div></main></section>`;
  root.querySelector("#owned-back").onclick = onBack;
  root
    .querySelectorAll("[data-owned-hero]")
    .forEach((b) => (b.onclick = () => onHero(b.dataset.ownedHero)));
}
export function mountPlayerProfile(
  root,
  { profile, account, history, progress, onBack, onReset },
) {
  let tab = "overview";
  const paint = () => {
    const stats = history.stats(),
      matches = [...history.value.matches].reverse(),
      xp = account.value.xp % 100;
    root.innerHTML = `<section class="prep-screen player-profile"><header><button id="player-profile-back" type="button">‹ Lobby</button><h1>PLAYER PROFILE</h1><small>LOCAL OFFLINE ACCOUNT</small></header><nav class="prep-nav">${[
      ["overview", "Overview"],
      ["heroes", "Hero Statistics"],
      ["history", "History"],
      ["rank", "Rank"],
      ["account", "Account"],
      ["developer", "Developer Tools"],
    ]
      .map(
        ([id, n]) =>
          `<button type="button" data-profile-tab="${id}" aria-pressed="${tab === id}">${n}</button>`,
      )
      .join(
        "",
      )}</nav><main class="prep-body"><div class="profile-identity"><img class="hero-portrait" src="${COMBAT_ART.layla}" alt="Player avatar"><div><h2>${profile.username}</h2><p>${flagImage(profile.country)} ${profile.gender} · Account Lv ${account.level}</p><progress max="100" value="${account.level === 25 ? 100 : xp}"></progress><small>${account.value.xp} account XP · ${account.level === 25 ? "MAX LEVEL" : xp + "/100 toward next level"}</small></div></div><section id="player-profile-body"></section></main></section>`;
    root.querySelector("#player-profile-back").onclick = onBack;
    root.querySelectorAll("[data-profile-tab]").forEach(
      (b) =>
        (b.onclick = () => {
          tab = b.dataset.profileTab;
          paint();
        }),
    );
    const body = root.querySelector("#player-profile-body");
    const cards = (rows) =>
      rows
        .map(
          (h) =>
            `<article class="hero-stat"><img class="hero-portrait" src="${getHeroPortrait(h.hero)}" alt="${h.hero}"><div><h3>${h.hero[0].toUpperCase()+h.hero.slice(1)}</h3><p>${h.matches} completed matches · ${h.wins} wins / ${h.losses} losses</p><small>Last played ${new Date(h.last).toLocaleString()}</small></div></article>`,
        )
        .join("");
    if (tab === "overview")
      body.innerHTML = `<h2>Most-used heroes</h2>${cards(stats) || "<p>No recorded completed matches yet.</p>"}<h2>Recently used</h2>${cards([...stats].sort((a, b) => b.last - a.last)) || "<p>Play a lane match to start your local record.</p>"}<small>Statistics cover up to 100 retained completed matches; earlier versions did not save history.</small>`;
    if (tab === "heroes")
      body.innerHTML = `<h2>Hero Statistics</h2>${cards(stats) || "<p>No recorded hero statistics.</p>"}<small>Only actual completed matches are counted. No fabricated earlier history.</small>`;
    if (tab === "history")
      body.innerHTML = `<h2>Match History</h2><div class="profile-match-grid">${matches.map((r) => `<article class="history-card ${r.result.toLowerCase()}"><h3>${r.result}</h3><small>${r.mode.toUpperCase()} · Hero Lv ${r.level}</small><img class="hero-portrait" src="${getHeroPortrait(r.hero)}" alt="${r.hero}"><b>${r.hero[0].toUpperCase()+r.hero.slice(1)}</b><p>${Math.floor(r.duration / 60)}:${String(Math.floor(r.duration % 60)).padStart(2, "0")} · ${r.kills} / ${r.deaths} / ${r.assists}</p><small>${new Date(r.at).toLocaleString()}</small></article>`).join("") || "<p>No completed matches recorded yet. Quits and dummy Practice are not recorded.</p>"}</div>`;
    if (tab === "rank")
      body.innerHTML =
        '<h2>Rank</h2><div class="rank-future">♜</div><h3>Coming later</h3><p>No active rating, ranked matchmaking or fabricated rank.</p>';
    if (tab === "account") {
      body.innerHTML = `<h2>Local Account</h2><p>Name: ${profile.username} · ${profile.country} · ${profile.gender}</p><p>Coins: ${progress.current.coins} · Diamonds: ${progress.current.diamonds}</p><p>Stored in this browser / file origin only. Not a server account or Windows-wide save.</p><button type="button" id="reset-local-account">Reset / Delete Local Account</button><dialog id="reset-confirm"><h2>Delete this local account?</h2><p>Erases this player's identity, coins, diamonds, owned-hero progress, account XP, spell selection, saved builds and recorded history. Other local player saves and audio/key preferences are not erased.</p><p>A local recovery backup is required before deletion. Restore is available on the username creation screen.</p><button type="button" id="reset-cancel">Cancel — keep account</button><button type="button" id="reset-confirm-delete">Delete local account</button><p id="reset-error" role="alert"></p></dialog>`;
      const d = body.querySelector("dialog");
      body.querySelector("#reset-local-account").onclick = () => d.showModal();
      body.querySelector("#reset-cancel").onclick = () => d.close();
      body.querySelector("#reset-confirm-delete").onclick = () => {
        const r = onReset();
        if (!r.ok) body.querySelector("#reset-error").textContent = r.error;
      };
    }
    if (tab === "developer") {
      body.innerHTML =
        '<h2>Developer / Cheat Tools</h2><p>OFFLINE PROTOTYPE ONLY. Explicit development actions, not normal rewards, purchases or online currency.</p><label>Amount <input id="dev-amount" type="number" min="1" max="1000000" value="1000"></label><button type="button" id="dev-coins">Add coins</button><button type="button" id="dev-diamonds">Add diamonds</button><button type="button" id="dev-max-level">Set account level to 25</button><p id="dev-result" role="status"></p>';
      const add = (kind) => {
        const r = progress.developerAdd(
          kind,
          Number(body.querySelector("#dev-amount").value),
        );
        body.querySelector("#dev-result").textContent =
          r === "ok"
            ? `${kind} balance: ${progress.current[kind]} · saved locally if storage is available`
            : r;
      };
      body.querySelector("#dev-coins").onclick = () => add("coins");
      body.querySelector("#dev-diamonds").onclick = () => add("diamonds");
      body.querySelector("#dev-max-level").onclick = () => {
        account.developerMax();
        paint();
        root.querySelector("#dev-result").textContent =
          "Developer action: account is now level 25.";
      };
    }
  };
  paint();
}
