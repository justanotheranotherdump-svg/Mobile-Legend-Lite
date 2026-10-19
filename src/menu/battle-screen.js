import { spells, unlocked } from "../spells/catalog.js";
import { SPELL_ART } from "../spells/art.js";
import "./battle-screen.css";
export function openBattleScreen(account, onClose, {host=null}={}) {
  const root = document.createElement("section");
  root.className = "battle-screen"+(host?" embedded-battle-screen":"");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", host?"false":"true");
  root.setAttribute("aria-label", "Battle Spells");
  let inspected = account.value.selected,
    detailed = false;
  const paint = () => {
    const chosen = spells.find((s) => s.id === inspected) || spells[0];
    root.classList.toggle("detailed-spells", detailed);
    root.innerHTML = `<header><div><small>LOCAL ACCOUNT · LEVEL ${account.level} · XP ${account.value.xp}</small><h1>Battle Spells</h1><p>One spell per match · Hero level scales power; account level unlocks spells</p></div><button type="button" id="battle-layout">${detailed ? "Icon list" : "Detailed cards"}</button><button type="button" id="battle-close" aria-label="Close Battle Spells">×</button></header><div class="spell-browser-layout"><div class="battle-card-grid">${spells
      .map((s) => {
        const open = unlocked(s.id, account.level),
          equipped = s.id === account.value.selected;
        return `<article class="battle-card ${open ? "unlocked" : "locked"} ${equipped ? "equipped" : ""}" data-spell-card="${s.id}"><button type="button" class="spell-card-heading" data-inspect-spell="${s.id}"><img src="${SPELL_ART[s.id]}" alt=""><div><h2>${s.name.toUpperCase()}</h2><small><em>${s.cooldown}s</em> · Account Lv ${s.unlockLevel}</small></div></button><section class="ability-copy"><h3>ϟ ABILITY</h3><p>${s.ability}</p></section><section class="strategy-copy"><h3>⚔ STRATEGY</h3><p>${s.strategy}</p></section><footer><div>${s.roles.map((r) => `<span class="role-tag role-${r.toLowerCase()}">${r.toUpperCase()}</span>`).join("")}</div><button type="button" data-equip-spell="${s.id}" ${!open || equipped ? "disabled" : ""}>${equipped ? "EQUIPPED" : open ? "EQUIP" : "LOCKED · Lv " + s.unlockLevel}</button></footer></article>`;
      })
      .join(
        "",
      )}</div><aside class="spell-inspector"><img src="${SPELL_ART[chosen.id]}" alt=""><h2>${chosen.name}</h2><p>${chosen.cooldown}s cooldown · Account level ${chosen.unlockLevel}</p><p class="spell-unlock-state">${chosen.id === account.value.selected ? "EQUIPPED" : unlocked(chosen.id, account.level) ? "AVAILABLE · Equip using the spell tile" : "LOCKED · Requires account level " + chosen.unlockLevel}</p><h3>Ability</h3><p>${chosen.ability}</p><h3>Strategy</h3><p>${chosen.strategy}</p><div>${chosen.roles.map((r) => `<span class="role-tag">${r}</span>`).join("")}</div></aside></div><p class="battle-account-note">Prototype account progression: +100 XP per completed lane match, 100 XP per account level (maximum 25). No account coins or diamonds spent. Practice and quit matches do not grant XP.</p>`;
    root.querySelector("#battle-close").onclick = close;
    root.querySelector("#battle-layout").onclick = () => {
      detailed = !detailed;
      paint();
    };
    for (const b of root.querySelectorAll("[data-inspect-spell]"))
      b.onclick = () => {
        inspected = b.dataset.inspectSpell;
        paint();
      };
    for (const b of root.querySelectorAll("[data-equip-spell]"))
      b.onclick = () => {
        account.equip(b.dataset.equipSpell);
        inspected = b.dataset.equipSpell;
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
      if (e.code === "Tab" && !host) {
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
  (host||document.body).append(root);
  paint();
  root.querySelector("#battle-close").focus();
  close.dispose=()=>{scope.abort();root.remove()};
  return close;
}
