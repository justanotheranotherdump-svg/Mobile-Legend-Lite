import test from 'node:test';
import assert from 'node:assert/strict';
import {moveEntity,separateLivingUnits,overlapsBox} from '../src/simulation/movement.js';
const arena={halfSize:40,obstacles:[],unitCollision:true};
const body=(id,kind,team,x,z=0)=>({id,kind,team,x,z,hp:100,radius:kind==='minion'?.35:.6,speed:4});
for(const kinds of [['player','bot'],['player','minion'],['minion','minion']]) for(const allied of [false,true])
test(`living ${kinds.join('/')} ${allied?'allied':'opposing'} contacts pass straight through without blocking or pushing`,()=>{
 const a=body('a',kinds[0],'player',-3), b=body('b',kinds[1],allied?'player':'enemy',0);
 for(let i=0;i<60;i++){moveEntity(a,{x:1,z:0},1/60,arena,[a,b]);separateLivingUnits([a,b],arena);assert.ok(Math.abs(a.x-(-3+(i+1)/15))<1e-8);assert.equal(a.z,0);assert.equal(b.x,0);assert.equal(b.z,0);}
 assert.ok(Math.abs(a.x-1)<1e-8);
});
test('dead and living units never block, including at low frame rates',()=>{
 const a=body('a','player','player',-3),b=body('b','minion','enemy',0);b.hp=0;
 moveEntity(a,{x:1,z:0},2,arena,[a,b]); assert.ok(Math.abs(a.x-5)<1e-8);
 a.x=-3;b.hp=100;moveEntity(a,{x:1,z:0},2,{...arena,unitCollision:false},[a,b]);assert.ok(Math.abs(a.x-5)<1e-8);
 a.x=-3;b.kind='tower';moveEntity(a,{x:1,z:0},2,{...arena,unitCollision:false},[a,b]);assert.ok(a.x<-.9,'solid structures still block at low frame rates');
});
test('spawn overlaps do not push units; structures stay fixed and walls remain solid',()=>{
 const a=body('a','player','player',0),b=body('b','minion','enemy',0),tower={...body('tower','tower','enemy',2),radius:1};
 for(let i=0;i<8;i++)separateLivingUnits([a,b,tower],arena);
 assert.equal(a.x,0);assert.equal(a.z,0);assert.equal(b.x,0);assert.equal(b.z,0);assert.equal(tower.x,2);assert.equal(tower.z,0);
 const world={...arena,obstacles:[{x:-2,z:0,width:1,depth:4}]};
 moveEntity(a,{x:-1,z:0},2,world,[tower]);assert.ok(!overlapsBox(a.x,a.z,a.radius,world.obstacles[0]));
});
test('a compact allied six-minion wave is not an immovable wall for a controlled hero',()=>{
 const hero=body('hero','player','player',-4),wave=Array.from({length:6},(_,i)=>body('minion'+i,'minion','player',i%2*.7,(Math.floor(i/2)-1)*.75));
 for(let i=0;i<240;i++){moveEntity(hero,{x:1,z:0},1/60,arena,[hero,...wave]);separateLivingUnits([hero,...wave],arena);}
 assert.ok(Math.abs(hero.x-12)<1e-8);assert.equal(hero.z,0);for(const [i,a] of wave.entries()){assert.equal(a.x,i%2*.7);assert.equal(a.z,(Math.floor(i/2)-1)*.75);}
});
