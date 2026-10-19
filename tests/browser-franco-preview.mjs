import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchOfflineBrowser} from './helpers/offline-browser.mjs';
import {TIMING,MODES} from '../previews/franco/sequence.js';
const browser=await launchOfflineBrowser(),checks=[],errors=[],warnings=[],requests=[];
const H=TIMING.hook,S=TIMING.slam,U=TIMING.hunt;
await mkdir('artifacts/franco',{recursive:true});
try {
 const c=await browser.newContext({offline:true,viewport:{width:1440,height:1000}}),p=await c.newPage();
 p.setDefaultTimeout(60000);
 p.on('pageerror',e=>errors.push(String(e)));
 p.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text())});
 p.on('request',r=>{if(r.resourceType()!=='document'&&!/^(data:|blob:)/.test(r.url()))requests.push(r.url())});
 const entry=process.env.FRANCO_ENTRY||'previews/franco/Franco-Animation-Preview.html';
 await p.goto(pathToFileURL(resolve(entry)).href);
 await p.waitForFunction(()=>window.francoPreviewDiagnostics?.snapshot().ready);
 const snap=()=>p.evaluate(()=>window.francoPreviewDiagnostics.snapshot());
 const choose=id=>p.locator(`[data-mode=${id}]`).click();
 const seek=t=>p.locator('#timeline').fill(String(Number(Number(t).toFixed(2))));
 const shot=options=>process.env.FRANCO_SKIP_SCREENSHOTS==='1'?Promise.resolve():p.screenshot(options);
 const pass=text=>{checks.push(text);console.log('PASS: '+text)};
 const initial=await snap();
 assert.ok(initial.skinnedMeshes>0);assert.ok(initial.bones>=17);assert.equal(initial.clips.length,11);
 assert.equal(initial.gameIntegration,false);assert.equal(initial.timingRevision,'plan-b-r5');
 pass('Actual local skinned GLB and all 11 retimed clips load offline; no gameplay integration');
 await shot({path:'artifacts/franco/game-idle.png'});
 await p.locator('[data-camera=close]').click();await shot({path:'artifacts/franco/close-idle.png'});
 for(const [mode,t] of [['hook',H.maxArrival],['hit',.49],['miss',H.maxArrival],['slam',.30],['hunt',.78]]) {
  await choose(mode);await seek(t);await p.locator('[data-camera=game]').click();
  await shot({path:`artifacts/franco/${mode}.png`});const s=await snap();
  assert.equal(s.mode,mode);assert.ok(s.chainLinks>=2);
  pass(mode+' actual retimed rig/weapon/effect sequence is individually selectable and scrubbable');
 }
 await p.locator('#speed').selectOption('0.25');
 await choose('hook');await seek(.14);assert.equal((await snap()).travelChainVisible,false);
 await seek(.15);assert.equal((await snap()).travelChainVisible,true);
 assert.equal((await snap()).sequence.phase,'Outbound chain');
 await seek(H.maxArrival);assert.ok(Math.abs((await snap()).hookPosition[2]-6.4)<.001);
 await choose('slam');await seek(.29);assert.equal((await snap()).sequence.phase,'Fast wind-up');
 await seek(.30);assert.equal((await snap()).sequence.phase,'Impact / movement unlocked');
 pass('Hook launches at 0.15 s and reaches maximum at 0.40 s; Fury Shock impacts at 0.30 s');
 await choose('hunt');assert.equal((await snap()).sequence.suppressed,true);
 await seek(1.79);assert.equal((await snap()).sequence.count,6);assert.equal((await snap()).sequence.suppressed,true);
 await seek(1.80);assert.equal((await snap()).sequence.suppressed,false);
 await seek(1.80);assert.equal((await snap()).sequence.count,6);
 pass('Immediate restraint begins at activation, spans exactly 1.8 seconds, contains six strikes and releases cleanly');
 await choose('hit');await seek(H.hitArrival);const far=(await snap()).dummy[2];
 await seek(H.pullEnd);assert.ok((await snap()).dummy[2]<far-3);
 await choose('miss');await seek(H.emptyReturnEnd);assert.equal((await snap()).dummy[2],5.8);
 assert.equal((await snap()).dummy[0],1.2);assert.equal((await snap()).restraintVisible,false);
 await choose('hit');await seek(.39);assert.ok(Math.abs((await snap()).dummy[2]-5.8)<.001);await seek(.49);assert.ok(Math.abs((await snap()).dummy[2]-3.675)<.002);await seek(.58);assert.ok(Math.abs((await snap()).dummy[2]-1.55)<.001);
 pass('Faster 0.18-second target pull has smooth midpoint and exact final stop; no target teleport');
 pass('Retimed hit hauls target to its close stop; off-axis miss never moves or restrains it');
 for(const [mode,end]of[['hit',H.hitReturnEnd],['miss',H.emptyReturnEnd]]){
  await choose(mode);for(const t of[H.cast,H.hitArrival,end-.01,end,end+.01]){
   await seek(Math.min(t,MODES.find(m=>m.id===mode).duration));assert.equal((await snap()).feedChainVisible,true);
   assert.equal((await snap()).travelChainVisible,t<end);
  }
 }
 pass('Belt-to-hand linked chain stays connected during cast, flight, return and held-weapon handoff');
 await choose('slam');await seek(.30);assert.equal((await snap()).areaVisible,true);
 assert.equal((await snap()).proposedSlamRadius,3.2);await p.locator('#guides').uncheck();
 assert.equal((await snap()).areaVisible,false);await p.locator('#guides').check();
 pass('Proposed radius guide remains separate from decorative shockwave and is toggleable');
 await choose('hook');await p.locator('#speed').selectOption('0.25');await p.locator('#play').click();
 await p.waitForFunction(()=>window.francoPreviewDiagnostics.snapshot().time>.1);
 await p.locator('#play').click();const time=(await snap()).time;await p.waitForTimeout(250);
 assert.equal((await snap()).time,time);await p.locator('#restart').click();assert.equal((await snap()).time,0);
 pass('Native play/pause/restart and slow motion operate the actual sequence clock');
 for(const id of['idle','walk','run','attack','react','death','combo']){
  await choose(id);await seek(Math.min(.3,MODES.find(m=>m.id===id).duration));assert.equal((await snap()).mode,id);
 }
 pass('Locomotion, sharper basic attack, reaction, death and revised transition reel remain inspectable');
 for(const camera of['front','side','back','close','game'])await p.locator(`[data-camera=${camera}]`).click();
 await p.mouse.move(900,450);await p.mouse.down();await p.mouse.move(980,470,{steps:8});await p.mouse.up();await p.mouse.wheel(0,-120);
 pass('Five camera presets, native orbit drag and wheel zoom work');
 await choose('hook');await seek(.2);const pose=(await snap()).pose;
 await seek(H.emptyDuration);await seek(.2);assert.deepEqual((await snap()).pose,pose);
 await seek(H.cast);assert.notDeepEqual((await snap()).pose['hand.R'].position,pose['hand.R'].position);
 pass('Retimed skeletal pose changes and backward scrubbing after completion restores the same authored pose');
 await choose('hunt');
 for(const [i,t]of U.strikes.entries()){
  await seek(t-.1);const before=(await snap()).pose['hand.R'].position;await seek(t);const after=await snap();
  assert.equal(after.sequence.count,i+1);
  assert.ok(Math.hypot(...after.pose['hand.R'].position.map((v,i)=>v-before[i]))>.15);
 }
 pass('Each of six retimed impact markers accompanies a genuine authored hand strike, not only a counter');
 await choose('slam');await seek(.3);const slamEnd=(await snap()).pose;await choose('combo');await seek(TIMING.combo.slamEnd);assert.deepEqual((await snap()).pose.chest.quaternion,slamEnd.chest.quaternion);
 pass('Revised reel boundaries preserve neutral rig pose and target location without a position jump');
 for(const id of['hook','hit','miss','slam','hunt','walk','run','attack','death']){
  await choose(id);const d=MODES.find(m=>m.id===id).duration;
  for(const t of[.3,Math.min(.7,d)]){await seek(t);const y=(await snap()).boundsMin[1];assert.ok(y>=-.015,id+' intersects floor: '+y)}
 }
 pass('Actual deformed bounds remain above floor tolerance in sampled retimed skills, locomotion and falling poses');
 await choose('death');await seek(2);assert.ok((await snap()).boundsMin[1]>=-.015);
 await p.locator('[data-camera=close]').click();await shot({path:'artifacts/franco/death.png'});
 await choose('idle');await p.locator('#speed').selectOption('1');await p.locator('#play').click();
 const mark=()=>p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(now=>resolve({now,time:window.francoPreviewDiagnostics.snapshot().time}))));
 const a=await mark();await p.waitForTimeout(400);const b=await mark();
 assert.ok(Math.abs((b.time-a.time)-(b.now-a.now)/1000)<.035,'1× playback diverges from actual elapsed time');
 await p.locator('#play').click();
 pass('1× actual animation time tracks elapsed browser wall time, including slower rendered frames');
 await choose('idle');await p.locator('#loop').check();await seek(1.99);await p.locator('#play').click();
 await p.waitForFunction(()=>{const s=window.francoPreviewDiagnostics.snapshot();return s.playing&&s.time<.5});
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden});
 assert.equal((await snap()).playing,false);await p.locator('#loop').uncheck();
 pass('Loop resets and the synthetic hidden-document event path pauses playback');
 await p.setViewportSize({width:390,height:844});await p.locator('[data-camera=game]').click();await choose('hit');await seek(H.hitArrival);
 await shot({path:'artifacts/franco/mobile-layout.png'});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 pass('390-pixel responsive inspection layout has no horizontal overflow (emulated device)');
 await p.setViewportSize({width:1440,height:1000});
 await p.locator('#speed').selectOption('0.1');
 await choose('hook');await seek(.14);await p.locator('#move-now').click();assert.equal((await snap()).demo.moveAt,null);
 await seek(.18);const beforeHook=(await snap()).hookPosition;await p.locator('#move-now').click();await p.waitForFunction(()=>window.francoPreviewDiagnostics.snapshot().demo.position>.1);await p.locator('#play').click();assert.ok((await snap()).demo.position>0);assert.equal((await snap()).travelChainVisible,true);assert.notDeepEqual((await snap()).hookPosition,beforeHook);
 pass('Hook movement unlocks after 0.15 s while the independent connected projectile keeps travelling');
 await choose('hit');await seek(.18);await p.locator('#followup').click();await p.waitForFunction(()=>window.francoPreviewDiagnostics.snapshot().time>.22);await p.locator('#play').click();assert.equal((await snap()).renderedClip,'FuryShock');assert.equal((await snap()).travelChainVisible,true);
 pass('Follow-up slam can animate after hook cast without waiting for hook flight/pull cleanup');
 await choose('attack');await seek(.41);assert.equal((await snap()).demo.hits,1);const ready=(await snap()).demo.readyAt;await p.locator('#move-now').click();await p.locator('#play').click();await p.locator('#attack-again').click();assert.equal((await snap()).demo.hits,1);assert.equal((await snap()).demo.readyAt,ready);assert.equal((await snap()).demo.cancelled,true);
 await choose('attack');await seek(.2);await p.locator('#move-now').click();await p.waitForFunction(()=>window.francoPreviewDiagnostics.snapshot().time>.5);await p.locator('#play').click();assert.equal((await snap()).demo.hits,0);
 pass('Walking aborts pre-hit wind-up without a hit; after-hit walking keeps one hit and preserves cooldown');
 await choose('attack');await seek(.41);await p.locator('#followup').click();await p.waitForFunction(()=>window.francoPreviewDiagnostics.snapshot().time>.5);await p.locator('#play').click();assert.equal((await snap()).renderedClip,'FuryShock');assert.equal((await snap()).demo.hits,1);assert.equal((await snap()).demo.readyAt,1/1.03);pass('Next-skill input cancels basic backswing while preserving its single hit and original attack cooldown');
 await p.locator('#attack-speed').selectOption('2.06');await seek(.21);assert.equal((await snap()).demo.hits,1);assert.equal((await snap()).demo.timing.windup,.2);
 pass('Effective attack speed doubles correctly: 0.40 s contact becomes 0.20 s, with an independently scaled cooldown');
 await choose('hunt');await seek(.9);await p.locator('#move-now').click();assert.equal((await snap()).demo.moveAt,null);assert.equal((await snap()).sequence.suppressed,true);await seek(1.8);await p.locator('#move-now').click();assert.notEqual((await snap()).demo.moveAt,null);await p.locator('#play').click();
 pass('Walk input cannot bypass the 1.80-second ultimate channel; movement is allowed exactly at its end');
 await p.locator('#speed').selectOption('0.1');
 await choose('hit');await seek(.37);await p.locator('#flicker-now').click();assert.equal((await snap()).demo.flickerAt,undefined);
 await seek(.39);await p.locator('#flicker-now').click();await p.locator('#play').click();let f=await snap();assert.equal(f.casterPosition[2],-2.2);const at=f.demo.flickerAt;await p.locator('#flicker-now').click();assert.equal((await snap()).demo.flickerAt,at);
 pass('Manual catch → backward Flicker rejects early input, teleports caster 2.2 units and cannot repeat');
 await p.locator('#flicker-reel').click();await p.locator('#play').click();await seek(.38);assert.equal((await snap()).casterPosition[2],0);const pre=(await snap()).dummy[2];await seek(.39);assert.equal((await snap()).casterPosition[2],-2.2);assert.equal((await snap()).dummy[2],pre);await seek(.49);const mid=(await snap()).dummy[2];await seek(.58);f=await snap();assert.ok(mid<5.8&&mid>-.65);assert.ok(Math.abs(f.dummy[2]+.65)<.001);assert.ok(Math.abs(f.dummy[2]-f.casterPosition[2]-1.55)<.001);assert.equal(f.travelChainVisible,true);assert.equal(f.hookReach,6.4);
 pass('Scripted Flicker combo preserves catch, smoothly hauls to new caster endpoint and leaves raw hook range unchanged');
 await seek(.66);assert.equal((await snap()).travelChainVisible,false);await p.locator('#restart').click();assert.equal((await snap()).casterPosition[2],0);await choose('miss');await seek(.4);await p.locator('#flicker-now').click();assert.equal((await snap()).casterPosition[2],0);
 pass('Flicker return completes at displaced caster; restart restores origin and a miss cannot trigger caught-hook Flicker');
 await choose('hook');await seek(.14);assert.equal((await snap()).travelChainVisible,false);await seek(.15);assert.equal((await snap()).travelChainVisible,true);assert.ok(Math.abs((await snap()).clipDuration-.15)<.00001);await seek(.4);f=await snap();assert.ok(Math.abs(f.hookPosition[2]-6.4)<.001);assert.equal(f.hookScale,1.5);assert.equal(await p.locator('#cast-progress').getAttribute('max'),'0.15');
 pass('Plan B has actual exported .15-second cast and .40-second input-to-max with 1.5× visible hook, not larger range');
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);assert.deepEqual(requests,[]);
 await writeFile(process.env.FRANCO_RESULT||'previews/franco/browser-results.json',JSON.stringify({revision:TIMING.revision,checks,errors,warnings,requests,entry,environment:'Linux Chromium software WebGL2, offline file://; no physical-device, Windows or hardware-GPU certification.'},null,2)+'\n');
} finally {await browser.close()}
