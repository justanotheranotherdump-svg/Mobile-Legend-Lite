import { SPELL_ART } from "../spells/art.js";
import { HistoryStore } from "../player/history.js";
import {
  resetLocalAccount,
  restoreLocalBackup,
  BACKUP_KEY,
} from "../player/account-tools.js";
import { mountPlayerProfile, mountOwnedHeroes } from "./player-profile.js";
import { BuildStore } from "../player/builds.js";
import { mountPreparation } from "./preparation-screen.js";
import { BattleAccountStore } from "./battle-account.js";
import { openBattleScreen } from "./battle-screen.js";
import { getSpell } from "../spells/catalog.js";
import { LocalLoadingState } from "./loading-state.js";
import SELECTION_BACKGROUND from "./assets/hero-selection-stage.png?inline";
import { MatchFlow } from "./match-flow.js";
import {
  mountAiModes,
  mountRoom,
  mountSelection,
  mountLoading,
  mountResults,
} from "./match-screens.js";
import { startMatch } from "../match/start.js";
import { createMatchConfig } from "../match/config.js";
import "./match-flow.css";
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
import ROOM_BACKGROUND from "./assets/room-sky.png?inline";
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
    flow = new MatchFlow();
  let lobby = new LobbyView(root.querySelector("#lobby-preview"), registry),
    sharedVisual = null,
    runtime = null,
    lastDisposed = null;
  const battleAccounts = new Map();
  let battleAccount = null,
    builds = null,
    history = null,
    heroReturn = "shop";
  const historyStores = new Map();
  const buildStores = new Map();
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
    if (store.profile) {
      progress.loadFor(store.profile);
      if (!battleAccounts.has(store.profile.username))
        battleAccounts.set(
          store.profile.username,
          new BattleAccountStore(storage, store.profile.username),
        );
      battleAccount = battleAccounts.get(store.profile.username);
      if (!buildStores.has(store.profile.username))
        buildStores.set(
          store.profile.username,
          new BuildStore(
            storage,
            store.profile.username,
            progress.current.ownedHeroes,
          ),
        );
      builds = buildStores.get(store.profile.username);
      if (!historyStores.has(store.profile.username))
        historyStores.set(
          store.profile.username,
          new HistoryStore(storage, store.profile.username),
        );
      history = historyStores.get(store.profile.username);
    }
    root.querySelector("#lobby-backdrop").src =
      nav.screen === "selection" ? SELECTION_BACKGROUND : LOBBY_BACKGROUND;
    const visualScreen =
      ["lobby", "modes"].includes(nav.screen) ||
      (nav.screen === "selection" && Boolean(flow.heroId));
    if (visualScreen && lobby.disposed) {
      const canvas = document.createElement("canvas");
      canvas.id = "lobby-preview";
      canvas.setAttribute("aria-label", "Shared approved Layla model");
      root.insertBefore(canvas, content);
      lobby = new LobbyView(canvas, registry, sharedVisual);
    }
    lobby.setSelection(nav.screen === "selection");
    lobby.setActive(visualScreen);
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
          preparation: () => go("preparation"),
          profile: () => go("profile"),
          owned: () => go("owned"),
        },
        progress.snapshot(),
        battleAccount,
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
    if (nav.screen === "create") {
      let canRestore = false;
      try {
        canRestore = Boolean(storage?.getItem(BACKUP_KEY));
      } catch {}
      if (canRestore) {
        const b = document.createElement("button");
        b.type = "button";
        b.id = "restore-local-account";
        b.textContent = "Restore last deleted local account";
        content.querySelector("#profile-form").append(b);
        b.onclick = () => {
          if (restoreLocalBackup(storage)) {
            store.load();
            if (store.profile) {
              nav.go("lobby");
              render();
            }
          }
        };
      }
    }
    if (nav.screen === "profile")
      mountPlayerProfile(content, {
        profile: store.profile,
        account: battleAccount,
        history,
        progress,
        onBack: () => go("lobby"),
        onReset: () => {
          const name = store.profile.username,
            r = resetLocalAccount(storage, name);
          if (!r.ok) return r;
          battleAccounts.delete(name);
          buildStores.delete(name);
          historyStores.delete(name);
          progress.sessions.clear();
          progress.current = null;
          store.profile = null;
          store.persistent = false;
          battleAccount = null;
          builds = null;
          history = null;
          nav.go("create");
          render();
          return r;
        },
      });
    if (nav.screen === "owned")
      mountOwnedHeroes(content, {
        owned: progress.current.ownedHeroes,
        registry,
        onBack: () => go("lobby"),
        onHero: (id) => {
          selectedHeroId = id;
          heroReturn = "owned";
          go("hero");
        },
      });
    if (nav.screen === "preparation")
      cleanup = mountPreparation(content, {
        builds,
        account: battleAccount,
        owned: progress.current.ownedHeroes,
        onBack: () => go("lobby"),
      });
    if (nav.screen === "modes")
      mountModes(
        content,
        () => go("lobby"),
        () => go("ai-modes"),
        () => {
          flow.chooseMode("brawl");
          flow.teamSize = 5;
          go("room");
        },
      );
    if (nav.screen === "ai-modes")
      mountAiModes(
        content,
        () => go("modes"),
        (mode) => {
          flow.chooseMode(mode);
          flow.teamSize = 5;
          go("room");
        },
      );
    if (nav.screen === "room")
      mountRoom(content, flow, store.profile, {
        onBack: () => go(flow.mode === "brawl" ? "modes" : "ai-modes"),
        onStart: () => {
          if (flow.startSelection()) go("selection");
        },
      });
    if (nav.screen === "selection")
      cleanup = mountSelection(
        content,
        flow,
        () => go("room"),
        enterMatch,
        store.profile,
        () => {
          if (nav.screen !== "selection" || !flow.heroId) return;
          lobby.setActive(true);
          lobby
            .prepare()
            .then(() => {
              if (nav.screen === "selection" && flow.heroId)
                lobby.setActive(true);
            })
            .catch(fail);
        },
      );
    if (nav.screen === "results")
      mountResults(content, flow.result, {
        onReplay: () => {
          flow.startSelection();
          go("selection");
        },
        onRoom: () => go("room"),
        onMenu: () => go("lobby"),
      });
    if (nav.screen === "shop")
      mountHeroShop(content, progress.snapshot(), () => go("lobby"), {
        registry,
        state: shopState,
        onHero: (id) => {
          selectedHeroId = id;
          heroReturn = "shop";
          go("hero");
        },
      });
    if (nav.screen === "hero")
      mountHeroDetails(
        content,
        registry.get(selectedHeroId),
        progress.snapshot(),
        () => go(heroReturn),
      );
    if (nav.screen === "settings")
      cleanup = mountLobbySettings(content, preferences, audio, () =>
        go("lobby"),
      );
    if (battleAccount && ["lobby", "room", "selection"].includes(nav.screen)) {
      const button = document.createElement("button");
      button.type = "button";
      button.id = "setup-battle-spell";
      button.className = "setup-battle-spell";
      if (nav.screen === "lobby") button.classList.add("spell-lobby-entry");
      const label = () =>
        (button.innerHTML = `<img class="selection-spell-icon" src="${SPELL_ART[battleAccount.value.selected]}" alt=""><span class="spell-entry-caption">BATTLE SPELL</span><span class="spell-entry-value"> ${getSpell(battleAccount.value.selected).name} · Account Lv ${battleAccount.level}${flow.mode === "practice" && nav.screen !== "lobby" ? " · inactive in dummy Practice" : ""}</span><small>Change before entering match ›</small>`);
      label();
      const anchor = content.querySelector("#hero-confirm"),
        heading = content.querySelector(".room-heading");
      if (anchor) anchor.before(button);
      else if (heading) heading.append(button);
      else content.append(button);
      if (nav.screen === "selection") {
        const label = document.createElement("label");
        label.className = "selection-build-label";
        label.textContent = "EQUIPMENT BUILD";
        const select = document.createElement("select");
        select.id = "selection-build";
        select.setAttribute("aria-label", "Match equipment build");
        select.append(
          new Option("Manual item priority", ""),
          ...builds.hero("layla").builds.map((b) => new Option(b.name, b.id)),
        );
        select.value = builds.hero("layla").selected || "";
        select.onchange = () => builds.select("layla", select.value || null);
        label.append(select);
        button.after(label);
      }
      button.onclick = () => {
        const opened = Date.now();
        if (nav.screen === "selection") flow.selectionPausedAt = opened;
        openBattleScreen(battleAccount, () => {
          if (flow.selectionPausedAt) {
            flow.selectionEndsAt += Date.now() - opened;
            flow.selectionPausedAt = null;
          }
          label();
          button.focus();
        });
      };
    }
    if (visualScreen) lobby.prepare().catch(fail);
  }
  function leaveRuntime(destination) {
    runtime?.dispose();
    lastDisposed = runtime?.diagnostics();
    runtime = null;
    entering = false;
    flow.preparing = false;
    root.hidden = false;
    audio.setScene("lobby");
    if (nav.go(destination)) render();
  }
  async function enterMatch() {
    if (entering || nav.screen !== "selection") return;
    let config;
    try {
      config = flow.confirm(store.profile);
      if (config) {
        config.spellId = battleAccount.value.selected;
        config.accountLevel = battleAccount.level;
        config.build = builds.selected(config.heroId)?.items.slice() || [];
        flow.config.spellId = config.spellId;
      }
      if (!config) return;
      createMatchConfig(config.mode, config.difficulty, config.teamSize);
    } catch (cause) {
      fail(cause);
      return;
    }
    entering = true;
    nav.go("loading");
    cleanup();
    cleanup = () => {};
    root.dataset.screen = "loading";
    mountLoading(content, flow, store.profile);
    const matchIdentity =
      crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const loading = new LocalLoadingState();
    const refreshLoading = () => {
      const elapsed = Math.min(loading.minimumMs, loading.elapsed);
      content
        .querySelector("#lineup-view-progress")
        ?.setAttribute("value", elapsed);
      const status = content.querySelector("#lineup-view-status");
      if (status)
        status.textContent = loading.ready
          ? `Team lineup · ${Math.ceil(Math.max(0, loading.minimumMs - loading.elapsed) / 1000)}s remaining`
          : `Preparing local resources · ${Math.floor(loading.elapsed / 1000)}s`;
    };
    const loadingTicker = setInterval(refreshLoading, 100);
    refreshLoading();
    const stage = async (value, message) => {
      content.querySelector("#local-load-progress").value = value;
      content.querySelector("#local-load-stage").textContent =
        `${value}/7 · ${message}`;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      loading.task(value);
      refreshLoading();
      if (value === 7) {
        content.querySelector("#local-load-stage").textContent =
          "7/7 · Local resources ready · viewing team lineup";
        await loading.finish();
      }
    };
    try {
      await stage(1, "Mode, hero, difficulty and roster validated");
      sharedVisual = await lobby.release();
      sharedVisual.reset();
      await stage(2, "Approved local Layla GLB and textures ready");
      const options = {
        registry,
        heroVisual: sharedVisual,
        profile: store.profile,
        config,
        deferReveal: true,
        onProgress: stage,
        onReady: (context) => connectTrainingAudio(context, audio, preferences),
        onExit: leaveRuntime,
        onEnd: (result) => {
          const awarded = battleAccount.award(matchIdentity);
          result.accountXpEarned = awarded ? 100 : 0;
          result.accountLevel = battleAccount.level;
          history.record(matchIdentity, config, result);
          flow.result = result;
          leaveRuntime("results");
        },
      };
      if (config.mode === "practice") {
        runtime = await startTraining({ ...options, throwOnError: true });
      } else runtime = await startMatch(options);
      clearInterval(loadingTicker);
      loading.dispose();
      nav.go("training");
      root.dataset.screen = "training";
      root.hidden = true;
      runtime.reveal();
      content.replaceChildren();
      gameInitializations++;
      entering = false;
      flow.preparing = false;
    } catch (cause) {
      clearInterval(loadingTicker);
      loading.dispose();
      runtime?.dispose();
      runtime = null;
      root.hidden = false;
      entering = false;
      flow.preparing = false;
      content.innerHTML =
        '<section class="flow-screen"><div class="flow-error"><h1>Local preparation failed</h1><p id="load-error" role="alert"></p><button id="load-retry" type="button">Retry</button><button id="load-back" type="button">Back to room</button></div></section>';
      content.querySelector("#load-error").textContent = cause.message;
      content.querySelector("#load-back").onclick = () => {
        nav.go("room");
        render();
      };
      content.querySelector("#load-retry").onclick = () => {
        nav.go("room");
        flow.startSelection();
        nav.go("selection");
        flow.selectHero("layla");
        enterMatch();
      };
      console.error(cause);
    }
  }
  function backKey(event) {
    if (event.defaultPrevented) return;
    if (
      event.code === "Escape" &&
      !entering &&
      ["ai-modes", "room", "selection", "results"].includes(nav.screen)
    ) {
      event.preventDefault();
      go(
        nav.screen === "selection"
          ? "room"
          : nav.screen === "ai-modes"
            ? "modes"
            : nav.screen === "results"
              ? "lobby"
              : flow.mode === "brawl"
                ? "modes"
                : "ai-modes",
      );
      return;
    }
    if (event.code === "Escape" && nav.screen === "hero") {
      event.preventDefault();
      const close = content.querySelector(
        "[data-ability-sheet]:not([hidden]) #ability-close",
      );
      if (close) close.click();
      else go(heroReturn);
      return;
    }
    if (
      event.code === "Escape" &&
      ["modes", "shop", "settings", "preparation", "profile", "owned"].includes(
        nav.screen,
      ) &&
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
        match: {
          mode: flow.mode,
          difficulty: flow.difficulty,
          teamSize: flow.teamSize,
          selectedHeroId: flow.heroId,
          allyCount: flow.allyCount,
          enemyCount: flow.enemyCount,
        },
        battleAccount: battleAccount?.snapshot(),
        builds: builds && structuredClone(builds.value),
        history: history && structuredClone(history.value),
        lastDisposed,
        lobby: lobby.diagnostics(),
      }),
      audioProof: renderMusicProof,
    });
  render();
}
