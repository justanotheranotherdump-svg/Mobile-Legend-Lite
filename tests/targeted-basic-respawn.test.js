import test from 'node:test';import assert from 'node:assert/strict';
import {loadSourceHeroRegistry} from '../scripts/lib/hero-files.mjs';
import {HeroCombatSimulation} from '../src/simulation/hero-combat.js';
import {MatchSimulation} from '../src/match/simulation.js';
import {createMatchConfig,lane} from '../src/match/config.js';
import {respawnDelay} from '../src/match/respawn.js';
const registry=await loadSourceHeroRegistry();
test('Franco basic publishes approved clip timing and hits exactly once at contact',()=>{
 const s=new HeroCombatSimulation(lane,{player:{heroId:'franco',x:0,z:0},targeting:{defaultMode:'nearest'},dummies:[{id:'target',name:'Target',team:'enemy',x:1.3,z:0,radius:.3,hp:1e5,maxHp:1e5,physicalDefense:0,magicDefense:0}]},registry);
 assert.equal(s.attack('target'),'fired'); const release=s.pending[0].at, hp=s.enemies[0].hp;
 assert.equal(s.heroAction.key,'basicAttack');assert.equal(s.heroAction.release,release);
 s.update(release-.001);assert.equal(s.enemies[0].hp,hp);
 s.update(.002);const after=s.enemies[0].hp;assert.ok(after<hp);assert.equal(s.pending.length,0);
 s.update(.1);assert.equal(s.enemies[0].hp,after);
});
test('Franco interrupted basic clears pose and pending contact, with no late damage',()=>{
 const s=new MatchSimulation(registry,{...createMatchConfig('ai-training'),heroId:'franco'},{username:'Test'});s.phase='running';
 const target=s.bots.find(a=>a.team==='enemy');target.x=s.player.x+1.3;target.z=s.player.z;target.spawnProtectedUntil=0;s.syncEnemies();
 assert.equal(s.attack(target.id),'fired');const hp=target.hp;s.player.stunnedUntil=s.time+2;s.update(.01);
 assert.equal(s.heroAction,null);assert.equal(s.pending.length,0);assert.equal(target.hp,hp);
});
test('respawn preserves previous lane formula and supports separate explicit level pacing',()=>{
 for(const time of [0,59,60,300,900])assert.equal(respawnDelay(lane,time,15),Math.min(45,5+2*Math.floor(time/60)));
 const scenario={respawn:{base:4,perCompletedMinute:1.5,perLevel:.3,cap:45}};
 assert.ok(respawnDelay(scenario,600,15)>respawnDelay(scenario,60,4));
 assert.throws(()=>respawnDelay(scenario,-1));assert.throws(()=>respawnDelay(scenario,1,NaN));
});
test('death snapshots authoritative time; player/bot parity; countdown pauses and reset clears deaths',()=>{
 const s=new MatchSimulation(registry,createMatchConfig('ai-training'),{username:'Test'});s.phase='running';s.time=301;
 const bot=s.bots.find(a=>a.team==='enemy'), ally=s.bots.find(a=>a.team==='player');
 s.player.hp=0;bot.hp=0;s.onDeath(bot,s.player);s.onDeath(ally,bot);
 assert.equal(s.player.respawnDuration,bot.respawnDuration);assert.equal(s.player.respawnDuration,15);
 const deadline=s.player.respawnAt;s.paused=true;s.update(50);assert.equal(s.time,301);assert.equal(s.player.respawnAt,deadline);
 s.paused=false;s.update(.25);assert.equal(s.player.respawnAt,deadline);assert.equal(s.player.respawnAt-s.time,14.75);
 s.reset();assert.ok(!s.player.respawnAt);assert.equal(s.time,0);
});
test('approved Franco GLB blends basic cancellation into locomotion over90ms, without touching skill sampling',async()=>{
 const {createHeroVisual}=await import('../src/rendering/heroes/hero-visual.js');
 const s=new MatchSimulation(registry,{...createMatchConfig('ai-training'),heroId:'franco'},{username:'Test'});
 const v=await createHeroVisual(registry.get('franco'),registry.modelBytes('franco'));
 s.heroAction={key:'basicAttack',start:0,release:.4};s.time=.2;v.drive(s,false);
 const before=new Map();v.root.traverse(b=>{if(b.isBone)before.set(b.name,b.quaternion.clone());});
 s.heroAction=null;s.time=.21;v.drive(s,false);const blended=new Map();v.root.traverse(b=>{if(b.isBone)blended.set(b.name,b.quaternion.clone());});
 const target=await createHeroVisual(registry.get('franco'),registry.modelBytes('franco'));target.sample('idle',.21,false);
 let full=0,partial=0;target.root.traverse(b=>{if(b.isBone){full+=before.get(b.name).angleTo(b.quaternion);partial+=before.get(b.name).angleTo(blended.get(b.name));}});
 assert.ok(full>.1);assert.ok(partial<full*.5,'cancel must interpolate rather than snap directly to idle');
 s.time=.4;v.drive(s,false);assert.equal(v.diagnostics().pose,'idle');
 s.heroAction={key:'skill-1',start:.4,release:.15};s.time=.55;v.drive(s,false);assert.equal(v.diagnostics().pose,'skill-1');
});
