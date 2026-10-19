import assert from 'node:assert/strict';import {resolve}from'node:path';import{pathToFileURL}from'node:url';import{writeFile,mkdir}from'node:fs/promises';import{launchOfflineBrowser}from'./helpers/offline-browser.mjs';
const browser=await launchOfflineBrowser(),p=await browser.newPage({viewport:{width:840,height:600}}),errors=[],requests=[],checks=[];p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))requests.push(r.url());});const timer=setTimeout(()=>browser.close(),300000);p.setDefaultTimeout(60000);
try{
 await p.goto(pathToFileURL(resolve('artifacts/two-heroes/Render-Fixture.html')).href);await p.waitForFunction(()=>window.integrationFixture);
 for(const [x,z]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
  const d=Math.hypot(x,z),dx=x/d,dz=z/d,center={x:7,z:-11};
  const point=(n,side=0)=>({x:center.x+dx*n+dz*side,z:center.z+dz*n-dx*side});
  await p.evaluate(async({targets,center})=>integrationFixture.start('layla',targets,center),{targets:[{id:'near',...point(4)},{id:'mid',...point(24)},{id:'far',...point(46)},{id:'off',...point(24,3)}],center});
  assert.equal(await p.evaluate(({x,z})=>integrationFixture.cast('skill-ultimate',x,z),point(48)),'cast');
  const s=await p.evaluate(()=>integrationFixture.advanceTo(.66)),probe=await p.evaluate(()=>integrationFixture.beamProbe());
  assert.ok(s.enemies.slice(0,3).every(t=>t.hp<20000));assert.equal(s.enemies[3].hp,20000);
  assert.ok(Math.abs(probe.shot.beamEnd[0]-point(48).x)<1e-6);assert.ok(Math.abs(probe.shot.beamEnd[2]-point(48).z)<1e-6);assert.ok(probe.samples.filter(v=>v.brightness>145).length>=8,JSON.stringify(probe));
  checks.push({direction:[x,z],end:probe.shot.beamEnd,samples:probe.samples});console.log('PASS: actual approved Layla beam, aimed damage and framebuffer agree for',x,z);
  if(x===1&&z===0)await p.screenshot({path:'artifacts/current-fixes/ultimate-east.png'});
  if(x===-1&&z===-1)await p.screenshot({path:'artifacts/current-fixes/ultimate-diagonal.png'});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);await mkdir('artifacts/current-fixes',{recursive:true});await writeFile('artifacts/current-fixes/aim-browser.json',JSON.stringify({passed:checks.length,checks,errors,requests,environment:'Linux Chromium SwiftShader, not native hardware certification'},null,2)+'\n');
}finally{clearTimeout(timer);await browser.close();}
