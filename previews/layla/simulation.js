// Deterministic staged workshop only. No game imports, entities, damage or registry.
import defaults from './settings.json' with {type:'json'};
export {defaults};
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
export const sourceClips={basic:['BasicAttack',.25,.6],s1:['MaleficBomb',.25,.6],s2:['VoidProjectile',.4,.75],ult:['DestructionRush',.65,1.1]};
export const MODES=[['idle','Idle / model inspection'],['walk','Walk'],['run','Run'],['aim','Aim / grip'],['basic','Basic attack'],['passive','Malefic Gun / spacing'],['s1','Malefic Bomb'],['s2','Void Projectile / mark'],['ult','Destruction Rush'],['transition','Attack → follow-up'],['runfire','Run → aim → fire'],['repeat','AS-driven attack cycle']];
export const baseInput=()=>({scenario:'hit',targetKind:'hero',markFollow:'basic',follow:'move',cancelAt:null,repeatAt:null,nextAt:null});
export function releaseTime(key,c){return c[key+'Release']*(key==='basic'?1.06/c.aps:1)}
export function rangeFor(key,c,buffed=false){return c[key+'Range']+(['basic','s2'].includes(key)?c.ultimateRank*.6+(buffed?c.s1BonusRange:0):0)}
export function passiveMultiplier(distance,c,kind='hero'){return kind==='turret'?1:1+(c.passiveMax-1)*clamp(distance/c.passiveThreshold)}
export function clipSample(key,age,c){const [clip,r,end]=sourceClips[key],release=releaseTime(key,c),recovery=c.recovery[key]*(key==='basic'?1.06/c.aps:1);return {clip,time:age<=release?r*clamp(age/release):r+(end-r)*clamp((age-release)/recovery),release,duration:release+recovery}}
export function targetLayout(c,input){
 if(input.activeMode==='ult'&&input.scenario==='superline')return [Math.max(2,Math.min(3.4,c.ultRange*.25)),Math.max(2.2,c.ultRange*.5),c.ultRange*.94].map((z,id)=>({id,x:0,z,kind:id?'hero':input.targetKind,empty:false}));
 const d=c.distance,empty=input.scenario==='empty',miss=input.scenario==='miss';
 return [{id:0,x:miss?2:0,z:d,kind:input.targetKind,empty},{id:1,x:input.scenario==='line'?0:.8,z:input.scenario==='line'?Math.max(2,d-1.8):d+.4,kind:'hero',empty:empty||!['s2','ult'].includes(input.activeMode)},{id:2,x:input.scenario==='line'?0:-.8,z:input.scenario==='line'?Math.min(19,d+2):d+.5,kind:'hero',empty:empty||!['s2','ult'].includes(input.activeMode)}];
}
function targetAt(target,t,c,input,initialImpact=Infinity){
 const o={...target,alive:true,valid:!target.empty};
 if(input.scenario==='moving'&&target.id===0)o.x+=.7*Math.sin((t-(releaseTime(input.activeMode==='s2'?'s2':'s1',c)+(c.distance-1.64)/c[(input.activeMode==='s2'?'s2':'s1')+'Speed']))*2);
 if(target.id===0&&input.activeMode==='s2'&&t>=initialImpact+.3){if(input.markFollow==='dead'){o.alive=false;o.valid=false}if(input.markFollow==='leave')o.z+=20}
 return o;
}
export function simulate(mode,time,c=defaults,raw=baseInput(),origins={}){
 const input={...baseInput(),...raw,activeMode:mode};const targets=targetLayout(c,input),shots=[],events=[];let firstImpact=Infinity,buffAt=Infinity,markAt={},triggerAt={},heroX=0;
 const originFor=(key,start)=>origins[key+':'+start]||[0,1.75,1.64];
 function shot(key,start,{buffed=false,follow=false}={}){
  const release=start+releaseTime(key,c),range=rangeFor(key,c,buffed),origin=originFor(key,start),speed=c[key+'Speed'],endZ=range;
  if(key!=='ult'&&start===0&&input.cancelAt!==null&&input.cancelAt<release-1e-8)return null;
  if(key==='ult'&&input.cancelAt!==null&&input.cancelAt>=start&&input.cancelAt<release&&!c.ultimateCommitted)return null;
  if(follow){const primary=targetAt(targets[0],start,c,input,firstImpact);if(!primary.valid||primary.z>range)return null}
  const maxTravel=Math.max(0,endZ-origin[2]),travel=key==='ult'&&c.beamMode==='instant'?0:maxTravel/speed;
  let impacts=[];
  for(const target of targets){
   if(target.empty||(key==='s1'&&target.kind==='turret'))continue;
   if(follow&&(!targetAt(target,start,c,input,firstImpact).valid||targetAt(target,start,c,input,firstImpact).z>range))continue;
   if(follow&&target.id!==0&&key!=='ult')continue;
   if(key==='ult'){
    const pos=targetAt(target,release,c,input,firstImpact);if(pos.valid&&Math.abs(pos.x-origin[0])<=c.beamWidth/2+.23&&pos.z<=range&&pos.z>=origin[2])impacts.push({target:target.id,at:release+(c.beamMode==='instant'?0:(pos.z-origin[2])/speed),x:pos.x,z:pos.z});
   }else{
    // Fixed-direction swept contact with articulated dummy circles; not final collision.
    for(let i=0;i<=360;i++){
     const age=travel*i/360,t=release+age,pos=targetAt(target,t,c,input,firstImpact),z=origin[2]+speed*age;
     if(!pos.valid||pos.z>range||pos.z<origin[2])continue;
     if(Math.hypot(pos.x-origin[0],pos.z-z)<=.27+(key==='s2'?.14:key==='s1'?.10:.06)){impacts.push({target:target.id,at:t,x:pos.x,z:pos.z});break}
    }
   }
  }
  impacts.sort((a,b)=>a.at-b.at||a.target-b.target);if(key!=='ult')impacts=impacts.slice(0,1);
  const end=key==='ult'?release+travel:impacts[0]?.at??release+travel;
  const record={id:shots.length,key,start,release,range,speed,origin:[...origin],end,travel:Math.max(0,end-release),impacts,follow};shots.push(record);
  for(const hit of impacts)events.push({...hit,key,kind:'impact',shot:record.id});
  return record;
 }
 let actor={clip:'Idle',time:time%2,key:null,start:0};
 let actions=[];
 if(['idle','walk','run','aim'].includes(mode)){actor={clip:{idle:'Idle',walk:'Walk',run:'Run',aim:'Aim'}[mode],time:time%({idle:2,walk:1.2,run:.8,aim:1}[mode]),key:null,start:0}}
 else{
  let key=['basic','passive','transition','runfire','repeat'].includes(mode)?'basic':mode,start=mode==='runfire'?.65:0;
  if(mode==='runfire'&&time<.65)actor={clip:'Run',time:time%.8,key:null,start:0};
  actions.push({key,start});shot(key,start);
  if(mode==='repeat')for(let i=1;i<3;i++){const at=i/c.aps;actions.push({key:'basic',start:at});shot('basic',at)}
  if(mode==='s1'&&shots[0]?.impacts.length)buffAt=shots[0].impacts[0].at;
  if(mode==='s2'&&shots[0]?.impacts.length){
   const hit=shots[0].impacts[0];firstImpact=hit.at;
   for(const target of targets){const p=targetAt(target,hit.at,c,input);if(p.valid&&target.id!==hit.target&&Math.hypot(p.x-hit.x,p.z-hit.z)<=c.aoeRadius)events.push({target:target.id,at:hit.at,x:p.x,z:p.z,key:'s2',kind:'area-impact'});if(p.valid&&p.kind!=='turret'&&(c.markScope==='area'?Math.hypot(p.x-hit.x,p.z-hit.z)<=c.aoeRadius:target.id===hit.target))markAt[target.id]=hit.at}
   if(['basic','s1','ult'].includes(input.markFollow)){
    const followKey=input.markFollow,at=hit.at+.3;actions.push({key:followKey,start:at});const s=shot(followKey,at,{follow:true});
    for(const imp of s?.impacts??[]){if(markAt[imp.target]!==undefined&&imp.at<markAt[imp.target]+c.markDuration){triggerAt[imp.target]=imp.at;events.push({...imp,key:followKey,kind:'mark-trigger'})}}
   }
   // Dead/escaped target demonstrations schedule the same follow-up attempt, rejected by validity/range.
   if(['dead','leave'].includes(input.markFollow)){const at=hit.at+.65;actions.push({key:'basic',start:at});shot('basic',at,{follow:true})}
  }
  if(mode==='transition'){
   const at=releaseTime('basic',c)+.06;
   if(input.follow==='move')heroX=1.5*clamp((time-at)/.7);
   else{actions.push({key:input.follow,start:at});shot(input.follow,at)}
  }
  if(input.nextAt!==null){const at=input.nextAt;if(at>=releaseTime(key,c)){actions.push({key:input.follow==='move'?'s1':input.follow,start:at});shot(input.follow==='move'?'s1':input.follow,at)}}
  if(input.repeatAt!==null&&input.repeatAt>=1/c.aps){actions.push({key:'basic',start:input.repeatAt});shot('basic',input.repeatAt)}
  actions.sort((a,b)=>a.start-b.start);const active=actions.filter(a=>time>=a.start).at(-1);
  if(active){const s=clipSample(active.key,time-active.start,c);actor={...s,key:active.key,start:active.start};if(time-active.start>s.duration)actor={clip:'Idle',time:(time-active.start-s.duration)%2,key:null,start:active.start}}
  if(mode==='transition'&&input.follow==='move'&&time>=releaseTime('basic',c)+.06&&time<releaseTime('basic',c)+.76)actor={clip:'Walk',time:(time-releaseTime('basic',c)-.06)%1.2,key:null,start:releaseTime('basic',c)+.06};
  const locked=key==='ult'&&c.ultimateCommitted&&time<releaseTime(key,c);
  if(input.cancelAt!==null&&time>=input.cancelAt&&!locked){heroX=1.5*clamp((time-input.cancelAt)/.7);actor={clip:time<input.cancelAt+.7?'Walk':'Idle',time:(time-input.cancelAt)%1.2,key:null,start:input.cancelAt}}
 }
 const rangeBuff=time>=buffAt&&time<buffAt+c.s1RangeDuration;const kind=targets[0].kind,moveDuration=c.s1MoveDuration*(kind==='hero'?2:1);const msBonus=time>=buffAt?c.s1MoveBonus*(1-clamp((time-buffAt)/moveDuration)):0;
 const renderedTargets=targets.map(target=>{const p=targetAt(target,time,c,input,firstImpact),applied=markAt[target.id],trigger=triggerAt[target.id];return {...p,marked:p.alive&&applied!==undefined&&time>=applied&&time<applied+c.markDuration&&(trigger===undefined||time<trigger),markAt:applied,triggerAt:trigger,stunned:p.alive&&Object.values(triggerAt).some(at=>time>=at&&time<at+c.stunDuration)&&events.some(e=>e.kind==='mark-trigger'&&time>=e.at&&time<e.at+c.stunDuration&&Math.hypot(p.x-e.x,p.z-e.z)<=c.aoeRadius),hit:events.some(e=>e.target===target.id&&time>=e.at&&time<e.at+.22)}});
 const duration=Math.max(mode==='s1'&&Number.isFinite(buffAt)?buffAt+c.s1RangeDuration+.3:0,mode==='s2'?firstImpact<Infinity?firstImpact+c.markDuration+.4:2:0,...shots.map(s=>Math.max(s.end+(s.key==='ult'?(c.beamDuration??.24)+.15:.45),s.start+releaseTime(s.key,c)+c.recovery[s.key])),mode==='repeat'?3/c.aps:0,mode==='transition'?1.7:0,mode==='runfire'?1.8:0,['idle','walk','run','aim'].includes(mode)?2:0,input.cancelAt===null?0:input.cancelAt+.9,input.repeatAt===null?0:input.repeatAt+1/c.aps);
 const activeShot=shots.findLast(s=>time>=s.start)||shots[0],phase=activeShot?time<activeShot.release?'Wind-up → release':activeShot.key==='ult'&&time<activeShot.end+(c.beamDuration??.24)?'Beam flash / independent effects':time<activeShot.end?'Projectile / independent travel':actor.key?'Nonblocking recovery':'Ready / effects only':'Model inspection';
 return {mode,time,actor,heroX,targets:renderedTargets,shots,events,phase,duration:Math.min(15,Math.max(1.2,duration)),buffAt,rangeBuff,msBonus,basicRange:rangeFor('basic',c,rangeBuff),s2Range:rangeFor('s2',c,rangeBuff),passive:passiveMultiplier(Math.hypot(renderedTargets[0].x-heroX,renderedTargets[0].z),c,kind),readyAt:1/c.aps,markAt,triggerAt,firstImpact};
}
export function acceptInput(kind,t,c,input,mode){
 const key=['basic','passive','transition','runfire','repeat'].includes(mode)?'basic':mode;
 if(!sourceClips[key])return {accepted:false,message:'Select a firing demonstration first'};
 if(kind==='repeat'){if(input.nextAt!==null&&t<input.nextAt+releaseTime(input.follow==='move'?'s1':input.follow,c))return {accepted:false,message:'Repeat blocked during follow-up wind-up'};if(!['basic','passive','transition'].includes(mode)||t<1/c.aps)return {accepted:false,message:'Basic attack blocked: original 1/APS interval has not elapsed'};if(input.repeatAt!==null)return {accepted:false,message:'One repeat per inspection; restart to reset'};return {accepted:true,patch:{repeatAt:t},message:'Repeat accepted after original cooldown'}}
 if(kind==='move'){if(key==='ult'&&c.ultimateCommitted&&t<releaseTime(key,c))return {accepted:false,message:'Prototype commitment: ultimate wind-up cannot be walked out'};return {accepted:true,patch:{cancelAt:t},message:t<releaseTime(key,c)?'Wind-up aborted: no projectile; original basic interval retained':'Recovery cancelled: released projectile preserved'}}
 if(t<releaseTime(key,c))return {accepted:false,message:'Follow-up waits for release'};if(input.nextAt!==null)return {accepted:false,message:'One follow-up per inspection'};return {accepted:true,patch:{nextAt:t},message:'Next skill accepted; prior projectile and attack interval preserved'};
}
