import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'vite';
import { animatedTestGlb } from './helpers/glb.js';

test('production catalog eagerly bundles hero JSON and GLB bytes even with file inlining disabled', async () => {
  // Disposable synthetic animation-node fixture, not character artwork, a roster
  // addition or a gameplay/model experiment. No asset files enter the repository.
  const root = await mkdtemp(join(tmpdir(), 'moba-bundle-contract-'));
  try {
    await mkdir(join(root, 'training/assets'), { recursive: true });
    for (const name of ['hero', 'abilities', 'animations', 'visual']) {
      const data = JSON.parse(await readFile(`src/heroes/training/${name}.json`, 'utf8'));
      if (name === 'visual') { data.kind = 'glb'; data.model = 'assets/fixture.glb'; }
      if (name === 'animations') data.clips = { idle: 'FixtureMotion' };
      await writeFile(join(root, `training/${name}.json`), JSON.stringify(data));
    }
    const bytes = animatedTestGlb();
    await writeFile(join(root, 'training/assets/fixture.glb'), bytes);
    const catalog = (await readFile('src/heroes/catalog.js', 'utf8')).replace("'./registry.js'", JSON.stringify(resolve('src/heroes/registry.js')));
    await writeFile(join(root, 'entry.js'), `${catalog}\nconst r=loadHeroRegistry();globalThis.heroProof={hero:r.get('training'),bytes:Array.from(r.modelBytes('training'))};`);
    const output = await build({
      configFile: false, root, logLevel: 'silent', assetsInclude: ['**/*.glb'],
      build: { write: false, target: 'es2022', assetsInlineLimit: 0, minify: false,
        lib: { entry: join(root, 'entry.js'), name: 'FixtureBundle', formats: ['iife'] },
        rollupOptions: { output: { inlineDynamicImports: true } } },
    });
    const files = (Array.isArray(output) ? output : [output]).flatMap(result => result.output);
    assert.equal(files.length, 1, 'no runtime asset files or extra chunks');
    const sandbox = { TextDecoder, Uint8Array, DataView, atob, structuredClone };
    runInNewContext(files[0].code, sandbox);
    assert.equal(sandbox.heroProof.hero.id, 'training');
    assert.equal(sandbox.heroProof.hero.baseStats.maxHp, 100);
    assert.equal(sandbox.heroProof.hero.animations.clips.idle, 'FixtureMotion');
    assert.deepEqual(Array.from(sandbox.heroProof.bytes), Array.from(bytes));
    // No fetch, filesystem, document, or HTTP APIs exist in this runtime sandbox.
  } finally { await rm(root, { recursive: true, force: true }); }
});
