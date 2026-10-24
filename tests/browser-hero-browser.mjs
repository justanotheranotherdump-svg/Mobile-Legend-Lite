import { finishPracticeEntry } from './helpers/menu-practice.mjs';
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
const observe = (page) => {
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
    viewport: { width: 1440, height: 780 },
    offline: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  observe(page);
  const state = () => page.evaluate(() => window.menuDiagnostics.snapshot());
  await page.goto(url);
  await page.locator("#creation-layla").evaluate((i) => i.decode());
  for (const [width, height] of [
    [1440, 780],
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    const image = await page.locator("#creation-layla").evaluate((i) => {
      const r = i.getBoundingClientRect(),
        s = getComputedStyle(i);
      return {
        x: r.x,
        y: r.y,
        right: r.right,
        bottom: r.bottom,
        fit: s.objectFit,
        mask: s.maskImage,
        w: i.naturalWidth,
        h: i.naturalHeight,
      };
    });
    assert.equal(image.fit, "contain");
    assert.ok(image.mask.includes("linear-gradient"));
    assert.ok(
      image.x >= -1 &&
        image.y >= -1 &&
        image.right <= width + 1 &&
        image.bottom <= height + 1,
    );
    assert.equal(image.w, 1536);
    assert.equal(image.h, 1024);
    await page.screenshot({
      animations: "disabled",
      path: `artifacts/hero-browser-creation-${width}x${height}.png`,
    });
  }
  pass(
    "creation uses complete contained original PNG, larger layout allocation and a smooth bottom alpha mask at four viewport sizes",
  );
  await page.locator("#profile-username").fill("Hero_Guide");
  await page.locator('[data-gender="Female"]').tap();
  await page.locator("#profile-continue").tap();
  await page.waitForFunction(
    () => window.menuDiagnostics?.snapshot().screen === "lobby" && document.querySelector(".lobby-illustration")?.complete,
  );
  assert.equal((await state()).lobby.modelLoads,0);
  assert.equal((await state()).lobby.rendering,false);
  assert.equal(await page.locator("#audio-toggle").count(), 0);
  await page.locator("#open-lobby-settings").tap();
  assert.equal(await page.locator("[data-audio-master]").count(), 1);
  await page.locator("#preferences-back").tap();
  pass(
    "lobby quick sound button is gone; working sound controls remain in Settings",
  );
  await page.locator("#open-hero-shop").tap();
  assert.equal(await page.locator(".catalog-hero-card").count(), 2);
  assert.equal(await page.locator(".catalog-empty-slot").count(), 13);
  assert.equal(await page.locator("[data-hero-role]").count(), 7);
  assert.equal(await page.locator(".catalog-empty-slot button").count(), 0);
  assert.equal((await state()).progress.coins, 30000);
  assert.equal((await state()).gameInitializations, 0);
  pass(
    "Shop has owned Layla and locked Franco, thirteen truly empty noninteractive slots, seven role filters, wallet and no match/purchase initialization",
  );
  await page.locator('[data-hero-role="Tank"]').tap();
  assert.equal(await page.locator(".catalog-hero-card").count(), 1);
  assert.equal(await page.locator(".catalog-empty-slot").count(), 14);
  assert.equal(await page.locator("[data-hero-id=franco]").count(),1);
  await page.locator('[data-hero-role="Marksman"]').tap();
  assert.equal(await page.locator(".catalog-hero-card").count(), 1);
  await page.locator("#hero-search").fill("not_a_hero");
  assert.equal(await page.locator(".catalog-hero-card").count(), 0);
  await page.locator("#hero-search").fill("LAYLA");
  assert.equal(await page.locator(".catalog-hero-card").count(), 1);
  pass(
    "role filtering and search work without inventing heroes, and announce empty results",
  );
  await page.locator('[data-hero-id="layla"]').focus();
  await page.keyboard.press("Enter");
  assert.equal((await state()).screen, "hero");
  assert.equal((await state()).lobby.rendering, false);
  assert.equal((await state()).lobby.modelLoads,0);
  assert.equal((await state()).lobby.interactive,false);
  assert.equal(await page.locator(".hero-detail-screen canvas").count(),0);
  assert.equal(await page.locator("#hero-detail-title").innerText(), "Layla");
  assert.equal(await page.locator('[role="meter"]').count(), 4);
  assert.equal(await page.locator("[data-inspect-ability]").count(), 4);
  assert.match(
    await page.locator(".hero-ratings").innerText(),
    /PROTOTYPE RATINGS/,
  );
  assert.equal((await state()).gameInitializations, 0);
  const config = JSON.parse(
    await readFile("src/heroes/layla/abilities.json", "utf8"),
  );
  for (const a of config) {
    await page.locator(`[data-inspect-ability="${a.id}"]`).click();
    assert.equal(await page.locator("#ability-title").innerText(), a.name);
    assert.ok(
      (await page.locator("#ability-description").innerText()).length > 60,
    );
    if (a.slot !== "passive")
      assert.match(
        await page.locator(".ability-facts").innerText(),
        new RegExp(String(a.damage)),
      );
    await page.locator(".ability-note summary").click();
    assert.match(
      await page.locator(".ability-note").innerText(),
      /same damage, defense, resources and equipment systems/,
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("[data-ability-sheet]").isHidden(), true);
    assert.equal((await state()).screen, "hero");
  }
  pass(
    "hero PNG detail exposes role, four prototype ratings, passive plus three actual skill descriptions/values and truthful notes; Escape closes each sheet before leaving hero",
  );
  await page.keyboard.press("Escape");
  assert.equal((await state()).screen, "shop");
  assert.equal(await page.locator("#hero-search").inputValue(), "LAYLA");
  assert.equal(
    await page
      .locator('[data-hero-role="Marksman"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  pass(
    "hero back preserves Shop filters/search with zero menu model loads; no reload or wallet changes",
  );
  await page.locator("#hero-search").fill("");
  await page.locator('[data-hero-role="All"]').tap();
  for (const [width, height] of [
    [1280, 720],
    [960, 540],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      animations: "disabled",
      path: `artifacts/hero-browser-shop-${width}x${height}.png`,
    });
    assert.ok(
      await page.evaluate(
        () => document.querySelector("#menu-root").scrollWidth <= innerWidth,
      ),
    );
    const scroll = page.locator(".hero-catalog-scroll");
    assert.ok(await scroll.evaluate((e) => e.scrollHeight > e.clientHeight));
    await scroll.evaluate((e) => (e.scrollTop = e.scrollHeight));
    assert.ok(await scroll.evaluate((e) => e.scrollTop > 0));
    await scroll.evaluate((e) => (e.scrollTop = 0));
    await page.locator('[data-hero-id="layla"]').tap();
    await page.screenshot({
      animations: "disabled",
      path: `artifacts/hero-browser-detail-${width}x${height}.png`,
    });
    const fits = await page.locator(".hero-detail-info").evaluate((info) => {
      const r = info.getBoundingClientRect();
      return [...info.querySelectorAll(".hero-ability-buttons button")].every(
        (b) => {
          const q = b.getBoundingClientRect();
          return q.top >= r.top && q.bottom <= r.bottom + 1;
        },
      );
    });
    assert.equal(
      fits,
      true,
      `Skill buttons must be visible without scrolling at ${width}x${height}`,
    );
    await page.locator('[data-inspect-ability="malefic-bomb"]').tap();
    await page.screenshot({
      animations: "disabled",
      path: `artifacts/hero-browser-skill-${width}x${height}.png`,
    });
    const close = await page.locator("#ability-close").boundingBox();
    assert.ok(
      close.x >= 0 &&
        close.y >= 0 &&
        close.x + close.width <= width &&
        close.y + close.height <= height,
    );
    await page.keyboard.press("Escape");
    await page.locator("#hero-detail-back").tap();
  }
  pass(
    "catalog scroll and touch hero/skill/back flows fit 1280x720, 960x540 and 844x390 with reachable close controls",
  );
  assert.equal((await state()).lobby.modelLoads, 0);
  assert.equal((await state()).progress.coins, 30000);
  assert.equal((await state()).gameInitializations, 0);
  await page.locator("#shop-back").tap();
  await page.locator("#open-modes").tap();
  await page.locator("#mode-training").tap({ timeout: 90000 });
  await finishPracticeEntry(page);
  await page.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.05,
  );
  assert.equal((await state()).gameInitializations, 1);
  assert.equal((await state()).lobby.disposed, true);
  assert.equal((await state()).audio.scene, "training");
  assert.equal(await page.locator("#game-audio-controls").count(), 1);
  pass(
    "leaving the guide restores original lobby/modes and transfers the same approved model once into unchanged training with audio",
  );
  await context.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  pass(
    "actual standalone file:// guide flow has zero runtime errors, warnings or subresource/network requests",
  );
  await writeFile(
    "artifacts/hero-browser-results.json",
    JSON.stringify(
      {
        browser: await browser.version(),
        offline: true,
        fileProtocol: true,
        checks,
        errors,
        warnings,
        requests,
        limitations:
          "Linux software WebGL and touch emulation, not Windows/physical-device certification",
      },
      null,
      2,
    ),
  );
  console.log(`${checks.length} hero browser checks passed.`);
} catch (e) {
  await writeFile(
    "artifacts/hero-browser-failure.json",
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
