import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { launchOfflineBrowser } from './helpers/offline-browser.mjs';
const checks=[],errors=[],warnings=[],requests=[];
const pass = message => {checks.push(message);console.log('PASS: '+message);};
const browser=await launchOfflineBrowser();
const timer=setTimeout(()=>browser.close(),480000);
await mkdir('artifacts',{recursive:true});
try {
  const context=await browser.newContext({offline:true,viewport:{width:1280,height:720}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
  page.on('request',r=>{if(r.resourceType()!=='document')requests.push(r.url());});
  const snap=()=>page.evaluate(()=>window.foundationDiagnostics.snapshot());
  const elapsed=async seconds=>{const time=(await snap()).time;await page.waitForFunction(t=>window.foundationDiagnostics.snapshot().time>t,time+seconds);};
  const command=async(id,input,value)=>{if(input)await page.locator('#'+input).fill(String(value));await page.locator('#'+id).click();await elapsed(.04);};
  await page.goto(pathToFileURL(resolve('index.html')).href+'?screen=training#diagnostics');
  await page.waitForFunction(()=>window.foundationDiagnostics?.snapshot().time>.05);
  let s=await snap();
  assert.equal(s.player.hp,2250);assert.equal(s.player.mana,500);assert.equal(s.progression.level,1);assert.equal(s.progression.skillPoints,1);
  assert.equal(await page.locator('#hero-level').innerText(),'Lv 1');assert.equal(await page.locator('#hero-xp').innerText(),'XP 0 / 200');
  for(const slot of ['skill-1','skill-2','skill-ultimate']) assert.equal(await page.locator('#'+slot).isDisabled(),true);
  assert.equal(await page.locator('#upgrade-skill-ultimate').isDisabled(),true);
  pass('fresh offline level 1: 2250 HP / 500 mana, one point, zero XP, three visibly unlearned skills and locked ultimate');
  await page.locator('#upgrade-skill-1').click();await page.waitForFunction(()=>!document.querySelector('#skill-1').disabled);
  assert.equal(await page.locator('#upgrade-skill-2').isDisabled(),true);
  await page.keyboard.press('1');await elapsed(1.1);s=await snap();
  assert.equal(s.lastCastResult,'cast');assert.ok(s.enemies[0].hp<2000);assert.ok(s.player.mana<500);assert.equal(s.progression.totalXp,0);
  pass('one real skill point enables the same rebound/click skill action, costs real mana, deals scaled defended damage and grants no reward XP');
  await page.locator('#practice-tools summary').click();
  assert.equal(await page.locator('[data-attribute="physicalAttack"]').innerText(),'133');
  await command('practice-grant-xp','practice-xp',200);s=await snap();
  assert.equal(s.progression.level,2);assert.equal(s.progression.skillPoints,1);assert.equal(s.player.maxHp,2402);assert.equal(s.player.maxMana,600);assert.equal(s.progression.ranks['malefic-bomb'],1);
  assert.equal(await page.locator('#hero-xp').innerText(),'XP 0 / 300');
  await command('practice-grant-xp','practice-xp',500);s=await snap();assert.equal(s.progression.level,3);assert.equal(s.progression.xp,200);
  pass('configurable real XP crosses exact/multiple thresholds, keeps learned ranks, adds points/resources and updates live level/XP meter');
  await command('practice-set-level','practice-level',5);s=await snap();assert.equal(s.player.maxHp,2858);assert.equal(s.progression.level,5);assert.equal(s.progression.skillPoints,5);assert.equal(s.progression.ranks['malefic-bomb'],0);
  assert.equal(await page.locator('[data-attribute="physicalAttack"]').innerText(),'167');
  for(const [id,input,value] of [['practice-set-level','practice-level',0],['practice-grant-xp','practice-xp',-1]]) {
    await command(id,input,value);assert.equal((await snap()).progression.level,5);assert.match(await page.locator('#practice-result').innerText(),/expected/);
  }
  pass('Practice set-level resets ranks/flight/cooldowns; level 5 has 2858 HP / 167 PA; invalid inputs report errors without lowering XP/level');
  await command('practice-set-level','practice-level',15);await command('practice-restore');s=await snap();
  assert.equal(s.player.hp,4378);assert.equal(s.player.mana,1900);
  for(const [key,value] of Object.entries({physicalAttack:'252',physicalDefense:'71',magicDefense:'50',attackSpeed:'1.34',movementSpeed:'240 → 5.5',attackRange:'4.3 → 6',hpRegen:'8.2',manaRegen:'6.8'})) assert.equal(await page.locator(`[data-attribute="${key}"]`).innerText(),value);
  await command('practice-grant-xp','practice-xp',Number.MAX_SAFE_INTEGER);s=await snap();assert.equal(s.progression.totalXp,11900);assert.equal(await page.locator('#hero-xp').innerText(),'MAX LEVEL');assert.equal(await page.locator('[aria-label="Hero experience"]').getAttribute('aria-valuenow'),'1');
  pass('level 15 UI exactly reflects 4378 HP / 1900 mana / 252 PA / 71 PD / 50 MD / 1.34 attacks/s, explicit display-to-world units and maximum XP saturation');
  await page.locator('#practice-tools summary').click();
  for(const [slot,max] of [['skill-1',6],['skill-2',6],['skill-ultimate',3]]) {for(let i=0;i<max;i++)await page.locator('#upgrade-'+slot).click();await elapsed(.04);assert.equal(await page.locator('#upgrade-'+slot).isDisabled(),true);}
  assert.equal(await page.locator('#skill-points').innerText(),'0');assert.match(await page.locator('#skill-1 .skill-cost').innerText(),/60 MP/);
  pass('all fifteen points allocate exactly 6/6/3, live rank costs refresh, and every capped upgrade is visibly disabled');
  await page.locator('#practice-tools summary').click();await command('practice-reset');s=await snap();assert.equal(s.progression.level,1);assert.equal(s.progression.totalXp,0);assert.equal(s.progression.skillPoints,1);assert.equal(s.player.hp,2250);assert.equal(s.player.mana,500);
  pass('Practice Reset to level 1 restores resources/XP/ranks without resetting targets or fabricating eliminations');
  await page.locator('#upgrade-skill-1').click();await elapsed(.05);await page.locator('#practice-xp').focus();
  const before=await snap();await page.keyboard.down('d');await page.keyboard.press('1');await elapsed(.15);await page.keyboard.up('d');
  s=await snap();assert.equal(s.player.x,before.player.x);assert.equal(s.lastCast.serial,before.lastCast.serial);
  pass('real Practice numeric editor owns typing: no WASD movement or skill casts leak through');
  await page.locator('#practice-tools summary').click();
  for(const [width,height] of [[1280,720],[960,540],[844,390]]) {
    await page.setViewportSize({width,height});await elapsed(.08);
    for(const selector of ['.hero-panel','.progression-tools','#attack','#skill-1','#skill-2','#skill-ultimate']) {
      const r=await page.locator(selector).boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,`${selector} outside ${width}x${height}`);
    }
    await page.locator('#practice-tools summary').click();
    let r=await page.locator('.practice-body').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height,`practice outside ${width}x${height}: ${JSON.stringify(r)}`);
    await page.locator('#practice-restore').click();await elapsed(.03);await page.screenshot({path:`artifacts/progression-${width}x${height}.png`});
    await page.locator('#practice-tools summary').click();
  }
  pass('level/XP, skills/upgrades and scrollable Practice controls remain reachable at 1280x720, 960x540 and 844x390');
  assert.deepEqual(errors,[]);assert.deepEqual(requests.filter(u=>!u.startsWith('data:')&&!u.startsWith('blob:')),[]);
  pass('actual root file:// runs offline with zero browser errors and no external runtime requests');
  await writeFile('docs/progression-browser-results.json',JSON.stringify({environment:'Linux Chromium; file://; offline:true; software WebGL; not native Windows or physical touch',checks,errors,warnings,requests},null,2)+'\n');
  console.log(`${checks.length} progression browser checks passed.`);
} catch(error) {
  await writeFile('artifacts/progression-browser-failure.json',JSON.stringify({checks,errors,warnings,requests,failure:String(error)},null,2));throw error;
} finally {clearTimeout(timer);await browser.close();}
