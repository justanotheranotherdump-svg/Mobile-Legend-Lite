import test from 'node:test';import assert from 'node:assert/strict';
import {loadSourceHeroRegistry} from '../scripts/lib/hero-files.mjs';
import {MatchSimulation} from '../src/match/simulation.js';
import {createMatchConfig} from '../src/match/config.js';
import {inAttackRange} from '../src/simulation/targeting.js';
const registry=await loadSourceHeroRegistry();
for(const mode of ['ai-training','vs-ai','brawl','custom'])for(const heroId of ['layla','franco'])test(`${mode} ${heroId} approaches, damages and clears a destroyed tower`,()=>{
 const s=new MatchSimulation(registry,{...createMatchConfig(mode),heroId},{username:'Tester'});s.phase='running';s.bots=[];
 const t=s.structures.find(a=>a.id==='enemy-0');s.player.x=t.x-8;s.player.z=0;t.damage=0;
 assert.equal(s.requestAttack(t.id),'approaching');
 for(let i=0;i<600&&t.hp===t.maxHp;i++)s.update(1/60);
 assert.ok(t.hp<t.maxHp,`tower untouched: ${s.player.x}, ${s.lastAttack.reason}, ${s.attackCommand?.targetId}`);
 assert.ok(inAttackRange(s.player,t));assert.ok(Math.hypot(s.player.x-t.x,s.player.z-t.z)>=s.player.radius+t.radius-.003);
 s.deal(s.player,t,1e8,'true');s.update(1/60);assert.notEqual(s.selectedTargetId,t.id);
 assert.equal(s.attack(t.id),'invalid-target');
 assert.equal(s.attack('player-0'),'invalid-target');assert.equal(s.attack('enemy-1'),'range');
});

// Real picker implementation, deterministic intersection order without a GPU.
test('ray selection skips allied, dead, protected and ancestor-hidden foreground meshes', async()=>{
 const {WorldView}=await import('../src/rendering/world.js');
 const actors=[{id:'allied',team:'player',hp:100,maxHp:100,x:0,z:0},{id:'dead',team:'enemy',hp:0,maxHp:100,x:0,z:0},{id:'protected',team:'enemy',hp:100,maxHp:100,x:0,z:0,protected:true},{id:'hidden',team:'enemy',hp:100,maxHp:100,x:0,z:0},{id:'tower',team:'enemy',kind:'tower',hp:100,maxHp:100,x:0,z:0}];
 const hits=actors.map(a=>({object:{isMesh:true,visible:true,userData:{},parent:{visible:a.id!=='hidden',userData:{enemyId:a.id}}}}));
 const view={scene:{updateMatrixWorld(){}},raycaster:{setFromCamera(){},intersectObjects(){return hits;}},camera:{},dummies:new Map(),lastState:{player:{team:'player'},enemies:actors}};
 assert.equal(WorldView.prototype.pickTarget.call(view,{}),'tower');
});
