import assert from "node:assert/strict";
export async function checkMovingAttack({ page, snap, elapsed, reset }) {
  await reset();
  await page.locator("#world").focus();
  await page.keyboard.down("s");
  try {
    await elapsed(0.08);
    const before = await snap();
    await page.locator("#attack").click();
    const atClick = await snap();
    await elapsed(0.14);
    const clicked = await snap();
    assert.ok(
      clicked.player.x > atClick.player.x + 0.1,
      `Held movement stopped after clicking Attack: ${atClick.player.x} -> ${clicked.player.x}`,
    );
    assert.equal(clicked.lastAttack.serial, before.lastAttack.serial + 1);
    await page.keyboard.press("Space");
    await elapsed(0.1);
    const keyed = await snap();
    assert.ok(keyed.player.x > clicked.player.x + 0.1);
    assert.equal(keyed.lastAttack.serial, clicked.lastAttack.serial + 1);
  } finally {
    await page.keyboard.up("s");
  }
}
export async function runSettingsInputChecks(ctx) {
  const { page, pass, snap, elapsed, reset } = ctx;
  await checkMovingAttack(ctx);
  pass(
    "held WASD continues through mouse Attack and Space without re-pressing movement; each requests exactly one attack",
  );
  for (const trigger of ["shop", "settings"]) {
    await reset();
    await page.locator("#world").focus();
    await page.keyboard.down("s");
    await elapsed(0.07);
    await page.locator(`#${trigger}`).click();
    const opened = await snap();
    await elapsed(0.15);
    assert.equal((await snap()).player.x, opened.player.x);
    await page.keyboard.up("s");
    await page.keyboard.down("w");
    await page.keyboard.down("d");
    // Test the global guard as well as native dialog focus/inert behavior.
    await page.locator("#world").evaluate((e) => {
      e.dispatchEvent(
        new KeyboardEvent("keydown", { code: "KeyS", bubbles: true }),
      );
      e.dispatchEvent(
        new KeyboardEvent("keydown", { code: "Space", bubbles: true }),
      );
      e.dispatchEvent(
        new PointerEvent("pointerdown", {
          button: 0,
          clientX: 400,
          clientY: 200,
          bubbles: true,
        }),
      );
    });
    await elapsed(0.15);
    const blocked = await snap();
    assert.deepEqual(blocked.player, opened.player);
    assert.deepEqual(blocked.enemies, opened.enemies);
    assert.equal(blocked.lastAttack.serial, opened.lastAttack.serial);
    await page.keyboard.press("Escape");
    await page
      .locator("#world")
      .evaluate((e) =>
        e.dispatchEvent(
          new KeyboardEvent("keydown", {
            code: "KeyD",
            repeat: true,
            bubbles: true,
          }),
        ),
      );
    await elapsed(0.1);
    assert.equal(
      (await snap()).player.x,
      opened.player.x,
      "Held menu keys must not resume movement after close",
    );
    await page.keyboard.up("w");
    await page.keyboard.up("d");
    await page.keyboard.down("s");
    await elapsed(0.12);
    await page.keyboard.up("s");
    assert.ok((await snap()).player.x > opened.player.x + 0.1);
  }
  pass(
    "Shop and Settings stop held movement, reject fresh/off-dialog gameplay events and resume only after new movement input",
  );
  for (const trigger of ["shop", "settings"]) {
    await reset();
    const stick = await page.locator("#joystick").boundingBox();
    await page.mouse.move(
      stick.x + stick.width / 2,
      stick.y + stick.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      stick.x + stick.width * 0.8,
      stick.y + stick.height / 2,
    );
    await elapsed(0.1);
    await page.locator(`#${trigger}`).evaluate((e) => e.click());
    const opened = await snap();
    assert.ok(
      !(await page.locator("#joystick").getAttribute("class")).includes(
        "dragging",
      ),
    );
    await elapsed(0.12);
    assert.equal((await snap()).player.x, opened.player.x);
    await page.mouse.up();
    await page.keyboard.press("Escape");
    await elapsed(0.1);
    assert.equal((await snap()).player.x, opened.player.x);
  }
  pass(
    "opening either modal cancels active joystick capture/axes and closing never revives the old drag",
  );
  await reset();
  await page.locator("#settings").click();
  await page.locator("#settings-tab-controls").click();
  const before = await snap();
  for (const mode of ["current-hp", "hp-percent", "manual", "nearest"]) {
    await page
      .locator(`input[name="target-priority"][value="${mode}"]`)
      .check();
    await elapsed(0.03);
    assert.equal((await snap()).targetMode, mode);
    assert.equal(await page.locator("#target-mode").inputValue(), mode);
    assert.equal(
      await page.locator('input[name="target-priority"]:checked').count(),
      1,
    );
    assert.equal((await snap()).lastAttack.serial, before.lastAttack.serial);
    assert.equal((await snap()).player.x, before.player.x);
  }
  await page.locator("#key-controls summary").evaluate((e) => {
    if (!e.parentElement.open) e.click();
  });
  assert.equal(await page.locator("#bind-regen").inputValue(), "KeyV");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#regen .slot-key").innerText(), "V");
  const reserved = await snap();
  await page.keyboard.press("v");
  await elapsed(0.03);
  assert.deepEqual((await snap()).player, reserved.player);
  assert.equal((await snap()).lastAttack.serial, reserved.lastAttack.serial);
  await reset();
  await page.locator("#settings").click();
  await page.locator("#settings-tab-controls").click();
  assert.ok(
    await page
      .locator('input[name="target-priority"][value="nearest"]')
      .isChecked(),
  );
  await page.keyboard.press("Escape");
  pass(
    "Settings target priority shares existing HUD/simulation modes and reset; Regen defaults to V and remains reserved without healing",
  );
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1000, 700],
    [800, 600],
    [854, 480],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator("#settings").click();
    const shell = await page.locator("#settings-dialog").boundingBox();
    assert.ok(
      shell.x >= 0 &&
        shell.y >= 0 &&
        shell.x + shell.width <= width &&
        shell.y + shell.height <= height,
    );
    assert.ok(shell.width > width * 0.5);
    for (const tab of ["basic", "controls", "interface"]) {
      await page.locator(`#settings-tab-${tab}`).click();
      assert.equal(
        await page
          .locator('#settings-dialog [role="tabpanel"]:visible')
          .count(),
        1,
      );
      assert.equal(
        await page
          .locator('#settings-dialog [role="tab"][aria-selected="true"]')
          .count(),
        1,
      );
      await page
        .locator('[aria-label="Close settings"]')
        .click({ trial: true });
      const overflow = await page.locator("#settings-dialog").evaluate((e) => ({
        x: e.scrollWidth - e.clientWidth,
        y: e.scrollHeight - e.clientHeight,
      }));
      assert.ok(
        overflow.x <= 1 && overflow.y <= 1,
        `Settings shell overflow ${width}x${height}`,
      );
    }
    await page.locator("#settings-tab-basic").focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "settings-tab-controls",
    );
    await page.keyboard.press("End");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "settings-tab-interface",
    );
    await page.keyboard.press("Home");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "settings-tab-basic",
    );
    for (const tab of ["basic", "controls"]) {
      await page.locator(`#settings-tab-${tab}`).click();
      await page.screenshot({
        path: `artifacts/settings-layout-${tab}-${width}x${height}.png`,
      });
    }
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.id), "world");
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await reset();
  pass(
    "landscape Settings tabs/keyboard navigation and close remain accessible with no shell overflow at five desktop/compact sizes",
  );
}
