import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSourceHeroRegistry, readHeroFiles } from '../scripts/lib/hero-files.mjs';
import { discoverHeroPacks, validateHeroPack, createHeroState } from '../src/heroes/registry.js';
import { calculateAttributes, runtimeAttributes } from '../src/simulation/stats/attributes.js';
import { HeroProgression } from '../src/simulation/stats/progression.js';
import { damagePower, resolveDamage, effectiveDefense } from '../src/simulation/stats/damage.js';
import { HeroCombatSimulation } from '../src/simulation/hero-combat.js';
import { createHeroVisual } from '../src/rendering/heroes/hero-visual.js';
const registry = await loadSourceHeroRegistry(), hero = registry.get('layla');
const files = await readHeroFiles();
const original = discoverHeroPacks(files.json, files.assets).find(p => p.hero.id === 'layla');
const near = (a,b,tolerance=1e-7) => assert.ok(Math.abs(a-b)<tolerance, `${a} != ${b}`);
const sim = () => new HeroCombatSimulation({ halfSize:30, obstacles:[] }, {
  player:{heroId:'layla',x:0,z:0}, targeting:{defaultMode:'nearest'},
  dummies:[{id:'target', name:'Target',x:0,z:5,radius:.45,hp:1e7,maxHp:1e7,team:'enemy',targetable:true,physicalDefense:15,magicDefense:120}]
}, registry);
const step = (s, seconds) => { for(let i=0;i<Math.round(seconds*120);i++) s.update(1/120); };
const expected15 = {maxHp:4378,hpRegen:8.2,maxMana:1900,manaRegen:6.8,physicalAttack:252,physicalDefense:71,magicDefense:50,magicPower:0,attackSpeed:1.34,attackSpeedRatio:1,criticalDamage:2,movementSpeed:240,attackRange:4.3};
for (const [key,value] of Object.entries(expected15)) test(`level-1 offset growth: level 15 ${key} = ${value}`, () => {
  near(calculateAttributes(hero,15)[key], value);
  near(calculateAttributes(hero,1)[key], hero.baseStats[key]);
  for(let level=1;level<=15;level++) near(calculateAttributes(hero,level)[key], hero.baseStats[key] + hero.growthStats[key]*(level-1));
});
test('level 5 HP 2858; level-1 world speed/range stay 5.5/6 at display 240/4.3', () => {
  near(calculateAttributes(hero,5).maxHp,2858);
  const s=sim(), runtime=runtimeAttributes(hero,s.player.attributes);
  near(runtime.speed,5.5);near(runtime.range,6);near(runtime.attackRate,1.06);near(runtime.attackCooldown,1/1.06);
  assert.equal(s.player.maxHp,2250);assert.equal(s.player.mana,500);
});
test('immutable definition, independent player instances and layered flat/percentage modifiers', () => {
  const before=JSON.stringify(hero), first=sim(), second=sim();
  first.grantXp(11900);first.upgradeSkill('skill-1');first.player.hp=3;
  assert.equal(second.progression.level,1);assert.equal(second.player.hp,2250);
  const stats=calculateAttributes(hero,5,{items:{flat:{physicalAttack:20},percent:{physicalAttack:.1}},temporary:{flat:{physicalAttack:-10},percent:{physicalAttack:.2}}});
  near(stats.physicalAttack,(133+8.5*4+10)*1.3);
  assert.equal(JSON.stringify(hero),before); assert.ok(Object.isFrozen(hero.growthStats));
});
test('effective attack rate cap is explicit; invalid modifier values never leak NaN', () => {
  near(runtimeAttributes(hero,calculateAttributes(hero,1,{items:{flat:{attackSpeed:10},percent:{}}})).attackRate,2.5);
  for (const bad of [{temporary:{flat:{typo:1},percent:{}}},{items:{flat:{maxHp:-10000},percent:{}}},{items:{flat:{},percent:{attackSpeed:NaN}}},{temporary:{flat:{},percent:{physicalAttack:-1.1}}}]) assert.throws(()=>calculateAttributes(hero,1,bad));
});
test('level gains add only numerical max HP/mana increases, never refill', () => {
  const s=sim();s.player.hp=700;s.player.mana=125;s.grantXp(hero.progression.xpThresholds[4]);
  assert.equal(s.progression.level,5);assert.equal(s.player.hp,1308);assert.equal(s.player.maxHp,2858);assert.equal(s.player.mana,525);assert.equal(s.player.maxMana,900);
  s.grantXp(0);assert.equal(s.player.hp,1308);
  s.setPracticeLevel(1);assert.equal(s.player.hp,700);assert.equal(s.player.mana,125);
});
test('real HP/mana regen uses level-dependent rates, caps and never revives a dead actor', () => {
  const s=sim();s.player.hp=100;s.player.mana=100;step(s,1);near(s.player.hp,105.4);near(s.player.mana,104);
  s.grantXp(11900);s.player.hp=100;s.player.mana=100;step(s,1);near(s.player.hp,108.2);near(s.player.mana,106.8);
  s.restoreResources();step(s,1);assert.equal(s.player.hp,4378);assert.equal(s.player.mana,1900);
  s.player.hp=0;s.player.mana=0;s.grantXp(0);step(s,2);assert.equal(s.player.hp,0);assert.equal(s.player.mana,0);
});
for(let level=2;level<=15;level++) test(`XP threshold ${level}: just below / exact / granted skill point`, () => {
  const p=new HeroProgression(hero), threshold=hero.progression.xpThresholds[level-1];
  p.grantXp(threshold-1);assert.equal(p.level,level-1);
  p.grantXp(1);assert.equal(p.level,level);assert.equal(p.skillPoints,level);
  p.grantXp(0);assert.equal(p.level,level);
});
test('multiple level jump, remainder and maximum overflow are deterministic', () => {
  const p=new HeroProgression(hero);p.grantXp(550);assert.equal(p.level,3);assert.equal(p.snapshot().xp,50);assert.equal(p.snapshot().xpToNext,400);
  p.grantXp(Number.MAX_SAFE_INTEGER);assert.equal(p.level,15);assert.equal(p.totalXp,11900);assert.equal(p.snapshot().xp,0);assert.equal(p.snapshot().xpToNext,0);
  p.grantXp(500);assert.equal(p.totalXp,11900);
});
for(const value of [-1,NaN,Infinity,-Infinity,.1,'200',undefined,null]) test(`invalid XP ${String(value)} is rejected atomically`, () => {
  const s=sim(),before=s.snapshot();assert.throws(()=>s.grantXp(value),/XP grant/);assert.deepEqual(s.snapshot(),before);
});
for(const level of [0,16,1.5,NaN,Infinity,'4']) test(`invalid practice level ${String(level)} is rejected atomically`, () => {
  const s=sim(),before=s.snapshot();assert.throws(()=>s.setPracticeLevel(level),/Practice level/);assert.deepEqual(s.snapshot(),before);
});
test('start one point, all actives unlearned, passive automatic; no unlearned cast/aim costs', () => {
  const s=sim();assert.equal(s.progression.skillPoints,1);
  for(const slot of ['skill-1','skill-2','skill-ultimate']) {
    assert.equal(s.ability(slot).rank,0);assert.equal(s.cast(slot),'unlearned');assert.equal(s.beginAim(slot),false);
  }
  assert.equal(s.player.mana,500);assert.equal(s.pending.length,0);assert.deepEqual(s.cooldowns,{});
  near(s.passive(s.enemies[0]),1.125);
  assert.equal(s.upgradeSkill('skill-1'),'upgraded');assert.equal(s.progression.skillPoints,0);
  assert.equal(s.upgradeSkill('skill-2'),'no-skill-points');assert.equal(s.upgradeSkill('skill-ultimate'),'requires-level-4');
});
test('ultimate gates exactly 4 / 8 / 12, standard caps 6, total spending never exceeds 15', () => {
  const p=new HeroProgression(hero);
  for(const [level,rank] of [[4,1],[8,2],[12,3]]) {
    p.grantXp(hero.progression.xpThresholds[level-1]-p.totalXp);
    assert.equal(p.upgrade('skill-ultimate'),'upgraded');assert.equal(p.ranks['destruction-rush'],rank);
    assert.equal(p.upgrade('skill-ultimate'),rank===3?'max-rank':`requires-level-${level+4}`);
  }
  p.grantXp(11900);
  for(const slot of ['skill-1','skill-2']) {for(let rank=1;rank<=6;rank++) assert.equal(p.upgrade(slot),'upgraded');assert.equal(p.upgrade(slot),'max-rank');}
  assert.equal(p.spent,15);assert.equal(p.skillPoints,0);assert.equal(p.upgrade('passive'),'invalid-ability');
});
test('rank upgrade updates real mana/cooldown/damage; snapshot at accepted cast protects in-flight damage', () => {
  const s=sim();s.upgradeSkill('skill-1');s.grantXp(200);s.upgradeSkill('skill-1');
  const a=s.ability('skill-1');assert.equal(a.rank,2);assert.equal(a.damage,220);assert.equal(a.cooldown,5.6);assert.equal(a.manaCost,40);
  const mana=s.player.mana;assert.equal(s.cast('skill-1'),'cast');near(s.player.mana,mana-40);near(s.cooldowns[a.id],5.6);
  const raw=damagePower(a.damage,a.damageModel,s.player.attributes);s.grantXp(11900);step(s,1);
  near(1e7-s.enemies[0].hp,raw*1.125*120/135,.00001);
});
for(const type of ['physical','magic','true']) for(const defense of [0,15,120,600]) test(`${type} damage at defense ${defense}`, () => {
  const result=resolveDamage({base:100,model:{type,physicalScaling:1.5,magicScaling:.5},source:{physicalAttack:200,magicPower:80},target:{physicalDefense:defense,magicDefense:defense}});
  near(result.raw,440);near(result.amount,type==='true'?440:440*120/(120+defense));
});
test('physical/magic independently choose defense; true bypasses both; pipeline order explicit', () => {
  const base={base:100,source:{physicalAttack:0,magicPower:0},target:{physicalDefense:120,magicDefense:0}};
  near(resolveDamage({...base,model:{type:'physical',physicalScaling:0,magicScaling:0}}).amount,50);
  near(resolveDamage({...base,model:{type:'magic',physicalScaling:0,magicScaling:0}}).amount,100);
  near(effectiveDefense(100,{flatReduction:20,percentReduction:.25,percentPenetration:.2,flatPenetration:10}),38);
  near(effectiveDefense(-120),0);near(effectiveDefense(15,{flatPenetration:100}),0);
});
test('malformed damage models, missing defenses, reduction/penetration are errors, not fallback balance', () => {
  const params={base:100,model:{type:'physical',physicalScaling:1,magicScaling:0},source:{physicalAttack:133,magicPower:0},target:{physicalDefense:15,magicDefense:15}};
  for(const bad of [{...params,base:NaN},{...params,model:{...params.model,type:'unknown'}},{...params,target:{}},{...params,defenseModifiers:{percentPenetration:1.1}},{...params,defenseModifiers:{flatReduction:-1}}]) assert.throws(()=>resolveDamage(bad));
});
for(const level of [1,15]) test(`actual level ${level} basic interval / rate, full movement lock and next acceptance`, () => {
  const s=sim();s.setPracticeLevel(level);const interval=1/(1.06+.02*(level-1));
  near(s.player.attackCooldown,interval);assert.equal(s.attack(),'fired');near(s.lastAttack.duration,interval);near(s.lockUntil,interval);
  s.update(interval-.001,1,0);near(s.player.x,0);assert.equal(s.attack(),'cooldown');
  s.update(.002,1,0);assert.equal(s.isActionLocked(),false);s.update(.01,1,0);assert.ok(s.player.x>0);
  const accepted=[];for(let i=0;i<2000;i++){s.update(1/120);if(s.attack()==='fired')accepted.push(s.time);}
  assert.ok(accepted.length>10);for(let i=1;i<accepted.length;i++) near(accepted[i]-accepted[i-1],interval,1/120+.00001);
});
test('all skill casts keep original 1.05 lock even at level 15', () => {
  for(const slot of ['skill-1','skill-2','skill-ultimate']) {const s=sim();s.setPracticeLevel(15);s.upgradeSkill(slot);assert.equal(s.cast(slot),'cast');near(s.lockUntil,1.05);s.update(1,1,0);near(s.player.x,0);assert.ok(s.isActionLocked());}
});
test('same Shoot clip obeys requested basic duration; following skill resets original playback rate', async () => {
  const visual=await createHeroVisual(hero,registry.modelBytes('layla')), duration=1/1.34;
  visual.play('basicAttack',true,duration);visual.update(duration-.01,'idle');assert.equal(visual.diagnostics().oneShot,true);
  visual.update(.02,'idle');assert.equal(visual.diagnostics().oneShot,false);
  visual.play('cast',true);visual.update(1,'idle');assert.equal(visual.diagnostics().oneShot,true);visual.update(.06,'idle');assert.equal(visual.diagnostics().oneShot,false);
});
test('Practice reset cancels flight/cooldowns/aim; full arena reset returns untouched level 1 state', () => {
  const s=sim();s.setPracticeLevel(15);s.upgradeSkill('skill-1');s.cast('skill-1');step(s,.3);assert.ok(s.projectiles.length);
  const targetHp=s.enemies[0].hp;s.setPracticeLevel(1);assert.equal(s.projectiles.length,0);assert.equal(s.pending.length,0);assert.deepEqual(s.cooldowns,{});assert.equal(s.isActionLocked(),false);assert.equal(s.enemies[0].hp,targetHp);assert.equal(s.progression.skillPoints,1);
  s.grantXp(11900);s.reset();assert.equal(s.progression.level,1);assert.equal(s.progression.totalXp,0);assert.equal(s.player.hp,2250);assert.equal(s.player.mana,500);assert.equal(s.ability('skill-1').rank,0);
});
test('genuine target death grants no XP; snapshots are independent and training fixture unchanged', () => {
  const s=sim();s.enemies[0].hp=1;s.attack();step(s,1);assert.equal(s.enemies[0].hp,0);assert.equal(s.progression.totalXp,0);
  const snapshot=s.snapshot();snapshot.player.attributes.physicalAttack=999;snapshot.progression.ranks['malefic-bomb']=6;assert.equal(s.player.attributes.physicalAttack,133);assert.equal(s.ability('skill-1').rank,0);
  assert.equal(createHeroState(registry.get('training'),{x:0,z:0}).hp,100);
});
const invalidDefinitions=[
 ['baseStats.maxHp',p=>p.hero.baseStats.maxHp=0],['growthStats.physicalAttack',p=>p.hero.growthStats.physicalAttack=NaN],
 ['baseStats.physicalDefense',p=>p.hero.baseStats.physicalDefense=-1],['baseStats.attackSpeed',p=>p.hero.baseStats.attackSpeed=0],
 ['growthStats.manaRegen',p=>p.hero.growthStats.manaRegen=Infinity],['baseStats.hpRegen',p=>p.hero.baseStats.hpRegen=-.1],
 ['baseStats.physiclAttack',p=>p.hero.baseStats.physiclAttack=4],['runtimeScale.range',p=>p.hero.runtimeScale.range=0],
 ['basicAttack.cooldown',p=>p.hero.basicAttack.cooldown=.65],['basicAttack.range',p=>p.hero.basicAttack.range=5],
 ['progression.maxLevel',p=>{p.hero.progression.maxLevel=16;p.hero.progression.xpThresholds.push(14000);}],['progression.xpThresholds',p=>p.hero.progression.xpThresholds[2]=200],
 ['hero.json.abilityIds',p=>p.hero.abilityIds[0]='missing'],['ranks.max',p=>p.abilities[1].ranks.max=7],
 ['ranks.requiredLevels',p=>p.abilities[3].ranks.requiredLevels=[3,7,11]],['ranks.manaCost',p=>p.abilities[1].ranks.manaCost[5]=-5],
 ['ranks.damage',p=>p.abilities[1].ranks.damage[3]=NaN],['damageModel.type',p=>p.abilities[1].damageModel.type='oops'],
 ['damageModel.magicScaling',p=>p.abilities[1].damageModel.magicScaling=Infinity],['ranks.cooldown',p=>p.abilities[1].ranks.cooldown[5]=0]
];
for(const [field,mutate] of invalidDefinitions) test(`strict useful hero file.field validation: ${field}`, () => {
  const p=structuredClone(original);mutate(p);assert.throws(()=>validateHeroPack(p),e=>e.message.includes('src/heroes/layla/')&&e.message.includes(field));
});
