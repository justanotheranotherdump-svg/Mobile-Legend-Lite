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
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    offline: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.type() === "warning") warnings.push(m.text());
  });
  page.on("request", (r) => {
    if (r.resourceType() !== "document") requests.push(r.url());
  });
  const url =
    pathToFileURL(resolve("deliverables/MOBA-Lab-Phase-3.html")).href +
    "#diagnostics";
  const menu = () => page.evaluate(() => window.menuDiagnostics.snapshot());
  const screen = async (name) => {
    await page.waitForFunction(
      (name) => window.menuDiagnostics?.snapshot().screen === name,
      name,
    );
  };
  const expectIsolated = async () => {
    assert.equal(
      await page.evaluate(() => typeof window.foundationDiagnostics),
      "undefined",
    );
    assert.equal(await page.locator("#app").isHidden(), true);
  };
  await page.goto(url);
  await screen("create");
  await expectIsolated();
  assert.equal((await menu()).lobby.modelLoads, 0);
  assert.equal(await page.locator("#profile-continue").isDisabled(), true);
  assert.equal(await page.locator("[data-country]").count(), 3);
  assert.equal(await page.locator("[data-gender]").count(), 2);
  await page.locator("#creation-layla").evaluate((img) => img.decode());
  const pixels = await page.locator("#creation-layla").evaluate((img) => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0);
    const p = cx.getImageData(0, 0, c.width, c.height).data;
    let min = 255,
      max = 0,
      transparent = 0;
    for (let i = 3; i < p.length; i += 4) {
      min = Math.min(min, p[i]);
      max = Math.max(max, p[i]);
      if (p[i] === 0) transparent++;
    }
    return {
      min,
      max,
      transparent,
      width: img.naturalWidth,
      height: img.naturalHeight,
      fit: getComputedStyle(img).objectFit,
    };
  });
  assert.equal(pixels.min, 0);
  assert.equal(pixels.max, 254);
  assert.ok(pixels.transparent > 100000);
  assert.equal(pixels.fit, "contain");
  assert.equal(pixels.width, 1536);
  pass(
    "first launch shows creation only; supplied RGBA artwork decodes with its real alpha preserved and no 3D model loaded",
  );
  for (const value of ["abc", "bad name", "bad@name"]) {
    await page.locator("#profile-username").fill(value);
    assert.equal(await page.locator("#profile-continue").isDisabled(), true);
    assert.equal(
      await page.locator("#profile-username").getAttribute("aria-invalid"),
      "true",
    );
  }
  await page.locator("#profile-username").fill("Test_Hero");
  assert.equal(await page.locator("#profile-continue").isDisabled(), true);
  pass(
    "invalid names cannot continue, and a valid name still requires explicit gender selection",
  );
  await page.locator("#country-picker summary").click();
  await page.locator('[data-country="US"]').click();
  await page.locator('[data-gender="Male"]').click();
  assert.equal(
    await page.locator('[data-country="US"]').getAttribute("aria-checked"),
    "true",
  );
  assert.equal(
    await page.locator('[data-gender="Male"]').getAttribute("aria-checked"),
    "true",
  );
  await page.locator("#profile-continue").click();
  await screen("lobby");
  await page.waitForFunction(
    () => window.menuDiagnostics.snapshot().lobby.status === "glb",
  );
  assert.deepEqual((await menu()).profile, {
    username: "Test_Hero",
    country: "US",
    gender: "Male",
  });
  assert.equal(await page.locator("#local-username").innerText(), "Test_Hero");
  await expectIsolated();
  assert.equal(await page.locator("#creation-layla").count(), 0);
  assert.equal(await page.locator("#lobby-preview").isVisible(), true);
  assert.equal((await menu()).lobby.modelLoads, 1);
  pass(
    "country/gender selection saves the actual local profile and lobby displays it with the existing GLB, not the PNG",
  );
  await page.keyboard.press("w");
  await page.keyboard.press("1");
  await page.keyboard.press("Space");
  await expectIsolated();
  await page
    .locator("[data-placeholder]")
    .evaluateAll((buttons) => buttons.forEach((b) => b.click()));
  assert.equal((await menu()).screen, "lobby");
  assert.equal(await page.locator("[data-placeholder]").count(), 10);
  pass(
    "all 10 remaining lobby placeholders are disabled/no-op; menu combat keys never initialize training",
  );
  assert.equal(
    (await menu()).persistent,
    true,
    "file-origin storage must be proven, not assumed",
  );
  await page.reload();
  await screen("lobby");
  await page.waitForFunction(
    () => window.menuDiagnostics.snapshot().lobby.status === "glb",
  );
  assert.equal(await page.locator("#local-username").innerText(), "Test_Hero");
  pass(
    "actual offline file:// localStorage survives same-file reload and skips creation for a valid profile",
  );
  await page.locator("#open-modes").click();
  await screen("modes");
  for (const id of ["classic", "ranked", "brawl"]) {
    assert.equal(await page.locator("#mode-" + id).isDisabled(), true);
    await page.locator("#mode-" + id).evaluate((b) => b.click());
    assert.equal((await menu()).screen, "modes");
  }
  await expectIsolated();
  assert.equal((await menu()).lobby.modelLoads, 1);
  assert.equal(await page.locator("#creation-layla").count(), 0);
  await page.locator("#modes-back").click();
  await screen("lobby");
  await page.locator("#open-modes").click();
  await page.keyboard.press("Escape");
  await screen("lobby");
  assert.deepEqual((await menu()).profile, {
    username: "Test_Hero",
    country: "US",
    gender: "Male",
  });
  assert.equal((await menu()).lobby.modelLoads, 1);
  pass(
    "MODE/back/Escape preserve profile and reuse one GLB presentation; Classic/Ranked/Brawl cannot launch matches",
  );
  // Independent contexts ensure each responsive sample genuinely starts without a profile.
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    const c = await browser.newContext({
      viewport: { width, height },
      offline: true,
      hasTouch: true,
      isMobile: true,
    });
    const p = await c.newPage();
    p.on("pageerror", (e) => errors.push(String(e)));
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
      if (m.type() === "warning") warnings.push(m.text());
    });
    p.on("request", (r) => {
      if (r.resourceType() !== "document") requests.push(r.url());
    });
    await p.goto(url);
    await p.locator("#profile-username").waitFor();
    const check = async () =>
      assert.equal(
        await p.evaluate(
          () => document.querySelector("#menu-root").scrollWidth <= innerWidth,
        ),
        true,
        `horizontal overflow ${width}x${height}`,
      );
    await check();
    await p.screenshot({
      animations: "disabled",
      path: `artifacts/menu-create-${width}x${height}.png`,
    });
    await p.locator("#profile-username").fill("Touch_Hero");
    await p.locator('[data-gender="Female"]').tap();
    await p.locator("#country-picker summary").tap();
    await p.locator('[data-country="JP"]').tap();
    await p.locator("#profile-continue").tap();
    await p.waitForFunction(
      () => window.menuDiagnostics?.snapshot().lobby.status === "glb",
    );
    await check();
    assert.equal(await p.locator("#local-username").innerText(), "Touch_Hero");
    await p.screenshot({
      animations: "disabled",
      path: `artifacts/menu-lobby-${width}x${height}.png`,
    });
    await p.locator("#open-modes").tap();
    await check();
    for (const id of [
      "modes-back",
      "mode-classic",
      "mode-ranked",
      "mode-brawl",
      "mode-training",
    ]) {
      const b = await p.locator("#" + id).boundingBox();
      assert.ok(
        b.x >= 0 &&
          b.y >= 0 &&
          b.x + b.width <= width + 1 &&
          b.y + b.height <= height + 1,
        id + " outside viewport",
      );
    }
    await p.screenshot({
      animations: "disabled",
      path: `artifacts/menu-modes-${width}x${height}.png`,
    });
    await p.locator("#modes-back").tap();
    assert.equal(await p.locator("#local-username").innerText(), "Touch_Hero");
    if (width === 844) {
      await p.locator("#open-modes").tap();
      // Software WebGL can spend >30s compiling the transferred scene on CI.
      await p.locator("#mode-training").tap({ timeout: 90000 });
      await p.waitForFunction(
        () => window.foundationDiagnostics?.snapshot().time > 0.05,
      );
      const state = await p.evaluate(() => window.menuDiagnostics.snapshot());
      assert.equal(state.gameInitializations, 1);
      assert.equal(state.lobby.disposed, true);
      assert.deepEqual(state.profile, {
        username: "Touch_Hero",
        country: "JP",
        gender: "Female",
      });
      assert.equal(await p.locator("#hud-root").isVisible(), true);
    }
    await c.close();
  }
  pass(
    "1280x720, 960x540, 844x390: all three screens fit, cards stay in bounds, PNG stays contained and touch-emulated profile/MODE/back and compact AI entry work",
  );
  const blocked = await browser.newContext({
    offline: true,
    viewport: { width: 960, height: 540 },
  });
  await blocked.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    }),
  );
  const bp = await blocked.newPage();
  await bp.goto(url);
  await bp.locator("#profile-username").fill("Session_Only");
  await bp.locator('[data-gender="Female"]').click();
  await bp.locator("#profile-continue").click();
  await bp.waitForFunction(
    () => window.menuDiagnostics?.snapshot().screen === "lobby",
  );
  assert.equal(
    (await bp.evaluate(() => window.menuDiagnostics.snapshot())).persistent,
    false,
  );
  assert.match(await bp.locator(".lobby-storage").innerText(), /Session-only/);
  await bp.locator("#open-modes").click();
  await bp.locator("#modes-back").click();
  assert.equal(await bp.locator("#local-username").innerText(), "Session_Only");
  await blocked.close();
  pass(
    "denied storage remains usable for the session and honestly displays the persistence limitation",
  );
  const corrupt = await browser.newContext({ offline: true });
  await corrupt.addInitScript(() =>
    localStorage.setItem(
      "moba-lab.profile.v1",
      '{"username":"<bad>","country":"XX","gender":"Other"}',
    ),
  );
  const cp = await corrupt.newPage();
  await cp.goto(url);
  await cp.locator("#profile-form").waitFor();
  await corrupt.close();
  pass("corrupt/invalid saved data safely returns to creation");
  await page.bringToFront();
  await page.locator("#open-modes").click();
  await page.locator("#mode-training").evaluate((b) => {
    b.click();
    b.click();
  });
  await page.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.05,
  );
  const s = () => page.evaluate(() => window.foundationDiagnostics.snapshot());
  assert.equal((await menu()).gameInitializations, 1);
  assert.equal((await menu()).lobby.modelLoads, 1);
  assert.equal((await menu()).lobby.disposed, true);
  assert.equal((await menu()).lobby.rendering, false);
  assert.equal(await page.locator("#menu-root").isHidden(), true);
  assert.equal(
    (await page.evaluate(() => window.foundationDiagnostics.hero()))
      .modelStatus,
    "glb",
  );
  assert.equal(
    (await page.evaluate(() => window.foundationDiagnostics.hero())).id,
    "layla",
  );
  assert.equal(await page.locator(".hero-skill").count(), 3);
  const x = (await s()).player.x;
  await page.keyboard.down("d");
  const t = (await s()).time;
  await page.waitForFunction(
    (t) => window.foundationDiagnostics.snapshot().time > t,
    t + 0.2,
  );
  await page.keyboard.up("d");
  assert.ok((await s()).player.x > x + 0.3);
  await page.locator("#upgrade-skill-1").click();
  await page.keyboard.press("1");
  const castTime = (await s()).time;
  await page.waitForFunction(
    (t) => window.foundationDiagnostics.snapshot().time > t,
    castTime + 1.2,
  );
  assert.ok((await s()).enemies[0].hp < 2000);
  assert.equal((await s()).lastCast.serial, 1);
  await page.screenshot({
    animations: "disabled",
    path: "artifacts/menu-entered-existing-training.png",
  });
  pass(
    "AI Training enters the established real Layla simulation exactly once, transfers the same GLB safely, disposes lobby rendering and restores movement/skill damage",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  pass(
    "actual standalone offline menu-to-game flow has zero runtime errors, warnings or external/subresource requests",
  );
  await writeFile(
    "artifacts/menu-browser-results.json",
    JSON.stringify(
      {
        platform: process.platform,
        browser: await browser.version(),
        offline: true,
        fileProtocol: true,
        persistence:
          "same-file reload verified; denied-storage fallback verified",
        artwork: pixels,
        checks,
        errors,
        warnings,
        requests,
      },
      null,
      2,
    ),
  );
  console.log(checks.length + " menu browser checks passed.");
} catch (e) {
  await writeFile(
    "artifacts/menu-browser-failure.json",
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
