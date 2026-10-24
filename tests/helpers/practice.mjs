// Regression fixtures explicitly learn rank-1 skills at level 4 via real UI.
// These are not runtime/debug mutation APIs. Initial progression is tested separately.
export async function learnPracticeKit(page) {
  // Exact historical damage fixtures explicitly select single-attempt attacks.
  // Default persistent approach is covered by browser-game-polish + command units.
  if(await page.locator('#smart-basic').isChecked()) {
    const open=await page.locator('#settings-dialog').isVisible();
    if(!open)await page.locator('#settings').click();
    await page.locator('#settings-tab-controls').click();
    await page.locator('#smart-basic').uncheck();
    if(!open)await page.locator('#settings-dialog [data-close]').click();
  }
  await page.locator('#practice-tools summary').click();
  await page.locator('#practice-level').fill('4');
  await page.locator('#practice-set-level').click();
  await page.locator('#practice-tools summary').click();
  for (const slot of ['skill-1','skill-2','skill-ultimate']) await page.locator(`#upgrade-${slot}`).click();
  await page.waitForFunction(() => ['skill-1','skill-2','skill-ultimate'].every(id => !document.getElementById(id).disabled));
}
export const afterS1 = 2000 - (180 + .8 * (133 + 8.5 * 3)) * 1.15 * 120 / 135;
export const woundedAfterS1 = 900 - (180 + .8 * (133 + 8.5 * 3)) * 1.15 * 120 / 135;
export const afterUltimate = 2000 - (450 + 1.5 * (133 + 8.5 * 3)) * 1.15 * 120 / 135;
