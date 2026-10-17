// Tests the exact downloadable artifact using file://, offline, with ordinary
// browser file-origin security (no --disable-web-security / file access bypass).
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { brotliDecompressSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import chromium from '@sparticuz/chromium';
import { chromium as playwright } from 'playwright-core';

await mkdir('artifacts', { recursive: true });
const checks = [];
const errors = [], warnings = [], requests = [];
const pass = name => { checks.push(name); console.log(`PASS: ${name}`); };
let browser;
try {
  let env = { ...process.env };
  let executablePath = process.env.BROWSER_PATH;
  let args = ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
  if (!executablePath) {
    executablePath = await chromium.executablePath();
    args = chromium.args.filter(arg => !['--disable-web-security', '--allow-running-insecure-content', '--disable-site-isolation-trials'].includes(arg));
    // This minimal Linux image lacks NSS. Extract the libraries supplied by our
    // npm-packaged browser into a temporary directory, not the project/source.
    if (process.platform === 'linux') {
      const temp = await mkdtemp(join(tmpdir(), 'moba-browser-'));
      const packageRoot = resolve(dirname(fileURLToPath(import.meta.resolve('@sparticuz/chromium'))), '..');
      const archive = brotliDecompressSync(await readFile(join(packageRoot, 'bin/al2023.tar.br')));
      await writeFile(join(temp, 'libraries.tar'), archive);
      execFileSync('tar', ['xf', join(temp, 'libraries.tar'), '-C', temp]);
      env.LD_LIBRARY_PATH = `${join(temp, 'lib')}:${process.env.LD_LIBRARY_PATH || ''}`;
    }
  }
  browser = await playwright.launch({ executablePath, args, env, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, offline: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
    if (message.type() === 'warning') warnings.push(message.text());
  });
  page.on('request', request => { if (!request.isNavigationRequest()) requests.push(request.url()); });
  const snap = () => page.evaluate(() => window.foundationDiagnostics.snapshot());
  const elapsed = async seconds => {
    const before = (await snap()).time;
    await page.waitForFunction(target => window.foundationDiagnostics.snapshot().time >= target, before + seconds);
  };
  const reset = async () => {
    await page.locator('#reset').click();
    await page.waitForFunction(() => window.foundationDiagnostics.snapshot().hits === 0 && window.foundationDiagnostics.snapshot().player.x === -5);
    await elapsed(0.05);
  };
  const project = (x, y, z) => page.evaluate(([x, y, z]) => window.foundationDiagnostics.project(x, y, z), [x, y, z]);
  const clickDummy = async (height = 1.45) => {
    const state = await snap();
    const point = await project(state.dummy.x, height, state.dummy.z);
    assert.ok(point.visible, 'dummy must be visible for pointer test');
    await page.mouse.click(point.x, point.y);
  };

  await page.goto(pathToFileURL(resolve('deliverables/MOBA-Lab-Phase-1.html')).href + '#diagnostics');
  await page.waitForFunction(() => window.foundationDiagnostics && window.foundationDiagnostics.snapshot().time > 0.05);
  assert.ok(await page.locator('#error').isHidden());
  const gpu = await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    return gl && gl.getParameter(gl.VERSION);
  });
  assert.match(gpu, /WebGL 2/);
  pass('downloaded HTML initializes actual WebGL2 using file:// with network disabled');
  const layout = await page.evaluate(() => ({
    background: getComputedStyle(document.documentElement).backgroundColor,
    header: getComputedStyle(document.querySelector('.topbar')).position,
    canvas: { width: document.querySelector('canvas').clientWidth, height: document.querySelector('canvas').clientHeight },
  }));
  assert.equal(layout.background, 'rgb(16, 27, 36)');
  assert.equal(layout.header, 'absolute');
  assert.deepEqual(layout.canvas, { width: 1440, height: 900 });
  pass('inline CSS is applied: dark background, positioned HUD, full-viewport canvas (unstyled-page regression)');
  await page.screenshot({ path: 'artifacts/arena-initial.png' });

  await clickDummy();
  await elapsed(0.05);
  assert.equal((await snap()).lastAttack.reason, 'range');
  assert.equal((await snap()).dummy.hp, 200);
  pass('ray-picked dummy rejects an out-of-range attack without damage');

  async function measure(keys) {
    await reset();
    const before = await snap();
    for (const key of keys) await page.keyboard.down(key);
    await elapsed(0.45);
    for (const key of keys) await page.keyboard.up(key);
    const after = await snap();
    return Math.hypot(after.player.x - before.player.x, after.player.z - before.player.z) / (after.time - before.time);
  }
  const straight = await measure(['w']);
  const diagonal = await measure(['w', 'd']);
  assert.ok(Math.abs(straight - 5.5) < 0.65, `W speed ${straight}`);
  assert.ok(Math.abs(diagonal - 5.5) < 0.65, `WD speed ${diagonal}`);
  assert.ok(Math.abs(straight - diagonal) < 0.65);
  pass('real keyboard movement and diagonal normalization (measured against simulation time)');

  await reset();
  await page.keyboard.down('d');
  await page.waitForFunction(() => {
    const { player, dummy } = window.foundationDiagnostics.snapshot();
    return Math.hypot(player.x - dummy.x, player.z - dummy.z) < 5.1;
  });
  await page.keyboard.up('d');
  let state = await snap();
  const heroScreen = await project(state.player.x, 0, state.player.z);
  assert.ok(Math.abs(heroScreen.x - 720) < 1 && Math.abs(heroScreen.y - 450) < 1);
  const groundPoint = await project(state.player.x + 1.2, 0, state.player.z + 0.7);
  await page.mouse.move(groundPoint.x, groundPoint.y);
  await elapsed(0.05);
  let aim = (await snap()).aim;
  assert.ok(Math.hypot(aim.x - (state.player.x + 1.2), aim.z - (state.player.z + 0.7)) < 0.06);
  pass('camera follows player and mouse ray maps to the correct ground position after movement');

  await clickDummy();
  await elapsed(0.02);
  state = await snap();
  assert.equal(state.dummy.hp, 175);
  assert.equal(state.hits, 1);
  await clickDummy();
  await elapsed(0.02);
  state = await snap();
  assert.equal(state.lastAttack.reason, 'cooldown');
  assert.equal(state.dummy.hp, 175);
  pass('in-range left click deals 25 damage; rapid second click is rejected by cooldown');
  for (let i = 0; i < 7; i++) { await elapsed(0.67); await clickDummy(); }
  await elapsed(0.05);
  state = await snap();
  assert.equal(state.dummy.hp, 0);
  assert.equal(state.hits, 8);
  assert.equal(await page.locator('#target-status').innerText(), 'DEFEATED');
  await clickDummy(0.12);
  await elapsed(0.05);
  assert.equal((await snap()).lastAttack.reason, 'dead');
  assert.equal((await snap()).dummy.hp, 0);
  pass('eight real pointer attacks defeat dummy; dead target rejects further damage');

  await reset();
  state = await snap();
  assert.equal(state.player.hp, 100);
  assert.equal(state.player.cooldown, 0);
  assert.equal(state.dummy.hp, 200);
  assert.equal(state.hits, 0);
  assert.equal(state.player.x, -5);
  assert.equal(state.player.z, 5);
  pass('Reset button restores positions, HP, cooldown, dummy life, and hit count');

  await page.keyboard.down('w');
  await page.keyboard.down('d');
  await elapsed(1.8);
  await page.keyboard.up('w');
  await page.keyboard.up('d');
  state = await snap();
  assert.ok(state.player.z >= -1.3 - 1e-7 && state.player.z < -1.05, `obstacle contact z=${state.player.z}`);
  const contactX = state.player.x;
  await page.keyboard.down('d');
  await elapsed(0.16);
  await page.keyboard.up('d');
  state = await snap();
  assert.ok(state.player.x > contactX + 0.25, 'can slide along obstacle');
  assert.ok(state.player.z >= -1.3 - 1e-7);
  pass('real keyboard movement hits a solid obstacle and slides without penetrating');
  await reset();

  // Hold A into an obstacle and eventually the arena edge: no state mutation.
  await page.keyboard.down('a');
  await elapsed(5.5);
  await page.keyboard.up('a');
  state = await snap();
  assert.ok(state.player.x >= -14.55 - 1e-7 && state.player.z <= 14.55 + 1e-7);
  assert.ok(Math.abs(state.player.x + 14.55) < 0.15 || Math.abs(state.player.z - 14.55) < 0.15);
  pass('held real keyboard movement remains inside arena boundaries');

  await reset();
  await page.keyboard.down('w');
  await page.waitForFunction(() => window.foundationDiagnostics.snapshot().player.x < -5.5);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  state = await snap();
  assert.equal(state.paused, true);
  await page.waitForTimeout(250);
  const paused = await snap();
  assert.equal(paused.player.x, state.player.x);
  assert.equal(paused.time, state.time);
  await page.keyboard.up('w');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await elapsed(0.15);
  state = await snap();
  assert.equal(state.player.x, paused.player.x);
  pass('blur pauses simulation, clears held input, and resume has no movement jump (synthetic focus events)');

  for (const [width, height] of [[1000, 700], [800, 600], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await elapsed(0.05);
    state = await snap();
    assert.equal(state.width, width);
    assert.equal(state.height, height);
    const point = await project(state.player.x, 0, state.player.z - 1.5);
    await page.mouse.move(point.x, point.y);
    await elapsed(0.05);
    aim = (await snap()).aim;
    assert.ok(Math.hypot(aim.x - state.player.x, aim.z - (state.player.z - 1.5)) < 0.08);
    const center = await project(state.player.x, 0, state.player.z);
    assert.ok(Math.abs(center.x - width / 2) < 1 && Math.abs(center.y - height / 2) < 1);
    const resetBounds = await page.locator('#reset').boundingBox();
    assert.ok(resetBounds.x >= 0 && resetBounds.x + resetBounds.width <= width);
  }
  pass('resize at 1000×700, 800×600, 1440×900 preserves canvas, camera, ground picking, and reset control');
  await reset();
  await page.screenshot({ path: 'artifacts/arena-final.png' });
  // Reproduce the user's download path, not just the separately named build.
  // Isolate the ZIP's index.html in a folder with spaces/Unicode and no siblings.
  const isolated = join(await mkdtemp(join(tmpdir(), 'moba-source-')), 'Windows download — offline');
  await mkdir(isolated);
  const archivedIndex = execFileSync('unzip', ['-p', 'deliverables/MOBA-Lab-Phase-1-source.zip', 'index.html'], { maxBuffer: 4 * 1024 * 1024 });
  assert.ok(archivedIndex.equals(await readFile('index.html')), 'ZIP must include the current playable root index');
  await writeFile(join(isolated, 'index.html'), archivedIndex);
  for (const [entry, label] of [[resolve('index.html'), 'repository root index.html'], [join(isolated, 'index.html'), 'source-ZIP index.html isolated without sibling files (spaces/Unicode path)']]) {
    await page.goto(pathToFileURL(entry).href + '#diagnostics');
    await page.waitForFunction(() => window.foundationDiagnostics?.snapshot().time > 0.05);
    assert.ok(await page.locator('#error').isHidden());
    assert.equal(await page.locator('.topbar').evaluate(element => getComputedStyle(element).position), 'absolute');
    await page.keyboard.down('d');
    await page.waitForFunction(() => {
      const { player, dummy } = window.foundationDiagnostics.snapshot();
      return Math.hypot(player.x - dummy.x, player.z - dummy.z) < 5.1;
    });
    await page.keyboard.up('d');
    await clickDummy();
    await elapsed(0.05);
    assert.equal((await snap()).dummy.hp, 175);
    await reset();
    assert.equal((await snap()).dummy.hp, 200);
    pass(`${label}: styled offline 3D, keyboard movement, attack and reset`);
  }
  await page.screenshot({ path: 'artifacts/source-zip-offline.png' });
  assert.deepEqual(requests, [], 'file artifact must not request any subresources');
  assert.deepEqual(errors, [], 'no browser console errors or page exceptions');
  assert.deepEqual(warnings, [], 'no browser warnings');
  pass('no runtime errors/warnings and ZERO subresource requests during full offline interaction');
  let developmentPreview = null;
  if (process.env.DEV_TEST_URL) {
    const devContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const devPage = await devContext.newPage();
    const devErrors = [];
    devPage.on('pageerror', error => devErrors.push(String(error)));
    devPage.on('console', message => { if (message.type() === 'error') devErrors.push(message.text()); });
    await devPage.goto(process.env.DEV_TEST_URL + '/#diagnostics');
    await devPage.waitForFunction(() => window.foundationDiagnostics?.snapshot().time > 0.05);
    assert.ok(await devPage.locator('script[src="/src/main.js"]').count(), 'Dev root must serve editable template, not stale standalone bundle');
    assert.ok(await devPage.locator('#error').isHidden());
    assert.deepEqual(devErrors, []);
    developmentPreview = { passed: true, errors: devErrors };
    console.log('PASS: separate Vite preview smoke check — root serves source template and WebGL initializes');
    // Leave both contexts to browser.close() below. Closing an individual
    // context can terminate the single-process Chromium container build.
  }
  await writeFile('artifacts/browser-results.json', JSON.stringify({ platform: process.platform, browser: await browser.version(), gpu, offline: true, fileProtocol: true, developmentPreview, checks, errors, warnings, requests }, null, 2));
  console.log(`\n${checks.length} browser checks passed. Windows double-click testing remains manual.`);
} catch (error) {
  await writeFile('artifacts/browser-failure.json', JSON.stringify({ checks, errors, warnings, requests, failure: String(error) }, null, 2));
  throw error;
} finally { if (browser) await browser.close(); }
