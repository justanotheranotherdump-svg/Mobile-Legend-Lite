import { ItemEffects } from "./item-effects.js";
import { ExpandedItemEffects } from "./expanded-item-effects.js";
import { HeroCombatSimulation } from "../simulation/hero-combat.js";
// An NPC kit is already the same HeroCombatSimulation as the human. Attach the
// same equipment/status hooks to that actor's context instead of maintaining a
// second stat table or borrowing the human's inventory, timers or item procs.
export function attachHeroEquipment(match, engine) {
  engine.inventory = Array(6).fill(null);
  engine.potion = null;
  engine.scenario = match.scenario;
  Object.defineProperties(engine, {
    actors: { get: () => match.actors },
    phase: { get: () => match.phase },
    paused: { get: () => match.paused },
  });
  Object.defineProperty(engine.player, "inventory", {
    get: () => engine.inventory,
    enumerable: true,
  });
  engine.random = () => match.random();
  engine.deal = (...args) => match.deal(...args);
  engine.roleEquipment = {
    actorModifiers: (a) =>
      match.roleEquipment?.actorModifiers(a) || { flat: {}, percent: {} },
  };
  engine.spellDefense = (...args) => match.spellDefense.call(engine, ...args);
  engine.applyRangeAndSpeed = () => {
    HeroCombatSimulation.prototype.applyRangeAndSpeed.call(engine);
    engine.itemEffects?.applyRuntime();
  };
  engine.onBasicCommitted = (t) => { match.brawl?.combat(engine.player); engine.itemEffects.basicCommitted(t); };
  engine.onHeroCast = (a) => {
    match.brawl?.combat(engine.player);
    engine.itemEffects.cast(a);
    engine.expandedEffects.cast(a);
  };
  engine.itemEffects = new ItemEffects(engine);
  engine.expandedEffects = new ExpandedItemEffects(engine);
  engine.itemEffects.tick();
}
