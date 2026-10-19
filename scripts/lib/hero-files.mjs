import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHeroRegistry, discoverHeroPacks } from '../../src/heroes/registry.js';
export async function readHeroFiles(root = resolve('src/heroes')) {
  const json = {}, assets = {};
  for (const folder of await readdir(root, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    for (const name of ['hero.json', 'abilities.json', 'animations.json', 'visual.json']) {
      try { json[`./${folder.name}/${name}`] = JSON.parse(await readFile(`${root}/${folder.name}/${name}`, 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw new Error(`${root}/${folder.name}/${name}: ${error.message}`); }
    }
    try {
      for (const name of await readdir(`${root}/${folder.name}/assets`)) {
        if (name.endsWith('.glb')) assets[`./${folder.name}/assets/${name}`] = new Uint8Array(await readFile(`${root}/${folder.name}/assets/${name}`));
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return { json, assets };
}
export async function loadSourceHeroRegistry(root) {
  const { json, assets } = await readHeroFiles(root);
  return createHeroRegistry(discoverHeroPacks(json, assets));
}
