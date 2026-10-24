import assert from 'node:assert/strict';
import {build} from 'vite';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchOfflineBrowser} from './helpers/offline-browser.mjs';
const dir='artifacts/layla-skill2-gate';await mkdir(dir,{recursive:true});
const result=await build({configFile:false,logLevel:'silent',assetsInclude:['**/*.glb'],build:{write:false,target:'es2022',assetsInlineLimit:100000000,lib:{entry:resolve('tests/layla-skill2-ui-fixture.js'),name:'GateFixture',formats:['iife']},rollupOptions:{output:{inlineDynamicImports:true}}}});
const js=result[0].output.find(x=>x.type==='chunk').code;
await writeFile(`${dir}/UI-Fixture.html`,`<!doctype html><meta charset="utf-8"><style>button{min-width:140px;min-height:80px;margin:10px}button span{display:block}[hidden]{display:none!important}</style><div id="hud-root"><div class="hero-info"></div><div class="hero-icon"></div><div class="build-note"></div>${['skill-1','skill-2','skill-ultimate','battle-spell'].map(id=>`<button id="${id}"><span class="slot-label"></span></button>`).join('')}</div><canvas></canvas><script>${js.replace(/<\/script/gi,'<\\/script')}</script>`);
const browser=await launchOfflineBrowser(),checks=[],errors=[],requests=[],timer=setTimeout(()=>browser.close(),120000);
const pass=m=>{checks.push(m);console.log('PASS:',m);};
try{
 const c=await browser.newContext({offline:true,viewport:{width:1000,height:700}}),p=await c.newPage();p.setDefaultTimeout(30000);
 p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))requests.push(r.url());});
 await p.goto(pathToFileURL(resolve(`${dir}/UI-Fixture.html`)).href);await p.waitForFunction(()=>window.gateFixture);
 const snap=()=>p.evaluate(()=>gateFixture.snapshot()),button=p.locator('#skill-2');
 const initial=await snap();assert.match(await button.innerText(),/NO TARGET/);
 // aria-disabled marks unavailable skills but native pointer events still reach
 // the production gate; force bypasses only Playwright's actionability filter.
 await button.click({force:true});assert.deepEqual({...await snap(),lastCast:undefined},{...initial,lastCast:undefined});assert.equal((await snap()).lastCast,'no-target');pass('empty-range pointer click creates no cast/animation, mana cost or cooldown; HUD says NO TARGET');
 await button.evaluate(b=>b.click());assert.equal((await snap()).mana,initial.mana);assert.equal((await snap()).pending,0);pass('assistive/native button.click also rejects empty range');
 for(const kind of ['minion','tower']){await p.evaluate(k=>gateFixture.target(k),kind);await button.click({force:true});assert.equal((await snap()).pending,0);assert.deepEqual((await snap()).cooldowns,{});}pass('minion and tower alone remain NO TARGET through actual HUD clicks');
 await p.evaluate(()=>gateFixture.target('hero',20));await button.click({force:true});assert.equal((await snap()).pending,0);pass('out-of-range enemy hero does not activate');
 await p.evaluate(()=>gateFixture.target());assert.doesNotMatch(await button.innerText(),/NO TARGET/);
 const box=await button.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.waitForFunction(()=>Boolean(gateFixture.snapshot().aiming));await p.evaluate(()=>gateFixture.moveOut());await p.mouse.up();assert.equal((await snap()).lastCast,'no-target');assert.equal((await snap()).mana,initial.mana);assert.deepEqual((await snap()).cooldowns,{});pass('hero leaving while holding aim cancels release without mana or cooldown');
 await p.evaluate(()=>gateFixture.target());await button.click();const after=await snap();assert.equal(after.lastCast,'cast');assert.ok(after.mana<initial.mana);assert.ok(after.cooldowns['void-projectile']>0);assert.equal(after.pending,1);pass('valid nearby enemy hero permits the normal pointer cast and charges exactly one pending shot');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('real shared engine/HUD/gestures fixture runs offline without runtime errors or external requests');
 await c.close();
}finally{clearTimeout(timer);await writeFile(`${dir}/browser-results.json`,JSON.stringify({checks,errors,requests,environment:'Linux Chromium offline file://; actual production combat/HUD/gesture modules in isolated test fixture; not physical-device certification'},null,2));await browser.close();}
