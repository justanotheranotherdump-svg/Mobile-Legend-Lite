import test from 'node:test';import assert from 'node:assert/strict';
import {loadSourceHeroRegistry} from '../scripts/lib/hero-files.mjs';import {MatchSimulation} from '../src/match/simulation.js';import {createMatchConfig,lane} from '../src/match/config.js';import {respawnDelay} from '../src/match/respawn.js';import {healActor} from '../src/simulation/status.js';import {validTarget} from '../src/match/actions.js';import {overlapsBox} from '../src/simulation/movement.js';
const registry=await loadSourceHeroRegistry();
function make(){const s=new MatchSimulation(registry,createMatchConfig('brawl','normal',1),{username:'Test'});s.phase='running';s.bots.forEach(a=>{a.protected=false;a.spawnProtectedUntil=0;});s.player.protected=false;s.player.spawnProtectedUntil=0;return s;}
function isolated(){const s=make();s.bots=[];return s;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('Brawl owns separate mirrored map, economy, spell, restrictions and configurable respawn',()=>{
 const s=make();assert.equal(s.progression.level,4);assert.equal(s.gold,2500);assert.equal(s.scenario.objectives.length,6);assert.equal(s.spells.id,'flicker');assert.equal(s.spells.readyAt,60);assert.equal(s.useUtility('recall'),'mode-unavailable');assert.equal(s.roleEquipment.setup.kind,'none');
 assert.ok(respawnDelay(s.scenario,600,15)>respawnDelay(s.scenario,60,4));assert.notDeepEqual(s.scenario.respawn,lane.respawn);
 for(const box of s.scenario.obstacles)assert.ok(s.scenario.obstacles.some(b=>Math.abs(b.x+box.x)<1e-7&&Math.abs(b.z+box.z)<1e-7));
 for(const p of [...s.brawl.runes,...s.brawl.barrels,...s.brawl.crabs])assert.ok(!s.arena.obstacles.some(b=>overlapsBox(p.x,p.z,s.player.radius,b)),p.id+' must be reachable');
 const normal=new MatchSimulation(registry,createMatchConfig('vs-ai'),{username:'Test'});assert.equal(normal.brawl,null);assert.equal(normal.spells.id,'execute');assert.deepEqual(normal.scenario.respawn,lane.respawn);assert.equal(normal.scenario.wave.size,3);
});
test('shop has one five-second exit latch per spawn, closes on combat and cannot reopen by re-entry',()=>{
 const s=isolated(),b=s.brawl,p=s.player;assert.ok(b.canShop());p.x=-28;b.tick(0);assert.equal(p.brawlShop.leftAt,0);s.time=4.99;b.tick(0);assert.ok(b.canShop());p.x=-33;s.time=5;b.tick(0);assert.equal(b.canShop(),false);assert.equal(s.purchaseItem('dagger'),'brawl-shop-closed');assert.equal(s.quotePurchase('dagger').error,'brawl-shop-closed');
 b.spawn(p);assert.ok(b.canShop());p.x=-28;b.tick(0);b.combat(p);assert.equal(b.canShop(),false);p.hp=0;assert.ok(b.canShop());p.hp=p.maxHp;b.spawn(p);assert.ok(b.canShop());
});
test('altar restores neither HP nor mana; shared Brawl healing is halved for player and AI',()=>{
 const s=make(),p=s.player,a=s.bots[0];p.hp-=500;p.mana-=200;const hp=p.hp,mana=p.mana;s.tickHeroes(1);assert.equal(p.hp,hp);assert.equal(p.mana,mana);
 a.hp-=500;const ahp=a.hp;near(healActor(s,p,100),50);near(healActor(s,a,100),50);near(a.hp,ahp+50);
});
test('six typed minions each team spawn first30 and every30, with enhanced stats after12min',()=>{
 const s=isolated();assert.deepEqual(s.waveScheduler.due(29.99),[]);for(const wave of s.waveScheduler.due(30))s.spawnWave(wave);assert.equal(s.minions.length,12);
 for(const team of ['player','enemy']){const wave=s.minions.filter(a=>a.team===team);assert.equal(wave.filter(a=>a.minionType==='melee').length,3);assert.equal(wave.filter(a=>a.minionType==='ranged').length,2);assert.equal(wave.filter(a=>a.minionType==='siege').length,1);assert.ok(wave.find(a=>a.minionType==='ranged').range>wave[0].range);assert.ok(wave.find(a=>a.minionType==='siege').maxHp>wave[0].maxHp);}
 assert.deepEqual(s.waveScheduler.due(59.99),[]);assert.deepEqual(s.waveScheduler.due(60),[2]);s.time=720;s.minions=[];s.spawnWave(24);assert.ok(s.minions.every(a=>a.enhanced));assert.equal(s.minions.find(a=>a.minionType==='melee').magicDefense,40);assert.equal(s.minions.find(a=>a.minionType==='siege').magicDefense,50);
 const target=s.minions.find(a=>a.team==='enemy'&&a.minionType==='siege');s.player.x=target.x-2;s.player.z=target.z;s.deal(s.player,target,1e6,'true');const gold=s.gold;assert.ok(gold>2500);s.onDeath(s.player,target);assert.equal(s.gold,gold);
});
test('Frozen Crabs spawn at30, are real neutrals, reward contributing allies once and respawn30 after death',()=>{
 const s=make(),b=s.brawl,a=s.bots[0];a.team='player';s.time=29.9;b.tick(0);assert.ok(b.crabs.every(a=>a.hp===0));s.time=30;b.tick(0);const crab=b.crabs[0];assert.ok(crab.hp>0);assert.ok(validTarget(s.player,crab));assert.equal(validTarget({team:'player',kind:'minion'},crab),false);
 Object.assign(s.player,{x:crab.x+1,z:crab.z,hp:s.player.maxHp-500});Object.assign(a,{x:crab.x-1,z:crab.z});s.deal(a,crab,1,'true');const assist=a.earnedGold||0;s.deal(s.player,crab,1e6,'true');assert.equal(crab.hp,0);assert.ok(s.player.shields.some(a=>a.id==='frozen-crab'));assert.ok(a.earnedGold>assist);const gold=s.gold;s.onDeath(s.player,crab);assert.equal(s.gold,gold);assert.equal(crab.readySpawnAt,60);s.time=59.99;b.tick(0);assert.equal(crab.hp,0);s.time=60;b.tick(0);assert.equal(crab.hp,crab.maxHp);
});
test('healing rune has continuous five-second healing, radius-limited HP/mana burst and35s pickup clock',()=>{
 const s=make(),b=s.brawl,r=b.runes[0],p=s.player,a=s.bots[0];a.team='player';s.time=30;Object.assign(p,{x:r.x,z:r.z,hp:p.maxHp-1000,mana:0});Object.assign(a,{x:r.x+3,z:r.z,hp:a.maxHp-1000,mana:0});b.tick(0);assert.equal(r.collectorId,p.id);assert.equal(r.readyAt,65);const hp=p.hp;
 for(let i=0;i<4;i++){s.time++;b.tick(1);}assert.ok(p.hp>hp);assert.equal(a.mana,0);s.time=35;b.tick(1);near(a.mana,a.maxMana*.4);assert.ok(a.hp>a.maxHp-1000);assert.equal(r.collectorId,null);assert.ok(s.time<r.readyAt);
});
test('collector death cancels immediately; dead collector cannot burst after respawn',()=>{
 const s=make(),b=s.brawl,r=b.runes[0],p=s.player,a=s.bots[0];s.time=30;p.x=r.x;p.z=r.z;b.tick(0);assert.equal(r.collectorId,p.id);p.hp=0;s.onDeath(a,p);assert.equal(r.collectorId,null);p.hp=p.maxHp;a.mana=0;s.time=36;b.tick(1);assert.equal(a.mana,0);
});
test('barrel first20, carry30, per-hero60 pickup clock; root blocks; real impact true damage and one use',()=>{
 const s=make(),b=s.brawl,p=s.player,a=s.bots[0],barrel=b.barrels[0];s.time=20;Object.assign(p,{x:barrel.x,z:barrel.z});b.tick(0);assert.equal(p.barrel.expiresAt,50);assert.equal(p.barrelReadyAt,80);p.rootedUntil=21;assert.equal(b.launchBarrel({x:p.x+10,z:p.z}),'cannot-act');p.rootedUntil=0;Object.assign(a,{x:p.x+3,z:p.z,protected:false,targetable:true,hp:a.maxHp,physicalDefense:1e6,magicDefense:1e6});const hp=a.hp;
 assert.equal(b.launchBarrel(a),'launched');assert.equal(p.targetable,false);assert.equal(p.barrel,null);for(let i=0;i<30&&p.brawlTravel;i++){s.time+=.02;b.tick(.02);}assert.ok(a.hp<hp);near(hp-a.hp,b.q.barrel.trueDamage+b.q.barrel.damagePerLevel*s.progression.level);assert.equal(b.launchBarrel(a),'no-barrel');
 p.hp=0;b.death(p);p.hp=p.maxHp;b.spawn(p);assert.equal(p.barrelReadyAt,80);s.time=81;Object.assign(p,{x:barrel.x,z:barrel.z});b.tick(0);assert.ok(p.barrel);s.time=112;b.tick(0);assert.equal(p.barrel,null);
});
test('barrel respects walls; cloud is a real separate base-only travel and resets cooldown on respawn',()=>{
 const s=isolated(),b=s.brawl,p=s.player;assert.equal(b.useCloud(),'launched');const x=p.x;s.time+=.1;b.tick(.1);assert.ok(p.x>x);for(let i=0;i<180&&p.brawlTravel;i++){s.time+=1/60;b.tick(1/60);}assert.ok(p.x>-20,'cloud must route around its allied core and inner tower');b.stopTravel(p);assert.equal(b.useCloud(),'cooldown');b.spawn(p);assert.equal(p.cloudReadyAt,0);p.x=0;assert.equal(b.useCloud(),'base-only');
 p.barrel={expiresAt:100};s.time=1;p.x=-2;p.z=0;s.arena={halfSize:36,laneHalfWidth:11,obstacles:[{x:0,z:0,width:1,depth:20}]};assert.equal(b.launchBarrel({x:10,z:0}),'launched');for(let i=0;i<30&&p.brawlTravel;i++){s.time+=.05;b.tick(.05);}assert.ok(p.x<-.5-p.radius+.01);
});
test('inner tower destruction clears lane minions; bushes really conceal and combat reveals; reset clears objects',()=>{
 const s=isolated(),b=s.brawl;s.spawnWave(1);const tower=s.structures.find(a=>a.team==='enemy'&&a.order===1);b.structureDeath(tower);assert.ok(s.minions.every(a=>a.hp===0));const bush=b.q.bushes[0];Object.assign(s.player,{x:bush.x,z:bush.z});b.tick(0);assert.ok(s.player.camouflaged);b.combat(s.player);b.tick(0);assert.equal(s.player.camouflaged,false);s.reset();assert.ok(s.brawl.crabs.every(a=>a.hp===0));assert.ok(s.brawl.runes.every(r=>r.readyAt===30));assert.equal(s.player.barrel,null);assert.equal(s.player.cloudReadyAt,0);
});
