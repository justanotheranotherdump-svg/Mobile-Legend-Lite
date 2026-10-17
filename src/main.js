import { loadHeroRegistry } from './heroes/catalog.js';
import { createHeroVisual } from './rendering/heroes/hero-visual.js';
import './ui/style.css';
import arena from './data/arena.json';
import training from './data/training.json';
import { HeroCombatSimulation } from './simulation/hero-combat.js';
import { TrainingSimulation } from './simulation/game.js';
import { FixedClock } from './core/clock.js';
import { Controls } from './input/controls.js';
import { WorldView } from './rendering/world.js';
import { Hud } from './ui/hud.js';

const error = document.querySelector('#error');
function reportError(message) {
  error.hidden = false;
  error.textContent = message;
}

async function boot() {
  try {
    const registry = loadHeroRegistry();
    // Explicit historical fixture mode; normal standalone boot is reconstructed Layla.
    const fixture = new URLSearchParams(location.search).get("hero") === "training";
    const config = structuredClone(training);
    if (!fixture) config.player.heroId = "layla";
    const simulation = new (fixture ? TrainingSimulation : HeroCombatSimulation)(arena, config, registry);
    const heroVisual = await createHeroVisual(simulation.hero, registry.modelBytes(simulation.hero.id));
    const clock = new FixedClock();
    const view = new WorldView(document.querySelector('#world'), arena, simulation.enemies, heroVisual);
    view.connectCombat(simulation);
    if(!fixture)view.canvas.setAttribute("aria-label","3D training arena. WASD moves; click an enemy or press Space to attack. Tap 1/2/3 to auto-target; hold to aim, release to cast, Escape to cancel.");
    const controls = new Controls(view.canvas, pointer => {if(!controls.skillGestureActive)simulation.attack(view.pickTarget(pointer));});
    const hud = new Hud(simulation, () => {
      simulation.reset();
      clock.reset();
      controls.clear();
      view.resetFeedback();
      heroVisual.reset();
    }, mode => {
      controls.clear();
      simulation.setTargetMode(mode);
    }, controls, view);
    let paused = document.hidden;
    function pause() { paused = true; clock.reset(); controls.clear(); hud.paused(true); }
    function resume() { paused = document.hidden; clock.reset(); hud.paused(paused); }
    window.addEventListener('blur', pause);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
    view.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      pause();
      reportError('The graphics context was lost. Reload to restart.');
    });
    function frame(timestamp) {
      try {
        if (!paused) clock.advance(timestamp, dt => simulation.update(dt, ...controls.axes));
        view.render(simulation, controls.pointer);
        hud.update(simulation, view);
        requestAnimationFrame(frame);
      } catch (cause) { console.error(cause); reportError('The prototype encountered a runtime error.'); }
    }
    requestAnimationFrame(frame);
    // Optional read-only diagnostics for reproducible browser tests; no mutation API.
    if (location.hash === '#diagnostics') {
      window.foundationDiagnostics = Object.freeze({
        snapshot: () => ({ ...simulation.snapshot(), aim: view.aim && { ...view.aim }, paused, width: view.width, height: view.height }),
        project: (x, y, z) => view.project(x, y, z),
        hero: () => ({ id: simulation.hero.id, definition: structuredClone(simulation.hero), modelStatus: heroVisual.status, modelFacing:view.hero.rotation.y, sightVisible:Boolean(view.aimSight?.group.visible), visual:heroVisual.diagnostics(), effects:view.combatVfx?.diagnostics(), registeredIds: registry.ids() }),
      });
    }
  } catch (cause) { console.error(cause); reportError(`Could not initialize the 3D arena: ${cause.message}. Check hero data; graphics also require WebGL2-enabled Chrome/Edge.`); }
}
boot();
