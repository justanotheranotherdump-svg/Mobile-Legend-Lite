import {brawlSettings as defaults} from './config.js';
import {distance,validTarget} from '../actions.js';
import {healActor,grantShield,heroes} from '../../simulation/status.js';
import {safeDestination} from '../../spells/system.js';
import {segmentCircle} from '../../simulation/skill-geometry.js';

// Mode-owned clocks and entities. Rendering observes these, never awards effects.
export class BrawlSystem {
 constructor(s) {
  this.s=s;this.q=s.scenario.brawl||structuredClone(defaults);
  this.crabs=this.q.crabs.map(p=>({...p,home:{...p},name:'Frozen Crab',kind:'creep',team:'neutral',radius:.6,hp:0,maxHp:this.q.crab.hp,physicalDefense:18,magicDefense:18,speed:0,range:this.q.crab.range,damage:this.q.crab.damage,readyAt:0,readySpawnAt:this.q.crab.firstAt,targetable:false}));
  this.runes=this.q.runes.map(p=>({...p,readyAt:this.q.rune.firstAt,collectorId:null,endsAt:null}));
  this.barrels=this.q.barrels.map(p=>({...p,readyAt:this.q.barrel.firstAt}));
  for(const a of [s.player,...s.bots])this.spawn(a);
 }
 get heroes(){return [this.s.player,...this.s.bots].filter(heroes);}
 spawn(a){Object.assign(a,{modeHealingMultiplier:this.q.healingMultiplier,brawlShop:{leftAt:null,closed:false},barrel:null,barrelReadyAt:a.barrelReadyAt??0,cloudReadyAt:0,brawlTravel:null,brawlUntargetableUntil:0,brawlCombatUntil:0,camouflaged:false});}
 combat(a){if(!heroes(a))return;a.brawlCombatUntil=this.s.time+1.5;if(a.brawlShop)a.brawlShop.closed=true;}
 canShop(a=this.s.player){const w=a.brawlShop;if(a.hp<=0)return true;return !!w&&!w.closed&&(w.leftAt===null||this.s.time<w.leftAt+this.q.shopGrace);}
 stopTravel(a){if(a.brawlTravel){a.brawlTravel=null;a.channeling=false;}}
 death(a){for(const r of this.runes)if(r.collectorId===a.id){r.collectorId=null;this.s.emit('brawl-rune-cancel',{id:r.id,point:{x:a.x,z:a.z}});}a.barrel=null;a.shields=(a.shields||[]).filter(x=>x.id!=='frozen-crab');this.stopTravel(a);a.brawlUntargetableUntil=0;a.camouflaged=false;}
 canMove(a){return this.s.phase==='running'&&!this.s.paused&&a.hp>0&&!a.stunned&&!(a.stunnedUntil>this.s.time)&&!(a.suppressionUntil>this.s.time)&&!(a.rootedUntil>this.s.time)&&!a.rooted&&!a.channeling&&!a.frozen&&!(a===this.s.player?this.s:this.s.botEngines.get(a.id))?.isActionLocked();}
 launchBarrel(point,a=this.s.player){
  const s=this.s;if(!this.canMove(a))return 'cannot-act';
  if(!a.barrel||a.barrel.expiresAt<=s.time)return 'no-barrel';
  const x=point.x-a.x,z=point.z-a.z,n=Math.hypot(x,z);if(n<.01)return 'aim-required';
  a.barrel=null;a.channeling=true;a.brawlUntargetableUntil=s.time+this.q.barrel.untargetableDuration;a.targetable=false;
  a.brawlTravel={kind:'barrel',x:x/n,z:z/n,remaining:this.q.barrel.range};
  this.combat(a);s.emit('brawl-barrel-launch',{id:a.id,point:{x:a.x,z:a.z}});return 'launched';
 }
 useCloud(a=this.s.player){
  const s=this.s;if(!this.canMove(a))return 'cannot-act';
  if(s.time<a.cloudReadyAt)return 'cooldown';
  if(distance(a,s.scenario.spawn[a.team])>this.q.cloud.baseRadius)return 'base-only';
  a.cloudReadyAt=s.time+this.q.cloud.cooldown;a.channeling=true;
  const sign=a.team==='player'?1:-1,flank=(Math.abs(a.z)>.1?Math.sign(a.z):sign)*2.5;
  a.brawlTravel={kind:'cloud',x:sign,z:0,remaining:this.q.cloud.range,waypoints:[{x:s.scenario.spawn[a.team].x+sign*3,z:flank},{x:s.scenario.spawn[a.team].x+sign*this.q.cloud.range,z:flank}]};
  s.emit('brawl-cloud',{id:a.id,point:{x:a.x,z:a.z}});return 'launched';
 }
 tickTravel(a,dt){
  const f=a.brawlTravel;if(!f)return;
  if(a.hp<=0||a.stunned||a.stunnedUntil>this.s.time||a.suppressionUntil>this.s.time||a.rootedUntil>this.s.time){this.stopTravel(a);return;}
  const q=this.q[f.kind],from={x:a.x,z:a.z};
  let n=Math.min(q.speed*dt,f.remaining);
  if(f.kind==='cloud'){
   if(f.waypoints.length>1&&distance(a,f.waypoints[0])<.05)f.waypoints.shift();
   const p=f.waypoints[0],dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz);
   if(d<.01){this.stopTravel(a);return;}
   f.x=dx/d;f.z=dz/d;n=Math.min(n,d);
  }
  let end=safeDestination(a,{x:a.x+f.x*n,z:a.z+f.z*n},this.s.arena,this.s.actors),hit=null;
  if(f.kind==='barrel'){
   let nearest=2;
   for(const target of this.s.actors)if(validTarget(a,target)&&!['tower','core'].includes(target.kind)){
    const t=segmentCircle(from,end,target,a.radius);if(t!==null&&t<nearest){nearest=t;hit=target;}
   }
   if(hit)end={x:from.x+(end.x-from.x)*nearest,z:from.z+(end.z-from.z)*nearest};
  }
  a.x=end.x;a.z=end.z;f.remaining-=n;
  if(hit){
   const level=a===this.s.player?this.s.progression.level:a.progression?.level||4;
   for(const target of this.s.actors)if(validTarget(a,target)&&!['tower','core'].includes(target.kind)&&distance(end,target)<=q.radius+target.radius)
    this.s.deal(a,target,q.trueDamage+q.damagePerLevel*level,'true',false);
   this.s.emit('brawl-barrel-impact',{id:a.id,point:{...end},radius:q.radius});
  }
  if(hit||f.remaining<=.001||distance(from,end)<n-.05)this.stopTravel(a);
 }
 crabDeath(source,crab){
  const s=this.s,q=this.q.crab;crab.readySpawnAt=s.time+q.respawn;crab.targetable=false;
  healActor(s,source,source.maxHp*q.healFraction);grantShield(s,source,q.shield,q.shieldDuration,'frozen-crab');
  const recipients=this.heroes.filter(a=>a.hp>0&&a.team===source.team&&distance(a,crab)<=q.assistRadius&&(a===source||(crab.contributors?.[a.id]??-Infinity)>=s.time-s.scenario.assistWindow));
  for(const a of recipients){const gold=a===source?q.gold:q.assistGold;
   if(a===s.player){s.gold+=gold;s.stats.goldEarned+=gold;s.grantXp(q.xp);s.emit('gold-gained',{amount:gold,reason:crab.id});}
   else {a.earnedGold=(a.earnedGold||0)+gold;const before=a.progression.level;a.progression.grantXp(q.xp);if(a.progression.level!==before)s.growBot(a);}
  }
  s.rewardLog.push({targetId:crab.id,sourceId:source.id,time:s.time,gold:q.gold,xp:q.xp});s.emit('brawl-crab-killed',{id:crab.id,point:{x:crab.x,z:crab.z}});
 }
 structureDeath(tower){
  if(tower.kind!=='tower'||tower.order!==1)return;
  // The destruction wave clears both sides' lane minions, without attributing
  // artificial last-hit rewards to a hero. Neutral camps are not minions.
  for(const a of this.s.minions)if(a.hp>0){a.hp=0;a.targetable=false;a.deathHandled=true;a.diedAt=this.s.time;}
  this.s.emit('brawl-clear-wave',{point:{x:tower.x,z:tower.z}});
 }
 tick(dt){
  const s=this.s,now=s.time;
  for(const a of this.heroes){
   if(a.hp<=0){this.death(a);continue;}
   if(!a.brawlShop)this.spawn(a);
   const w=a.brawlShop;if(w.leftAt===null&&distance(a,s.scenario.spawn[a.team])>this.q.baseRadius)w.leftAt=now;
   if(w.leftAt!==null&&(now>=w.leftAt+this.q.shopGrace||a.brawlCombatUntil>now))w.closed=true;
   if(a.barrel?.expiresAt<=now){a.barrel=null;s.emit('brawl-barrel-expired',{id:a.id});}
   this.tickTravel(a,dt);
   a.brawlBushId=this.q.bushes.find(b=>distance(a,b)<b.radius)?.id||null;
   a.camouflaged=!!a.brawlBushId&&!(a.brawlCombatUntil>now);
  }
  for(const crab of this.crabs){
   if(crab.hp<=0&&now>=crab.readySpawnAt){Object.assign(crab,{x:crab.home.x,z:crab.home.z,hp:crab.maxHp,targetable:true,deathHandled:false,contributors:{},readyAt:now});s.emit('brawl-crab-spawn',{id:crab.id,point:{x:crab.x,z:crab.z}});}
   if(crab.hp>0&&now>=crab.readyAt){const attacker=this.heroes.find(a=>validTarget(crab,a)&&distance(crab,a)<=this.q.crab.range&&(crab.contributors?.[a.id]??-Infinity)>=now-8);if(attacker){s.deal(crab,attacker,this.q.crab.damage,'physical',true);crab.readyAt=now+this.q.crab.cooldown;}}
  }
  for(const rune of this.runes){
   if(rune.collectorId){
    const a=this.heroes.find(a=>a.id===rune.collectorId);
    if(!a||a.hp<=0){s.emit('brawl-rune-cancel',{id:rune.id,point:a?{x:a.x,z:a.z}:{x:rune.x,z:rune.z}});rune.collectorId=null;}
    else {
     healActor(s,a,a.maxHp*this.q.rune.collectorHpPerSecond*Math.max(0,Math.min(dt,rune.endsAt-(now-dt))));
     if(now>=rune.endsAt){for(const ally of this.heroes)if(ally.team===a.team&&ally.hp>0&&distance(a,ally)<=this.q.rune.radius)healActor(s,ally,ally.maxHp*this.q.rune.burstHpFraction,ally.maxMana*this.q.rune.manaFraction);
      s.emit('brawl-rune-complete',{id:rune.id,point:{x:a.x,z:a.z},radius:this.q.rune.radius});rune.collectorId=null;
     }
    }
   }
   if(!rune.collectorId&&now>=rune.readyAt){const a=this.heroes.find(a=>a.hp>0&&distance(a,rune)<=this.q.rune.pickupRadius);if(a){rune.readyAt=now+this.q.rune.respawn;rune.collectorId=a.id;rune.endsAt=now+this.q.rune.delay;s.emit('brawl-rune-pickup',{id:rune.id,collectorId:a.id,point:{x:a.x,z:a.z}});}}
  }
  for(const barrel of this.barrels)if(now>=barrel.readyAt){
   const a=this.heroes.find(a=>a.hp>0&&!a.barrel&&!a.brawlTravel&&now>=a.barrelReadyAt&&distance(a,barrel)<=this.q.barrel.pickupRadius);
   if(a){a.barrel={expiresAt:now+this.q.barrel.carryDuration};a.barrelReadyAt=now+this.q.barrel.recollectCooldown;barrel.readyAt=now+this.q.barrel.worldRespawn;s.emit('brawl-barrel-pickup',{id:barrel.id,collectorId:a.id,point:{x:a.x,z:a.z}});}
  }
 }
 botIntent(a,original){
  if(a.brawlTravel)return {type:'hold'};
  // No fictitious fountain regeneration: wounded bots seek real runes/crabs.
  if(a.hp/a.maxHp<.5){
   const rune=this.runes.filter(r=>this.s.time>=r.readyAt&&!r.collectorId).sort((x,y)=>distance(a,x)-distance(a,y))[0];
   if(rune)return {type:'move',x:rune.x,z:rune.z,reason:'brawl-healing-rune'};
   const crab=this.crabs.find(c=>c.hp>0&&distance(a,c)<8);
   if(crab)return distance(a,crab)<=a.range?{type:'attack',targetId:crab.id}:{type:'move',x:crab.x,z:crab.z};
   if(original.type==='retreat')return {type:'move',x:a.team==='player'?-4:4,z:a.laneOffset||0,reason:'brawl-no-altar-heal'};
  }
  if(a.barrel&&this.canMove(a)){const enemy=this.heroes.find(t=>validTarget(a,t)&&distance(a,t)<8);if(enemy)this.launchBarrel(enemy,a);}
  // Cloud is an explicit action, never an automatic spawn/respawn speed boost.
  return original;
 }
 snapshot(){return {version:this.q.version,shopOpen:this.canShop(),runes:structuredClone(this.runes),barrels:structuredClone(this.barrels),crabs:this.crabs.map(a=>({id:a.id,x:a.x,z:a.z,hp:a.hp,maxHp:a.maxHp,readySpawnAt:a.readySpawnAt})),carried:this.s.player.barrel&&{...this.s.player.barrel},barrelReadyAt:this.s.player.barrelReadyAt,cloudReadyAt:this.s.player.cloudReadyAt,travel:this.s.player.brawlTravel&&{...this.s.player.brawlTravel}};}
}
