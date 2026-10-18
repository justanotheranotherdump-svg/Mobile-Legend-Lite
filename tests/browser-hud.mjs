import { runEmptyShopChecks } from "./browser-shop.mjs";
import assert from "node:assert/strict";
export async function runHudChecks({
  page,
  pass,
  snap,
  elapsed,
  reset,
  approach,
  ready,
  setMode,
}) {
  await reset();
  assert.equal(await page.locator("#arena-map .map-target").count(), 3);
  assert.ok((await page.locator(".icon").count()) > 25);
  assert.equal(await page.locator("#hud-root img").count(), 0);
  const mapBefore = await page.locator("#map-player").getAttribute("transform");
  await page.keyboard.down("w");
  await elapsed(0.2);
  await page.keyboard.up("w");
  const state = await snap();
  assert.equal(
    Number(await page.locator("#map-player").getAttribute("data-x")),
    state.player.x,
  );
  assert.notEqual(
    await page.locator("#map-player").getAttribute("transform"),
    mapBefore,
  );
  for (const enemy of state.enemies)
    assert.equal(
      Number(
        await page
          .locator(`[data-map-enemy="${enemy.id}"]`)
          .getAttribute("data-hp"),
      ),
      enemy.hp,
    );
  pass(
    "live SVG minimap tracks actual player/targets and original vector icons are bundled locally",
  );

  await reset();
  assert.equal(await page.locator("#match-timer").innerText(), "00:00");
  await elapsed(1.1);
  assert.equal(await page.locator("#match-timer").innerText(), "00:01");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const frozenTimer = await page.locator("#match-timer").innerText();
  await page.waitForTimeout(120);
  assert.equal(await page.locator("#match-timer").innerText(), frozenTimer);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await reset();
  assert.equal(await page.locator("#match-timer").innerText(), "00:00");
  pass(
    "session timer follows actual simulation time, pauses on blur and resets without inventing match scores",
  );

  const beforeMap = await snap();
  await page.locator("#toggle-map-range").click();
  assert.equal(
    await page.locator("#toggle-map-range").getAttribute("aria-pressed"),
    "false",
  );
  assert.ok(await page.locator(".map-range").isHidden());
  await page.locator("#toggle-map-range").click();
  await page.locator("#toggle-map").click();
  assert.ok(await page.locator("#minimap").isHidden());
  await page.locator("#toggle-map").click();
  assert.ok(await page.locator("#minimap").isVisible());
  assert.equal((await snap()).lastAttack.serial, beforeMap.lastAttack.serial);
  assert.equal((await snap()).player.x, beforeMap.player.x);
  pass(
    "map visibility and range controls change presentation only, never attack or move",
  );

  async function dragStart(dx = 1, dy = 0) {
    const rect = await page.locator("#joystick").boundingBox();
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
      radius = rect.width * 0.32;
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x + dx * radius, center.y + dy * radius);
  }
  for (const [dx, dy] of [
    [1, 0],
    [1, -1],
  ]) {
    await reset();
    await dragStart(dx, dy);
    const a = await snap();
    await elapsed(0.35);
    const b = await snap();
    await page.mouse.up();
    const speed =
      Math.hypot(b.player.x - a.player.x, b.player.z - a.player.z) /
      (b.time - a.time);
    assert.ok(
      Math.abs(speed - 5.5) < 0.6,
      `joystick normalized speed ${speed}`,
    );
    assert.equal(b.hits, 0);
    assert.equal(b.lastAttack.serial, 0);
    const stopped = await snap();
    await elapsed(0.1);
    assert.equal((await snap()).player.x, stopped.player.x);
  }
  pass(
    "real pointer joystick movement uses camera-relative normalized speed and releases without attacking",
  );

  await reset();
  await dragStart(-1, 0);
  await page.keyboard.down("d");
  const a = await snap();
  await elapsed(0.22);
  const b = await snap();
  assert.ok(b.player.x > a.player.x);
  assert.ok(b.player.z < a.player.z);
  assert.ok(
    Math.hypot(b.player.x - a.player.x, b.player.z - a.player.z) /
      (b.time - a.time) <
      5.7,
  );
  await page.keyboard.up("d");
  await page.mouse.move(750, 450);
  await page.mouse.up();
  const stopped = await snap();
  await elapsed(0.12);
  assert.equal((await snap()).player.x, stopped.player.x);
  assert.ok(
    !(await page.locator("#joystick").getAttribute("class")).includes(
      "dragging",
    ),
  );
  pass(
    "keyboard takes priority over joystick; pointer capture releases outside the control with no stuck input",
  );

  await reset();
  await dragStart();
  await elapsed(0.12);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  assert.ok(
    !(await page.locator("#joystick").getAttribute("class")).includes(
      "dragging",
    ),
  );
  await page.mouse.up();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const afterBlur = await snap();
  await elapsed(0.1);
  assert.equal((await snap()).player.x, afterBlur.player.x);
  await reset();
  await dragStart();
  await elapsed(0.1);
  await page.locator("#reset").focus();
  await page.keyboard.press("Enter");
  await page.mouse.up();
  await elapsed(0.1);
  assert.equal((await snap()).player.x, -5);
  assert.ok(
    !(await page.locator("#joystick").getAttribute("class")).includes(
      "dragging",
    ),
  );
  await reset();
  await dragStart();
  await page
    .locator("#joystick")
    .dispatchEvent("pointercancel", { pointerId: 1 });
  await elapsed(0.04);
  assert.ok(
    !(await page.locator("#joystick").getAttribute("class")).includes(
      "dragging",
    ),
  );
  const cancelled = await snap();
  await elapsed(0.1);
  assert.equal((await snap()).player.x, cancelled.player.x);
  await page.mouse.up();
  await reset();
  await dragStart();
  await page.locator("#joystick").evaluate((e) => e.releasePointerCapture(1));
  await elapsed(0.04);
  assert.ok(
    !(await page.locator("#joystick").getAttribute("class")).includes(
      "dragging",
    ),
  );
  await page.mouse.up();
  pass(
    "blur, keyboard reset, synthetic cancellation and forced capture loss clear the joystick without stuck movement",
  );

  await reset();
  await page.locator("#settings").click();
  await page.locator("#settings-tab-controls").click();
  await page.locator("#show-joystick").uncheck();
  await page.locator("#settings-tab-basic").click();
  await page.locator("#reduce-motion").check();
  assert.ok(await page.locator("#joystick").isHidden());
  assert.ok(
    await page
      .locator("html")
      .evaluate((e) => e.classList.contains("reduce-motion")),
  );
  await page.keyboard.press("Escape");
  assert.ok(await page.locator("#settings-dialog").isHidden());
  await page.keyboard.down("w");
  await elapsed(0.15);
  await page.keyboard.up("w");
  assert.ok((await snap()).player.x < -5);
  await page.locator("#settings").click();
  await page.locator("#settings-tab-controls").click();
  await page.locator("#show-joystick").check();
  await page.locator("#settings-tab-basic").click();
  await page.locator("#reduce-motion").uncheck();
  await page.locator('[aria-label="Close settings"]').click();
  assert.ok(await page.locator("#joystick").isVisible());
  pass(
    "settings allow optional joystick/reduced HUD motion, preserve WASD, and support Escape/focus return",
  );

  await reset();
  const beforeShop = await snap();
  await page.locator("#shop").focus();
  await page.keyboard.press("Enter");
  assert.ok(await page.locator("#shop-dialog").isVisible());
  assert.equal(await page.locator(".shop-slot-catalog").count(), 16);
  assert.match(
    await page.locator("#shop-dialog").innerText(),
    /not implemented/,
  );
  await page.keyboard.down("w");
  await elapsed(0.15);
  await page.keyboard.up("w");
  assert.equal((await snap()).player.x, beforeShop.player.x);
  await page.keyboard.press("Escape");
  assert.ok(await page.locator("#shop-dialog").isHidden());
  assert.equal((await snap()).lastAttack.serial, beforeShop.lastAttack.serial);
  for (const selector of [
    "#skill-1",
    "#skill-2",
    "#skill-ultimate",
    "#recall",
    "#regen",
    "#battle-spell",
    "#priority-minion",
    "#priority-tower",
    ".item-slot",
  ]) {
    for (const button of await page.locator(selector).all()) {
      assert.ok(await button.isDisabled());
      assert.equal(await button.getAttribute("data-control-kind"), "reserved");
    }
  }
  assert.equal(await page.locator(".team-score.blue").innerText(), "—");
  assert.match(await page.locator(".gold").innerText(), /—/);
  pass(
    "shop is a keyboard-accessible inert placeholder; skills/spells/equipment/minion/tower controls are honestly disabled",
  );

  assert.equal(await page.locator(".skill-slots button").count(), 3);
  assert.deepEqual(
    await page.locator(".skill-slots .slot-key").allTextContents(),
    ["1", "2", "3"],
  );
  assert.deepEqual(
    await page
      .locator(".skill-slots button")
      .evaluateAll((nodes) => nodes.map((n) => n.dataset.keyCode)),
    ["Digit1", "Digit2", "Digit3"],
  );
  await reset();
  await page.locator("#world").focus();
  const beforeSkillKeys = await snap();
  await page.evaluate(() => {
    window.__skillKeyTrace = [];
    window.addEventListener("keydown", (event) =>
      window.__skillKeyTrace.push([event.code, event.defaultPrevented]),
    );
  });
  for (const key of [
    "1",
    "2",
    "3",
    "Numpad1",
    "Numpad2",
    "Numpad3",
    "q",
    "e",
    "r",
  ])
    await page.keyboard.press(key);
  await page.locator("#world").evaluate((canvas) => {
    for (const modifier of ["ctrlKey", "altKey", "metaKey"])
      canvas.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Digit1",
          [modifier]: true,
          bubbles: true,
          cancelable: true,
        }),
      );
  });
  const keyTrace = await page.evaluate(() => window.__skillKeyTrace);
  assert.deepEqual(keyTrace.slice(0, 3), [
    ["Digit1", true],
    ["Digit2", true],
    ["Digit3", true],
  ]);
  assert.ok(keyTrace.slice(3).every(([, handled]) => !handled));
  assert.equal(
    (await snap()).lastAttack.serial,
    beforeSkillKeys.lastAttack.serial,
  );
  assert.equal((await snap()).hits, beforeSkillKeys.hits);
  assert.deepEqual(
    (await snap()).enemies.map((e) => e.hp),
    beforeSkillKeys.enemies.map((e) => e.hp),
  );
  assert.ok(await page.locator("#priority-minion").isDisabled());
  assert.ok(await page.locator("#priority-tower").isDisabled());
  pass(
    "exactly three reserved skills map only top-row 1/2/3 to first/second/ultimate; no numpad or old Q/E/R binding and no fabricated casts",
  );

  await reset();
  await approach();
  await ready();
  await page.locator("#world").focus();
  const beforeSpace = await snap();
  await page.keyboard.press("Space");
  await elapsed(0.02);
  const afterSpace = await snap();
  assert.equal(afterSpace.hits, beforeSpace.hits + 1);
  assert.equal(afterSpace.lastAttack.serial, beforeSpace.lastAttack.serial + 1);
  assert.equal(
    await page.locator("#attack").getAttribute("data-state"),
    "cooldown",
  );
  assert.ok((await page.locator("#attack-countdown").innerText()).length > 0);
  await page.keyboard.press("Space");
  await elapsed(0.02);
  assert.equal((await snap()).hits, afterSpace.hits);
  await ready();
  await elapsed(0.03);
  assert.equal(
    await page.locator("#attack").getAttribute("data-state"),
    "ready",
  );
  await page.locator("#attack").focus();
  const beforeNative = await snap();
  await page.keyboard.press("Space");
  await elapsed(0.02);
  assert.equal((await snap()).hits, beforeNative.hits + 1);
  pass(
    "Space and native focused-button activation each attack once through existing cooldown/target validation",
  );

  await reset();
  await approach();
  await setMode("current-hp");
  for (let i = 0; i < 4; i++) {
    await ready();
    await page.locator("#attack").click();
    await elapsed(0.03);
    if (i < 3)
      assert.ok(await page.locator("#combat-announcements").isHidden());
  }
  assert.ok(await page.locator("#combat-announcements").isVisible());
  assert.match(
    await page.locator("#combat-announcements").innerText(),
    /Target eliminated/,
  );
  assert.match(
    await page.locator("#combat-announcements").innerText(),
    /training target/,
  );
  assert.equal(await page.locator(".team-score.blue").innerText(), "—");
  assert.ok(
    (
      await page.locator('[data-map-enemy="dummy-b"]').getAttribute("class")
    ).includes("defeated"),
  );
  await page.screenshot({ path: "artifacts/phase-3-elimination.png" });
  await elapsed(2.5);
  assert.ok(await page.locator("#combat-announcements").isHidden());
  await reset();
  assert.ok(await page.locator("#combat-announcements").isHidden());
  pass(
    "actual lethal damage triggers a truthful training elimination, no fabricated team score; notice dismisses and resets",
  );

  function overlap(a, b) {
    return (
      Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
      Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1
    );
  }
  for (const [width, height] of [
    [800, 600],
    [854, 480],
    [1024, 600],
    [1440, 900],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await elapsed(0.07);
    assert.equal(
      await page.evaluate(
        () => document.elementFromPoint(innerWidth / 2, innerHeight / 2).id,
      ),
      "world",
      "battlefield center remains unobstructed",
    );
    for (const id of [
      "attack",
      "joystick",
      "target-mode",
      "reset",
      "shop",
      "settings",
      "toggle-map",
      "toggle-map-range",
    ]) {
      const box = await page.locator(`#${id}`).boundingBox();
      assert.ok(
        box &&
          box.x >= 0 &&
          box.y >= 0 &&
          box.x + box.width <= width + 0.1 &&
          box.y + box.height <= height + 0.1,
        `${id} on screen ${width}x${height}`,
      );
      assert.ok(
        await page.locator(`#${id}`).evaluate((e) => {
          const r = e.getBoundingClientRect();
          return e.contains(
            document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
          );
        }),
        `${id} not covered ${width}x${height}`,
      );
    }
    assert.ok(
      !overlap(
        await page.locator("#attack .slot-key").boundingBox(),
        await page.locator(".cooldown-track").boundingBox(),
      ),
      "attack key hint stays clear of cooldown rail",
    );
    const clusterIds = [
      "skill-1",
      "skill-2",
      "skill-ultimate",
      "priority-minion",
      "priority-tower",
      "attack",
    ];
    const clusterBoxes = await Promise.all(
      clusterIds.map((id) => page.locator(`#${id}`).boundingBox()),
    );
    for (let i = 0; i < clusterBoxes.length; i++) {
      const a = clusterBoxes[i];
      assert.ok(
        a.x >= 0 &&
          a.y >= 0 &&
          a.x + a.width <= width &&
          a.y + a.height <= height,
      );
      for (let j = i + 1; j < clusterBoxes.length; j++)
        assert.ok(
          !overlap(a, clusterBoxes[j]),
          `${clusterIds[i]} overlaps ${clusterIds[j]} at ${width}x${height}`,
        );
    }
    const utilityBox = await page.locator("#recall").boundingBox();
    assert.ok(utilityBox.width <= (width > 850 && height > 600 ? 50 : 38));
    const selectors = [
      "#minimap-panel",
      ".target-panel",
      ".hero-panel",
      "#joystick",
      ".utility-dock",
      ".action-dock",
    ];
    const boxes = await Promise.all(
      selectors.map((s) => page.locator(s).boundingBox()),
    );
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++)
        assert.ok(
          !overlap(boxes[i], boxes[j]),
          `${selectors[i]} overlaps ${selectors[j]} at ${width}x${height}`,
        );
    if (width !== 1920)
      await page.screenshot({
        path: `artifacts/phase-3-hud-${width}x${height}.png`,
      });
    await page.locator("#shop").click();
    assert.ok(await page.locator("#shop-dialog").isVisible());
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await reset();
  pass(
    "HUD regions do not overlap, controls stay hit-testable, dialogs work and center remains clear at five landscape sizes",
  );
  await runEmptyShopChecks({ page, pass, snap, elapsed, reset });
}
