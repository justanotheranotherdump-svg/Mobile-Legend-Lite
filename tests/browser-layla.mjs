import {
  learnPracticeKit,
  afterS1,
  woundedAfterS1,
  afterUltimate,
} from "./helpers/practice.mjs";
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
  const hero = () => page.evaluate(() => window.foundationDiagnostics.hero());
  const elapsed = async (sec) => {
    const t = (await snap()).time;
    await page.waitForFunction(
      (t) => window.foundationDiagnostics.snapshot().time >= t,
      t + sec,
    );
  };
  const reset = async () => {
    await page.locator("#reset").click();
    await elapsed(0.05);
    await learnPracticeKit(page);
  };
  const project = (x, y, z) =>
    page.evaluate(
      ([x, y, z]) => window.foundationDiagnostics.project(x, y, z),
      [x, y, z],
    );
  const ground = async (x, z) => {
    const p = await project(x, 0, z);
    await page.mouse.move(p.x, p.y);
  };
  const aimWheelAt = async(x,z) => {
    const s=await snap(),a=await project(s.player.x,0,s.player.z),b=await project(x,0,z),r=await page.locator('#skill-aim-wheel').boundingBox();
    const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy);
    await page.mouse.move(r.x+r.width/2+dx/n*55,r.y+r.height/2+dy/n*55);
  };
  const hold = async (key) => {
    await page.keyboard.down(key);
    await page.waitForFunction(() =>
      Boolean(window.foundationDiagnostics.snapshot().aiming),
    );
  };
  const load = async (file) => {
    await page.goto(pathToFileURL(file).href + "?screen=training#diagnostics");
    await page.bringToFront();
    await page.waitForFunction(
      () => window.foundationDiagnostics?.snapshot().time > 0.05,
    );
    assert.ok(await page.locator("#error").isHidden());
    await learnPracticeKit(page);
  };
  const setMode = async (mode) => {
    await page.locator("#settings").click();
    await page.locator("#settings-tab-controls").click();
    await page
      .locator(`input[name="target-priority"][value="${mode}"]`)
      .check();
    await page.keyboard.press("Escape");
  };
  await load(resolve("deliverables/MOBA-Lab-Phase-3.html"));
  assert.equal((await hero()).modelStatus, "glb");
  assert.deepEqual((await hero()).visual.clips, ["Walk", "Shoot"]);
  assert.equal(await page.locator(".hero-skill").count(), 3);
  assert.equal(
    await page
      .locator(
        ".target-panel,#target-mode,#joystick,#show-joystick,.movement-dock",
      )
      .count(),
    0,
  );
  let box = await page.locator(".hero-panel").boundingBox();
  assert.ok(box.y > 700 && box.x < 30);
  assert.equal(await page.locator("#regen").isDisabled(), false);
  pass(
    "offline default uses approved GLB, 3 skills, keyboard-only HUD; no joystick/duplicate priority card, hero status bottom-left",
  );
  const originalYaw = (await hero()).modelFacing;
  await ground(10, 8);
  await elapsed(0.1);
  assert.equal((await hero()).modelFacing, originalYaw);
  assert.equal((await snap()).aiming, null);
  pass("idle mouse hover does not rotate model or create an aim sight");
  await page.keyboard.down("d");
  await elapsed(0.35);
  await page.keyboard.up("d");
  let s = await snap();
  assert.ok(s.facing.x > 0 && s.facing.z < 0);
  const movedYaw = (await hero()).modelFacing;
  await ground(-10, 0);
  await elapsed(0.08);
  assert.equal((await hero()).modelFacing, movedYaw);
  pass(
    "normal model facing follows actual camera-relative movement rather than mouse",
  );
  await reset();
  await page.keyboard.down("d");
  await elapsed(0.35);
  await page.keyboard.press("Space");
  const frozen = (await snap()).player;
  assert.equal((await snap()).lastAttack.reason, "fired");
  await elapsed(0.55);
  s = await snap();
  assert.equal(s.player.x, frozen.x);
  assert.equal(s.player.z, frozen.z);
  assert.ok(s.hits === 1);
  assert.equal((await hero()).visual.current, "Shoot");
  assert.match(await page.locator("#attack-status").innerText(), /Firing/);
  await elapsed(0.75);
  assert.ok((await snap()).player.x > frozen.x + 0.2);
  await page.keyboard.up("d");
  pass(
    "moving basic locks movement for full Shoot, hits locked enemy, then held WASD resumes automatically",
  );
  await reset();
  await ground(-12, 5);
  await page.keyboard.press("1");
  assert.equal((await snap()).lastCastResult, "cast");
  await elapsed(1.2);
  assert.ok(Math.abs((await snap()).enemies[0].hp - afterS1) < 1e-6);
  assert.equal((await snap()).player.range, 8);
  pass(
    "quick key tap ignores mouse and auto-targets nearest eligible enemy at skill range; normal damage/buff/mana/CD retained",
  );
  await page.keyboard.press("2");
  await elapsed(1.2);
  s = await snap();
  assert.ok(s.enemies[0].mark);
  const hp = s.enemies[0].hp;
  await page.locator("#attack").click();
  await elapsed(1.2);
  s = await snap();
  assert.ok(s.enemies[0].hp < hp - 40);
  assert.equal(s.enemies[0].mark, undefined);
  assert.equal(s.hits, 1);
  assert.ok((await hero()).effects.events["mark-trigger"]);
  pass(
    "auto orb/basic chaining retains marks, bonus damage, stun trigger and authoritative presentation",
  );
  await reset();
  await setMode("current-hp");
  assert.equal((await snap()).targetMode, "current-hp");
  await page.locator("#skill-1").click();
  await elapsed(1.2);
  s = await snap();
  assert.equal(s.enemies[0].hp, 2000);
  assert.ok(Math.abs(s.enemies[1].hp - woundedAfterS1) < 1e-6);
  pass(
    "pointer tap auto-targets using Settings priority, not cursor position; Settings is sole priority selector",
  );
  await reset();
  await hold("1");
  s = await snap();
  assert.equal(s.player.mana, 800);
  assert.equal(s.pendingCasts.length, 0);
  assert.equal((await hero()).sightVisible, true);
  assert.equal(await page.locator("#cancel-skill").isVisible(), true);
  await aimWheelAt(3, 1);
  await elapsed(0.08);
  await page.screenshot({ path: "artifacts/combat-controls-aim.png" });
  await page.keyboard.press("Escape");
  await page.keyboard.up("1");
  s = await snap();
  assert.equal(s.aiming, null);
  assert.equal(s.player.mana, 800);
  assert.deepEqual(s.abilityCooldowns, {});
  pass(
    "held bound key previews original directional sight without spending; Escape cancels and stale keyup does not cast",
  );
  const pin = await project(0, 1.45, 0);
  await page.mouse.click(pin.x, pin.y);
  assert.equal((await snap()).manualTargetId, "dummy-a");
  await hold("1");
  await aimWheelAt(3, 1);
  await elapsed(0.08);
  await page.keyboard.up("1");
  await elapsed(1.2);
  s = await snap();
  assert.equal(s.enemies[0].hp, 2000);
  assert.ok(Math.abs(s.enemies[1].hp - woundedAfterS1) < 1e-6);
  assert.equal(s.manualTargetId, "dummy-a");
  pass(
    "relative hold-and-release overrides smart/manual pin direction without changing the pin",
  );
  await reset();
  let b = await page.locator("#skill-1").boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForSelector("#skill-aim-wheel:not([hidden])");
  await aimWheelAt(3, 1);
  await page.waitForFunction(() =>
    Boolean(window.foundationDiagnostics.snapshot().aiming),
  );
  await elapsed(0.08);
  await page.mouse.up();
  await elapsed(1.2);
  assert.ok(Math.abs((await snap()).enemies[1].hp - woundedAfterS1) < 1e-6);
  assert.equal((await snap()).lastCast.serial, 1);
  pass(
    "pointer capture supports held button drag aim and release, with exactly one cast and no native-click duplicate",
  );
  await reset();
  b = await page.locator("#skill-1").boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForFunction(() =>
    Boolean(window.foundationDiagnostics.snapshot().aiming),
  );
  const cancel = await page.locator("#cancel-skill").boundingBox();
  await page.mouse.move(
    cancel.x + cancel.width / 2,
    cancel.y + cancel.height / 2,
  );
  await page.mouse.up();
  assert.equal((await snap()).player.mana, 800);
  assert.equal((await snap()).lastCast.serial, 0);
  assert.equal((await snap()).aiming, null);
  pass(
    "dragging held pointer into visible CANCEL area and releasing cancels without mana/cooldown",
  );
  await hold("2");
  await page.mouse.click(600, 350, { button: "right" });
  await page.keyboard.up("2");
  assert.equal((await snap()).player.mana, 800);
  assert.equal((await snap()).aiming, null);
  pass(
    "right-click cancels a held skill without basic attack or resource spend",
  );
  await reset();
  await hold("1");
  await page.locator("#settings").click();
  assert.equal((await snap()).aiming,null);
  await page.keyboard.up("1");
  assert.equal((await snap()).lastCast.serial,0);
  assert.equal((await snap()).player.mana,800);
  const beforeMenuMove = (await snap()).player.x;
  await page.keyboard.down("d");
  await elapsed(0.15);
  await page.keyboard.up("d");
  assert.ok((await snap()).player.x > beforeMenuMove + 0.2);
  await page.keyboard.press("Escape");
  await page.locator("#shop").click();
  await page.keyboard.press("3");
  await elapsed(1.2);
  assert.ok((await snap()).lastCast.serial >= 1);
  await page.keyboard.press("Escape");
  await reset();
  pass(
    "switching panels cancels stale aim; non-modal panels still allow WASD and fresh skill casts",
  );
  await page.locator("#settings").click();
  await page.locator("#settings-tab-controls").click();
  await page.locator("#key-controls summary").click();
  await page.locator("#bind-skill-1").selectOption("Numpad1");
  await page.keyboard.press("Escape");
  await page.keyboard.press("1");
  assert.equal((await snap()).lastCast.serial, 0);
  await hold("Numpad1");
  await page.keyboard.press("Escape");
  await page.keyboard.up("Numpad1");
  assert.equal((await snap()).player.mana, 800);
  await page.keyboard.press("Numpad1");
  await elapsed(1.2);
  assert.ok(Math.abs((await snap()).enemies[0].hp - afterS1) < 1e-6);
  assert.equal(await page.locator("#skill-1 .slot-key").innerText(), "Num 1");
  pass(
    "session custom numpad keys support both tap-auto and held preview/cancel; old key is replaced",
  );
  await reset();
  await page.locator("#skill-ultimate").focus();
  await page.keyboard.press("Enter");
  await elapsed(1.2);
  assert.ok(Math.abs((await snap()).enemies[0].hp - afterUltimate) < 1e-6);
  assert.equal((await hero()).effects.events.beam, 1);
  pass(
    "native accessible button activation shares auto-targeted ultimate and authoritative one-hit beam",
  );
  await reset();
  await hold("Numpad1");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.keyboard.up("Numpad1");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  assert.equal((await snap()).aiming, null);
  assert.equal((await snap()).player.mana, 800);
  assert.equal((await snap()).lastCast.serial, 0);
  pass(
    "blur/reset lifecycle clears held preview/capture without spending or reviving old gestures",
  );
  for (const [width, height] of [
    [1440, 900],
    [960, 540],
    [800, 450],
  ]) {
    await page.setViewportSize({ width, height });
    await elapsed(0.05);
    for (const id of [
      "skill-1",
      "skill-2",
      "skill-ultimate",
      "attack",
      "reset",
    ]) {
      const r = await page.locator("#" + id).boundingBox();
      assert.ok(
        r.x >= 0 &&
          r.y >= 0 &&
          r.x + r.width <= width + 1 &&
          r.y + r.height <= height + 1,
        `${id} outside ${width}x${height}`,
      );
    }
    box = await page.locator(".hero-panel").boundingBox();
    assert.ok(box.y > height - 160 && box.x < 30);
    await page.screenshot({
      path: `artifacts/combat-controls-${width}x${height}.png`,
    });
  }
  pass(
    "keyboard-only status/skills/attack remain accessible in desktop and compact landscape layouts",
  );
  const isolated = join(
    await mkdtemp(join(tmpdir(), "layla-controls-")),
    "Offline download — alone",
  );
  await mkdir(isolated);
  const bytes = execFileSync(
    "unzip",
    ["-p", "deliverables/MOBA-Lab-Game-Polish-source.zip", "index.html"],
    { maxBuffer: 12 * 1024 * 1024 },
  );
  assert.ok(bytes.equals(await readFile("index.html")));
  const standalone = join(isolated, "index.html");
  await writeFile(standalone, bytes);
  await load(standalone);
  await page.keyboard.press("1");
  await elapsed(1.2);
  assert.ok(Math.abs((await snap()).enemies[0].hp - afterS1) < 1e-6);
  assert.equal(await page.locator("#joystick,.target-panel").count(), 0);
  pass(
    "source ZIP HTML works copied alone at offline file:// Unicode/spaces path, with new controls and real embedded GLB",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(requests, []);
  pass(
    "ZERO runtime errors, warnings or subresource requests across offline interaction",
  );
  await writeFile(
    "artifacts/combat-controls-browser-results.json",
    JSON.stringify(
      {
        platform: process.platform,
        browser: await browser.version(),
        offline: true,
        fileProtocol: true,
        checks,
        errors,
        warnings,
        requests,
      },
      null,
      2,
    ),
  );
  console.log(checks.length + " combat-control browser checks passed.");
} catch (e) {
  await writeFile(
    "artifacts/combat-controls-browser-failure.json",
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
