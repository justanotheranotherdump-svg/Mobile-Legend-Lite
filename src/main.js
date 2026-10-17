import { loadHeroRegistry } from './heroes/catalog.js';
import { createHeroVisual } from './rendering/heroes/hero-visual.js';
import './ui/style.css';
import arena from './data/arena.json';
import training from './data/training.json';
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
    const simulation = new TrainingSimulation(arena, training, registry);
    const heroVisual = await createHeroVisual(simulation.hero, registry.modelBytes(simulation.hero.id));
    const clock = new FixedClock();
    const view = new WorldView(document.querySelector('#world'), arena, simulation.enemies, heroVisual);
    const controls = new Controls(view.canvas, pointer => simulation.attack(view.pickTarget(pointer)));
    const hud = new Hud(simulation, () => {
      simulation.reset();
      clock.reset();
      controls.clear();
      view.resetFeedback();
      heroVisual.reset();
    }, mode => {
      controls.clear();
      simulation.setTargetMode(mode);
    });
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
        hero: () => ({ id: simulation.hero.id, definition: structuredClone(simulation.hero), modelStatus: heroVisual.status, registeredIds: registry.ids() }),
      });
    }
  } catch (cause) { console.error(cause); reportError(`Could not initialize the 3D arena: ${cause.message}. Check hero data; graphics also require WebGL2-enabled Chrome/Edge.`); }
}
boot();
