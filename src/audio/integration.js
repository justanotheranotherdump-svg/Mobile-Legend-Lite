import { mountAudioControls } from "./settings-controls.js";
// Read-only consumer of established combat events; never applies gameplay effects.
export function connectTrainingAudio({ simulation }, audio, preferences) {
  audio.setScene("training");
  const offEvents=simulation.events.subscribe((event) => {
    if (["brawl-rune-complete","brawl-rune-pickup","brawl-cloud","brawl-barrel-pickup"].includes(event.type)) audio.effect("skill");
    else if (["brawl-rune-cancel","brawl-barrel-impact"].includes(event.type)) audio.effect("impact");
    else if (event.type === "launch") audio.effect("shot");
    else if (event.type === "cast" || event.type === "beam")
      audio.effect("skill");
    else if (event.type === "hit") audio.effect("impact");
  });
  let offControls=()=>{};
  const panel = document.querySelector("#settings-page-basic");
  if (panel && !document.querySelector("#game-audio-controls")) {
    const audioBlock = document.createElement("div");
    audioBlock.id = "game-audio-controls";
    audioBlock.innerHTML =
      '<h3 class="settings-divider">Audio</h3><div data-game-audio></div>';
    panel.append(audioBlock);
    offControls=mountAudioControls(
      audioBlock.querySelector("[data-game-audio]"),
      preferences,
      audio,
      { prefix: "game-audio" },
    );
    const reserved = document.querySelector(
      '#settings-dialog button[title="Reserved — no audio system"]',
    );
    if (reserved) {
      const button = document.createElement("button");
      button.type = "button";
      button.id = "settings-audio-shortcut";
      button.dataset.controlKind = "functional";
      button.textContent = "Audio";
      button.addEventListener("click", () => {
        document.querySelector("#settings-tab-basic").click();
        audioBlock.scrollIntoView({ block: "start", behavior: "auto" });
      });
      reserved.replaceWith(button);
    }
  }
  const footer = document.querySelector(
    "#settings-dialog .settings-footer>span",
  );
  if (footer)
    footer.textContent =
      "Audio/motion use local storage or session fallback · keys are session-only";
  const motion = document.querySelector("#reduce-motion");
  if (motion) {
    motion.checked = preferences.value.reduceMotion;
    motion.addEventListener("change", () =>
      preferences.update({ reduceMotion: motion.checked }),
    );
  }
  return ()=>{offEvents();offControls();};
}
