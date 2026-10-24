import * as T from 'three';
import {laneCenter} from '../match/brawl/config.js';
const glow=c=>new T.MeshBasicMaterial({color:c,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false});
function ring(radius,color){const m=new T.Mesh(new T.TorusGeometry(radius,.045,5,56),glow(color));m.rotation.x=Math.PI/2;m.position.y=.09;return m;}
function glyph(radius=1){
 const g=new T.Group();g.add(ring(radius,'#ffe783'),ring(radius*.72,'#b8ffed'));
 for(let i=0;i<8;i++){const a=i*Math.PI/4,m=new T.Mesh(new T.BoxGeometry(.12,.03,.27),glow('#ffffb0'));m.position.set(Math.cos(a)*radius*.86,.1,Math.sin(a)*radius*.86);m.rotation.y=-a;g.add(m);}
 const spiral=new T.BufferGeometry(),points=[];
 for(let i=0;i<=90;i++){const a=i/90*Math.PI*4,r=radius*.48*(1-i/110);points.push(new T.Vector3(Math.cos(a)*r,.12,Math.sin(a)*r));}
 spiral.setFromPoints(points);g.add(new T.Line(spiral,new T.LineBasicMaterial({color:'#fff9a8'})));return g;
}
function label(text){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const context=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas),sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.scale.set(3.8,.95,1);
 sprite.userData.setText=value=>{if(sprite.userData.text===value)return;sprite.userData.text=value;context.clearRect(0,0,256,64);context.fillStyle='#132634dd';context.fillRect(0,8,256,48);context.font='bold 22px sans-serif';context.textAlign='center';context.fillStyle='#fff1ba';context.fillText(value,128,40);texture.needsUpdate=true;};sprite.userData.setText(text);sprite.position.y=2;return sprite;
}
export function makeBrawlArena(v,arena){
 v.scene.background=new T.Color('#162637');v.scene.fog=new T.Fog('#233548',52,110);
 const floor=new T.Mesh(new T.PlaneGeometry(78,76),v.material('#263b48'));floor.rotation.x=-Math.PI/2;floor.position.y=-.3;v.scene.add(floor);
 const positions=[],indices=[];
 for(let i=0;i<=72;i++){const x=i-36,center=laneCenter(x),half=7.8+1.7*Math.sin((x+36)/72*Math.PI)**2;positions.push(x,-.01,center-half,x,-.01,center+half);if(i<72){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
 const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(positions,3));geom.setIndex(indices);geom.computeVertexNormals();v.scene.add(new T.Mesh(geom,v.material('#778889',{side:T.DoubleSide})));
 for(const b of arena.obstacles){const mesh=v.box(b.width,b.height,b.depth,b.cover?'#456679':'#344e62',b.x,b.height/2,b.z);v.scene.add(mesh);if(b.cover){const ice=v.mesh(new T.IcosahedronGeometry(.6),v.material('#89e2ed'),b.x,1.7,b.z);v.scene.add(ice);}}
 for(let x=-32;x<=32;x+=4){const line=v.box(.07,.015,1.3,'#b7cec7',x,.025,laneCenter(x));v.scene.add(line);}
 for(const bush of arena.brawl.bushes){
  const patch=new T.Mesh(new T.CircleGeometry(bush.radius,32),v.material('#305958'));patch.rotation.x=-Math.PI/2;patch.position.set(bush.x,.04,bush.z);v.scene.add(patch);
  for(let i=0;i<22;i++){const a=i*2.4,r=bush.radius*Math.sqrt((i+.5)/22);v.scene.add(v.mesh(new T.ConeGeometry(.3,.85,5),v.material(i%2?'#418d79':'#5aad98'),bush.x+Math.cos(a)*r,.45,bush.z+Math.sin(a)*r));}
 }
 for(const team of ['player','enemy']){const p=arena.spawn[team],g=glyph(2.5);g.position.set(p.x,.025,p.z);v.scene.add(g);const cloud=new T.Group();for(let i=0;i<5;i++){const m=v.mesh(new T.SphereGeometry(.6,10,6),v.material('#b6dbde'),(i-2)*.5,.3,Math.sin(i)*.3);m.scale.y=.3;cloud.add(m);}cloud.position.set(p.x+(team==='player'?3:-3),.3,p.z);v.scene.add(cloud);}
 v.brawlObjects=new Map();
 for(const [kind,points] of [['rune',arena.brawl.runes],['barrel',arena.brawl.barrels]])for(const p of points){
  const g=new T.Group(),base=glyph(kind==='rune'?1.1:.8);g.add(base);
  if(kind==='barrel'){
   const barrel=v.mesh(new T.CylinderGeometry(.43,.43,.9,12),v.material('#9c7657'),0,.65,0);barrel.rotation.z=.15;g.add(barrel);
   for(const y of [.3,1]){const hoop=new T.Mesh(new T.TorusGeometry(.44,.055,5,16),v.material('#abc8d1'));hoop.rotation.x=Math.PI/2;hoop.position.y=y;g.add(hoop);}
  }
  const timer=label(kind==='rune'?'Healing rune · 30':'Barrel · 20');g.add(timer);g.position.set(p.x,0,p.z);v.scene.add(g);v.brawlObjects.set(p.id,{g,base,timer,kind});
 }
 v.brawlCollectorGlyphs=new Map();
}
export function makeCrab(v,a){
 const g=new T.Group(),shell=v.mesh(new T.IcosahedronGeometry(.57,1),v.material('#8bd8e9'),0,.55,0);shell.scale.set(1,.65,.85);g.add(shell);
 for(const sign of [-1,1])for(let i=0;i<4;i++){const leg=v.box(.07,.12,.65,'#c5eff2',sign*.5,.23,(i-1.5)*.26);leg.rotation.y=sign*(.6-i*.3);g.add(leg);}
 for(const x of [-.26,.26]){g.add(v.mesh(new T.SphereGeometry(.1,8,6),v.material('#1a334d'),x,.75,.3));g.add(v.mesh(new T.ConeGeometry(.18,.5,5),v.material('#b6f8ff'),x,.9,0));}
 g.add(ring(.8,'#84e5ff'));g.add(label('Frozen Crab'));g.userData.enemyId=a.id;v.scene.add(g);return g;
}
export function renderBrawl(v,s){
 if(!s.brawl||!v.brawlObjects)return;
 for(const o of [...s.brawl.runes,...s.brawl.barrels]){
  const visual=v.brawlObjects.get(o.id),available=s.time>=o.readyAt;visual.base.rotation.y=s.time*.35;
  visual.g.children.forEach(m=>{if(m!==visual.timer)m.visible=available;});
  visual.timer.userData.setText(available?(visual.kind==='rune'?'Healing rune':'Barrel'):`${visual.kind==='rune'?'Rune':'Barrel'} · ${Math.ceil(o.readyAt-s.time)}s`);
 }
 for(const a of [s.player,...s.bots]){
  const rune=s.brawl.runes.find(r=>r.collectorId===a.id);
  let g=v.brawlCollectorGlyphs.get(a.id);
  if(rune&&!g){g=glyph(s.brawl.q.rune.radius);v.scene.add(g);v.brawlCollectorGlyphs.set(a.id,g);}
  if(g){g.visible=!!rune&&a.hp>0;g.position.set(a.x,.03,a.z);if(rune)for(const m of g.children)if(m.material?.transparent)m.material.opacity=.6+.2*Math.sin(s.time*4)**2;}
 }
 for(const crab of s.brawl.crabs){const model=v.dummies.get(crab.id),text=model?.children.find(m=>m.isSprite);if(text){model.scale.y=1;model.visible=true;for(const m of model.children)if(m!==text)m.visible=crab.hp>0;text.userData.setText(crab.hp>0?`Frozen Crab ${Math.ceil(crab.hp)}`:`Crab · ${Math.ceil(Math.max(0,crab.readySpawnAt-s.time))}s`);}}
}
export function makeBrawlMinion(v,a){
 const g=new T.Group(),color=a.team==='player'?'#6bc8ed':'#eb8c8c';
 if(a.minionType==='siege'){
  g.add(v.box(.8,.35,1.05,'#516878',0,.4,0));
  for(const x of [-.45,.45])for(const z of [-.35,.35]){const wheel=v.mesh(new T.CylinderGeometry(.23,.23,.14,10),v.material('#263d50'),x,.25,z);wheel.rotation.z=Math.PI/2;g.add(wheel);}
  const cannon=v.mesh(new T.CylinderGeometry(.16,.23,.85,10),v.material(color),0,.8,.25);cannon.rotation.x=Math.PI/2;g.add(cannon);
 }else{
  g.add(v.mesh(new T.ConeGeometry(.3,.65,8),v.material(color),0,.45,0));g.add(v.mesh(new T.IcosahedronGeometry(.21),v.material('#c4e0e6'),0,.9,0));
  if(a.minionType==='melee'){g.add(v.box(.4,.48,.1,'#b2d0ce',-.3,.48,.1));g.add(v.box(.05,.7,.07,'#f8edb4',.3,.65,0));}
  else {const bow=new T.Mesh(new T.TorusGeometry(.25,.035,5,14,Math.PI),v.material('#f1d0a0'));bow.position.set(.3,.6,.1);g.add(bow);}
 }
 g.add(ring(a.radius+.1,a.enhanced?'#f6da86':color));g.userData.enemyId=a.id;v.scene.add(g);return g;
}
