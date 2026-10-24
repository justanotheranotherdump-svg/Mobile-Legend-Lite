// Four genuine cloned/skeleton-bound actors; equal camera and world scale, not screenshots.
import * as T from 'three';
import {clone as cloneRig} from 'three/addons/utils/SkeletonUtils.js';
import {createEffects,createMark,EFFECT_IDENTITIES} from './effects.js';
import {simulate,baseInput,sourceClips,clamp} from './simulation.js';
const keys=['basic','s1','s2','ult'],names=['Basic attack','S1 · Malefic Bomb','S2 · Void Projectile','ULT · Destruction Rush'];
export function createComparison(gltf,getConfig){
 const root=document.querySelector('#comparison'),cards=[];let visible=false,speed=.25,wide=false;
 function init(){if(cards.length)return;
  keys.forEach((key,i)=>{
   const card=document.createElement('article');card.className='compare-card';card.dataset.attack=key;
   card.innerHTML=`<div class="compare-heading"><span class="eyebrow">0${i+1} / MALEFIC ENERGY</span><h3>${names[i]}</h3><p>${EFFECT_IDENTITIES[key].shape}</p></div><canvas aria-label="${names[i]} comparison"></canvas><div class="compare-controls"><button data-compare-play="${key}">Play</button><button data-compare-restart="${key}">↺ Restart</button><input type="range" min="0" max="2" step="0.001" value="0" aria-label="${names[i]} comparison time"><output></output></div><p class="compare-readout"></p>`;
   root.querySelector('.compare-grid').append(card);
   const canvas=card.querySelector('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
   const scene=new T.Scene();scene.background=new T.Color('#203640');scene.add(new T.HemisphereLight('#d5edf4','#525263',2.5));const light=new T.DirectionalLight('#fff0db',3.3);light.position.set(-4,8,6);scene.add(light);const fill=new T.DirectionalLight('#8ecbfc',2);fill.position.set(5,4,-4);scene.add(fill);
   const floor=new T.Mesh(new T.PlaneGeometry(260,260),new T.MeshStandardMaterial({color:'#293b45',roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);const grid=new T.GridHelper(120,120,'#4b6268','#354d58');grid.position.y=-.01;grid.material.transparent=true;grid.material.opacity=.2;scene.add(grid);
   const model=cloneRig(gltf.scene);scene.add(model);const mixer=new T.AnimationMixer(model),actions={};for(const clip of gltf.animations){actions[clip.name]=mixer.clipAction(clip);actions[clip.name].setLoop(T.LoopOnce,1);actions[clip.name].clampWhenFinished=true}
   const camera=new T.OrthographicCamera(-6,6,4,-4,.05,500),effects=createEffects(scene),muzzle=model.getObjectByName('muzzle');
   const targets=Array.from({length:3},()=>{const o=new T.Group();scene.add(o);const material=new T.MeshStandardMaterial({color:'#405969',roughness:.6});const body=new T.Mesh(new T.CapsuleGeometry(.22,.8,6,10),material);body.position.y=1.05;o.add(body);const foot=new T.Mesh(new T.CylinderGeometry(.37,.4,.05,24),material);foot.position.y=.025;o.add(foot);const mark=createMark();mark.position.y=1.8;o.add(mark);const stun=new T.Mesh(new T.OctahedronGeometry(.12),new T.MeshBasicMaterial({color:'#eeffff'}));stun.position.y=2.1;o.add(stun);return {o,mark,stun,body}});
   const line=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({color:'#72ccd9',dashSize:.3,gapSize:.15,transparent:true,opacity:.45}));line.position.y=.03;scene.add(line);
   const c={key,card,renderer,scene,model,mixer,actions,camera,effects,muzzle,targets,line,time:0,playing:false,result:null,origins:{}};cards.push(c);
   card.querySelector('button[data-compare-play]').onclick=()=>{if(c.time>=c.result.duration)c.time=0;c.playing=!c.playing;render(c)};
   card.querySelector('button[data-compare-restart]').onclick=()=>{c.time=0;c.playing=false;render(c)};
   card.querySelector('input').oninput=e=>{c.time=Number(e.target.value);c.playing=false;render(c)};
  });
 }
 function sample(c,name,t){for(const a of Object.values(c.actions))a.stop();const a=c.actions[name];a.reset().play();c.mixer.setTime(clamp(t,0,a.getClip().duration));c.model.updateMatrixWorld(true)}
 function compute(c){const config={...getConfig(),distance:4},input={...baseInput(),scenario:c.key==='ult'?'superline':'hit',markFollow:'basic'},origins={};let r=simulate(c.key,c.time,config,input);
  for(let pass=0;pass<3;pass++){for(const s of r.shots){sample(c,...sourceClips[s.key].slice(0,2));origins[s.key+':'+s.start]=c.muzzle.getWorldPosition(new T.Vector3()).toArray()}r=simulate(c.key,c.time,config,input,origins)}
  c.origins=origins;c.result=r;return r;
 }
 function render(c){const config=getConfig(),r=compute(c);sample(c,r.actor.clip,r.actor.time);c.effects.update(r,c.time,config,c.muzzle.getWorldPosition(new T.Vector3()));
  c.targets.forEach((o,i)=>{const d=r.targets[i];o.o.visible=!d.empty&&d.alive;o.o.position.set(d.x,0,d.z);o.mark.visible=d.marked;o.mark.rotation.y=c.time*1.6;o.stun.visible=d.stunned;o.stun.rotation.y=c.time*8;o.body.rotation.z=d.hit?Math.sin(c.time*50)*.05:0});
  c.line.geometry.setFromPoints([new T.Vector3(0,0,0),new T.Vector3(0,0,c.key==='ult'?config.ultRange:4.3)]);c.line.computeLineDistances();
  const width=Math.max(100,c.card.querySelector('canvas').clientWidth),height=260;c.renderer.setSize(width,height,false);const span=wide?Math.max(10,config.ultRange):6.2;
  // One shared calibration for every card; never enlarge a projectile per card.
  const target=new T.Vector3(0,1,span*.45);c.camera.position.copy(target).add(new T.Vector3(-span*.6,span*.85,span*.7));c.camera.lookAt(target);c.camera.left=-3.8*width/height;c.camera.right=-c.camera.left;c.camera.top=3.8;c.camera.bottom=-3.8;c.camera.zoom=1;c.camera.updateMatrixWorld(true);
  const points=[];for(const x of[-1.7,1.7])for(const y of[0,3.1])for(const z of[-.7,span])points.push(new T.Vector3(x,y,z).applyMatrix4(c.camera.matrixWorldInverse));const w=Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),h=Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y));c.camera.zoom=Math.min((c.camera.right-c.camera.left)/w,7.6/h)*.9;c.camera.updateProjectionMatrix();c.renderer.render(c.scene,c.camera);
  c.card.querySelector('input').max=r.duration;c.card.querySelector('input').value=c.time;c.card.querySelector('output').textContent=c.time.toFixed(3)+' s';c.card.querySelector('[data-compare-play]').textContent=c.playing?'Pause':'Play';
  const s=r.shots[0];c.card.querySelector('.compare-readout').textContent=`Release ${s.release.toFixed(2)}s · ${c.key==='ult'?config.ultRange+'u beam / '+config.beamDuration.toFixed(2)+'s flash':s.speed+'u/s · flight '+s.travel.toFixed(3)+'s'} · ${r.phase}${c.key==='ult'&&!wide?' · beam continues beyond close crop':''}`;
 }
 function phase(name){for(const c of cards){const r=compute(c),s=r.shots[0];c.playing=false;c.time=name==='charge'?s.release*.7:name==='flight'?s.release+(c.key==='ult'?.045:s.travel*.45):name==='impact'?s.end+.025:name==='mark'?c.key==='s2'?Math.min((r.triggerAt[0]??Infinity)-.03,r.firstImpact+.53):s.end+.12:name==='trigger'?c.key==='s2'?(r.triggerAt[0]??s.end)+.025:s.end+.025:r.duration;render(c)}}
 root.querySelector('#compare-all').onclick=()=>{for(const c of cards){c.time=0;c.playing=true;render(c)}};
 root.querySelector('#compare-pause').onclick=()=>cards.forEach(c=>{c.playing=false;render(c)});
 root.querySelector('#compare-speed').onchange=e=>speed=Number(e.target.value);
 root.querySelector('#compare-wide').onchange=e=>{wide=e.target.checked;cards.forEach(render)};
 for(const b of root.querySelectorAll('[data-compare-phase]'))b.onclick=()=>phase(b.dataset.comparePhase);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cards.forEach(c=>c.playing=false)});
 return {get visible(){return visible},show(){visible=true;init();phase('flight')},hide(){visible=false;cards.forEach(c=>c.playing=false)},resetIfVisible(){if(visible)cards.forEach(c=>{c.time=0;c.playing=false;render(c)})},pause(){cards.forEach(c=>c.playing=false)},frame(elapsed){if(!visible)return;for(const c of cards){if(c.playing){c.time=Math.min(c.result.duration,c.time+elapsed*speed);if(c.time>=c.result.duration)c.playing=false;render(c)}else if(c.renderer.domElement.width!==Math.round(c.renderer.domElement.clientWidth))render(c)}},snapshot(){return {visible,speed,wide,sharedCamera:true,sharedWorldScale:true,cards:cards.map(c=>({key:c.key,time:c.time,playing:c.playing,release:c.result.shots[0].release,duration:c.result.duration,poseClip:c.result.actor.clip,cameraPosition:c.camera.position.toArray(),cameraZoom:c.camera.zoom,effects:c.effects.snapshot()}))}}};
}
