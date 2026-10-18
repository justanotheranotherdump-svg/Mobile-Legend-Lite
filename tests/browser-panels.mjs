import { learnPracticeKit, afterS1, woundedAfterS1, afterUltimate } from './helpers/practice.mjs';
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
  const snap = () =>
    page.evaluate(() => window.foundationDiagnostics.snapshot());
  const elapsed = async (n) => {
    const t = (await snap()).time;
    await page.waitForFunction(
      (t) => window.foundationDiagnostics.snapshot().time >= t,
      t + n,
    );
  };
  const reset = async () => {
    await page.locator("#reset").click();
    await elapsed(0.05);
    await learnPracticeKit(page);
  };
  await page.goto(
    pathToFileURL(resolve("deliverables/MOBA-Lab-Phase-3.html")).href +
      "?screen=training#diagnostics",
  );
  await page.waitForFunction(
    () => window.foundationDiagnostics?.snapshot().time > 0.05,
  );
  await learnPracticeKit(page);
  for (const panel of ["shop", "settings"]) {
    await reset();
    await page.keyboard.down("d");
    await elapsed(0.1);
    await page.locator("#" + panel).click();
    const before = (await snap()).player.x;
    await elapsed(0.2);
    assert.ok((await snap()).player.x > before + 0.4);
    assert.equal(
      await page
        .locator("#" + panel + "-dialog")
        .evaluate((e) => e.matches(":modal")),
      false,
    );
    await page.keyboard.up("d");
    const stopped = (await snap()).player.x;
    await elapsed(0.1);
    assert.equal((await snap()).player.x, stopped);
    await page.keyboard.down("s");
    const reverse = (await snap()).player.x;
    await elapsed(0.15);
    assert.ok((await snap()).player.x > reverse + 0.2);
    await page.keyboard.press("Escape");
    const closed = (await snap()).player.x;
    await elapsed(0.15);
    assert.ok((await snap()).player.x > closed + 0.2);
    await page.keyboard.up("s");
    pass(
      panel +
        ": held/fresh WASD works in non-modal panel, keyup stops, closing preserves held movement",
    );
    await reset();
    await page.locator("#" + panel).click();
    await page.keyboard.press("1");
    await elapsed(1.2);
    let s = await snap();
    assert.ok(Math.abs(s.enemies[0].hp - afterS1) < 1e-6);
    assert.equal(await page.locator("#" + panel + "-dialog").isVisible(), true);
    await page.locator("#world").focus(); // Focus battlefield: focused shop buttons retain native Space.
    await page.keyboard.press("Space");
    await elapsed(1.2);
    s = await snap();
    assert.equal(s.hits, 1);
    assert.ok(s.enemies[0].hp < afterS1);
    pass(
      panel +
        ": skill and basic shortcuts deal real damage while panel stays open",
    );
    const hpBeforePointer = (await snap()).enemies[0].hp;
    const box = await page.locator("#skill-ultimate").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForFunction(() =>
      Boolean(window.foundationDiagnostics.snapshot().aiming),
    );
    await page.mouse.up();
    await elapsed(1.2);
    assert.ok((await snap()).enemies[0].hp < hpBeforePointer);
    pass(
      panel +
        ": HUD skill pointer hold/release remains interactive outside panel",
    );
    await page.keyboard.down("d");
    await elapsed(0.3);
    await page.keyboard.up("d");
    const enemy = { x: 1420, y: 450 };
    const h = (await snap()).hits;
    await page.mouse.click(enemy.x, enemy.y);
    await elapsed(1.2);
    assert.equal((await snap()).hits, h + 1);
    assert.equal(await page.locator("#" + panel + "-dialog").isVisible(), true);
    pass(
      panel + ": exposed battlefield LMB attacks work without dismissing panel",
    );
    await page.keyboard.press("Escape");
  }
  await reset();
  await page.keyboard.down("1");
  await page.waitForFunction(() =>
    Boolean(window.foundationDiagnostics.snapshot().aiming),
  );
  await page.locator("#shop").click();
  assert.ok((await snap()).aiming);
  await page.keyboard.press("Escape");
  await page.keyboard.up("1");
  assert.equal((await snap()).player.mana, 800);
  assert.equal(await page.locator("#shop-dialog").isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#shop-dialog").isVisible(), false);
  pass(
    "opening a panel preserves held aim; first Escape cancels aim, second closes panel",
  );
  await page.locator("#settings").click();
  await page.locator("#settings-tab-controls").click();
  await page.locator("#key-controls summary").click();
  await page.locator("#bind-skill-1").focus();
  const old = (await snap()).lastCast.serial;
  await page.keyboard.press("1");
  assert.equal((await snap()).lastCast.serial, old);
  const x = (await snap()).player.x;
  await page.keyboard.down("d");
  await elapsed(0.15);
  await page.keyboard.up("d");
  assert.ok((await snap()).player.x > x + 0.2);
  pass(
    "focused key-binding select owns combat keys but still permits protected WASD movement",
  );
  await page.locator("#settings-dialog").evaluate((e) => {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "test-typing";
    e.append(input);
    input.focus();
  });
  const typed = (await snap()).player.x;
  await page.keyboard.type("wasd123 ");
  await elapsed(0.12);
  assert.equal((await snap()).player.x, typed);
  assert.equal((await snap()).lastCast.serial, old);
  assert.equal(await page.locator("#test-typing").inputValue(), "wasd123 ");
  await page.locator("#test-typing").evaluate((e) => e.remove());
  await page.keyboard.press("Escape");
  pass("actual text entry does not move, attack or cast while typing");
  await reset();
  await page.locator("#settings").click();
  await page.locator("#bind-skill-1").focus();
  await page.locator("#skill-1").click();
  await elapsed(1.2);
  assert.ok(Math.abs((await snap()).enemies[0].hp - afterS1) < 1e-6);
  await page.locator("#bind-skill-1").focus();
  await page.mouse.click(1420, 450);
  await elapsed(1.2);
  assert.equal((await snap()).hits, 1);
  await page.keyboard.press("Escape");
  pass(
    "explicit HUD or battlefield pointer attacks leave editors and work on the first click",
  );
  await page.locator("#shop").click();
  await page.keyboard.down("d");
  await elapsed(0.1);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.keyboard.up("d");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const pos = (await snap()).player.x;
  await elapsed(0.12);
  assert.equal((await snap()).player.x, pos);
  await page.keyboard.press("Escape");
  pass("blur still clears held movement without stale resumption");
  await reset();
  await page.keyboard.down("1");
  await page.waitForFunction(() =>
    Boolean(window.foundationDiagnostics.snapshot().aiming),
  );
  await page.locator("#shop").click();
  await page.locator("#settings").click();
  assert.equal(await page.locator("#shop-dialog").isVisible(), false);
  assert.ok((await snap()).aiming);
  await page.locator("#settings").click();
  assert.equal(await page.locator("#settings-dialog").isVisible(), false);
  assert.ok((await snap()).aiming);
  await page.locator("#shop").click();
  await page.locator('[aria-label="Close shop"]').click();
  assert.ok((await snap()).aiming);
  await page.keyboard.press("Escape");
  await page.keyboard.up("1");
  assert.equal((await snap()).player.mana, 800);
  await page.keyboard.down("d");
  await page.locator("#shop").click();
  await page.locator("#settings").click();
  await page.locator('[aria-label="Close settings"]').click();
  const afterClose = (await snap()).player.x;
  await elapsed(0.15);
  assert.ok((await snap()).player.x > afterClose + 0.2);
  await page.keyboard.up("d");
  pass(
    "panel switching, trigger toggling and X closing preserve held aim and movement",
  );
  for (const [width, height] of [
    [1440, 900],
    [960, 540],
    [800, 450],
  ]) {
    await page.setViewportSize({ width, height });
    await learnPracticeKit(page);
  for (const panel of ["shop", "settings"]) {
      await page.locator("#" + panel).click();
      if (panel === "settings")
        await page.locator("#settings-tab-controls").click();
      const box = await page.locator("#" + panel + "-dialog").boundingBox();
      assert.ok(
        box.x >= 0 &&
          box.y >= 0 &&
          box.x + box.width <= width &&
          box.y + box.height <= height,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await page
        .locator(`[aria-label="Close ${panel}"]`)
        .click({ trial: true });
      assert.ok(
        Math.abs(box.x + box.width / 2 - width / 2) <= 1,
        "panel horizontally centered",
      );
      assert.ok(
        Math.abs(box.y + box.height / 2 - height / 2) <= 1,
        "panel vertically centered",
      );
      assert.equal(
        await page
          .locator("#" + panel + "-dialog")
          .evaluate((e) => e.matches(":modal")),
        false,
      );
      await page.locator("#attack").click({ trial: true });
      await page.screenshot({
        path: `artifacts/live-panels-${panel}-${width}x${height}.png`,
      });
      await page.keyboard.press("Escape");
    }
  }
  pass(
    "both panels are centered horizontally and vertically, non-modal and in bounds with reachable close/attack at desktop and compact landscape sizes",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  pass(
    "offline file://: zero runtime errors, warnings or subresource requests",
  );
  await writeFile(
    "artifacts/live-panels-browser-results.json",
    JSON.stringify(
      {
        platform: process.platform,
        browser: await browser.version(),
        offline: true,
        checks,
        errors,
        warnings,
        requests,
      },
      null,
      2,
    ),
  );
  console.log(checks.length + " live-panel browser checks passed.");
} catch (e) {
  await writeFile(
    "artifacts/live-panels-browser-failure.json",
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
