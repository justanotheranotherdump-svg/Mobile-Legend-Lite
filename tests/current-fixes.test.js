import {isBootItem} from "../src/match/catalog.js";
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {loadSourceHeroRegistry} from '../scripts/lib/hero-files.mjs';
import {HeroCombatSimulation} from '../src/simulation/hero-combat.js';
import {learnBotSkills} from '../src/match/hero-bots.js';
import {ApprovedCombatVfx} from '../src/rendering/approved-combat-vfx.js';
import {items,purchaseQuote,recipeQuote,getItem,priorityStep} from '../src/match/recipes.js';
import {inventoryBonuses,sell} from '../src/match/equipment.js';
import {BuildStore,validBuild} from '../src/player/builds.js';
import {BuildPriority} from '../src/match/build-priority.js';
import {MatchFlow} from '../src/menu/match-flow.js';
const registry=await loadSourceHeroRegistry(), blank=()=>Array(6).fill(null);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
let fx;
for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])test(`aimed ultimate ${dx},${dz}: real damage event, mesh and endpoint share world direction`,()=>{
 const n=Math.hypot(dx,dz),d={x:dx/n,z:dz/n},center={x:7,z:-11};
 const target=(id,dist,side=0)=>({id,kind:'hero',team:'enemy',targetable:true,radius:.4,hp:20000,maxHp:20000,physicalDefense:0,magicDefense:0,x:center.x+d.x*dist+d.z*side,z:center.z+d.z*dist-d.x*side});
 const s=new HeroCombatSimulation({halfSize:80,obstacles:[]},{player:{heroId:'layla',...center},targeting:{defaultMode:'nearest'},dummies:[target('near',4),target('mid',24),target('far',46),target('off',24,3)]},registry);s.setPracticeLevel(15);learnBotSkills(s);
 let beam; s.events.subscribe(e=>{if(e.type==='beam')beam=e;});
 if(!fx)fx=new ApprovedCombatVfx(new T.Scene(),s,{});else{fx.clear();fx.unsubscribe();fx.simulation=s;fx.unsubscribe=s.events.subscribe(e=>fx.event(e));}
 // First instance subscribes in constructor, subsequent ones subscribe above.
 const end={x:center.x+d.x*48,z:center.z+d.z*48};
 assert.equal(s.cast('skill-ultimate',end),'cast');
 for(let i=0;i<396;i++)s.update(1/600);
 assert.equal(beam.effect,'line-blast');near(beam.end.x,end.x);near(beam.end.z,end.z);
 assert.ok(s.enemies.slice(0,3).every(e=>e.hp<20000));assert.equal(s.enemies[3].hp,20000);
 fx.view={heroVisual:{muzzlePosition:()=>new T.Vector3(beam.source.x,beam.source.y,beam.source.z)}};fx.update();
 const shot=fx.last.shots.find(s=>s.key==='ult');assert.ok(shot);near(shot.beamEnd[0],end.x);near(shot.beamEnd[2],end.z);
 const mesh=fx.energy.root.children.find(o=>o.visible&&o.userData.flow);assert.ok(mesh);fx.scene.updateMatrixWorld(true);
 const a=mesh.localToWorld(new T.Vector3(0,0,-.5)),b=mesh.localToWorld(new T.Vector3(0,0,.5));near(a.x,beam.source.x);near(a.z,beam.source.z);near(b.x,end.x);near(b.z,end.z);
 const hp=s.enemies.map(e=>e.hp);for(let i=0;i<600;i++)s.update(1/600);assert.deepEqual(s.enemies.map(e=>e.hp),hp);
});
for(const item of items.filter(i=>i.type!=='consumable'))test(`repeat equipment: ${item.id}, paid copies or one pair only`,()=>{
 let gold=100000,inv=blank();
 for(let count=1;count<=6;count++){
  const before=[...inv],q=purchaseQuote(gold,inv,item.id);
  if(isBootItem(item)&&count>1){assert.equal(q.error,'one-boots-only');assert.deepEqual(inv,before);break;}
  assert.equal(q.error,undefined);assert.equal(q.remaining,item.cost);assert.equal(q.gold,gold-item.cost);assert.equal(q.inventory.filter(id=>id===item.id).length,count);
  gold=q.gold;inv=q.inventory;
  const bonus=inventoryBonuses(inv);for(const [key,value]of Object.entries(item.modifiers.flat))near(bonus.modifiers.flat[key],value*count);
 }
 if(!isBootItem(item))assert.equal(purchaseQuote(gold,inv,item.id).error,'equipment-full');
 const refund=sell(gold,inv,0);assert.equal(refund.gold,gold+Math.floor(item.cost*.6));assert.equal(refund.inventory.filter(Boolean).length,inv.filter(Boolean).length-1);
});
test('different boots rejected, legitimate boots component upgrade allowed, no double-credit',()=>{
 for(const [a,b]of [['boots','basic-boots'],['basic-boots','boots'],['boots','swift-boots']]){const inv=[a,null,null,null,null,null];assert.equal(purchaseQuote(9999,inv,b).error,'one-boots-only');assert.deepEqual(inv,[a,null,null,null,null,null]);}
 const boots=purchaseQuote(9999,blank(),'basic-boots');assert.equal(purchaseQuote(boots.gold,boots.inventory,'tough-boots').error,undefined); // upgrades consume base boots
 const upgraded=purchaseQuote(boots.gold,boots.inventory,'tough-boots');assert.equal(upgraded.inventory.filter(Boolean).length,1);assert.equal(purchaseQuote(9999,upgraded.inventory,'swift-boots').error,'one-boots-only');
 const inv=['blade-of-despair','legion-sword','legion-sword',null,null,null],q=recipeQuote('blade-of-despair',inv);assert.equal(q.consumed.length,2);assert.ok(!q.consumed.includes(0));assert.equal(q.credit,2*getItem('legion-sword').cost);
});
test('repeat builds persist, advance per purchased copy, never complete two steps from one copy',()=>{
 const seq=['haas-claws','haas-claws','wind-of-nature','winter-crown'];assert.equal(validBuild(seq),true);assert.equal(validBuild(['swift-boots','swift-boots']),false);
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};const store=new BuildStore(storage,'Duplicate_Test');assert.equal(store.saveBuild('layla',{name:'Twins',items:seq}),'ok');assert.deepEqual(new BuildStore(storage,'Duplicate_Test').selected('layla').items,seq);
 const b=new BuildPriority(seq),inv=blank();assert.equal(b.refresh(inv),'haas-claws');inv[0]='haas-claws';assert.equal(b.refresh(inv),'haas-claws');assert.equal(b.refresh(inv),'haas-claws');assert.equal(priorityStep(9999,inv,'haas-claws').completed,undefined);inv[1]='haas-claws';assert.equal(b.refresh(inv),'wind-of-nature');inv[0]=null;inv[1]=null;assert.equal(b.refresh(inv),'wind-of-nature');
});
test('owned-only human draft, Shop ownership expansion, null clear and AI global availability stay separate',()=>{
 const f=new MatchFlow();f.startSelection();assert.deepEqual(f.selectableHeroes(),['layla']);assert.throws(()=>f.selectHero('franco'),/Unowned/);assert.equal(f.heroId,null);assert.equal(f.config.heroId,null);f.selectHero('layla');f.selectHero(null);assert.equal(f.heroId,null);assert.ok(f.availableHeroes.includes('franco'));f.ownedHeroes.push('franco');assert.deepEqual(f.selectableHeroes(),['layla','franco']);f.selectHero('franco');assert.equal(f.confirm({username:'Owner'}).heroId,'franco');
});
