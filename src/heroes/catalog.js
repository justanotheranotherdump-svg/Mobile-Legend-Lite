import { createHeroRegistry, discoverHeroPacks } from './registry.js';
// Eager imports are bundled, not runtime fetches or lazy chunks. A new directory
// is discovered without touching a central roster or unrelated hero files.
const json = import.meta.glob('./*/{hero,abilities,animations,visual}.json', { eager: true, import: 'default' });
const assets = import.meta.glob('./*/assets/*.glb', { eager: true, query: '?inline', import: 'default' });
export function loadHeroRegistry() { return createHeroRegistry(discoverHeroPacks(json, assets)); }
