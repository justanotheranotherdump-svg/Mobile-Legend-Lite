import { ProfileStore, browserStorage } from "./profile.js";
import { ProgressStore } from "./progress.js";
import { MenuNavigation } from "./navigation.js";
import { mountProfile } from "./profile-screen.js";
import { mountLobby } from "./lobby-screen.js";
import { mountModes } from "./mode-screen.js";
import { mountHeroDetails } from "./hero-details.js";
import { mountHeroShop } from "./shop-screen.js";
import { mountLobbySettings } from "./settings-screen.js";
import { LobbyView } from "./lobby-view.js";
import { LOBBY_BACKGROUND } from "./art.js";
import { PreferenceStore } from "../audio/preferences.js";
import { AudioEngine } from "../audio/engine.js";
import { renderMusicProof } from "../audio/score.js";
import { connectTrainingAudio } from "../audio/integration.js";
import "./menu.css";
import "./polish.css";
import "./hero-browser.css";
import "../audio/audio.css";
export function startMenuApplication(registry, startTraining) {
  const root = document.createElement("div");
  root.id = "menu-root";
  document.body.append(root);
  root.innerHTML = `<div class="menu-atmosphere" aria-hidden="true"><div class="sky-orbit"></div><div class="sky-horizon"></div></div><img id="lobby-backdrop" src="${LOBBY_BACKGROUND}" alt="" draggable="false"><div class="lobby-vignette" aria-hidden="true"></div><div class="ambient-motes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><canvas id="lobby-preview" aria-label="Existing 3D Layla model in the citadel lobby" hidden></canvas><main id="menu-content"></main><p id="menu-error" role="alert" hidden></p>`;
  const content = root.querySelector("#menu-content"),
    storage = browserStorage(),
    store = new ProfileStore(storage),
    progress = new ProgressStore(storage),
    preferences = new PreferenceStore(storage),
    audio = new AudioEngine(preferences);
  if (
    !preferences.persistent &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    preferences.value.reduceMotion = true;
  const applyPresentation = () =>
    document.documentElement.classList.toggle(
      "reduce-motion",
      preferences.value.reduceMotion,
    );
  preferences.subscribe(applyPresentation);
  applyPresentation();
  store.load();
  const nav = new MenuNavigation(Boolean(store.profile)),
    lobby = new LobbyView(root.querySelector("#lobby-preview"), registry);
  const shopState = { role: "All", query: "", scrollTop: 0 };
  let selectedHeroId = "layla";
  let entering = false,
    gameInitializations = 0,
    cleanup = () => {};
  function fail(cause) {
    console.error(cause);
    const box = root.querySelector("#menu-error");
    box.hidden = false;
    box.textContent = `Could not open the arena: ${cause.message}`;
    entering = false;
    const button = content.querySelector("#mode-training");
    if (button) button.disabled = false;
  }
  const go = (screen) => {
    if (!entering && nav.go(screen)) render();
  };
  function render() {
    cleanup();
    cleanup = () => {};
    root.dataset.screen = nav.screen;
    if (store.profile) progress.loadFor(store.profile);
    lobby.setActive(nav.screen === "lobby" || nav.screen === "modes");
    if (nav.screen === "create")
      mountProfile(content, (profile) => {
        if (nav.screen !== "create") return;
        store.save(profile);
        nav.go("lobby");
        audio.effect("confirm");
        render();
      });
    if (nav.screen === "lobby")
      cleanup = mountLobby(
        content,
        store.profile,
        store.persistent,
        {
          modes: () => go("modes"),
          shop: () => go("shop"),
          settings: () => go("settings"),
        },
        progress.snapshot(),
      );
    if (nav.screen === "lobby" && (progress.recovered || !progress.persistent))
      content
        .querySelector(".lobby-storage")
        .prepend(
          document.createTextNode(
            progress.recovered
              ? "Wallet recovered at zero · "
              : "Wallet is session-only · ",
          ),
        );
    if (nav.screen === "modes")
      mountModes(content, () => go("lobby"), enterTraining);
    if (nav.screen === "shop")
      mountHeroShop(content, progress.snapshot(), () => go("lobby"), {
        registry,
        state: shopState,
        onHero: (id) => {
          selectedHeroId = id;
          go("hero");
        },
      });
    if (nav.screen === "hero")
      mountHeroDetails(
        content,
        registry.get(selectedHeroId),
        progress.snapshot(),
        () => go("shop"),
      );
    if (nav.screen === "settings")
      cleanup = mountLobbySettings(content, preferences, audio, () =>
        go("lobby"),
      );
    if (nav.screen === "lobby" || nav.screen === "modes")
      lobby.prepare().catch(fail);
  }
  async function enterTraining() {
    if (entering || nav.screen !== "modes") return;
    entering = true;
    content.querySelector("#mode-training").disabled = true;
    content.querySelector("#mode-training small").textContent =
      "PREPARING ARENA…";
    try {
      const heroVisual = await lobby.release();
      if (!nav.go("training")) return;
      cleanup();
      cleanup = () => {};
      root.dataset.screen = "training";
      root.hidden = true;
      document.querySelector("#app").hidden = false;
      window.removeEventListener("keydown", backKey);
      gameInitializations++;
      await startTraining({
        registry,
        heroVisual,
        onReady: (context) => connectTrainingAudio(context, audio, preferences),
      });
      document.querySelector("#world").focus({ preventScroll: true });
      content.replaceChildren();
    } catch (cause) {
      root.hidden = false;
      document.querySelector("#app").hidden = true;
      fail(cause);
    }
  }
  function backKey(event) {
    if (event.defaultPrevented) return;
    if (event.code === "Escape" && nav.screen === "hero") {
      event.preventDefault();
      const close = content.querySelector(
        "[data-ability-sheet]:not([hidden]) #ability-close",
      );
      if (close) close.click();
      else go("shop");
      return;
    }
    if (
      event.code === "Escape" &&
      ["modes", "shop", "settings"].includes(nav.screen) &&
      !entering
    ) {
      event.preventDefault();
      go("lobby");
    }
  }
  function gesture(event) {
    if (!event.isTrusted || event.target?.closest?.("[data-audio-enable]"))
      return;
    if (event.type === "keydown" && !["Enter", "Space"].includes(event.code))
      return;
    audio.unlock();
  }
  document.addEventListener("pointerdown", gesture, { capture: true });
  document.addEventListener("keydown", gesture, { capture: true });
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target?.closest?.("button");
      if (event.isTrusted && button && !button.disabled) audio.effect("ui");
    },
    { capture: true },
  );
  const suspend = () => audio.setHidden(true),
    resume = () => audio.setHidden(document.hidden);
  window.addEventListener("blur", suspend);
  window.addEventListener("focus", resume);
  document.addEventListener("visibilitychange", () =>
    audio.setHidden(document.hidden),
  );
  window.addEventListener("keydown", backKey);
  window.addEventListener("pagehide", () => audio.dispose(), { once: true });
  if (location.hash === "#diagnostics")
    window.menuDiagnostics = Object.freeze({
      snapshot: () => ({
        screen: nav.screen,
        profile: store.profile && { ...store.profile },
        persistent: store.persistent,
        progress: progress.snapshot(),
        progressPersistent: progress.persistent,
        walletRecovered: progress.recovered,
        preferences: { ...preferences.value },
        preferencesPersistent: preferences.persistent,
        audio: audio.diagnostics(),
        entering,
        gameInitializations,
        lobby: lobby.diagnostics(),
      }),
      audioProof: renderMusicProof,
    });
  render();
}
