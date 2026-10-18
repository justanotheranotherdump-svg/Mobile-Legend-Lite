import { FixedClock } from "./core/clock.js";
import { withinEvents } from "./core/events.js";
import { Controls } from "./input/controls.js";
import { Hud } from "./ui/hud.js";
import { MatchHud } from "./ui/match-hud.js";
// One owned RAF, AbortController, renderer, HUD and event bus per session.
export async function createRuntime({
  simulation,
  heroVisual,
  View,
  profile,
  fixture = false,
  onReady,
  onExit,
  onEnd,
  onProgress = async () => {},
}) {
  const scope = new AbortController();
  let view,
    controls,
    hud,
    matchHud,
    raf = 0,
    disposed = false,
    paused = document.hidden,
    userPaused = false,
    offReady;
  const clock = new FixedClock();
  if (profile) simulation.playerName = profile.username;
  document.querySelector("#app").hidden = false;
  document.querySelector("#error").hidden = true;
  const syncPause = () => {
    simulation.paused = paused || userPaused;
    if (controls) controls.suspended = simulation.paused;
  };
  const setPaused = (value) => {
    userPaused = value;
    syncPause();
    controls.clear();
    clock.reset();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    controls?.clear();
    scope.abort();
    offReady?.();
    matchHud?.dispose();
    view?.dispose();
    simulation.events.listeners.clear();
    document.querySelector("#hud-root").replaceChildren();
    document.querySelector("#enemy-labels").replaceChildren();
    document.querySelector("#pause").hidden = true;
    document.querySelector("#app").hidden = true;
    if (window.foundationDiagnostics) delete window.foundationDiagnostics;
  };
  try {
    view = new View(
      document.querySelector("#world"),
      simulation.arena,
      simulation.isMatch ? [] : simulation.enemies,
      heroVisual,
    );
    view.canvas.setAttribute("aria-label", simulation.isMatch ? "3D single-lane local MOBA. Move with WASD or the touch joystick, click enemies to target, and destroy the enemy outer tower, inner tower and core." : "3D training arena. Use WASD or the joystick to move and left-click ground for smart attacks or a dummy to prioritize it.");
    view.connectCombat(simulation);
    await onProgress(4, "3D environment and objective visuals prepared");
    withinEvents(scope, () => {
      controls = new Controls(
        view.canvas,
        (pointer) => {
          if (!controls.skillGestureActive)
            simulation.attack(view.pickTarget(pointer));
        },
        { allowMenuGameplay: !fixture },
      );
      hud = new Hud(
        simulation,
        () => {
          simulation.reset();
          clock.reset();
          controls.clear();
          view.resetFeedback();
          heroVisual.reset();
        },
        (mode) => simulation.setTargetMode(mode),
        controls,
        view,
      );
      if (simulation.isMatch)
        matchHud = new MatchHud(simulation, {
          onPause: setPaused,
          onQuit: (destination) => onExit?.(destination),
        });
      if (onExit && !simulation.isMatch) {
        const exit = document.createElement("button");
        exit.id = "practice-exit";
        exit.type = "button";
        exit.textContent = "Exit Practice";
        exit.className = "practice-exit";
        exit.addEventListener("click", () => {
          setPaused(true);
          const panel = document.createElement("div");
          panel.className = "practice-exit-confirm";
          panel.innerHTML =
            '<section><h2>Leave Practice?</h2><button data-resume type="button">Keep practicing</button><button data-leave type="button">Return to room</button></section>';
          document.querySelector("#hud-root").append(panel);
          panel.querySelector("[data-resume]").onclick = () => {
            panel.remove();
            setPaused(false);
          };
          panel.querySelector("[data-leave]").onclick = () => onExit("room");
        });
        document.querySelector("#hud-root").append(exit);
      }
    });
    await onProgress(5, "HUD, equipment, touch and keyboard input initialized");
    offReady = onReady?.({ simulation });
    await onProgress(6, "Local audio and session resources connected");
    const options = { signal: scope.signal };
    window.addEventListener(
      "blur",
      () => {
        paused = true;
        syncPause();
        clock.reset();
        controls.clear();
        hud.paused(true);
      },
      options,
    );
    window.addEventListener(
      "focus",
      () => {
        paused = document.hidden;
        syncPause();
        clock.reset();
        hud.paused(paused);
      },
      options,
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        paused = document.hidden;
        syncPause();
        clock.reset();
        controls.clear();
        hud.paused(paused);
      },
      options,
    );
    view.canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        setPaused(true);
        const e = document.querySelector("#error");
        e.hidden = false;
        e.textContent = "Graphics context lost. Leave to the room and retry.";
      },
      options,
    );
    const diagnosticSnapshot = () => ({
      ...simulation.snapshot(),
      aim: view.aim && { ...view.aim },
      paused: paused || userPaused,
      width: view.width,
      height: view.height,
    });
    if (location.hash === "#diagnostics")
      window.foundationDiagnostics = Object.freeze({
        snapshot: diagnosticSnapshot,
        project: (x, y, z) => view.project(x, y, z),
        hero: () => ({
          id: simulation.hero.id,
          definition: structuredClone(simulation.hero),
          modelStatus: heroVisual.status,
          modelFacing: view.hero.rotation.y,
          sightVisible: Boolean(view.aimSight?.group.visible),
          visual: heroVisual.diagnostics(),
          effects: view.combatVfx?.diagnostics(),
          registeredIds: ["layla", "training"],
        }),
      });
    function frame(timestamp) {
      if (disposed) return;
      try {
        if (!paused && !userPaused)
          clock.advance(timestamp, (dt) =>
            simulation.update(dt, ...controls.axes),
          );
        else clock.reset();
        view.render(simulation, controls.pointer);
        hud.update(simulation, view);
        matchHud?.update();
        if (simulation.phase === "ended") {
          onEnd?.(structuredClone(simulation.result));
          if (disposed) return;
        }
        raf = requestAnimationFrame(frame);
      } catch (error) {
        setPaused(true);
        const box = document.querySelector("#error");
        box.hidden = false;
        box.textContent = `Runtime stopped safely: ${error.message}. Use Pause / Quit to leave.`;
        console.error(error);
      }
    }
    await onProgress(7, "Ready — local simulation starts with countdown");
    syncPause();
    raf = requestAnimationFrame(frame);
    view.canvas.focus({ preventScroll: true });
    return {
      simulation,
      heroVisual,
      view,
      controls,
      dispose,
      setPaused,
      diagnostics: () => ({
        disposed,
        listenerScopeAborted: scope.signal.aborted,
      }),
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
