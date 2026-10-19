import { imageIcon } from "./art.js";
import { mountAudioControls } from "../audio/settings-controls.js";
export function mountLobbySettings(root, preferences, audio, onBack) {
  root.innerHTML = `<section class="front-panel lobby-settings" aria-labelledby="lobby-settings-title"><header class="front-panel-header"><button id="preferences-back" class="front-back" type="button">${imageIcon("back")}<span>Back</span></button><div><p class="menu-kicker">LOCAL PREFERENCES</p><h1 id="lobby-settings-title">Settings</h1></div></header><div class="front-settings-body"><nav class="front-settings-tabs" role="tablist" aria-label="Settings categories"><button id="pref-tab-audio" type="button" role="tab" aria-selected="true" aria-controls="pref-audio">Audio</button><button id="pref-tab-display" type="button" role="tab" aria-selected="false" aria-controls="pref-display">Presentation</button></nav><div class="front-settings-content"><section id="pref-audio" role="tabpanel" aria-labelledby="pref-tab-audio"></section><section id="pref-display" role="tabpanel" aria-labelledby="pref-tab-display" hidden><h2>Presentation</h2><label class="audio-option"><span>Reduce interface motion<small>Minimize transitions, ambient particles and glows. Does not alter combat.</small></span><input id="lobby-reduce-motion" type="checkbox"></label><p class="audio-save-note">Gameplay targeting, key bindings and button hints remain in Training Settings. Graphics-quality presets, chat, network tests and online services are not implemented.</p></section></div></div><footer class="front-panel-footer">CHANGES APPLY IMMEDIATELY <span data-preferences-save></span></footer></section>`;
  const audioCleanup = mountAudioControls(
    root.querySelector("#pref-audio"),
    preferences,
    audio,
    { prefix: "lobby-audio" },
  );
  const motion = root.querySelector("#lobby-reduce-motion");
  motion.addEventListener("change", () =>
    preferences.update({ reduceMotion: motion.checked }),
  );
  function sync() {
    motion.checked = preferences.value.reduceMotion;
    root.querySelector("[data-preferences-save]").textContent =
      preferences.persistent
        ? "Saved in this browser"
        : "Local settings · session fallback if storage is blocked";
  }
  const off = preferences.subscribe(sync);
  sync();
  root.querySelector("#preferences-back").addEventListener("click", onBack);
  const names = ["audio", "display"];
  const activate = (name, focus = false) => {
    for (const other of names) {
      const tab = root.querySelector("#pref-tab-" + other);
      tab.setAttribute("aria-selected", String(other === name));
      tab.tabIndex = other === name ? 0 : -1;
      root.querySelector("#pref-" + other).hidden = other !== name;
    }
    if (focus) root.querySelector("#pref-tab-" + name).focus();
  };
  for (const [index, name] of names.entries()) {
    const tab = root.querySelector("#pref-tab-" + name);
    tab.addEventListener("click", () => activate(name));
    tab.addEventListener("keydown", (event) => {
      const next = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(
        event.key,
      )
        ? names[1 - index]
        : event.key === "Home"
          ? names[0]
          : event.key === "End"
            ? names[1]
            : null;
      if (next) {
        event.preventDefault();
        activate(next, true);
      }
    });
  }
  activate("audio");
  return () => {
    audioCleanup();
    off();
  };
}
