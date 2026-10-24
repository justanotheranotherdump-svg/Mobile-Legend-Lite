import proposal from './timing-proposal.json' with {type:'json'};
// Visual proposal only. No damage, targeting, action-lock, collision or CC logic.
export const TIMING=Object.freeze(proposal);
const H=TIMING.hook,S=TIMING.slam,U=TIMING.hunt;
export const CONFIG=Object.freeze({hookReach:6.4,targetDistance:5.8,pullStop:1.55,slamRadius:3.2,suppressionStart:U.start,suppressionDuration:U.end-U.start,strikes:Object.freeze([...U.strikes])});
export const MODES=[
 {id:'hook',clip:'HookMechanism',title:'Hook & chain',tag:'A',duration:H.emptyDuration,clipDuration:H.clipDuration,note:'Actor clip/stop: 0.15 s only. Projectile continues independently for 0.25 s to maximum. Move after cast to inspect the live chain.'},
 {id:'hit',clip:'IronHook',title:'Iron Hook · hit',tag:'B1',duration:H.hitDuration,clipDuration:H.clipDuration,note:'Actor clip/stop: 0.15 s. Catch/pull continue independently; the longer effect inspection timeline is NOT a character lock. Flight 0.23 s; target pull 0.18 s; return 0.08 s. Try Move now after 0.15 s.'},
 {id:'miss',clip:'HookMiss',title:'Iron Hook · miss',tag:'B2',duration:H.emptyDuration,clipDuration:H.clipDuration,note:'Actor clip/stop: 0.15 s. Independent 0.25 s maximum-range projectile; off-line dummy is never grabbed. Movement is unlocked after cast.'},
 {id:'slam',clip:'FuryShock',title:'Fury Shock',tag:'C',duration:S.duration,note:'Entire exported slam clip and preview movement lock: 0.30 s. No added 0.40 s recovery. The dust can persist independently after the action.'},
 {id:'hunt',clip:'BloodyHunt',title:'Bloody Hunt',tag:'D',duration:U.duration,note:'Entire exported channel/clip: exactly 1.80 s. Six strikes; no extra pre-cast or recovery. Move input cannot bypass the channel.'},
 {id:'combo',clip:null,title:'Transition reel',tag:'↗',duration:TIMING.combo.duration,note:'Same retimed clips: Hook → Fury Shock → Bloody Hunt. Full neutral cycles for inspection, not a simulated combat combo or Flicker interaction.'},
 {id:'idle',clip:'Idle',title:'Idle',tag:'01',duration:2,note:'Breathing, stance, silhouette and attached weapons.'},
 {id:'walk',clip:'Walk',title:'Walk',tag:'02',duration:1.2,note:'In-place walk cycle. Root travel is deliberately not applied in this inspection view.'},
 {id:'run',clip:'Run',title:'Run',tag:'03',duration:.8,note:'In-place heavy run cycle. Foot contact still needs visual approval.'},
 {id:'attack',clip:'BasicAttack',title:'Basic attack',tag:'04',duration:1.3,clipDuration:TIMING.attack.duration,note:'Base contact 0.40 s; actual AS scales contact/animation time. Move before contact aborts the swing; after contact cancels only backswing. Attack cooldown never resets.'},
 {id:'react',clip:'HitReact',title:'Take damage',tag:'05',duration:16/30,note:'Short torso/head reaction, then neutral recovery.'},
 {id:'death',clip:'Death',title:'Death',tag:'06',duration:2,note:'Authored fall. No ragdoll physics; the final grounded pose is provisional.'},
];
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
export function advanceClock(time,elapsed,speed,duration,loop){
 const next=time+Math.max(0,elapsed)*speed;
 return next>=duration?{time:loop?next%duration:duration,finished:!loop,wrapped:loop}:{time:next,finished:false,wrapped:false};
}
export function sequence(mode,time){
 let id=mode,local=time;
 if(mode==='combo'){
  if(time<TIMING.combo.hitEnd)id='hit';
  else if(time<TIMING.combo.slamEnd){id='slam';local=time-TIMING.combo.hitEnd}
  else{id='hunt';local=time-TIMING.combo.slamEnd}
 }
 const m=MODES.find(m=>m.id===id);let phase='Idle / ready';
 if(['hook','hit','miss'].includes(id)){
  const hit=id==='hit',arrival=hit?H.hitArrival:H.maxArrival,returned=hit?H.hitReturnEnd:H.emptyReturnEnd;
  phase=local<H.cast*2/3?'Anticipation':local<H.cast?'Throw / release':local<arrival?'Outbound chain':hit&&local<H.pullStart?'Catch / secure':local<(hit?H.pullEnd:returned)?(hit?'Haul target':'Retract chain'):local<returned?'Hook return':local<m.duration-.05?'Recovery':'Return to idle';
 }
 if(id==='slam')phase=local<.1?'Brace / weight shift':local<S.impact?'Fast wind-up':'Impact / movement unlocked';
 if(id==='hunt')phase=local<U.end?'Immediate restraint / six strikes':'Channel complete / movement unlocked';
 if(id==='idle')phase='Idle / breathe';
 if(id==='walk'||id==='run')phase=id==='walk'?'Walk / in place':'Run / in place';
 if(id==='attack')phase=local<TIMING.attack.impact?'Attack wind-up':local<TIMING.attack.duration?'Cancellable backswing':'Cooldown / free movement';
 if(id==='react')phase=local<.14?'Hit response':'Reaction recovery';
 if(id==='death')phase=local<.35?'Stagger':local<1.2?'Fall':'Grounded / provisional';
 const count=id==='hunt'?CONFIG.strikes.filter(t=>local>=t-1e-7).length:0;
 return {id,local,clip:m.clip,duration:m.clipDuration??m.duration,phase,count,suppressed:id==='hunt'&&local>=U.start&&local<U.end};
}
export function phaseJumps(id){
 if(id==='combo')return [['Hook',0],['Slam',TIMING.combo.hitEnd],['Hunt',TIMING.combo.slamEnd],['Release',TIMING.combo.slamEnd+U.end]];
 if(id==='hunt')return [['Restrain now',0],['Hit 1',U.strikes[0]],['Hit 6',U.strikes.at(-1)],['Release',U.end],['Idle',U.duration]];
 if(id==='slam')return [['Brace',.1],['Wind-up',.2],['Impact / unlock',S.impact]];
 if(['hook','hit','miss'].includes(id))return [['Anticipation',H.cast*2/3],['Launch',H.cast],[id==='hit'?'Catch':'Maximum',id==='hit'?H.hitArrival:H.maxArrival],['Return',id==='hit'?H.pullEnd:H.emptyReturnEnd],['Idle',MODES.find(m=>m.id===id).duration]];
 const duration=MODES.find(m=>m.id===id).duration;
 return [['Start',0],['Midpoint',duration*.5],['End',duration]];
}
