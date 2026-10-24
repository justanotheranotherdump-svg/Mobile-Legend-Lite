import assert from "node:assert/strict";
export async function runEmptyShopChecks({ page, pass, snap, elapsed, reset }) {
  await reset();
  assert.equal(await page.locator("#message").count(), 0);
  assert.ok(await page.locator("#shop-dialog").isHidden());
  assert.equal(
    await page
      .locator("#equipment-slots .item-slot:not(.quick-buy) .icon")
      .count(),
    0,
  );
  const before = await snap();
  await page.locator("#shop").click();
  assert.equal(await page.locator(".shop-slot-catalog").count(), 16);
  assert.equal(await page.locator(".shop-slot-build").count(), 4);
  assert.equal(await page.locator(".shop-slot-equipment").count(), 6);
  assert.equal(
    await page
      .locator("#shop-dialog img, #shop-dialog image, .shop-card")
      .count(),
    0,
  );
  for (const button of await page
    .locator('#shop-dialog [data-control-kind="reserved"]')
    .all())
    assert.ok(await button.isDisabled());
  await page.locator("#shop-purchase").evaluate((e) => e.click());
  await page.locator(".shop-prioritize").evaluate((e) => e.click());
  await page
    .locator(".shop-slot-catalog")
    .first()
    .evaluate((e) =>
      e.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
  await elapsed(0.1);
  let after = await snap();
  assert.deepEqual(after.enemies, before.enemies);
  assert.deepEqual(after.player, before.player);
  assert.equal(after.lastAttack.serial, before.lastAttack.serial);
  pass(
    "empty shop has sixteen catalog, four build and six equipment slots; disabled slots/purchases/priorities never mutate gameplay",
  );
  for (const name of [
    "Attack",
    "Magic",
    "Defense",
    "Movement",
    "Jungle",
    "Roam",
    "Recommended",
  ]) {
    await page.locator(`[data-category="${name}"]`).click();
    assert.equal(await page.locator("#shop-category-title").innerText(), name);
    assert.equal(
      await page.locator('[data-category][aria-pressed="true"]').count(),
      1,
    );
    assert.equal(await page.locator(".shop-slot-catalog").count(), 16);
  }
  const columns = () =>
    page
      .locator(".shop-slot-grid")
      .evaluate(
        (e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
      );
  assert.equal(await columns(), 4);
  await page.locator('[data-shop-view="simple"]').click();
  assert.equal(await columns(), 3);
  assert.equal(
    await page
      .locator('[data-shop-view="simple"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.locator(".shop-slot-catalog").last().scrollIntoViewIfNeeded();
  assert.ok(await page.locator(".shop-slot-catalog").last().isVisible());
  await page.locator('[data-shop-view="all"]').click();
  assert.equal(await columns(), 4);
  pass(
    "shop categories and view tabs only change the empty interface; simple layout scrolls and all-equipment restores four columns",
  );
  await page.locator('[aria-label="Close shop"]').click();
  assert.ok(await page.locator("#shop-dialog").isHidden());
  await page.locator("#shop").focus();
  await page.keyboard.press("Enter");
  const x = (await snap()).player.x;
  await page.keyboard.down("w");
  await elapsed(0.12);
  await page.keyboard.up("w");
  await page.keyboard.press("Escape");
  assert.equal((await snap()).player.x, x);
  assert.equal(await page.evaluate(() => document.activeElement.id), "world");
  assert.equal(
    await page.locator("#shop").getAttribute("aria-expanded"),
    "false",
  );
  await page.locator("#shop").click();
  await page.mouse.click(2, 2);
  assert.ok(await page.locator("#shop-dialog").isHidden());
  pass(
    "landscape shop supports native keyboard opening, close/Escape/backdrop, world focus return and clears movement input",
  );
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1000, 700],
    [800, 600],
    [854, 480],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator("#shop").click();
    const dialog = await page.locator("#shop-dialog").boundingBox();
    assert.ok(
      dialog.x >= 0 &&
        dialog.y >= 0 &&
        dialog.x + dialog.width <= width &&
        dialog.y + dialog.height <= height,
    );
    assert.ok(
      dialog.width > width * 0.55,
      "Shop remains a landscape panel, not the old narrow dialog",
    );
    for (const selector of [
      ".shop-header",
      ".shop-categories",
      ".shop-catalog",
      ".shop-builder",
      ".shop-equipment",
      ".shop-purchase",
      '[aria-label="Close shop"]',
      "#shop-purchase",
      ".shop-slot-equipment",
    ]) {
      for (const node of await page.locator(selector).all()) {
        const box = await node.boundingBox();
        assert.ok(box);
        assert.ok(
          box.x >= dialog.x - 1 &&
            box.y >= dialog.y - 1 &&
            box.x + box.width <= dialog.x + dialog.width + 1 &&
            box.y + box.height <= dialog.y + dialog.height + 1,
          `${selector} clips at ${width}x${height}`,
        );
      }
    }
    const overflow = await page
      .locator("#shop-dialog")
      .evaluate((e) => ({
        x: e.scrollWidth - e.clientWidth,
        y: e.scrollHeight - e.clientHeight,
      }));
    assert.ok(
      overflow.x <= 1 && overflow.y <= 1,
      `Shop shell overflows ${width}x${height}: ${JSON.stringify(overflow)}`,
    );
    const close = page.locator('[aria-label="Close shop"]');
    await close.click({ trial: true });
    await page.screenshot({
      path: `artifacts/shop-layout-${width}x${height}.png`,
    });
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await reset();
  pass(
    "empty landscape shop stays in bounds with accessible close/purchase/equipment and no shell overflow at five desktop/compact sizes",
  );
}
