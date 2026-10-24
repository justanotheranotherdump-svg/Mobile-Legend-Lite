import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadSourceHeroRegistry } from "../lib/hero-files.mjs";
const registry = await loadSourceHeroRegistry(),
  manifest = {
    version: 1,
    stage: "Approved Layla + Franco integration only",
    assets: {},
    heroes: {},
  };
for (const id of ["layla", "franco"]) {
  const hero = registry.get(id),
    names = [
      "illustration.png",
      "character.png",
      "portrait.png",
      "character-portrait.png",
      "showcase-background.png",
      "passive.png",
      "skill-1.png",
      "skill-2.png",
      "ultimate.png",
      id === "layla" ? "energy-gunner.glb" : "franco.glb",
      ...(id === "franco" ? ["hook.glb"] : []),
    ];
  for (const name of names) {
    const path = `src/heroes/${id}/assets/${name}`,
      b = await readFile(path);
    manifest.assets[path] = {
      bytes: b.length,
      sha256: createHash("sha256").update(b).digest("hex"),
      ...(name.endsWith(".png")
        ? { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
        : {}),
    };
  }
  manifest.heroes[id] = {
    model: hero.presentation.model,
    scale: hero.presentation.scale,
    animations: hero.animations.clips,
    abilityIds: hero.abilityIds,
    sourceApproved:
      id === "layla"
        ? "previews/layla/assets/layla-rework.glb"
        : "previews/franco/assets/franco-proposed.glb",
    vfx:
      id === "layla"
        ? "src/heroes/layla/effects.js"
        : "src/rendering/approved-combat-vfx.js",
  };
}
for (const path of [
  "src/heroes/layla/effects.js",
  "src/rendering/approved-combat-vfx.js",
  "src/rendering/combat-vfx.js",
  "src/rendering/heroes/pose-driver.js",
  ...["layla", "franco"].flatMap((id) =>
    [
      "hero",
      "abilities",
      "animations",
      "visual",
      ...(id === "franco" ? ["commerce"] : []),
    ].map((name) => `src/heroes/${id}/${name}.json`),
  ),
]) {
  const b = await readFile(path);
  manifest.assets[path] = {
    bytes: b.length,
    sha256: createHash("sha256").update(b).digest("hex"),
  };
}
await writeFile(
  "src/heroes/integration-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log("Wrote integration asset manifest");
