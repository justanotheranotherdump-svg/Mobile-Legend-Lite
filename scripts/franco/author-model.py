"""Original Franco visual proposal. Run with bpy 4.2.22; no downloaded/ripped geometry.
All anatomy, armor, facial hair and weapons are authored mesh surfaces below.
Outputs a reusable Blender source, skinned GLB and actual baked action clips.
Coordinates: Blender Z-up, face -Y; exported glTF Y-up, face +Z.
"""
import bpy, math, os, json, random
from mathutils import Vector, Matrix
from pathlib import Path
random.seed(19)
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'previews/franco/assets'; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for d in list(bpy.data.materials): bpy.data.materials.remove(d)
def mat(name,color,metal=0,rough=.6):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
skin=mat('Weathered warm skin',(.55,.27,.17)); skinLight=mat('Face planes',(.69,.37,.24)); iron=mat('Cold forged iron',(.095,.14,.18),.83,.33); edge=mat('Worn steel edges',(.37,.46,.49),.82,.31); leather=mat('Oxhide leather',(.17,.085,.043)); seam=mat('Leather seams',(.075,.038,.025)); bronze=mat('Aged brass',(.47,.29,.11),.72,.35); hair=mat('Auburn mane',(.22,.095,.061)); fur=mat('Fur tips',(.35,.19,.12)); beard=mat('Copper red beard',(.53,.075,.022)); bright=mat('Copper hair highlights',(.78,.18,.035)); ivory=mat('Teeth and horn scratches',(.73,.64,.45)); horn=mat('Dark horn',(.068,.055,.046)); white=mat('Eyes',(.87,.82,.66)); iris=mat('Pale blue iris',(.13,.39,.47)); black=mat('Pupil and mouth',(.018,.012,.01)); cloth=mat('Charcoal quilted armor',(.055,.076,.085))
parts=[]; skinparts=[]
def alive(o):
 try:return o.name in bpy.data.objects
 except ReferenceError:return False
def mesh(name,v,f,material,bone=None):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);me.materials.append(material)
 for p in me.polygons:p.use_smooth=True
 if bone:ob['bone']=bone
 parts.append(ob);return ob
# A loft follows arbitrary authored contours; elliptical cross-sections are perpendicular to its spine.
def loft(name,sections,material,bone=None,n=16,anatomy=False):
 v=[];f=[]
 for j,(p,rx,ry) in enumerate(sections):
  p=Vector(p);t=Vector(sections[min(j+1,len(sections)-1)][0])-Vector(sections[max(0,j-1)][0]);t.normalize();a=Vector((1,0,0));
  if abs(t.dot(a))>.9:a=Vector((0,1,0))
  a=(a-t*a.dot(t)).normalized();b=t.cross(a).normalized()
  for i in range(n):
   ang=i*math.tau/n;v.append(p+a*math.cos(ang)*rx+b*math.sin(ang)*ry)
 for j in range(len(sections)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;f.append((a,b,b+n,a+n))
 f.append(tuple(range(n-1,-1,-1)));f.append(tuple((len(sections)-1)*n+i for i in range(n)))
 ob=mesh(name,v,f,material,bone)
 if anatomy:skinparts.append(ob)
 return ob
# Continuous barrel torso, thick limbs, hands, digits, neck and facial planes.
loft('Barrel torso',[( (0,0,.9),.43,.31),((0,0,1.1),.56,.41),((0,-.035,1.38),.65,.48),((0,0,1.65),.63,.4),((0,.025,1.91),.66,.3),((0,.02,2.02),.35,.21)],skin,n=32,anatomy=True)
loft('Neck', [((0,0,1.88),.26,.22),((0,0,2.2),.22,.19)],skin,anatomy=True)
loft('Head planes',[((0,-.035,2.08),.14,.15),((0,-.025,2.18),.27,.24),((0,0,2.35),.32,.27),((0,.005,2.53),.28,.25),((0,.005,2.63),.17,.15)],skinLight,n=24,anatomy=True)
loft('Broad hooked nose',[((0,-.237,2.49),.065,.045),((0,-.29,2.37),.075,.055),((0,-.36,2.32),.10,.07),((0,-.34,2.28),.07,.035)],skinLight,n=12,anatomy=True)
for sign,label in [(-1,'R'),(1,'L')]:
 loft('Ear '+label,[((sign*.27,0,2.42),.08,.06),((sign*.37,-.01,2.38),.08,.065),((sign*.33,-.03,2.27),.045,.04)],skin,anatomy=True)
 loft('Arm '+label,[((sign*.57,0,1.92),.24,.26),((sign*.76,-.005,1.84),.27,.26),((sign*.86,-.02,1.6),.23,.22),((sign*.9,-.055,1.48),.18,.19),((sign*.94,-.09,1.26),.22,.20),((sign*.97,-.11,1.1),.155,.14)],skin,anatomy=True)
 loft('Palm '+label,[((sign*.97,-.11,1.13),.15,.12),((sign*1.0,-.13,.98),.17,.115),((sign*.99,-.15,.9),.15,.10)],skin,anatomy=True)
 for i in range(4):
  x=sign*(.87+i*.077);y=-.2
  loft('Finger '+label+str(i),[((x,y,1.0),.043,.043),((x,y-.065,.90),.047,.041),((x,y-.04,.82+abs(i-1.5)*.02),.038,.035),((x,y+.025,.85),.026,.026)],skin,n=8,anatomy=True)
 loft('Thumb '+label,[((sign*.85,-.1,1.02),.061,.055),((sign*.79,-.18,.96),.055,.05),((sign*.83,-.24,.91),.04,.04)],skin,anatomy=True)
 loft('Leg '+label,[((sign*.32,0,1.04),.26,.25),((sign*.36,.015,.74),.24,.23),((sign*.37,0,.55),.19,.19),((sign*.39,.02,.26),.18,.18)],skin,anatomy=True)
# Merge/re-surface intersecting anatomy into one true connected sculpt mesh, not a primitive mannequin.
bpy.ops.object.select_all(action='DESELECT')
for o in skinparts:o.select_set(True)
bpy.context.view_layer.objects.active=skinparts[0];bpy.ops.object.join();body=skinparts[0];body.name='Franco continuous anatomical sculpt'
rem=body.modifiers.new('Unified anatomical surface','REMESH');rem.mode='VOXEL';rem.voxel_size=.018;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
sm=body.modifiers.new('Sculpt relaxation','SMOOTH');sm.factor=.62;sm.iterations=4;bpy.ops.object.modifier_apply(modifier=sm.name)
dec=body.modifiers.new('Game surface reduction','DECIMATE');dec.ratio=.43;bpy.ops.object.modifier_apply(modifier=dec.name)
parts=[o for o in parts if alive(o)]
# Fine sculpted features; tapered tubes used for hair locks, wrinkles, scars and seams.
def stroke(name,pts,r,material,bone='head',n=8):return loft(name,[(p,r*(1-.72*i/max(1,len(pts)-1)),r*(1-.72*i/max(1,len(pts)-1))) for i,p in enumerate(pts)],material,bone,n)
def oval(name,p,r,material,bone='head'):
 x,y,z=p;rx,ry,rz=r
 return loft(name,[((x,y,z-rz),rx*.15,ry*.15),((x,y,z-rz*.65),rx*.77,ry*.77),((x,y,z),rx,ry),((x,y,z+rz*.65),rx*.77,ry*.77),((x,y,z+rz),rx*.1,ry*.1)],material,bone,16)
for sign in [-1,1]:
 oval('Deep eye socket', (sign*.133,-.249,2.43),(.10,.024,.05),seam)
 oval('Eye white',(sign*.13,-.273,2.432),(.060,.016,.021),white)
 oval('Blue iris',(sign*.122,-.289,2.432),(.022,.008,.025),iris)
 oval('Pupil',(sign*.122,-.296,2.432),(.009,.004,.016),black)
 stroke('Fierce brow',[(sign*.045,-.292,2.48),(sign*.14,-.28,2.51),(sign*.25,-.23,2.50)],.047,beard)
 for j in range(3):stroke('Weathered eye crease',[(sign*.19,-.266,2.39-j*.025),(sign*.25,-.238,2.385-j*.027),(sign*.28,-.2,2.40-j*.024)],.006,leather)
 stroke('Cheek contour',[(sign*.23,-.24,2.37),(sign*.18,-.279,2.32),(sign*.12,-.29,2.26)],.014,skinLight)
# Mouth and individually sculpted teeth beneath snarling lip.
oval('Snarling mouth',(0,-.258,2.235),(.146,.025,.055),black)
for i in range(7):oval('Tooth %s'%i,((i-3)*.032,-.282,2.247),(.016,.011,.025),ivory)
# Long flowing moustache and forked red beard: overlapping tapered sculpted locks, not flat cards.
for sign in [-1,1]:
 for j in range(8):
  stroke('Swept moustache',[(sign*.025,-.32,2.28-j*.008),(sign*.16,-.35,2.25-j*.01),(sign*.29,-.31,2.27-j*.011),(sign*.36,-.24,2.35-j*.006)],.037,bright if j%3==0 else beard)
for i in range(23):
 t=(i-11)/11;x=t*.24;end=1.65+.18*abs(t);y=-.32-.11*(1-t*t)
 stroke('Braided beard strand %02d'%i,[(x,-.25,2.22),(x*1.1,y,2.05),(x*.72,y-.035,1.86),(x*.46,y+.015,end)],.049+(1-abs(t))*.012,bright if i%4==0 else beard,n=9)
for sign in [-1,1]:
 stroke('Beard braid tie',[(sign*.08,-.43,1.82),(sign*.08,-.44,1.76),(sign*.06,-.40,1.72)],.065,bronze)
# Fur mantle, each leaf-like volumetric tuft shaped and tapered individually.
for j in range(52):
 a=math.pi*(.06+.88*(j%26)/25);layer=j//26;cx=math.cos(a)*(.74+layer*.08);cy=math.sin(a)*(.48+layer*.15)+.05
 tip=(cx*1.20,cy*1.42,1.56-random.random()*.19-layer*.08)
 stroke('Fur mantle tuft %02d'%j,[(cx*.72,cy*.7,2.18),(cx,cy,1.96),tip],.16 if layer==0 else .13,fur if j%4==0 else hair,'chest',n=7)
# Back hair below helmet.
for i in range(13):
 x=(i-6)*.045;stroke('Auburn hair lock',[(x,.16,2.56),(x*1.3,.26,2.28),(x*1.4,.29,2.04)],.055,hair)
# Helmet dome / metal band, authored lathed shell with face opening above the brows.
loft('Horned helmet shell',[((0,0,2.49),.32,.275),((0,0,2.57),.32,.276),((0,0,2.72),.25,.22),((0,0,2.78),.05,.06)],iron,'head',n=24)
loft('Steel brow band',[((0,0,2.49),.335,.29),((0,0,2.535),.335,.29)],edge,'head',n=24)
stroke('Helmet central ridge',[(0,-.29,2.5),(0,-.26,2.66),(0,-.09,2.79),(0,.21,2.63)],.032,edge)
for sign in [-1,1]:
 pts=[(sign*.25,.03,2.62),(sign*.42,.03,2.66),(sign*.52,.015,2.8),(sign*.54,-.005,2.95),(sign*.48,-.02,3.04)]
 loft('Curved dark horn',[(p,.11*(1-i/4)+.007,.10*(1-i/4)+.005) for i,p in enumerate(pts)],horn,'head',n=12)
 for i in range(3):
  p=Vector(pts[0]).lerp(Vector(pts[2]),i*.22);oval('Horn steel collar',p,(.115-i*.014,.11-i*.013,.045),bronze)
# Continuous fitted dark undercoat under individually raised diamond plates.
loft('Fitted quilted iron undercoat',[((0,-.02,1.03),.53,.40),((0,-.035,1.18),.62,.48),((0,-.035,1.40),.675,.51),((0,0,1.67),.66,.43),((0,.015,1.91),.65,.32)],cloth,'chest',n=32)
# Quilted belly armor with individual raised diamond plates following the belly.
for row in range(6):
 z=1.03+row*.13
 for col in range(7):
  x=(col-3)*.145+(row%2)*.06
  if abs(x)>.52:continue
  y=-math.sqrt(max(.04,1-(x/.68)**2))*(.56 if row<4 else .48)-.035
  v=[(x,y-.025,z+.095),(x+.09,y+.006,z),(x,y-.025,z-.095),(x-.09,y+.006,z),(x,y-.055,z)]
  mesh('Quilted diamond',v,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],iron if (col+row)%3 else cloth,'chest')
# Wide leather belt, straps, tabard with stitched hems.
loft('Oxhide broad belt',[((0,0,.99),.50,.37),((0,0,1.12),.56,.435)],leather,'pelvis',n=32)
for sign in [-1,1]:
 stroke('Shoulder leather harness',[(sign*.40,-.2,1.95),(sign*.44,-.32,1.74),(sign*.41,-.43,1.51),(sign*.34,-.45,1.15)],.075,leather,'chest',n=6)
 for j in range(6):oval('Harness brass stud',(sign*.41,-.45,1.24+j*.085),(.021,.013,.021),bronze,'chest')
 v=[(-.29,-.38,1.04),(.29,-.38,1.04),(.35,-.39,.65),(0,-.46,.56),(-.35,-.39,.65)]
mesh('Leather hanging tabard',v,[(0,1,2,3,4)],leather,'pelvis')
stroke('Tabard stitched edging',[v[0],v[4],v[3],v[2],v[1]],.018,bronze,'pelvis')
oval('Belt iron boss',(0,-.47,1.075),(.12,.04,.095),edge,'pelvis');oval('Belt brass inset',(0,-.508,1.075),(.07,.012,.055),bronze,'pelvis')
# One iconic huge circular raised iron pauldron, opposite fur/leather shoulder.
loft('Great forged pauldron',[((-.73,0,1.77),.28,.30),((-.77,0,1.91),.36,.37),((-.72,0,2.10),.31,.31),((-.67,0,2.20),.10,.12)],iron,'upper_arm.R',n=20)
oval('Pauldron outer rim',(-.83,-.23,1.99),(.32,.065,.29),edge,'upper_arm.R')
oval('Pauldron recessed face',(-.83,-.287,1.99),(.273,.028,.25),iron,'upper_arm.R')
for i in range(12):
 a=i*math.tau/12;oval('Pauldron rivet',(-.83+math.cos(a)*.24,-.32,1.99+math.sin(a)*.22),(.027,.017,.027),bronze,'upper_arm.R')
# Embossed northern sigil, not proprietary texture.
stroke('Pauldron sigil',[(-.96,-.324,2.06),(-.83,-.34,2.16),(-.69,-.324,2.06),(-.83,-.34,1.83),(-.96,-.324,2.06)],.018,edge,'upper_arm.R')
for sign,label in [(-1,'R'),(1,'L')]:
 loft('Layered bracer '+label,[((sign*.94,-.09,1.18),.22,.20),((sign*.94,-.08,1.30),.245,.23),((sign*.92,-.065,1.42),.225,.21)],iron,'forearm.'+label,n=12)
 for z in [1.19,1.38]:loft('Bracer edge', [((sign*.94,-.08,z),.242,.223),((sign*.94,-.08,z+.035),.242,.223)],bronze,'forearm.'+label,n=12)
 loft('Heavy leather boot '+label,[((sign*.39,-.17,.05),.255,.37),((sign*.39,-.18,.13),.27,.39),((sign*.39,-.10,.25),.23,.31),((sign*.39,0,.44),.195,.22),((sign*.39,.01,.57),.205,.22)],leather,'shin.'+label,n=16)
 for z in [.28,.48]:loft('Boot buckle band',[((sign*.39,-.02,z),.218,.25),((sign*.39,-.02,z+.045),.218,.25)],iron,'shin.'+label,n=16)
 stroke('Boot front seam',[(sign*.39,-.51,.13),(sign*.39,-.35,.24),(sign*.39,-.23,.51)],.014,bronze,'shin.'+label)
# Hook weapon: solid curved forged section, pointed inward barb, wrapped grip.
# Rigid meshes are parented to a named socket so the SAME weapon can fly in the viewer.
weapon=[]
before=len(parts)
loft('Hook curved forged blade',[((0,0,0),.058,.07),((0,0,-.20),.062,.08),((.05,0,-.43),.074,.085),((.22,0,-.58),.082,.08),((.41,0,-.52),.066,.07),((.44,0,-.32),.055,.06),((.30,0,-.20),.006,.009)],edge,None,n=10)
stroke('Hook raised spine',[(0,.01,-.10),(.04,.01,-.4),(.23,.01,-.54),(.40,.01,-.47)],.025,iron,None)
loft('Hook leather grip',[((0,0,.02),.082,.075),((0,0,.23),.074,.07)],leather,None,n=12)
for z in [.04,.09,.14,.19]:loft('Grip binding',[((0,0,z),.087,.08),((0,0,z+.012),.087,.08)],bronze,None,n=12)
weapon=parts[before:]
# Export separate reusable weapon geometry, then put its actual authored mesh into the rigged model socket.
bpy.ops.object.select_all(action='DESELECT')
for o in weapon:o.select_set(True)
bpy.context.view_layer.objects.active=weapon[0];bpy.ops.object.join();hook=weapon[0];hook.name='HookHead';hook.select_set(True)
# Preserve mesh buffers; save the approved larger display transform in both GLBs
# and include it in floor-safe pose baking, not only in the viewer.
hook.scale *= json.loads((OUT.parent/'timing-proposal.json').read_text()).get('visual',{}).get('hookScale',1)
bpy.ops.export_scene.gltf(filepath=str(OUT/'franco-hook.glb'),export_format='GLB',use_selection=True,export_animations=False)
parts=[o for o in parts if alive(o) and o!=hook]
# Off-hand heavy iron axe (original baseline reference silhouette; no alternate skin).
axe=[];before=len(parts)
loft('Axe haft',[((0,0,-.4),.05,.05),((0,0,.44),.055,.055)],leather,None,n=10)
v=[(-.04,-.055,-.17),(-.04,-.055,.26),(.40,-.055,.35),(.55,-.055,.12),(.48,-.055,-.21),(-.04,.055,-.17),(-.04,.055,.26),(.40,.055,.35),(.55,.055,.12),(.48,.055,-.21)]
mesh('Axe forged wedge',v,[(0,1,2,3,4),(5,9,8,7,6),(0,5,6,1),(1,6,7,2),(2,7,8,3),(3,8,9,4),(4,9,5,0)],iron)
stroke('Axe sharp cutting edge',[(.40,0,.35),(.55,0,.12),(.48,0,-.21)],.025,edge,None)
axe=parts[before:]
bpy.ops.object.select_all(action='DESELECT')
for o in axe:o.select_set(True)
bpy.context.view_layer.objects.active=axe[0];bpy.ops.object.join();axe=axe[0];axe.name='OffhandAxe';parts=[o for o in parts if alive(o) and o!=axe]
# Anatomical skeleton, reusable named sockets and smooth skin weights.
bpy.ops.object.armature_add(enter_editmode=True);rig=bpy.context.object;rig.name='Franco_Rig';eb=rig.data.edit_bones;eb.remove(eb[0]);bones={}
def bone(n,h,t,parent=None):
 b=eb.new(n);b.head=h;b.tail=t
 if parent:b.parent=eb[parent]
 bones[n]=(Vector(h),Vector(t));return b
bone('root',(0,0,0),(0,0,.3));bone('pelvis',(0,0,.85),(0,0,1.24),'root');bone('chest',(0,0,1.24),(0,0,2.04),'pelvis');bone('neck',(0,0,2.04),(0,0,2.22),'chest');bone('head',(0,0,2.22),(0,0,2.76),'neck')
for sign,label in [(-1,'R'),(1,'L')]:
 bone('upper_arm.'+label,(sign*.60,0,1.96),(sign*.90,-.055,1.48),'chest');bone('forearm.'+label,(sign*.90,-.055,1.48),(sign*.97,-.11,1.10),'upper_arm.'+label);bone('hand.'+label,(sign*.97,-.11,1.1),(sign*.99,-.15,.88),'forearm.'+label)
 bone('thigh.'+label,(sign*.32,0,1.02),(sign*.37,0,.55),'pelvis');bone('shin.'+label,(sign*.37,0,.55),(sign*.39,0,.15),'thigh.'+label);bone('foot.'+label,(sign*.39,0,.15),(sign*.39,-.37,.12),'shin.'+label)
bpy.ops.object.mode_set(mode='OBJECT')
def bind(ob,weights):
 for n in bones:ob.vertex_groups.new(name=n)
 for vert in ob.data.vertices:
  for n,w in weights(vert.co):
   if w>.00001:ob.vertex_groups[n].add([vert.index],w,'REPLACE')
 ob.parent=rig;mod=ob.modifiers.new('Franco skin deformation','ARMATURE');mod.object=rig
segments={n:p for n,p in bones.items() if n not in ['root','neck']}
def smooth_weights(p):
 def distance(seg):a,b=seg;ab=b-a;t=max(0,min(1,(p-a).dot(ab)/ab.length_squared));return (p-a-t*ab).length
 ds=sorted([(distance(seg),n)for n,seg in segments.items()])[:3];ws=[1/(.035+d)**8 for d,n in ds];total=sum(ws);return[(n,w/total)for (_,n),w in zip(ds,ws)]
for ob in parts:
 if ob==body:bind(ob,smooth_weights)
 else:
  n=ob.get('bone','chest');bind(ob,lambda p,n=n:[(n,1)])
def socket(name,boneName,object,local):
 empty=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(empty);empty.parent=rig;empty.parent_type='BONE';empty.parent_bone=boneName
 bpy.context.view_layer.update()
 empty.matrix_world=Matrix.Translation(rig.data.bones[boneName].tail_local+Vector((0,-.06,.08)))
 object.parent=empty;object.matrix_parent_inverse=Matrix.Identity(4);object.location=(0,0,-.1);object.rotation_euler=(0,0,0)
 return empty
socket('HookSocket','hand.R',hook,(0,0,-.04));socket('AxeSocket','hand.L',axe,(0,0,-.03))
# A hanging real linked chain: forged links alternate planes and remain visible at rest.
# The animated travelling chain is built from the same link dimensions in the preview, never a 2D line.
def chain_link(name,p,rot):
 v=[];f=[];N=12;M=5
 for i in range(N):
  t=i*math.tau/N
  for j in range(M):
   a=j*math.tau/M;v.append(((.048+.012*math.cos(a))*math.cos(t),(.075+.012*math.cos(a))*math.sin(t),.012*math.sin(a)))
 for i in range(N):
  for j in range(M):f.append((i*M+j,((i+1)%N)*M+j,((i+1)%N)*M+(j+1)%M,i*M+(j+1)%M))
 ob=mesh(name,v,f,iron,'pelvis');ob.location=p;ob.rotation_euler=rot;bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);ob.select_set(False);bind(ob,lambda p:[('pelvis',1)]);return ob
bpy.ops.object.select_all(action='DESELECT')
for i in range(13):
 t=i/12;chain_link('Belt chain link %02d'%i,(-.48-.36*t,-.31,.98-.31*math.sin(t*math.pi)),(math.pi/2,0,(i%2)*math.pi/2))
# Consolidate skinned surfaces by material in one deformable mesh for game-camera rendering.
bpy.ops.object.select_all(action='DESELECT')
for ob in parts:ob.select_set(True)
bpy.context.view_layer.objects.active=body;bpy.ops.object.join();body.name='FrancoBody'
# Actual authored keyframed skeletal actions, including matched neutral endpoints.
TIMING=json.loads((OUT.parent/'timing-proposal.json').read_text());H=TIMING['hook'];S=TIMING['slam'];U=TIMING['hunt'];A=TIMING['attack']
FPS=TIMING['fps'];bpy.context.scene.render.fps=FPS
for p in rig.pose.bones:p.rotation_mode='XYZ'
def key(action,time,pose={},rootZ=0):
 f=round(time*FPS)+1
 for p in rig.pose.bones:
  p.rotation_euler=pose.get(p.name,(0,0,0));p.location=(0,rootZ if p.name=='root' else 0,0);p.keyframe_insert('rotation_euler',frame=f,group=p.name);p.keyframe_insert('location',frame=f,group=p.name)
def make_action(name,seq):
 a=bpy.data.actions.new(name);rig.animation_data_create();rig.animation_data.action=a
 for t,p,z in seq:key(a,t,p,z)
 for fc in a.fcurves:
  for k in fc.keyframe_points:k.interpolation='BEZIER'
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,a);strip.action_frame_start=1;strip.action_frame_end=max(fc.range()[1] for fc in a.fcurves);track.mute=True
 return a
neutral={}
make_action('Idle',[(0,{},0),(1,{'chest':(.025,0,0),'head':(-.015,0,.02),'upper_arm.R':(.02,0,.01)},.008),(2,{},0)])
for name,dur,amp in [('Walk',1.2,.28),('Run',.8,.48)]:
 seq=[]
 for i in range(9):
  t=i/8;v=math.sin(t*math.tau)*amp;seq.append((t*dur,{'thigh.R':(v,0,0),'thigh.L':(-v,0,0),'shin.R':(max(0,-v)*.8,0,0),'shin.L':(max(0,v)*.8,0,0),'upper_arm.R':(-v*.7,0,0),'upper_arm.L':(v*.7,0,0),'chest':(.045,0,math.sin(t*math.tau)*.025)},abs(math.sin(t*math.tau))*.035))
 make_action(name,seq)
make_action('BasicAttack',[(0,{},0),(.14,{'chest':(-.06,0,-.22),'upper_arm.L':(-1.5,0,-.35),'forearm.L':(-.5,0,0)},0),(A['impact'],{'chest':(.18,0,.22),'upper_arm.L':(-.7,0,.2)},-.05),(A['duration'],{},0)])
throw={'chest':(-.09,0,-.20),'upper_arm.R':(.55,.15,-.22),'forearm.R':(-.8,0,0),'thigh.L':(-.08,0,0)}
release={'chest':(.12,0,.16),'upper_arm.R':(-1.48,0,.18),'forearm.R':(-.12,0,0),'upper_arm.L':(.14,0,-.14)}
haul={'chest':(-.12,0,-.14),'upper_arm.R':(-.78,0,.12),'forearm.R':(-1.15,0,0),'upper_arm.L':(-.8,0,-.12),'forearm.L':(-.6,0,0)}
# Re-authored action keys use the same seconds as the visual timing proposal.
for clip in ['HookMechanism','IronHook','HookMiss']:
 make_action(clip,[(0,{},0),(H['cast']*2/3,throw,-.04),(H['cast'],release,0)])
make_action('FuryShock',[(0,{},0),(.10,{'chest':(-.12,0,0),'upper_arm.L':(-1.75,0,-.25),'upper_arm.R':(-.7,0,.2),'forearm.L':(-.45,0,0)},-.07),(.20,{'chest':(-.18,0,-.1),'upper_arm.L':(-2.5,0,-.20),'forearm.L':(-.3,0,0)},.025),(S['impact'],{'chest':(.5,0,.08),'upper_arm.L':(-.4,0,.1),'upper_arm.R':(-.7,0,0),'thigh.R':(-.23,0,.06),'thigh.L':(-.23,0,-.06),'shin.R':(.45,0,0),'shin.L':(.45,0,0)},-.15)])
# Suppression is staged immediately at activation. Body secure blends in during
# its first 80 ms, INSIDE the 1.8-second channel, never an added pre-cast delay.
seq=[(0,{},0)]
for t in U['strikes']:
 seq.extend([(t-.10,{'chest':(.07,0,-.14),'upper_arm.L':(-1.48,0,-.55),'forearm.L':(-.3,0,0),'upper_arm.R':(-.75,0,.10),'forearm.R':(-1.6,0,0)},-.04),(t,{'chest':(.15,0,.12),'upper_arm.L':(-1.48,0,-.55),'forearm.L':(-.3,0,0),'upper_arm.R':(-1.5,0,.6),'forearm.R':(-.1,0,0)},-.055)])
seq.extend([(U['end'],{},0)])
make_action('BloodyHunt',seq)
make_action('HitReact',[(0,{},0),(.12,{'chest':(-.13,0,-.06),'head':(-.13,0,0)},-.035),(16/30,{},0)])
make_action('Death',[(0,{},0),(.35,{'chest':(.35,0,.15),'thigh.R':(-.4,0,0),'thigh.L':(-.4,0,0),'shin.R':(.6,0,0),'shin.L':(.6,0,0)},-.4),(1.2,{'root':(1.57,0,.12),'upper_arm.R':(.25,0,.2),'upper_arm.L':(.15,0,-.2)},.70),(2,{'root':(1.57,0,.12),'upper_arm.R':(.25,0,.2),'upper_arm.L':(.15,0,-.2)},.70)])
# Bake a floor-safe root-height correction on every sampled frame. Root local Y
# is Blender world Z for this vertical root bone; local Z is NOT vertical.
# Ground contact is geometric only, not gameplay physics or foot-IK certification.
for action in bpy.data.actions:
 rig.animation_data.action=action;corrections=[]
 for frame in range(int(action.frame_range[0]),int(action.frame_range[1])+1):
  bpy.context.scene.frame_set(frame);bpy.context.view_layer.update();dep=bpy.context.evaluated_depsgraph_get()
  low=min((o.evaluated_get(dep).matrix_world@Vector(corner)).z for o in [body,hook,axe] for corner in o.evaluated_get(dep).bound_box)
  corrections.append((frame,rig.pose.bones['root'].location.y+max(0,.025-low)))
 for frame,height in corrections:
  root=rig.pose.bones['root'];root.location.y=height;root.keyframe_insert('location',index=1,frame=frame,group='root')
 for fc in action.fcurves:
  if fc.data_path=='pose.bones["root"].location' and fc.array_index==1:
   for k in fc.keyframe_points:k.interpolation='LINEAR'
rig.animation_data.action=None
for p in rig.pose.bones:p.rotation_euler=(0,0,0);p.location=(0,0,0)
bpy.context.scene.frame_set(1)
# Keep all assets and authored actions in a genuine editable .blend.
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/source_blender/franco-preview.blend'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'franco-proposed.glb'),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_frame_range=False,export_anim_slide_to_zero=True,export_nla_strips=True,export_skins=True,export_apply=False)
manifest={'authoring':'Original custom-contour anatomical mesh / unified sculpt surface / hand-authored armor, hair, rig and clips. No screenshot textures, ripped model, external source asset or motion capture.','timingRevision':TIMING['revision'],'timingProvenance':TIMING['provenance'],'blender':bpy.app.version_string,'rigBones':list(bones),'clips':[{ 'name':a.name,'duration':(a.frame_range[1]-a.frame_range[0])/FPS}for a in bpy.data.actions],'model':'assets/franco-proposed.glb','hook':'assets/franco-hook.glb','source':'assets/source_blender/franco-preview.blend','totalSkinnedVertices':len(body.data.vertices),'totalSkinnedPolygons':len(body.data.polygons),'approval':'UNAPPROVED VISUAL PROPOSAL — not registered in gameplay'}
(OUT.parent/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest,indent=2))

# Some sandbox system GL/X11 library combinations fault in bpy shutdown destructors.
# Artifacts are completely exported above; avoid only that teardown path.
import sys
sys.stdout.flush()
os._exit(0)
