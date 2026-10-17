import { ShopPanel, EQUIPMENT_SLOT_COUNT } from "./shop-panel.js";
import { KeySettings } from "./key-settings.js";
import { icon } from "./components/icons.js";
export class PlaceholderPanels {
  constructor(elements, joystick, clearInput, bindings) {
    const e = elements;
    e["equipment-slots"].innerHTML =
      Array.from(
        { length: EQUIPMENT_SLOT_COUNT },
        (_, i) =>
          `<button class="item-slot" type="button" disabled data-control-kind="reserved" aria-label="Equipment slot ${i + 1} reserved" title="Empty equipment slot"><span class="empty-slot-mark" aria-hidden="true"></span></button>`,
      ).join("") +
      `<button class="item-slot quick-buy" type="button" disabled data-control-kind="reserved" title="Quick buy reserved — no purchases" aria-label="Quick buy reserved">${icon("plus")}</button>`;
    this.shop = new ShopPanel(e["shop-dialog"]);
    e["settings-dialog"].innerHTML =
      `<div class="dialog-heading"><div><span class="eyebrow">LOCAL INTERFACE</span><h2 id="settings-title">Settings & controls</h2></div><button type="button" class="tool-button" data-control-kind="interface-only" data-close aria-label="Close settings">${icon("close")}</button></div><label class="setting-row"><span>On-screen joystick<small>Optional. WASD always remains available.</small></span><input id="show-joystick" type="checkbox" checked data-control-kind="functional"></label><label class="setting-row"><span>Reduce HUD motion<small>Presentation only. Does not alter gameplay.</small></span><input id="reduce-motion" type="checkbox" data-control-kind="interface-only"></label><div id="keyboard-settings"></div><dl class="controls-help"><div><dt>W A S D / Joystick</dt><dd>Camera-relative movement</dd></div><div><dt>Left click enemy</dt><dd>Pin and attempt basic attack</dd></div><div><dt>Left click ground</dt><dd>Attack current smart target</dd></div></dl><p data-key-help></p><p>Keyboard buttons: Tab to focus, Enter / Space to activate. Escape closes panels. Interface settings are session-only.</p>`;
    this.keySettings = new KeySettings(
      e["settings-dialog"].querySelector("#keyboard-settings"),
      bindings,
      clearInput,
    );
    for (const id of ["show-joystick", "reduce-motion"])
      e[id] = e["settings-dialog"].querySelector(`#${id}`);
    e["show-joystick"].addEventListener("change", () =>
      joystick.setEnabled(e["show-joystick"].checked),
    );
    e["reduce-motion"].checked = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    e["reduce-motion"].addEventListener("change", () =>
      document.documentElement.classList.toggle(
        "reduce-motion",
        e["reduce-motion"].checked,
      ),
    );
    for (const [trigger, dialog] of [
      [e.shop, e["shop-dialog"]],
      [e.settings, e["settings-dialog"]],
    ]) {
      trigger.setAttribute("aria-controls", dialog.id);
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("click", () => {
        clearInput();
        dialog.showModal();
        trigger.setAttribute("aria-expanded", "true");
      });
      const close = () => {
        clearInput();
        dialog.close();
        trigger.setAttribute("aria-expanded", "false");
        trigger.blur();
        document.querySelector("#world").focus({ preventScroll: true });
      };
      dialog.querySelector("[data-close]").addEventListener("click", close);
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        close();
      });
      dialog.addEventListener("close", () =>
        trigger.setAttribute("aria-expanded", "false"),
      );
      dialog.addEventListener("pointerdown", (event) => {
        if (event.target === dialog) {
          const r = dialog.getBoundingClientRect();
          if (
            event.clientX < r.left ||
            event.clientX > r.right ||
            event.clientY < r.top ||
            event.clientY > r.bottom
          )
            close();
        }
      });
    }
  }
}
