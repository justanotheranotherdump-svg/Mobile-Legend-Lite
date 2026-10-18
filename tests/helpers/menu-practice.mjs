// Historical menu/asset/audio tests still exercise the same sandbox, now through
// the authorized prematch pipeline. Foreground the actual test tab: a hidden
// tab correctly pauses preparation/clock, particularly with multiple contexts.
export async function finishPracticeEntry(page) {
  await page.bringToFront();
  const method=await page.evaluate(()=>matchMedia('(pointer:coarse)').matches)?'tap':'click';
  for(const selector of ['#ai-mode-practice','#room-start','#pick-layla','#hero-confirm'])await page.locator(selector)[method]({timeout:90000});
  try {
    await page.waitForFunction(()=>window.foundationDiagnostics?.snapshot().time>.05||document.querySelector('#load-error'),null,{timeout:90000});
    const failure=await page.evaluate(()=>document.querySelector('#load-error')?.textContent);
    if(failure)throw Error(failure);
  } catch(error){
    console.error('Practice entry diagnostics',await page.evaluate(()=>({menu:window.menuDiagnostics?.snapshot(),game:window.foundationDiagnostics?.snapshot(),hidden:document.hidden,focus:document.hasFocus(),error:document.querySelector('#load-error')?.textContent})));
    await page.screenshot({path:'artifacts/practice-entry-failure.png'});throw error;
  }
}
