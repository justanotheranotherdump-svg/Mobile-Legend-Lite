import test from 'node:test';import assert from 'node:assert/strict';
import {loadSourceHeroRegistry} from '../scripts/lib/hero-files.mjs';
import {HeroCombatSimulation} from '../src/simulation/hero-combat.js';
import {MatchSimulation} from '../src/match/simulation.js';import {createMatchConfig} from '../src/match/config.js';
import {hookImpact} from '../src/simulation/franco-kit.js';import {learnBotSkills} from '../src/match/hero-bots.js';
const registry=await loadSourceHeroRegistry();
const target=(kind='hero',z=7.5)=>({id:'target',kind,team:'enemy',targetable:true,x:0,z,radius:.45,hp:20000,maxHp:20000,physicalDefense:0,magicDefense:0});
function make(t=target()){const s=new HeroCombatSimulation({halfSize:60,obstacles:[]},{player:{heroId:'franco',x:0,z:0},dummies:[t],targeting:{defaultMode:'nearest'}},registry);s.setPracticeLevel(15);learnBotSkills(s);return s;}
const advance=(s,time)=>{while(s.time+1e-9<time)s.update(Math.min(1/600,time-s.time));};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('extended hook reaches a hero beyond old6.4 range; damage occurs once and position holds before pull',()=>{
 const s=make(),t=s.enemies[0],a=s.ability('skill-1');assert.equal(a.range,8);assert.equal(a.castTime,.15);assert.equal(a.parameters.speed,32);
 assert.equal(s.cast('skill-1',{x:0,z:8}),'cast');advance(s,.4);assert.ok(t.hp<t.maxHp);assert.ok(s.hookPull);const start=s.hookPull.start,damageHp=t.hp;
 assert.equal(s.hookReturn,null);advance(s,start-.001);near(t.z,7.5);assert.ok(t.stunned);assert.equal(t.hp,damageHp);
 advance(s,start+.09);assert.ok(t.z<7.5&&t.z>1.1);advance(s,start+.181);assert.equal(s.hookPull,null);assert.ok(t.z<2);assert.equal(t.hp,damageHp);
});
for(const kind of ['hero','player','bot'])test(`${kind} contact holds exactly0.5s and follows Franco's current location afterward`,()=>{
 const s=make(target(kind,5)),t=s.enemies[0];hookImpact(s,{id:1,x:0,z:5,a:s.ability('skill-1')},t);near(s.hookPull.start,.5);near(s.hookPull.end,.68);
 s.player.x=-2;advance(s,.499);near(t.x,0);near(t.z,5);advance(s,.59);assert.ok(t.x<0);assert.ok(t.z<5);advance(s,.681);assert.equal(s.hookPull,null);assert.ok(Math.hypot(t.x-s.player.x,t.z-s.player.z)<2);
});
for(const kind of ['minion','creep'])test(`${kind} keeps original0.02s contact pause`,()=>{const s=make(target(kind,5));hookImpact(s,{id:1,x:0,z:5,a:s.ability('skill-1')},s.enemies[0]);near(s.hookPull.start,.02);near(s.hookPull.end,.2);});
test('hook cannot catch a hero beyond the new reach',()=>{const s=make(target('hero',8.8));s.cast('skill-1',{x:0,z:20});advance(s,.8);assert.equal(s.enemies[0].hp,20000);assert.equal(s.hookPull,null);});
test('AI Franco uses the same range and hero hold as the player',()=>{
 const s=new MatchSimulation(registry,{...createMatchConfig('custom','normal',2),botHeroIds:{player:['franco'],enemy:['franco','layla']}},{username:'HookTest'});s.phase='running';s.time=12;
 const bot=s.bots.find(a=>a.heroId==='franco'),engine=s.botEngines.get(bot.id),t=s.bots.find(a=>a.team!==bot.team);t.protected=false;t.targetable=true;t.spawnProtectedUntil=0;t.x=bot.x+5;t.z=bot.z;engine.enemies=[t];engine.time=12;
 assert.equal(engine.ability('skill-1').range,8);hookImpact(engine,{id:1,x:t.x,z:t.z,a:engine.ability('skill-1')},t);near(engine.hookPull.start,12.5);near(engine.hookPull.end,12.68);
});
test('Franco death during hero hold cancels pull and releases displacement ownership',()=>{const s=make();const t=s.enemies[0];hookImpact(s,{id:1,x:t.x,z:t.z,a:s.ability('skill-1')},t);s.player.hp=0;s.update(.1);assert.equal(s.hookPull,null);assert.equal(t.displacementBy,undefined);near(t.z,7.5);});
