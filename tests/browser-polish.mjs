// New default-mode integration coverage. Legacy tests explicitly use ?hero=training.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";
import bundledChromium from "@sparticuz/chromium";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";
await mkdir("artifacts", { recursive: true });
const checks = [],
  errors = [],
  warnings = [],
  requests = [];
const pass = (s) => {
  checks.push(s);
  console.log("PASS: " + s);
};
// Same developer prerequisites as the historical browser suite; no fixed
// sandbox-only executable path. Browser assets/libraries never enter the source.
let executablePath = process.env.BROWSER_PATH;
const env = { ...process.env };
if (!executablePath) {
  executablePath = await bundledChromium.executablePath();
  if (process.platform === "linux") {
    const temp = await mkdtemp(join(tmpdir(), "layla-browser-"));
    const root = resolve(
      dirname(fileURLToPath(import.meta.resolve("@sparticuz/chromium"))),
      "..",
    );
    const archive = brotliDecompressSync(
      await readFile(join(root, "bin/al2023.tar.br")),
    );
    await writeFile(join(temp, "libraries.tar"), archive);
    execFileSync("tar", ["xf", join(temp, "libraries.tar"), "-C", temp]);
    env.LD_LIBRARY_PATH = `${join(temp, "lib")}:${process.env.LD_LIBRARY_PATH || ""}`;
  }
}
const browser = await chromium.launch({
  executablePath,
  env,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const timer = setTimeout(() => {
  console.error("Browser test watchdog");
  browser.close();
}, 480000);
const url =
  pathToFileURL(resolve("deliverables/MOBA-Lab-Phase-3.html")).href +
  "#diagnostics";
const profile = { username: "Polish_Hero", country: "PH", gender: "Female" };
const attach = (page) => {
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.type() === "warning") warnings.push(m.text());
  });
  page.on("request", (r) => {
    if (r.resourceType() !== "document") requests.push(r.url());
  });
};
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    offline: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  attach(page);
  await page.goto(url);
  await page.evaluate(
    (p) => localStorage.setItem("moba-lab.profile.v1", JSON.stringify(p)),
    profile,
  );
  await page.reload();
  const snap = () => page.evaluate(() => window.menuDiagnostics.snapshot());
  const ready = () =>
    page.waitForFunction(
      () => window.menuDiagnostics?.snapshot().lobby.status === "glb",
    );
  await ready();
  assert.equal((await snap()).progress.coins, 30000);
  assert.equal((await snap()).progress.diamonds, 0);
  assert.equal((await snap()).progressPersistent, true);
  assert.deepEqual((await snap()).progress.ownedHeroes, ["layla"]);
  assert.equal(
    await page.locator('[data-balance="coins"]').innerText(),
    "30,000",
  );
  pass(
    "old valid profile migrates once to 30,000 coins / 0 diamonds with owned Layla",
  );
  assert.equal((await snap()).audio.contextState, "not-created");
  assert.equal((await snap()).audio.schedulerActive, false);
  pass(
    "fresh page creates no audio context or scheduler before a real gesture",
  );
  await page.locator("#audio-toggle").click();
  await page.waitForFunction(
    () =>
      window.menuDiagnostics.snapshot().audio.contextState === "running" &&
      window.menuDiagnostics.snapshot().audio.scheduledNotes > 0,
  );
  assert.equal((await snap()).audio.scene, "lobby");
  const proof = await page.evaluate(() => window.menuDiagnostics.audioProof());
  assert.ok(proof.rms > 0.001);
  assert.ok(proof.peak < 1);
  assert.equal(proof.channels, 2);
  pass(
    "trusted click unlocks actual Web Audio; original score renders nonzero stereo energy without clipping",
  );
  await page.locator("#open-hero-shop").click();
  assert.equal((await snap()).screen, "shop");
  assert.equal(await page.locator("#lobby-preview").isHidden(), true);
  await page.locator("#shop-layla-portrait").evaluate((i) => i.decode());
  assert.equal(await page.locator("canvas:visible").count(), 0);
  assert.match(await page.locator(".owned-badge").innerText(), /OWNED/);
  assert.equal(await page.locator(".hero-shop button").count(), 1);
  assert.equal((await snap()).gameInitializations, 0);
  pass(
    "Hero Shop uses supplied 2D PNG, already-owned Layla, no purchase controls and no combat initialization",
  );
  await page.keyboard.press("Escape");
  await page.locator("#open-lobby-settings").click();
  await page.locator('[data-pref="musicEnabled"]').uncheck();
  assert.equal((await snap()).preferences.musicEnabled, false);
  assert.equal((await snap()).audio.activeMusicVoices, 0);
  await page.locator("#lobby-audio-masterVolume").focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 37; i++) await page.keyboard.press("ArrowRight");
  assert.equal((await snap()).preferences.masterVolume, 0.37);
  await page.locator("[data-audio-master]").uncheck();
  assert.equal((await snap()).audio.masterMuted, true);
  await page.locator('[data-pref="effectsEnabled"]').uncheck();
  assert.equal((await snap()).preferences.effectsEnabled, false);
  await page.locator("#pref-tab-display").click();
  await page.locator("#lobby-reduce-motion").check();
  assert.equal(
    await page
      .locator("html")
      .evaluate((e) => e.classList.contains("reduce-motion")),
    true,
  );
  await page.reload();
  await ready();
  assert.equal((await snap()).preferences.masterMuted, true);
  assert.equal((await snap()).preferences.masterVolume, 0.37);
  assert.equal((await snap()).preferences.reduceMotion, true);
  assert.equal((await snap()).progress.coins, 30000);
  assert.equal((await snap()).audio.contextState, "not-created");
  pass(
    "real music/effects/master switches, volume and reduced motion persist on same-file reload without autoplay",
  );
  await page.evaluate(() => {
    const k = "moba-lab.progress.v1:Polish_Hero";
    const v = JSON.parse(localStorage.getItem(k));
    v.coins = 123;
    localStorage.setItem(k, JSON.stringify(v));
  });
  await page.reload();
  await ready();
  assert.equal((await snap()).progress.coins, 123);
  pass(
    "reopening preserves an existing changed balance; starter grant is never reapplied",
  );
  // Touch emulation and screenshots of the actual final offline artifact.
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of ["lobby", "shop", "settings", "modes"]) {
      if (route === "shop") await page.locator("#open-hero-shop").tap();
      if (route === "settings")
        await page.locator("#open-lobby-settings").tap();
      if (route === "modes") await page.locator("#open-modes").tap();
      assert.ok(
        await page.evaluate(
          () => document.querySelector("#menu-root").scrollWidth <= innerWidth,
        ),
      );
      const selector =
        route === "lobby"
          ? "#open-modes,#open-hero-shop,#open-lobby-settings,#audio-toggle,.currency-bar"
          : route === "shop"
            ? "#shop-back,.currency-bar,.owned-hero-card"
            : route === "settings"
              ? "#preferences-back,#pref-tab-audio,#pref-tab-display"
              : "#modes-back,#mode-classic,#mode-ranked,#mode-brawl,#mode-training";
      for (const b of await page.locator(selector).all()) {
        const r = await b.boundingBox();
        assert.ok(
          r &&
            r.x >= 0 &&
            r.y >= 0 &&
            r.x + r.width <= width + 1 &&
            r.y + r.height <= height + 1,
          `${route} out of bounds ${width}x${height}: ${JSON.stringify(r)}`,
        );
      }
      const image = await page.locator("#lobby-backdrop").evaluate((i) => ({
        width: i.naturalWidth,
        height: i.naturalHeight,
        fit: getComputedStyle(i).objectFit,
      }));
      assert.ok(image.width > 1000 && image.height > 700);
      assert.equal(image.fit, "cover");
      await page.screenshot({
        animations: "disabled",
        path: `artifacts/polish-${route}-${width}x${height}.png`,
      });
      if (route !== "lobby")
        await page
          .locator(
            route === "shop"
              ? "#shop-back"
              : route === "settings"
                ? "#preferences-back"
                : "#modes-back",
          )
          .tap();
    }
  }
  pass(
    "1280x720 / 960x540 / 844x390 touch navigation, currency bounds, Shop, Settings and MODE fit; PNG uses undistorted cover",
  );
  assert.equal((await snap()).lobby.modelLoads, 1);
  assert.equal((await snap()).lobby.rendering, true);
  pass(
    "Shop/Settings/back/resize retain exactly one model and restore on-demand lobby rendering",
  );
  await page.locator("#open-lobby-settings").tap();
  await page.locator("[data-audio-reset]").tap();
  assert.equal((await snap()).preferences.musicEnabled, true);
  assert.equal((await snap()).preferences.masterMuted, false);
  assert.equal((await snap()).preferences.reduceMotion, true);
  await page.locator("#preferences-back").tap();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForFunction(
    () => window.menuDiagnostics.snapshot().audio.contextState === "suspended",
  );
  assert.equal((await snap()).audio.schedulerActive, false);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.waitForFunction(
    () => window.menuDiagnostics.snapshot().audio.contextState === "running",
  );
  assert.equal((await snap()).audio.schedulerActive, true);
  pass(
    "audio reset preserves motion preference; blur suspends audio/scheduler and focus resumes one scheduler",
  );
  await page.locator("#open-modes").tap();
  await page.locator("#mode-training").tap();
  await page.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.05,
  );
  assert.equal((await snap()).gameInitializations, 1);
  assert.equal((await snap()).audio.scene, "training");
  assert.equal((await snap()).lobby.disposed, true);
  assert.equal(await page.locator("#game-audio-controls").count(), 1);
  const before = (await snap()).audio.effectsPlayed;
  await page.keyboard.press("1");
  await page.waitForFunction(
    (n) => window.menuDiagnostics.snapshot().audio.effectsPlayed > n,
    before,
  );
  pass(
    "normal entry transfers approved model once, switches to energetic score and actual accepted combat events produce effects",
  );
  await page.locator("#settings").click();
  await page.locator("#settings-audio-shortcut").click();
  await page.locator("#game-audio-controls [data-audio-master]").uncheck();
  assert.equal((await snap()).preferences.masterMuted, true);
  assert.equal((await snap()).audio.masterMuted, true);
  await page.screenshot({
    animations: "disabled",
    path: "artifacts/polish-training-audio-844x390.png",
  });
  pass(
    "training Settings exposes the same working persisted audio controls in its non-modal centered panel",
  );
  await context.close();
  const fallback = await browser.newContext({
    viewport: { width: 960, height: 540 },
    offline: true,
  });
  await fallback.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
  });
  const fp = await fallback.newPage();
  attach(fp);
  await fp.goto(url);
  await fp.locator("#profile-username").fill("Session_Audio");
  await fp.locator('[data-gender="Male"]').click();
  await fp.locator("#profile-continue").click();
  await fp.waitForFunction(
    () => window.menuDiagnostics?.snapshot().screen === "lobby",
  );
  const fs = await fp.evaluate(() => window.menuDiagnostics.snapshot());
  assert.equal(fs.progress.coins, 30000);
  assert.equal(fs.progressPersistent, false);
  assert.equal(fs.audio.status, "unavailable");
  assert.equal(await fp.locator("#audio-toggle").isDisabled(), true);
  await fp.locator("#open-lobby-settings").click();
  assert.match(
    await fp.locator("[data-audio-status]").innerText(),
    /unavailable/,
  );
  await fp.locator('[data-pref="musicEnabled"]').uncheck();
  assert.equal(
    (await fp.evaluate(() => window.menuDiagnostics.snapshot())).preferences
      .musicEnabled,
    false,
  );
  await fallback.close();
  pass(
    "blocked storage and missing Web Audio preserve session wallet and useful settings without crashing",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  pass(
    "final standalone offline flow has no runtime errors, warnings, or subresource/network requests",
  );
  await writeFile(
    "artifacts/polish-browser-results.json",
    JSON.stringify(
      {
        browser: await browser.version(),
        offline: true,
        fileProtocol: true,
        proof,
        checks,
        errors,
        warnings,
        requests,
        limitations:
          "Linux Chromium software WebGL / touch emulation; not native Windows, physical touch, or speaker listening certification",
      },
      null,
      2,
    ),
  );
  console.log(`${checks.length} polish browser checks passed.`);
} catch (e) {
  await writeFile(
    "artifacts/polish-browser-failure.json",
    JSON.stringify(
      { checks, errors, warnings, requests, failure: String(e) },
      null,
      2,
    ),
  );
  throw e;
} finally {
  clearTimeout(timer);
  await browser.close();
}
