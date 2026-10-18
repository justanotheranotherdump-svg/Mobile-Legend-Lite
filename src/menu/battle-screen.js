import { spells, unlocked } from "../spells/catalog.js";
import { SPELL_ART } from "../spells/art.js";
import "./battle-screen.css";
export function openBattleScreen(account, onClose) {
  const root = document.createElement("section");
  root.className = "battle-screen";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Battle Spells");
  const paint = () => {
    root.innerHTML = `<header><div><small>LOCAL ACCOUNT · LEVEL ${account.level} · XP ${account.value.xp}</small><h1>Battle Spells</h1><p>One spell per match · Hero level scales power; account level unlocks spells</p></div><button type="button" id="battle-close" aria-label="Close Battle Spells">×</button></header><div class="battle-card-grid">${spells
      .map((s) => {
        const open = unlocked(s.id, account.level),
          equipped = s.id === account.value.selected;
        return `<article class="battle-card ${open ? "unlocked" : "locked"} ${equipped ? "equipped" : ""}" data-spell-card="${s.id}"><div class="spell-card-heading"><img src="${SPELL_ART[s.id]}" alt=""><div><h2>${s.name.toUpperCase()}</h2><small><em>${s.cooldown}s</em> · Account Lv ${s.unlockLevel}</small></div></div><section class="ability-copy"><h3>ϟ ABILITY</h3><p>${s.ability}</p></section><section class="strategy-copy"><h3>⚔ STRATEGY</h3><p>${s.strategy}</p></section><footer><div>${s.roles.map((r) => `<span class="role-tag role-${r.toLowerCase()}">${r.toUpperCase()}</span>`).join("")}</div><button type="button" data-equip-spell="${s.id}" ${!open || equipped ? "disabled" : ""}>${equipped ? "EQUIPPED" : open ? "EQUIP" : "LOCKED · Lv " + s.unlockLevel}</button></footer></article>`;
      })
      .join(
        "",
      )}</div><p class="battle-account-note">Prototype account progression: +100 XP per completed lane match, 100 XP per account level (maximum 25). No account coins or diamonds spent. Practice and quit matches do not grant XP.</p>`;
    root.querySelector("#battle-close").onclick = close;
    for (const b of root.querySelectorAll("[data-equip-spell]"))
      b.onclick = () => {
        account.equip(b.dataset.equipSpell);
        paint();
      };
  };
  const scope = new AbortController(),
    close = () => {
      scope.abort();
      root.remove();
      onClose();
    };
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.code === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
      if (e.code === "Tab") {
        const buttons = [...root.querySelectorAll("button:not(:disabled)")],
          n = buttons.indexOf(document.activeElement);
        if (buttons.length) {
          e.preventDefault();
          buttons[
            (n + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length
          ].focus();
        }
      }
    },
    { capture: true, signal: scope.signal },
  );
  document.body.append(root);
  paint();
  root.querySelector("#battle-close").focus();
  return close;
}
