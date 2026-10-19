import { icon } from "./components/icons.js";
import { KeySettings } from "./key-settings.js";
export const SETTINGS_TABS = Object.freeze(["Basic", "Controls", "Interface"]);
export function settingsMarkup({cheats=false} = {}) {
  return `<header class="settings-header"><span class="eyebrow">LOCAL PREFERENCES</span><h2 id="settings-title">Settings</h2><button type="button" class="tool-button" data-close data-control-kind="interface-only" aria-label="Close settings">${icon("close")}</button></header>
    <nav class="settings-sidebar" role="tablist" aria-label="Settings categories" aria-orientation="vertical">${SETTINGS_TABS.map((label, i) => `<button type="button" id="settings-tab-${label.toLowerCase()}" role="tab" aria-controls="settings-page-${label.toLowerCase()}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-settings-tab="${label.toLowerCase()}" data-control-kind="interface-only">${label}</button>`).join("")}<button type="button" disabled data-control-kind="reserved" title="Reserved — no audio system">Sound<small>RESERVED</small></button><button type="button" disabled data-control-kind="reserved" title="Offline single-player — no network settings">Network<small>OFFLINE</small></button>${cheats ? '<button type="button" id="settings-tab-cheats" role="tab" aria-controls="settings-page-cheats" aria-selected="false" tabindex="-1" data-settings-tab="cheats" data-control-kind="interface-only">Cheats</button>' : ""}</nav>
    <div class="settings-content">
      <section id="settings-page-basic" role="tabpanel" aria-labelledby="settings-tab-basic" tabindex="0"><h3 class="settings-divider">Presentation</h3><label class="setting-row"><span>Reduce HUD motion<small>Reduce interface animation. Does not change combat or movement.</small></span><input id="reduce-motion" type="checkbox" data-control-kind="interface-only"></label><h3 class="settings-divider">Training environment</h3><dl class="settings-facts"><div><dt>Rendering</dt><dd>WebGL2 · 3D</dd></div><div><dt>Game</dt><dd>Offline training</dd></div><div><dt>Delivery</dt><dd>Self-contained HTML</dd></div></dl><p class="settings-help">Graphics quality, resolution and frame-rate presets are not implemented.</p></section>
      <section id="settings-page-controls" role="tabpanel" aria-labelledby="settings-tab-controls" tabindex="0" hidden><h3 class="settings-divider">Target</h3><fieldset class="settings-priority"><legend>Targeting priority</legend><div data-priority-options></div></fieldset><p class="settings-help">Smart basic attack approaches a valid target and repeats attacks. WASD/joystick movement cancels it. Click an enemy to pin it; dedicated minion and tower buttons keep their category.</p><h3 class="settings-divider">Joystick settings</h3><label class="setting-row"><span>On-screen joystick<small>Optional. WASD always remains available outside menus.</small></span><input id="show-joystick" type="checkbox" checked data-control-kind="functional"></label><h3 class="settings-divider">Keyboard settings</h3><div id="keyboard-settings"></div><p data-key-help></p></section>
      <section id="settings-page-interface" role="tabpanel" aria-labelledby="settings-tab-interface" tabindex="0" hidden><h3 class="settings-divider">Button display</h3><div id="hint-settings"></div><h3 class="settings-divider">Battlefield controls</h3><dl class="controls-help"><div><dt>W A S D / Joystick</dt><dd>Camera-relative movement</dd></div><div><dt>Left click enemy</dt><dd>Pin and attempt basic attack</dd></div><div><dt>Left click ground</dt><dd>Attack current smart target</dd></div><div><dt>Regen · default V</dt><dd>Restore HP / mana over time; damage cancels</dd></div></dl><p class="settings-help">Movement and attacks are blocked while Shop or Settings is open. Close the panel, then press a movement key again to resume.</p></section>
      ${cheats ? '<section id="settings-page-cheats" role="tabpanel" aria-labelledby="settings-tab-cheats" tabindex="0" hidden><h3 class="settings-divider">Local match testing</h3><p class="settings-help">Single-player development only. Adds match Gold for equipment testing, not account Coins, diamonds, levels, items or skill points. Does not count as earned income or blessing progression.</p><button type="button" id="cheat-add-gold" data-control-kind="functional">Add +9999 Gold</button><p id="cheat-gold-result" role="status" aria-live="polite"></p></section>' : ""}
    </div><footer class="settings-footer"><span>SESSION ONLY <i>·</i> Changes apply immediately</span><span><kbd>ESC</kbd> Back to arena</span></footer>`;
}
export class SettingsPanel {
  constructor(dialog, bindings, clearInput, options = {}) {
    dialog.classList.add("settings-window");
    dialog.innerHTML = settingsMarkup(options);
    const addGold=dialog.querySelector("#cheat-add-gold");
    if(addGold) addGold.onclick=()=>{clearInput();const result=options.addGold();dialog.querySelector("#cheat-gold-result").textContent=result==="ok" ? "+9999 Gold added · Match balance: "+options.getGold() : result;};
    this.keySettings = new KeySettings(
      dialog.querySelector("#keyboard-settings"),
      bindings,
      clearInput,
    );
    dialog
      .querySelector("#hint-settings")
      .append(this.keySettings.hints.closest(".setting-row"));
    const tabs = [...dialog.querySelectorAll("[data-settings-tab]")];
    const activate = (tab, focus = false) => {
      clearInput();
      for (const option of tabs) {
        option.setAttribute("aria-selected", String(option === tab));
        option.tabIndex = option === tab ? 0 : -1;
      }
      for (const panel of dialog.querySelectorAll('[role="tabpanel"]'))
        panel.hidden = panel.id !== tab.getAttribute("aria-controls");
      dialog.querySelector(".settings-content").scrollTop = 0;
      if (focus) tab.focus();
    };
    for (const [index, tab] of tabs.entries()) {
      tab.addEventListener("click", () => activate(tab));
      tab.addEventListener("keydown", (event) => {
        const next =
          event.key === "ArrowDown"
            ? (index + 1) % tabs.length
            : event.key === "ArrowUp"
              ? (index + tabs.length - 1) % tabs.length
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : null;
        if (next !== null) {
          event.preventDefault();
          activate(tabs[next], true);
        }
      });
    }
  }
}
