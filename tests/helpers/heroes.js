// Historical foundation fixtures deliberately stay scoped to schema-1 training.
import { readHeroFiles } from '../../scripts/lib/hero-files.mjs';
import { createHeroRegistry, discoverHeroPacks } from '../../src/heroes/registry.js';
const files=await readHeroFiles();
export const heroRegistry=createHeroRegistry(discoverHeroPacks(files.json,files.assets).filter(p=>p.hero.id==='training'));
