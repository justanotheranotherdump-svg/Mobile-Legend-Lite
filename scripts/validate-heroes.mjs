import { loadSourceHeroRegistry } from './lib/hero-files.mjs';
const registry = await loadSourceHeroRegistry();
console.log(`PASS: validated hero data/assets: ${registry.ids().join(', ')}`);
