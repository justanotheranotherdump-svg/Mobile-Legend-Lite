// Original procedural Malefic Energy. No textures, network, game code or model edits.
import * as T from 'three';
import {clamp,ease} from '../../simulation/skill-vfx-math.js';
export const ENERGY={white:'#efffff',cyan:'#57eeff',blue:'#168cfa',violet:'#8c68f9'};
export const EFFECT_IDENTITIES={basic:{shape:'compact tapered plasma bolt',radius:.055,length:.24,trail:.32},s1:{shape:'pointed spindle / rotating fins',radius:.15,length:.82,trail:1.25},s2:{shape:'spherical reactor / orbit bands',radius:.29,length:.58,trail:.65},ult:{shape:'muzzle-connected continuous layered beam'}};
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const material=(color,opacity=1)=>new T.MeshBasicMaterial({color,opacity,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,fog:false,side:T.DoubleSide});
function mesh(parent,geometry,color,opacity=1){const m=new T.Mesh(geometry,material(color,opacity));parent.add(m);return m}
function line(parent,points,color,opacity=.65){const l=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color,opacity,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,fog:false}));parent.add(l);return l}
function sphere(g,r,color,a){return mesh(g,new T.SphereGeometry(r,20,14),color,a)}
function tube(g,r,length,color,a){const m=mesh(g,new T.CylinderGeometry(r,r,length,24,1,false),color,a);m.rotation.x=Math.PI/2;return m}
function torus(g,r,t,color,a=.7){return mesh(g,new T.TorusGeometry(r,t,6,64),color,a)}
function alpha(g,a){g.traverse(o=>{if(o.material){o.userData.baseOpacity??=o.material.opacity;o.material.opacity=o.userData.baseOpacity*a}})}
function star(g,r,color,a=1){const group=new T.Group();g.add(group);for(let i=0;i<4;i++){const m=mesh(group,new T.OctahedronGeometry(1,0),color,a);m.scale.set(.018,r,.018);m.rotation.z=i*Math.PI/4}return group}
function trail(g,length,width,color,a){const m=mesh(g,new T.ConeGeometry(width,length,12,1,true),color,a);m.rotation.x=-Math.PI/2;m.position.z=-length/2;return m}
function projectile(key){const g=new T.Group(),details=[];
 if(key==='basic'){
  const core=sphere(g,.055,ENERGY.white,1);core.scale.z=2.2;
  const shell=sphere(g,.075,ENERGY.cyan,.45);shell.scale.z=2;
  trail(g,.32,.035,ENERGY.blue,.6);trail(g,.22,.013,ENERGY.white,.85);
 }else if(key==='s1'){
  // A genuine pointed lathed spindle, not the basic sphere or a stretched line.
  const profile=[new T.Vector2(0,-.43),new T.Vector2(.075,-.28),new T.Vector2(.15,-.06),new T.Vector2(.115,.19),new T.Vector2(0,.43)];
  const shell=mesh(g,new T.LatheGeometry(profile,24),ENERGY.blue,.6);shell.rotation.x=Math.PI/2;
  const core=mesh(g,new T.LatheGeometry(profile,20),ENERGY.white,1);core.rotation.x=Math.PI/2;core.scale.set(.48,.82,.48);
  const edge=mesh(g,new T.LatheGeometry(profile,20),ENERGY.violet,.18);edge.rotation.x=Math.PI/2;edge.scale.setScalar(1.15);
  for(let i=0;i<4;i++){const fin=line(g,[V(.08,0,-.4),V(.23,0,-.15),V(.15,0,.12),V(0,0,.43)],i%2?ENERGY.violet:ENERGY.cyan,.85);fin.rotation.z=i*Math.PI/2;details.push(fin)}
  trail(g,1.25,.09,ENERGY.blue,.48);trail(g,.95,.026,ENERGY.cyan,.9);
  for(let j=0;j<3;j++){const l=line(g,[V(.1,0,-.9),V(.13,.03,-.5),V(.05,.03,-.2)],ENERGY.violet,.65);l.rotation.z=j*2.094;details.push(l)}
 }else{
  sphere(g,.11,ENERGY.white,1);sphere(g,.21,ENERGY.cyan,.42);sphere(g,.285,ENERGY.blue,.2);
  for(let i=0;i<3;i++){const band=torus(g,.29+i*.018,.009,i===1?ENERGY.violet:ENERGY.cyan,.8);band.rotation.set(.65+i*.7,i*.9,.4);details.push(band)}
  for(let j=0;j<3;j++){const points=[];for(let i=0;i<=30;i++){const a=i/30*Math.PI*1.45;points.push(V(Math.cos(a)*.32,Math.sin(a)*.32,Math.sin(a*2+j)*.08))}const arc=line(g,points,j===1?ENERGY.violet:ENERGY.blue,.8);arc.rotation.y=j*1.1;details.push(arc)}
  trail(g,.65,.12,ENERGY.blue,.25);trail(g,.45,.045,ENERGY.violet,.45);
 }
 g.userData={key,details};return g;
}
function beam(){const g=new T.Group();
 // The luminous main body's outer diameter is exactly the candidate hit width.
 for(const [r,col,a]of[[.5,ENERGY.violet,.2],[.46,ENERGY.blue,.35],[.34,ENERGY.cyan,.65],[.115,ENERGY.white,1]])tube(g,r,1,col,a);
 const glow=tube(g,.64,1,ENERGY.blue,.12);glow.userData.decorativeGlow=true;
 const ribbons=[];for(let i=0;i<5;i++){const m=tube(g,.008+i*.001,1,i%2?ENERGY.white:ENERGY.cyan,.8);m.position.x=Math.sin(i*1.8)*.32;m.position.y=Math.cos(i*1.8)*.32;ribbons.push(m)}
 const flowMaterial=new T.ShaderMaterial({uniforms:{time:{value:0},fade:{value:1}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv; uniform float time; uniform float fade; void main(){float a=pow(max(0.,sin(vUv.y*150.-time*60.+vUv.x*22.)),18.);gl_FragColor=vec4(.25,.9,1.,a*.28*fade);}',transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false});
 const flow=new T.Mesh(new T.CylinderGeometry(.38,.38,1,24,1,true),flowMaterial);flow.rotation.x=Math.PI/2;g.add(flow);
 g.userData={glow,ribbons,flow};return g;
}
function impact(){const root=new T.Group(),center=sphere(root,.13,ENERGY.white,.95),shell=sphere(root,.45,ENERGY.blue,.28),burst=star(root,.42,ENERGY.cyan,.8),shock=torus(root,1,.012,ENERGY.cyan,.9),boundary=torus(root,1,.012,ENERGY.violet,.7);shock.rotation.x=boundary.rotation.x=Math.PI/2;
 const fill=mesh(root,new T.CircleGeometry(1,64),ENERGY.blue,.08);fill.rotation.x=-Math.PI/2;
 const fragments=[];for(let i=0;i<12;i++){const shard=mesh(root,new T.OctahedronGeometry(.045),i%3?ENERGY.cyan:ENERGY.violet,.75);fragments.push(shard)}
 root.traverse(o=>{if(o.material)o.material.depthTest=false});
 const light=new T.PointLight(ENERGY.cyan,0,2.6,2);light.position.set(.4,1.95,.2);root.add(light);
 return {root,center,shell,burst,shock,boundary,fill,fragments,light};
}
export function createMark(){const g=new T.Group(),halo=torus(g,.25,.012,ENERGY.violet,.8);halo.rotation.x=Math.PI/2;
 const diamond=line(g,[V(0,.15,0),V(.12,0,0),V(0,-.15,0),V(-.12,0,0),V(0,.15,0)],ENERGY.cyan,.95);diamond.position.y=.08;
 const core=mesh(g,new T.OctahedronGeometry(.045),ENERGY.white,.9);core.position.y=.08;
 for(const sign of[-1,1])line(g,[V(sign*.19,-.04,0),V(sign*.25,.03,0),V(sign*.19,.1,0)],ENERGY.violet,.85);
 return g;
}
export function createEffects(scene,{shotCapacity=7,impactCapacity=24}={}){
 const root=new T.Group();root.name='Original_Malefic_Energy_R2';scene.add(root);
 const shots=Array.from({length:shotCapacity},()=>{const g=new T.Group();root.add(g);const shapes={};for(const key of['basic','s1','s2']){shapes[key]=projectile(key);g.add(shapes[key])}const flash=new T.Group();root.add(flash);const blast=star(flash,.24,ENERGY.white,.95),disk=torus(flash,.15,.014,ENERGY.cyan,.85);disk.rotation.x=0;const plume=trail(flash,.36,.14,ENERGY.blue,.45);plume.rotation.x=Math.PI/2;const b=beam();root.add(b);return {g,shapes,flash,blast,disk,beam:b}});
 const impacts=Array.from({length:impactCapacity},()=>{const o=impact();root.add(o.root);return o});
 const charge=new T.Group();root.add(charge);sphere(charge,.1,ENERGY.white,.95);const chargingHalo=sphere(charge,.23,ENERGY.cyan,.2),chargeBands=[];for(let i=0;i<3;i++){const m=torus(charge,.23+i*.075,.009,i===1?ENERGY.violet:ENERGY.cyan,.8);m.rotation.set(i*.5,i*.7,0);chargeBands.push(m)}
 const convergence=[];for(let i=0;i<10;i++){const l=line(charge,[V(),V()],i%3?ENERGY.blue:ENERGY.violet,.7);convergence.push(l)}
 const light=new T.PointLight(ENERGY.cyan,0,4,2);root.add(light);
 const buff=new T.Group();root.add(buff);for(let i=0;i<6;i++){const l=line(buff,[V(),V()],i%3?ENERGY.cyan:ENERGY.violet,.75);l.userData.index=i}
 let diagnostic={};
 function update(result,time,c,muzzle){
  const muzzlePos=muzzle?.clone()||V(0,1.75,1.64);light.position.copy(muzzlePos);light.intensity=0;const shotViews=[],eventViews=[];
  for(const o of shots){o.g.visible=o.flash.visible=o.beam.visible=false;Object.values(o.shapes).forEach(s=>s.visible=false)}
  for(const s of result.shots){const o=shots[s.id];if(!o)continue;const age=time-s.release,origin=V(...s.origin),flashDuration=s.key==='basic'?.055:s.key==='s1'?.105:s.key==='s2'?.12:.085;
   o.flash.visible=age>=0&&age<flashDuration;o.flash.position.copy(origin);const strength={basic:.5,s1:1.35,s2:1.1,ult:2.2}[s.key];o.flash.scale.setScalar(strength*(1-clamp(age/flashDuration)*.65));o.flash.rotation.z=time*12;alpha(o.flash,1-clamp(age/flashDuration));if(o.flash.visible)light.intensity=Math.max(light.intensity,strength*2);
   if(s.key==='ult'){
    const duration=c.beamDuration??.24,tailEnd=s.end+duration;o.beam.visible=age>=0&&time<tailEnd;
    // Even the optional travelling-front mode remains anchored at the cannon.
    const anchor=s.muzzle?V(...s.muzzle):muzzle&&result.actor.key==='ult'?muzzlePos:origin;
    const end=c.beamMode==='instant'?s.range:Math.min(s.range,origin.z+Math.max(0,age)*s.speed),length=Math.max(.001,end-anchor.z);
    const endpoint=s.endPoint?V(s.endPoint[0],anchor.y,s.endPoint[2]):V(anchor.x,anchor.y,end),delta=endpoint.clone().sub(anchor),worldLength=Math.max(.001,delta.length());
    o.beam.position.copy(anchor).addScaledVector(delta,.5);o.beam.rotation.y=Math.atan2(delta.x,delta.z);o.beam.scale.set(c.beamWidth,c.beamWidth,worldLength);
    const fade=1-clamp((time-s.end-duration*.7)/(duration*.3));alpha(o.beam,fade);
    o.beam.userData.flow.material.uniforms.time.value=time;o.beam.userData.flow.material.uniforms.fade.value=fade;
    o.beam.userData.glow.material.opacity=.12*(c.beamGlow??.7)*fade;
    o.beam.userData.ribbons.forEach((m,i)=>{m.position.x=Math.sin(time*22+i*1.8)*.28;m.position.y=Math.cos(time*15+i*1.8)*.28;m.material.opacity=(.35+.35*Math.sin(time*35+i))*fade});
    if(o.beam.visible){light.intensity=Math.max(light.intensity,3*(c.beamGlow??.7));shotViews.push({key:s.key,shape:EFFECT_IDENTITIES.ult.shape,origin:s.origin,beamStart:anchor.toArray(),beamEnd:endpoint.toArray(),continuous:true,internalRibbonMotion:true,hitWidth:c.beamWidth,bodyWidth:c.beamWidth,glowWidth:c.beamWidth*1.28,length:worldLength,visibleDuration:duration,glow:c.beamGlow??.7})}
   }else{
    const active=age>=0&&time<s.end;o.g.visible=active;const shape=o.shapes[s.key];shape.visible=active;o.g.position.set(origin.x,origin.y,origin.z+Math.max(0,age)*s.speed);if(s.position)o.g.position.fromArray(s.position);o.g.rotation.y=s.direction?Math.atan2(s.direction.x,s.direction.z):0;
    shape.rotation.z=s.key==='basic'?0:time*(s.key==='s1'?12:1.5);if(s.key==='s2')shape.scale.setScalar(1+Math.sin(time*15)*.035);else shape.scale.setScalar(1);
    shape.userData.details.forEach((m,i)=>{if(s.key==='s2'){m.rotation.z=time*(i%2?1.7:-1.4)+i;m.rotation.y=time*.8+i}});
    if(active)shotViews.push({key:s.key,...EFFECT_IDENTITIES[s.key],origin:s.origin,position:o.g.position.toArray(),speed:s.speed,spinningDetails:shape.userData.details.length});
   }
  }
  const charging=result.shots.find(s=>s.key==='ult'&&time>=s.start&&time<s.release);
  charge.visible=!!charging;if(charging){const progress=clamp((time-charging.start)/(charging.release-charging.start));charge.position.copy(charging.muzzle?V(...charging.muzzle):muzzlePos);charge.scale.setScalar(.5+progress*.9);chargingHalo.scale.setScalar(1+.12*Math.sin(time*30));chargeBands.forEach((m,i)=>{m.rotation.z=time*(3+i);m.rotation.y=time*(1+i*.3)});alpha(charge,.2+progress*.8);convergence.forEach((l,i)=>{const angle=i*Math.PI/5+time*.5,r=.6+((i*.13-time*.8)%1+1)%1*.5;l.geometry.setFromPoints([V(Math.cos(angle)*r,Math.sin(angle)*r,.4),V(Math.cos(angle)*r*.16,Math.sin(angle)*r*.16,.02)])});light.intensity=progress*2}
  for(const o of impacts)o.root.visible=false;
  const visualEvents=[...result.events];
  for(const e of result.events.filter(e=>e.kind==='mark-trigger'))for(const d of result.targets){if(d.id===e.target||d.empty||!d.alive||Math.hypot(d.x-e.x,d.z-e.z)>c.aoeRadius||result.events.some(x=>x.kind==='mark-trigger'&&x.target===d.id&&x.at===e.at))continue;visualEvents.push({...e,kind:'mark-splash',target:d.id,x:d.x,z:d.z})}
  visualEvents.forEach((e,i)=>{const age=time-e.at,trigger=e.kind==='mark-trigger',area=e.key==='s2'&&e.kind==='impact',neighbor=['area-impact','mark-splash'].includes(e.kind),life=trigger?.25:area?.5:neighbor?.18:e.key==='basic'?.12:.25;if(age<0||age>=life)return;
   const o=impacts[i%impacts.length],p=age/life;o.root.visible=true;o.root.position.set(e.x,0,e.z);const height=1.35;const radius=area?c.aoeRadius:trigger?.43:neighbor?.22:e.key==='s1'?.6:e.key==='ult'?.72:.23;
   o.center.visible=o.burst.visible=true;o.center.position.y=o.burst.position.y=height;o.center.scale.setScalar((area?2.5:trigger?1.2:e.key==='s1'?1.5:.65)*(1-p));o.burst.scale.setScalar((trigger?.95:area?1.3:neighbor?.45:e.key==='basic'?.4:e.key==='ult'?1.7:1)*(1-p));o.burst.rotation.z=trigger?Math.PI/4:time*3;o.burst.children.forEach(m=>m.material.color.set(trigger||e.key==='ult'?ENERGY.violet:ENERGY.cyan));o.light.intensity=(area?2.6:trigger?2:e.key==='basic'?.5:1.8)*(1-p);
   o.shell.visible=area;o.shell.position.y=height;o.shell.scale.setScalar(area?Math.max(.01,1-p*4):1);
   o.shock.visible=!neighbor;o.shock.position.y=.055;o.shock.scale.setScalar(radius*ease(Math.min(1,p*2)));o.shock.material.color.set(trigger?ENERGY.violet:ENERGY.cyan);
   o.boundary.visible=area||trigger||e.key==='ult';o.fill.visible=area;o.boundary.position.y=area||trigger?.04:height;o.fill.position.y=.04;o.boundary.rotation.x=area||trigger?Math.PI/2:0;o.boundary.scale.setScalar(area||trigger?c.aoeRadius:.52+age*2);o.fill.scale.setScalar(c.aoeRadius);
   o.fragments.forEach((m,j)=>{m.visible=!neighbor&&(e.key!=='basic'||j<4);const a=j*Math.PI/6+(area?p*2:0),r=radius*(.2+p);m.position.set(Math.cos(a)*r,height+Math.sin(j*2)*p*.5,Math.sin(a)*r);m.scale.set(.6,trigger?2:area?1.4:.8,.6);m.rotation.z=a});alpha(o.root,1-p);
   eventViews.push({kind:trigger?'mark-trigger':area?'orb-detonation':neighbor?e.kind==='mark-splash'?'mark-splash':'area-hit':e.key+'-impact',target:e.target,age,radius,configuredAreaRadius:area?c.aoeRadius:null});
  });
  buff.visible=result.msBonus>0&&Number.isFinite(result.buffAt)&&time-result.buffAt<.6;buff.position.set(result.heroX,0,0);buff.children.forEach((l,i)=>{const a=i*Math.PI/3+time*5;const y=.25+(i%3)*.65;l.geometry.setFromPoints([V(Math.cos(a)*.65,y,Math.sin(a)*.65),V(Math.cos(a+.5)*.65,y+.3,Math.sin(a+.5)*.65)]);alpha(l,1-clamp((time-result.buffAt)/.6))});
  diagnostic={shots:shotViews,events:eventViews,chargeVisible:charge.visible,chargeOrigin:charge.position.toArray(),muzzleFlashes:shots.filter(o=>o.flash.visible).length,lightIntensity:light.intensity,buffOutline:buff.visible};return diagnostic;
 }
 return {update,snapshot:()=>structuredClone(diagnostic),root};
}
