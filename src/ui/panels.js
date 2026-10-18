import { listen } from '../core/events.js';
import { ShopPanel, EQUIPMENT_SLOT_COUNT } from "./shop-panel.js";
import { SettingsPanel } from "./settings-panel.js";
import { icon } from "./components/icons.js";
export class PlaceholderPanels {
  constructor(elements, joystick, controls, bindings) {
    const e = elements;
    const clearInput = () =>
      controls.allowMenuGameplay
        ? controls.cancelCombatInput()
        : controls.clear();
    const syncMenu = () =>
      controls.setMenuBlocked(Boolean(document.querySelector("dialog[open]")));
    e["equipment-slots"].innerHTML =
      Array.from(
        { length: EQUIPMENT_SLOT_COUNT },
        (_, i) =>
          `<button class="item-slot" type="button" disabled data-control-kind="reserved" aria-label="Equipment slot ${i + 1} reserved" title="Empty equipment slot"><span class="empty-slot-mark" aria-hidden="true"></span></button>`,
      ).join("") +
      `<button class="item-slot quick-buy" type="button" disabled data-control-kind="reserved" title="Quick buy reserved — no purchases" aria-label="Quick buy reserved">${icon("plus")}</button>`;
    this.shop = new ShopPanel(e["shop-dialog"]);
    this.settings = new SettingsPanel(
      e["settings-dialog"],
      bindings,
      clearInput,
    );
    if (controls.allowMenuGameplay) {
      e["settings-dialog"].querySelector(
        ".controls-help + .settings-help",
      ).textContent =
        "Shop and Settings are non-blocking panels: WASD, attacks and skills stay active. Editing fields keep their keys. Escape closes the panel; skill aiming gets Escape first.";
    }
    this.keySettings = this.settings.keySettings;
    for (const id of ["show-joystick", "reduce-motion"])
      e[id] = e["settings-dialog"].querySelector(`#${id}`);
    if (!joystick) {
      const label = e["show-joystick"].closest("label");
      label.previousElementSibling?.remove();
      label.remove();
      e["settings-dialog"].querySelector(".controls-help dt").textContent =
        "W A S D";
    }
    e["show-joystick"].addEventListener("change", () =>
      joystick?.setEnabled(e["show-joystick"].checked),
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
        if (controls.allowMenuGameplay) {
          if (dialog.open) {
            close();
            return;
          }
          for (const other of [e["shop-dialog"], e["settings-dialog"]])
            if (other !== dialog) other.close();
          if(controls.skillGestureActive)clearInput();
          dialog.show();
        } else {
          clearInput();
          dialog.showModal();
        }
        syncMenu();
        trigger.setAttribute("aria-expanded", "true");
      });
      const close = () => {
        if (!controls.allowMenuGameplay) clearInput();
        dialog.close();
        syncMenu();
        trigger.setAttribute("aria-expanded", "false");
        trigger.blur();
        document.querySelector("#world").focus({ preventScroll: true });
      };
      dialog.querySelector("[data-close]").addEventListener("click", close);
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        close();
      });
      dialog.addEventListener("close", () => {
        trigger.setAttribute("aria-expanded", "false");
        syncMenu();
      });
      if (controls.allowMenuGameplay)
        listen(window, "keydown", (event) => {
          if (
            event.code === "Escape" &&
            dialog.open &&
            !event.defaultPrevented
          ) {
            event.preventDefault();
            close();
          }
        });
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
