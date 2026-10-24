// Explicit preview rules, NOT a certification of official Flicker mechanics.
export const FLICKER_DISTANCE=2.2; // Prototype world units, no live-game unit claim.
const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
export function flickerDemo(d,time,h){
 if(d.mode!=='hit'){d.message='Backward Flicker demo requires Iron Hook hit';return false}
 if(d.flickerAt!==undefined&&d.flickerAt!==null){d.message='Flicker already used; restart inspection to reset';return false}
 if(time<h.hitArrival-1e-8||time>=h.pullEnd-1e-8){d.message='Flicker allowed after catch and before pull completes';return false}
 if(d.followAt!==null&&time<d.followAt+.3){d.message='Flicker blocked during follow-up slam in this prototype';return false}
 d.flickerAt=time;d.flickerDistance=FLICKER_DISTANCE;d.message='Backward Flicker accepted; fixed projectile range, pull endpoint follows new caster position';return true;
}
export function casterZ(d,time){return d.flickerAt!=null&&time>=d.flickerAt?-d.flickerDistance:0}
export function pulledZ(d,time,h,far,stop){
 const normal=t=>far+(stop-far)*ease((t-h.pullStart)/(h.pullEnd-h.pullStart));
 if(d.flickerAt==null||time<d.flickerAt)return normal(time);
 const start=Math.max(h.pullStart,d.flickerAt),from=normal(d.flickerAt),to=stop-d.flickerDistance;
 return from+(to-from)*ease((time-start)/(h.pullEnd-start));
}
