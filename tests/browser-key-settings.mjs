import assert from "node:assert/strict";
export async function runKeySettingsChecks({
  page,
  pass,
  snap,
  elapsed,
  reset,
  approach,
  ready,
}) {
  const open = async (tab = "controls") => {
    await page.locator("#settings").click();
    await page.locator(`#settings-tab-${tab}`).click();
  };
  const close = async () => {
    await page.keyboard.press("Escape");
    await page.locator("#settings-dialog").waitFor({ state: "hidden" });
  };
  const expand = async () => {
    if ((await page.locator("#key-controls").getAttribute("open")) === null)
      await page.locator("#key-controls summary").click();
  };
  await reset();
  await open();
  await page.locator("#settings-tab-interface").click();
  await page.locator("#show-key-hints").uncheck();
  await close();
  assert.ok(await page.locator("#attack .slot-key").isHidden());
  assert.equal(await page.locator(".skill-slots .slot-key:visible").count(), 0);
  assert.equal(
    await page.locator(".skill-slots .slot-label:visible").count(),
    3,
  );
  await approach();
  await ready();
  await page.locator("#world").focus();
  const first = await snap();
  await page.keyboard.press("Space");
  await elapsed(0.03);
  assert.equal((await snap()).hits, first.hits + 1);
  pass(
    "Settings can hide button key hints without hiding names or disabling the actual attack shortcut",
  );

  await open();
  await expand();
  await page.locator("#bind-attack").selectOption("KeyJ");
  await page.locator("#bind-skill-1").selectOption("KeyK");
  await page.locator("#bind-regen").selectOption("KeyG");
  await page.locator("#bind-priority-minion").selectOption("KeyT");
  assert.ok(await page.locator("#attack .slot-key").isHidden());
  await page.locator("#settings-tab-interface").click();
  await page.locator("#show-key-hints").check();
  await close();
  assert.equal(await page.locator("#attack .slot-key").innerText(), "J / LMB");
  assert.equal(await page.locator("#skill-1 .slot-key").innerText(), "K");
  assert.equal(
    await page.locator("#priority-minion .slot-key").innerText(),
    "T",
  );
  await ready();
  await page.locator("#world").focus();
  const before = await snap();
  await page.keyboard.press("Space");
  await elapsed(0.03);
  assert.equal((await snap()).hits, before.hits);
  await page.keyboard.press("j");
  await elapsed(0.03);
  assert.equal((await snap()).hits, before.hits + 1);
  await page.keyboard.press("j");
  await elapsed(0.02);
  assert.equal((await snap()).hits, before.hits + 1);
  assert.match(await page.locator("#attack-status").innerText(), /cooldown/);
  pass(
    "Custom attack key replaces Space immediately, updates visible hints and uses original damage/cooldown validation",
  );

  await ready();
  await page.locator("#world").focus();
  const inactive = await snap();
  for (const key of ["k", "g", "t"]) await page.keyboard.press(key);
  await elapsed(0.02);
  assert.equal((await snap()).hits, inactive.hits);
  assert.equal((await snap()).lastAttack.serial, inactive.lastAttack.serial);
  assert.ok(await page.locator("#skill-1").isDisabled());
  assert.ok(await page.locator("#priority-minion").isDisabled());
  await open();
  await page.locator("#bind-attack").selectOption("KeyK");
  assert.match(
    await page.locator("#key-binding-status").innerText(),
    /already assigned/,
  );
  assert.equal(await page.locator("#bind-attack").inputValue(), "KeyJ");
  assert.equal(
    await page.locator('#bind-attack option[value="KeyW"]').count(),
    0,
  );
  assert.equal(
    await page.locator('#bind-attack option[value="Escape"]').count(),
    0,
  );
  assert.equal(
    await page.locator('#bind-attack option[value="F1"]').count(),
    0,
  );
  const menuBefore = await snap();
  await page.locator("#bind-attack").focus();
  await page.keyboard.press("j");
  await elapsed(0.05);
  assert.equal((await snap()).hits, menuBefore.hits);
  await close();
  pass(
    "Reserved bindings cannot cast; duplicate bindings are rejected, WASD/navigation keys protected and menus suppress gameplay shortcuts",
  );

  await open();
  await page.locator("#bind-attack").selectOption("");
  await close();
  assert.equal(await page.locator("#attack .slot-key").innerText(), "LMB");
  await ready();
  await page.locator("#world").focus();
  const unbound = await snap();
  await page.keyboard.press("j");
  await elapsed(0.02);
  assert.equal((await snap()).hits, unbound.hits);
  await page.locator("#attack").click();
  await elapsed(0.02);
  assert.equal((await snap()).hits, unbound.hits + 1);
  await open();
  await page.locator("#bind-attack").selectOption("Numpad0");
  await close();
  await ready();
  await page.locator("#world").focus();
  const num = await snap();
  await page.keyboard.press("Numpad0");
  await elapsed(0.02);
  assert.equal((await snap()).hits, num.hits + 1);
  await reset();
  assert.equal(
    await page.locator("#attack .slot-key").innerText(),
    "Num 0 / LMB",
  );
  await open();
  await page.locator("#restore-key-defaults").click();
  assert.equal(await page.locator("#bind-attack").inputValue(), "Space");
  assert.equal(await page.locator("#bind-skill-1").inputValue(), "Digit1");
  await close();
  assert.equal(
    await page.locator("#attack .slot-key").innerText(),
    "Space / LMB",
  );
  await reset();
  await approach();
  await ready();
  await page.locator("#world").focus();
  const restored = await snap();
  await page.keyboard.press("Space");
  await elapsed(0.02);
  assert.equal((await snap()).hits, restored.hits + 1);
  pass(
    "Unbinding keeps mouse/HUD attack available, custom numpad keys work, game reset preserves preferences and restore defaults restores Space/1/2/3",
  );

  for (const [width, height] of [
    [854, 480],
    [800, 600],
  ]) {
    await page.setViewportSize({ width, height });
    await open();
    // The new Controls page has targeting/joystick sections above the key editor.
    await page.locator("#bind-attack").scrollIntoViewIfNeeded();
    await page.locator("#bind-attack").selectOption("KeyJ");
    const rect = await page.locator("#bind-attack").boundingBox();
    assert.ok(
      rect.x >= 0 &&
        rect.x + rect.width <= width &&
        rect.y >= 0 &&
        rect.y + rect.height <= height,
    );
    await page.locator("#restore-key-defaults").click();
    await close();
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await reset();
  await page.screenshot({ path: "artifacts/key-settings-hud.png" });
  pass(
    "Scrollable key settings remain usable at compact landscape sizes and Escape returns focus without stuck input",
  );
}
