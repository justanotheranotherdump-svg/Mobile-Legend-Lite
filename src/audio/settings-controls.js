import { DEFAULT_PREFERENCES } from "./preferences.js";
export function mountAudioControls(
  root,
  preferences,
  audio,
  { prefix = "audio" } = {},
) {
  root.innerHTML = `<section class="audio-preferences" aria-label="Audio preferences"><div class="audio-status-row"><p data-audio-status role="status"></p><button type="button" class="audio-enable" data-audio-enable>Enable audio</button></div>
  <label class="audio-option"><span>Sound<small>Master switch for music and effects</small></span><input type="checkbox" data-audio-master aria-label="Sound enabled"></label>
  <label class="audio-option"><span>Music<small>Original, locally synthesized instrumental score</small></span><input type="checkbox" data-pref="musicEnabled" aria-label="Music enabled"></label>
  <label class="audio-option"><span>Sound effects<small>Interface feedback and actual combat cues</small></span><input type="checkbox" data-pref="effectsEnabled" aria-label="Sound effects enabled"></label>
  ${[
    ["masterVolume", "Master volume"],
    ["musicVolume", "Music volume"],
    ["effectsVolume", "Effects volume"],
  ]
    .map(
      ([key, label]) =>
        `<label class="audio-volume" for="${prefix}-${key}"><span>${label}</span><input id="${prefix}-${key}" type="range" min="0" max="100" step="1" data-pref="${key}"><output for="${prefix}-${key}" data-output="${key}"></output></label>`,
    )
    .join("")}
  <button type="button" class="audio-reset" data-audio-reset>Reset audio</button><p class="audio-save-note">No remote tracks, voice chat or online services. Changes save locally when storage is available.</p></section>`;
  const status = root.querySelector("[data-audio-status]"),
    enable = root.querySelector("[data-audio-enable]");
  function sync() {
    const p = preferences.value,
      s = audio.diagnostics();
    root.querySelector("[data-audio-master]").checked = !p.masterMuted;
    for (const node of root.querySelectorAll("[data-pref]")) {
      const value = p[node.dataset.pref];
      if (node.type === "checkbox") node.checked = value;
      else {
        node.value = Math.round(value * 100);
        root.querySelector(`[data-output="${node.dataset.pref}"]`).value =
          `${Math.round(value * 100)}%`;
      }
    }
    status.textContent =
      s.status === "unavailable"
        ? "Audio unavailable in this browser; the game is still playable."
        : s.status === "locked"
          ? "Click or tap to enable sound."
          : s.hidden || s.contextState === "suspended"
            ? "Audio paused while the game is unfocused."
            : p.masterMuted
              ? "All sound is muted."
              : !p.musicEnabled
                ? "Music off; effects follow their own switch."
                : `Original instrumental · ${s.scene === "training" ? "Training rhythm" : "Citadel theme"}`;
    enable.hidden = !["locked", "unavailable"].includes(s.status);
    enable.disabled = s.status === "unavailable";
  }
  root
    .querySelector("[data-audio-master]")
    .addEventListener("change", (e) =>
      preferences.update({ masterMuted: !e.target.checked }),
    );
  root
    .querySelectorAll("[data-pref]")
    .forEach((node) =>
      node.addEventListener(node.type === "range" ? "input" : "change", () =>
        preferences.update({
          [node.dataset.pref]:
            node.type === "checkbox" ? node.checked : Number(node.value) / 100,
        }),
      ),
    );
  enable.addEventListener("click", () => audio.unlock());
  root.querySelector("[data-audio-reset]").addEventListener("click", () => {
    const reset = { ...DEFAULT_PREFERENCES };
    delete reset.reduceMotion;
    preferences.update(reset);
  });
  const offPref = preferences.subscribe(sync),
    offAudio = audio.subscribe(sync);
  sync();
  return () => {
    offPref();
    offAudio();
  };
}
