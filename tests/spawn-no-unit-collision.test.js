import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSourceHeroRegistry} from '../scripts/lib/hero-files.mjs';
import {MatchSimulation} from '../src/match/simulation.js';
import {createMatchConfig} from '../src/match/config.js';
import {moveEntity,separateLivingUnits} from '../src/simulation/movement.js';
const registry=await loadSourceHeroRegistry();
const make=(mode='brawl')=>{const s=new MatchSimulation(registry,createMatchConfig(mode,'normal',2),{username:'Spawn_Test'});s.phase='running';return s;};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const mode of ['brawl','vs-ai'])test(`${mode}: real human and AI movement crosses living units at normal speed`,()=>{
 const s=make(mode);s.arena={halfSize:60,obstacles:[],unitCollision:true};s.structures=[];
 Object.assign(s.player,{x:-3,z:0});const bot=s.bots[0];Object.assign(bot,{x:0,z:0});s.minions=[{id:'minion',kind:'minion',team:'enemy',x:0,z:0,hp:100,radius:.35,speed:3}];
 const speed=s.player.speed;moveEntity(s.player,{x:1,z:0},3/speed,s.arena,s.actors);near(s.player.x,0);near(s.player.z,0);separateLivingUnits(s.actors,s.arena);near(s.player.x,0);near(bot.x,0);near(s.minions[0].x,0);
 // NPC and player call the same movement function. A normal NPC move isn't blocked by a minion.
 const minion=s.minions[0];s.moveNpc(minion,3,0,.5);near(minion.x,1.5);near(minion.z,0);
});
test('Brawl AI never auto-launches Cloud initially or after a real respawn',()=>{
 const s=make(),a=s.bots[0],intent={type:'move',x:0,z:0};
 for(let i=0;i<30;i++){s.time=i/10;assert.equal(s.brawl.botIntent(a,intent),intent);assert.equal(a.brawlTravel,null);assert.equal(a.cloudReadyAt,0);assert.equal(a.channeling,false);}
 a.hp=0;a.respawnAt=s.time;s.tickHeroes(0);assert.equal(a.hp,a.maxHp);assert.equal(a.brawlTravel,null);
 for(let i=0;i<10;i++){s.time+=.1;s.brawl.botIntent(a,intent);assert.equal(a.brawlTravel,null);assert.equal(a.cloudReadyAt,0);}
});
test('initial Brawl simulation has no automatic travel or faster-than-stat spawn movement',()=>{
 const s=make();let clouds=0;const emit=s.emit.bind(s);s.emit=(type,data)=>{if(type==='brawl-cloud')clouds++;emit(type,data);};
 for(let i=0;i<120;i++){
  const before=s.bots.map(a=>({x:a.x,z:a.z,speed:a.speed}));s.update(1/60);
  for(const [j,a] of s.bots.entries()){assert.equal(a.brawlTravel,null);assert.ok(Math.hypot(a.x-before[j].x,a.z-before[j].z)<=Math.max(a.speed,before[j].speed)/60+1e-7);}
 }
 assert.equal(clouds,0);
});
test('explicit Cloud action still works and normal movement stats are not retuned',()=>{
 const s=make(),p=s.player,speed=p.speed;assert.equal(s.brawl.useCloud(),'launched');assert.equal(p.brawlTravel.kind,'cloud');s.time+=.1;s.brawl.tick(.1);assert.ok(p.x>s.scenario.spawn.player.x);near(p.speed,speed);
});
test('overlapping hero/minion bodies do not disable skill hit detection or damage',()=>{
 const s=make();s.time=10;s.arena={halfSize:60,obstacles:[]};s.structures=[];const a=s.bots.find(a=>a.team==='enemy');
 Object.assign(s.player,{x:0,z:0});Object.assign(a,{x:0,z:0,protected:false,targetable:true,spawnProtectedUntil:0});s.upgradeSkill('skill-2');s.syncEnemies();const hp=a.hp;
 assert.equal(s.cast('skill-2',{x:0,z:5}),'cast');for(let i=0;i<60;i++)s.update(1/60);assert.ok(a.hp<hp,'Void Projectile still hits an overlapping target');
});
