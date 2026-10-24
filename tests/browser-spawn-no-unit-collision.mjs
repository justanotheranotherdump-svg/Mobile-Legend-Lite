import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {launchOfflineBrowser} from './helpers/offline-browser.mjs';
// Build first: node scripts/build-targeted-brawl-fixture.mjs
const browser=await launchOfflineBrowser(),checks=[],errors=[],requests=[];
const timer=setTimeout(()=>browser.close(),120000),pass=m=>{checks.push(m);console.log('PASS:',m);};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
try{
 const c=await browser.newContext({offline:true,viewport:{width:1000,height:650}}),p=await c.newPage();p.setDefaultTimeout(60000);
 p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))requests.push(r.url());});
 await p.goto(pathToFileURL(resolve('artifacts/targeted-brawl/Render.html')).href);await p.waitForFunction(()=>window.brawlFixture);
 for(const kind of ['hero','minion']){
  await p.evaluate(()=>brawlFixture.start('layla'));let s=await p.evaluate(k=>brawlFixture.crossing(k),kind),speed=s.state.player.speed;
  s=await p.evaluate(t=>brawlFixture.walk(t),3/speed);near(s.state.player.x,0);near(s.state.player.z,0);const target=s.state.enemies.find(a=>a.kind===(kind==='hero'?'bot':'minion'));assert.ok(target);near(target.x,0);near(target.z,0);
  await p.screenshot({path:`artifacts/spawn-no-unit-collision/overlapping-${kind}.png`});
  s=await p.evaluate(t=>brawlFixture.walk(t),2/speed);near(s.state.player.x,2);near(s.state.player.z,0);pass(`actual match/approved Layla renderer walks through ${kind} at exact normal speed with no detour or push`);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('offline file:// connected renderer has no runtime errors or external requests');await c.close();
}finally{clearTimeout(timer);await writeFile('artifacts/spawn-no-unit-collision/browser-results.json',JSON.stringify({checks,errors,requests,environment:'Linux Chromium/SwiftShader offline file:// actual MatchSimulation/LaneView/approved GLB; not hardware certification'},null,2));await browser.close();}
