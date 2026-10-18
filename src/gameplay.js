import { createRuntime } from './runtime.js';
import { loadHeroRegistry } from "./heroes/catalog.js";
import { createHeroVisual } from "./rendering/heroes/hero-visual.js";
import arena from "./data/arena.json";
import training from "./data/training.json";
import practice from "./data/layla-practice.json";
import { number } from "./simulation/stats/validation.js";
import { HeroCombatSimulation } from "./simulation/hero-combat.js";
import { TrainingSimulation } from "./simulation/game.js";
import { WorldView } from "./rendering/world.js";

const error = document.querySelector("#error");
function reportError(message) {
  error.hidden = false;
  error.textContent = message;
}

export async function startTraining({
  registry: sharedRegistry,
  heroVisual: sharedVisual,
  onReady, profile, onExit, onProgress, throwOnError = false,
} = {}) {
  try {
    const registry = sharedRegistry || loadHeroRegistry();
    // Explicit historical fixture mode; normal standalone boot is reconstructed Layla.
    const fixture =
      new URLSearchParams(location.search).get("hero") === "training";
    const config = structuredClone(training);
    if (!fixture) {
      config.player.heroId = "layla";
      number(practice.dummyHpMultiplier, 'src/data/layla-practice.json.dummyHpMultiplier', .01, 100);
      number(practice.dummyPhysicalDefense, 'src/data/layla-practice.json.dummyPhysicalDefense');
      number(practice.dummyMagicDefense, 'src/data/layla-practice.json.dummyMagicDefense');
      // Same targets/map/ratios; HP x10 for the new stat scale. No XP rewards.
      config.dummies = config.dummies.map(d => ({ ...d, hp: d.hp * practice.dummyHpMultiplier, maxHp: d.maxHp * practice.dummyHpMultiplier, physicalDefense: practice.dummyPhysicalDefense, magicDefense: practice.dummyMagicDefense }));
    }
    const simulation = new (
      fixture ? TrainingSimulation : HeroCombatSimulation
    )(arena, config, registry);
    await onProgress?.(3,"Separate dummy sandbox and hero stats initialized");
    const heroVisual =
      sharedVisual ||
      (await createHeroVisual(
        simulation.hero,
        registry.modelBytes(simulation.hero.id),
      ));
    const runtime = await createRuntime({simulation,heroVisual,View:WorldView,profile,onReady,onExit,fixture,onProgress});
    return runtime;
  } catch (cause) {
    if (throwOnError) throw cause;
    console.error(cause);
    reportError(
      `Could not initialize the 3D arena: ${cause.message}. Check hero data; graphics also require WebGL2-enabled Chrome/Edge.`,
    );
  }
}
