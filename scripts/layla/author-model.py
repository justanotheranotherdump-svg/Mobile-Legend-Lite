"""Original Energy Gunner-inspired workshop asset; no imported reference geometry/textures.
Blender4.2/bpy. Z-up, facing -Y => GLB Y-up facing+Z. Genuine baked rig actions.
"""
import bpy,math,json,os,sys
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'previews/layla/assets';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials):bpy.data.materials.remove(m)
def mat(name,c,metal=0,rough=.5,emit=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emit:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emit
 return m
skin=mat('Porcelain warm skin',(.76,.48,.36));face=mat('Warm face',(.84,.59,.46));white=mat('Ivory satin',(.84,.86,.83),.08,.35);purple=mat('Indigo tailored cloth',(.10,.055,.23));blue=mat('Blue violet silk',(.19,.14,.42),.08,.36);dark=mat('Dark plum leather',(.035,.018,.065),.1,.4);gold=mat('Brushed champagne gold',(.62,.39,.13),.78,.27);edge=mat('Gold edge',(.88,.66,.28),.72,.26);steel=mat('Gun pearl alloy',(.62,.68,.70),.78,.29);iron=mat('Gun deep violet alloy',(.065,.07,.14),.8,.3);glow=mat('Cyan Malefic Energy',(.035,.72,.85),.25,.22,2.8);hair=mat('Golden blonde hair',(.73,.48,.18),.12,.42);light=mat('Honey blonde ribbons',(.94,.76,.37),.1,.4);shadow=mat('Hair strand shadows',(.37,.20,.07),.05,.5);black=mat('Lashes and pupils',(.018,.014,.028));iris=mat('Teal eyes',(.04,.38,.40),.1,.25);lip=mat('Muted rose lip',(.5,.16,.18));eye=mat('Eye whites',(.9,.9,.85),0,.25)
parts=[]
def mesh(name,v,f,m,bone):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);me.materials.append(m)
 for p in me.polygons:p.use_smooth=True
 ob['bone']=bone;parts.append(ob);return ob
def loft(name,sections,m,bone,n=16):
 v=[];f=[]
 for j,(pos,rx,ry)in enumerate(sections):
  p=Vector(pos);t=Vector(sections[min(j+1,len(sections)-1)][0])-Vector(sections[max(0,j-1)][0]);t.normalize();a=Vector((1,0,0))
  if abs(t.dot(a))>.9:a=Vector((0,1,0))
  a=(a-t*a.dot(t)).normalized();b=t.cross(a).normalized()
  for i in range(n):ang=i*math.tau/n;v.append(p+a*math.cos(ang)*rx+b*math.sin(ang)*ry)
 for j in range(len(sections)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;f.append((a,b,b+n,a+n))
 f.extend([tuple(range(n-1,-1,-1)),tuple((len(sections)-1)*n+i for i in range(n))]);return mesh(name,v,f,m,bone)
def line(name,pts,r,m,bone,n=8):return loft(name,[(p,r,r)for p in pts],m,bone,n)
def oval(name,p,sz,m,bone):
 x,y,z=p;rx,ry,rz=sz
 return loft(name,[((x,y,z+rz*t),max(.001,rx*math.sqrt(max(0,1-t*t))),max(.001,ry*math.sqrt(max(0,1-t*t))))for t in [-1,-.92,-.7,-.4,0,.4,.7,.92,1]],m,bone,20)
# Anatomical contour meshes: not a primitive-only character.
loft('Sculpted torso',[( (0,0,1.36),.23,.14),((0,0,1.55),.20,.135),((0,0,1.72),.175,.13),((0,-.015,1.91),.25,.15),((0,0,2.08),.29,.125),((0,0,2.15),.15,.1)],white,'chest',28)
loft('High collar',[( (0,0,2.08),.115,.11),((0,0,2.23),.105,.095)],white,'neck',24)
loft('Neck',[( (0,0,2.10),.085,.08),((0,0,2.32),.085,.08)],skin,'neck',20)
loft('Face sculpture',[( (0,-.01,2.23),.035,.06),((0,-.025,2.28),.12,.105),((0,-.02,2.38),.175,.14),((0,0,2.52),.19,.17),((0,.015,2.65),.155,.14),((0,.015,2.70),.04,.05)],face,'head',32)
loft('Nose bridge',[( (0,-.153,2.48),.02,.018),((0,-.185,2.40),.03,.026),((0,-.17,2.38),.037,.018)],skin,'head',12)
line('Soft confident smile',[(-.052,-.147,2.334),(-.015,-.164,2.329),(.025,-.164,2.332),(.054,-.146,2.34)],.008,lip,'head')
for s,l in [(-1,'R'),(1,'L')]:
 oval('Ear '+l,(s*.181,.005,2.42),(.038,.028,.06),skin,'head');oval('Teal earring '+l,(s*.187,-.005,2.35),(.019,.016,.033),glow,'head')
 oval('Eye '+l,(s*.075,-.151,2.46),(.058,.015,.029),eye,'head');oval('Iris '+l,(s*.075,-.167,2.459),(.022,.007,.025),iris,'head');oval('Pupil '+l,(s*.075,-.173,2.459),(.009,.004,.019),black,'head');oval('Catchlight '+l,(s*.07,-.178,2.468),(.006,.003,.008),eye,'head')
 line('Upper lashes '+l,[(s*.02,-.162,2.479),(s*.075,-.17,2.492),(s*.133,-.148,2.476)],.006,black,'head')
 line('Brows '+l,[(s*.025,-.146,2.528),(s*.08,-.15,2.54),(s*.13,-.13,2.531)],.009,shadow,'head')
 # shoulders, posed arms with distinct joints; hands grip the two gun handles
 shoulder=(s*.27,0,2.08);elbow=(-.46,-.24,1.87)if s<0 else(.43,-.39,1.86);wrist=(-.16,-.55,1.72)if s<0 else(.14,-.91,1.72)
 lo=[(shoulder,.095,.088),((s*.37,-.08,2.015),.10,.095),(elbow,.062,.067)]
 loft('Sleeve '+l,lo,white,'upperArm'+l,20);line('Sleeve gold edge '+l,[(s*.37,-.09,2.02),(s*.39,-.12,1.99)],.068,gold,'upperArm'+l,16)
 loft('Forearm glove '+l,[(elbow,.061,.062),((Vector(elbow)+Vector(wrist))*.5,.066,.063),(wrist,.049,.043)],dark,'forearm'+l,20)
 line('Glove trim '+l,[(Vector(elbow)*.25+Vector(wrist)*.75),(Vector(elbow)*.15+Vector(wrist)*.85)],.067,gold,'forearm'+l,16)
 oval('Palm '+l,wrist,(.053,.075,.035),dark,'hand'+l)
 for i in range(4):
  x=wrist[0]+(i-1.5)*.022
  line('Curled finger '+l+str(i),[(x,wrist[1]-.035,wrist[2]),(x,wrist[1]-.092,wrist[2]-.02),(x,wrist[1]-.075,wrist[2]-.052)],.011,skin,'hand'+l,8)
 line('Thumb '+l,[(wrist[0]-s*.04,wrist[1]-.02,wrist[2]),(wrist[0]-s*.055,wrist[1]-.065,wrist[2]-.035)],.018,skin,'hand'+l)
 # legs, boots and precise shaped toe profiles
 loft('Thigh stocking '+l,[((s*.14,0,1.38),.12,.115),((s*.155,0,1.17),.115,.10),((s*.16,0,.87),.083,.082)],dark,'thigh'+l,24)
 loft('Knee to ankle '+l,[((s*.16,0,.88),.083,.082),((s*.165,.015,.68),.092,.08),((s*.17,.01,.30),.057,.058)],dark,'shin'+l,24)
 line('Stocking gold seam '+l,[(s*.205,-.063,1.25),(s*.22,-.066,1.08),(s*.205,-.066,.92)],.008,gold,'thigh'+l)
 loft('Boot upper '+l,[((s*.17,0,.24),.075,.07),((s*.17,0,.4),.075,.07),((s*.166,0,.57),.096,.085)],white,'shin'+l,20)
 line('Boot cuff '+l,[(s*.166,0,.54),(s*.166,0,.57)],.097,gold,'shin'+l,20)
 loft('Shaped boot '+l,[((s*.17,-.08,.035),.08,.18),((s*.17,-.08,.09),.09,.18),((s*.17,-.04,.16),.08,.12),((s*.17,0,.30),.065,.07)],white,'foot'+l,24)
 line('Boot toe gold '+l,[(s*.17,-.22,.105),(s*.17,-.25,.085)],.04,gold,'foot'+l,16)
 # shoulder cape with gold layered outline
 oval('Shoulder cap '+l,(s*.29,.03,2.095),(.13,.14,.052),purple,'chest')
 line('Cape border '+l,[(s*.22,-.065,2.13),(s*.34,-.06,2.10),(s*.40,.02,2.07)],.012,edge,'chest')
# Layered tailored waistcoat and skirt, white shirt front visible
for s in [-1,1]:
 mesh('Purple waistcoat panel',[(s*.04,-.152,1.79),(s*.11,-.15,2.08),(s*.265,-.10,2.07),(s*.19,-.14,1.73),(s*.215,-.145,1.53),(s*.05,-.15,1.56)],[(0,1,2,3,4,5)],purple,'chest')
 line('Waistcoat gold piping',[(s*.11,-.157,2.08),(s*.055,-.165,1.86),(s*.055,-.16,1.59)],.009,edge,'chest')
for z in [1.88,1.80,1.72]:oval('Gold shirt fastener',(0,-.16,z),(.013,.008,.013),gold,'chest')
loft('Belt corset',[( (0,0,1.48),.24,.16),((0,0,1.57),.22,.145)],dark,'pelvis',28)
oval('Belt jewel frame',(0,-.171,1.53),(.06,.022,.055),gold,'pelvis');oval('Belt cyan jewel',(0,-.195,1.53),(.032,.014,.033),glow,'pelvis')
for j in range(12):
 a=j*math.tau/12;b=(j+1)*math.tau/12
 v=[(.23*math.cos(a),.155*math.sin(a),1.49),(.23*math.cos(b),.155*math.sin(b),1.49),(.35*math.cos(b),.225*math.sin(b),1.25),(.35*math.cos(a),.225*math.sin(a),1.25)]
 mesh('Pleated skirt panel',v,[(0,1,2,3)],purple if j%2 else blue,'pelvis');line('Skirt gold hem',[v[2],v[3]],.009,edge,'pelvis')
loft('White skirt underlayer',[( (0,0,1.25),.345,.22),((0,0,1.20),.35,.225)],white,'pelvis',32)
# Cap, side locks and hand-contoured bangs. Individual smooth tapered strands.
loft('Hair crown',[( (0,.035,2.48),.18,.155),((0,.035,2.61),.205,.183),((0,.035,2.72),.17,.15),((0,.035,2.77),.045,.06)],hair,'head',32)
for i in range(7):
 x=(i-3)*.046
 loft('Swept bang '+str(i),[((x,.005,2.74),.055,.034),((x-.025,-.13,2.68),.052,.029),((x-.07,-.176,2.58-(i%3)*.025),.041,.025),((x-.09,-.169,2.54-(i%3)*.025),.002,.003)],light if i%2 else hair,'head',12)
for s,l in [(-1,'R'),(1,'L')]:
 loft('Side lock '+l,[((s*.16,-.01,2.64),.05,.045),((s*.195,-.055,2.48),.045,.035),((s*.205,-.04,2.31),.026,.023),((s*.20,-.045,2.26),.002,.002)],hair,'head')
 oval('Tail tie gold '+l,(s*.22,.07,2.68),(.07,.07,.055),gold,'head');oval('Tail tie cyan '+l,(s*.23,.015,2.69),(.05,.025,.027),glow,'head')
 # Two skinned hair sections per tail with seam hidden inside matching contours
 path=[((s*.22,.08,2.68),.055,.05),((s*.40,.12,2.79),.12,.095),((s*.53,.16,2.62),.135,.11),((s*.58,.18,2.30),.12,.10),((s*.62,.17,1.99),.12,.095),((s*.66,.15,1.66),.125,.09),((s*.70,.10,1.32),.13,.085),((s*.76,.02,1.03),.11,.065),((s*.86,-.04,.93),.06,.04),((s*.91,-.06,1.04),.003,.004)]
 smooth=[]
 for j in range(len(path)-1):
  a=path[max(0,j-1)];b=path[j];c=path[j+1];d=path[min(len(path)-1,j+2)]
  for k in range(4):
   u=k/4;vals=[]
   for z in range(5):
    def val(item):return item[0][z] if z<3 else item[z-2]
    A,B,C,D=map(val,[a,b,c,d]);vals.append(.5*((2*B)+(-A+C)*u+(2*A-5*B+4*C-D)*u*u+(-A+3*B-3*C+D)*u*u*u))
   smooth.append((tuple(vals[:3]),max(.002,vals[3]),max(.002,vals[4])))
 smooth.append(path[-1]);path=smooth
 ob=loft('Long twin tail '+l,path,hair,'tailBase'+l,24);ob['hairSide']=l
 for j in range(5):
  pts=[]
  for (x,y,z),rx,ry in path[1:-1]:pts.append((x+(j-2)*rx*.29,y-ry*.83,z))
  ob=line('Tail strand '+l+str(j),pts,.008 if j%2 else .012,light if j%2 else shadow,'tailBase'+l,8);ob['hairSide']=l
 # goggles perched on head, not floating lenses
 oval('Goggle gold rim '+l,(s*.09,-.114,2.715),(.073,.025,.043),gold,'head');oval('Goggle teal glass '+l,(s*.09,-.139,2.717),(.052,.01,.029),glow,'head')
line('Goggles bridge',[(-.027,-.136,2.72),(.027,-.136,2.72)],.01,gold,'head')
# Original oversized energy gun, angular forked muzzle and ring core.
loft('Energy gun main housing',[((0,-.42,1.75),.13,.12),((0,-.60,1.75),.21,.18),((0,-.83,1.75),.19,.16),((0,-1.05,1.75),.12,.12)],iron,'weapon',24)
loft('Gun pearl barrel',[((0,-.85,1.75),.15,.13),((0,-1.05,1.75),.13,.11),((0,-1.25,1.75),.105,.08)],steel,'weapon',16)
for s in [-1,1]:
 # distinct long bifurcated blades widening at the base then tapering toward muzzle
 v=[(s*.08,-.90,1.82),(s*.23,-1.0,1.80),(s*.17,-1.64,1.74),(s*.07,-1.39,1.72),(s*.08,-.90,1.70),(s*.23,-1.0,1.68),(s*.17,-1.64,1.71),(s*.07,-1.39,1.69)]
 mesh('Forked muzzle blade',v,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],gold,'weapon')
 line('Fork cyan conduit',[(s*.145,-.98,1.823),(s*.14,-1.28,1.79),(s*.16,-1.53,1.75)],.012,glow,'weapon')
 oval('Side core surround',(s*.19,-.64,1.77),(.025,.135,.135),edge,'weapon');oval('Side cyan core',(s*.216,-.64,1.77),(.012,.093,.093),glow,'weapon')
line('Weapon upper rail',[(0,-.50,1.93),(0,-.91,1.91),(0,-1.12,1.86)],.025,gold,'weapon')
line('Rear trigger grip',[(-.16,-.51,1.78),(-.16,-.55,1.65)],.035,iron,'weapon');line('Front support grip',[(.14,-.87,1.77),(.14,-.93,1.66)],.033,iron,'weapon')
loft('Muzzle energy throat',[((0,-1.15,1.75),.062,.055),((0,-1.48,1.75),.035,.032)],glow,'weapon',16)
# Skeleton and real baked arm IK. Hands follow weapon-owned grip targets.
bpy.ops.object.armature_add(enter_editmode=True);rig=bpy.context.object;rig.name='Layla_Workshop_Rig';eb=rig.data.edit_bones;eb.remove(eb[0]);bones={}
def bone(n,h,t,parent=None):
 b=eb.new(n);b.head=h;b.tail=t
 if parent:b.parent=eb[parent]
 bones[n]=(Vector(h),Vector(t));return b
bone('root',(0,0,0),(0,0,.3));bone('pelvis',(0,0,1.30),(0,0,1.60),'root');bone('chest',(0,0,1.60),(0,0,2.12),'pelvis');bone('neck',(0,0,2.12),(0,0,2.28),'chest');bone('head',(0,0,2.28),(0,0,2.74),'neck');bone('weapon',(0,-.55,1.75),(0,-1.55,1.75),'chest');bone('muzzle',(0,-1.64,1.75),(0,-1.72,1.75),'weapon')
for s,l in [(-1,'R'),(1,'L')]:
 sh=(s*.27,0,2.08);el=(-.46,-.24,1.87)if s<0 else(.43,-.39,1.86);wr=(-.16,-.55,1.72)if s<0 else(.14,-.91,1.72)
 bone('upperArm'+l,sh,el,'chest');bone('forearm'+l,el,wr,'upperArm'+l);bone('hand'+l,wr,(wr[0],wr[1]-.12,wr[2]),'forearm'+l);bone('grip'+l,wr,(wr[0],wr[1]-.12,wr[2]),'weapon')
 bone('thigh'+l,(s*.14,0,1.34),(s*.16,0,.88),'pelvis');bone('shin'+l,(s*.16,0,.88),(s*.17,0,.25),'thigh'+l);bone('foot'+l,(s*.17,0,.25),(s*.17,-.22,.1),'shin'+l)
 bone('tailBase'+l,(s*.22,.08,2.68),(s*.62,.17,1.99),'head');bone('tailTip'+l,(s*.62,.17,1.99),(s*.86,-.04,.95),'tailBase'+l)
bpy.ops.object.mode_set(mode='OBJECT')
for l in ['R','L']:
 c=rig.pose.bones['forearm'+l].constraints.new('IK');c.target=rig;c.subtarget='grip'+l;c.chain_count=2;c.use_stretch=False;c.iterations=100
 c=rig.pose.bones['hand'+l].constraints.new('COPY_ROTATION');c.target=rig;c.subtarget='grip'+l;c.target_space='WORLD';c.owner_space='WORLD'
for ob in parts:
 for n in bones:ob.vertex_groups.new(name=n)
 for v in ob.data.vertices:
  if ob.get('hairSide'):
   l=ob['hairSide'];w=max(0,min(1,(2.15-v.co.z)/.35));ob.vertex_groups['tailBase'+l].add([v.index],1-w,'REPLACE');ob.vertex_groups['tailTip'+l].add([v.index],w,'REPLACE')
  else:ob.vertex_groups[ob['bone']].add([v.index],1,'REPLACE')
 ob.parent=rig;mod=ob.modifiers.new('Baked preview skin','ARMATURE');mod.object=rig
bpy.ops.object.select_all(action='DESELECT')
for ob in parts:ob.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();body=parts[0];body.name='Layla_Original_Skinned_Model'
FPS=60;bpy.context.scene.render.fps=FPS
for p in rig.pose.bones:p.rotation_mode='XYZ'
def action(name,duration,poseFn):
 a=bpy.data.actions.new(name);rig.animation_data_create();rig.animation_data.action=a
 for i in range(round(duration*FPS)+1):
  t=i/FPS;phase=t/duration;pose,root=poseFn(t,phase)
  for p in rig.pose.bones:
   p.rotation_euler=pose.get(p.name,(0,0,0));p.location=(0,root if p.name=='root'else 0,0);p.keyframe_insert('rotation_euler',frame=i+1,group=p.name);p.keyframe_insert('location',frame=i+1,group=p.name)
 # Floor-safe baking includes actual skinned toe, skirt, gun and hair.
 for i in range(round(duration*FPS)+1):
  bpy.context.scene.frame_set(i+1);bpy.context.view_layer.update();dep=bpy.context.evaluated_depsgraph_get();low=min((body.evaluated_get(dep).matrix_world@Vector(c)).z for c in body.evaluated_get(dep).bound_box)
  if low<.012:
   p=rig.pose.bones['root'];p.location.y+=.012-low;p.keyframe_insert('location',index=1,frame=i+1,group='root')
 for fc in a.fcurves:
  for k in fc.keyframe_points:k.interpolation='LINEAR'
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,a);strip.action_frame_start=1;strip.action_frame_end=1+duration*FPS;track.mute=True
 return a
def idle(t,p):
 v=math.sin(p*math.tau);return({'chest':(.012*v,0,0),'head':(-.012*v,0,.012*v),'tailBaseR':(.02*v,0,.025*v),'tailBaseL':(-.02*v,0,-.025*v),'tailTipR':(.025*v,0,0),'tailTipL':(-.025*v,0,0)},0)
action('Idle',2,idle)
for name,dur,amp in [('Walk',1.2,.30),('Run',.8,.50)]:
 def locomotion(t,p,amp=amp):
  v=math.sin(p*math.tau)*amp;return({'thighR':(v,0,0),'thighL':(-v,0,0),'shinR':(max(0,-v)*.85,0,0),'shinL':(max(0,v)*.85,0,0),'chest':(.04,0,.02*math.sin(p*math.tau)),'weapon':(.035*math.sin(p*math.tau),0,0),'tailBaseR':(.07*math.sin(p*math.tau),0,.04*math.sin(p*math.tau)),'tailBaseL':(-.07*math.sin(p*math.tau),0,-.04*math.sin(p*math.tau)),'tailTipR':(.08*math.sin(p*math.tau),0,0),'tailTipL':(-.08*math.sin(p*math.tau),0,0)},abs(math.sin(p*math.tau))*.025)
 action(name,dur,locomotion)
action('Aim',1,lambda t,p:({'weapon':(-.05*math.sin(p*math.pi),0,0),'chest':(.035*math.sin(p*math.pi),0,0),'head':(-.035*math.sin(p*math.pi),0,0)},0))
clips={'BasicAttack':(.25,.60,.10),'MaleficBomb':(.25,.60,.16),'VoidProjectile':(.40,.75,.12),'DestructionRush':(.65,1.10,.24)}
for name,(release,dur,power) in clips.items():
 def shoot(t,p,r=release,d=dur,k=power):
  anticipate=math.sin(math.pi*min(1,t/r))*.06 if t<r else 0;recoil=math.sin(min(1,max(0,(t-r)/.12))*math.pi)*k if t>=r else 0;settle=max(0,1-max(0,t-r)/max(.01,d-r));brace=math.sin(min(1,t/r)*math.pi/2)*settle
  return({'weapon':(-anticipate-recoil,0,0),'chest':(.025*brace-recoil*.35,0,-.025*brace),'head':(-.02*brace+recoil*.15,0,.02*brace),'thighR':(-.025*brace,0,0),'thighL':(-.025*brace,0,0),'tailBaseR':(-recoil*.35,0,.015*brace),'tailBaseL':(-recoil*.35,0,-.015*brace),'tailTipR':(recoil*.5,0,0),'tailTipL':(recoil*.5,0,0)},-.012*brace)
 action(name,dur,shoot)
action('HitReact',.4,lambda t,p:({'chest':(-.12*math.sin(p*math.pi),0,0),'head':(-.06*math.sin(p*math.pi),0,0)},0))
action('Death',1.5,lambda t,p:({'root':(min(1,p*1.7)*1.5,0,.1*min(1,p*2))},min(1,p*1.7)*.6))
rig.animation_data.action=None
for p in rig.pose.bones:p.rotation_euler=(0,0,0);p.location=(0,0,0)
bpy.context.scene.frame_set(1);bpy.context.preferences.filepaths.save_version=0
source=ROOT/'assets/source_blender/layla-rework-preview.blend';source.parent.mkdir(parents=True,exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath=str(source))
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'layla-rework.glb'),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_frame_range=False,export_anim_slide_to_zero=True,export_skins=True,export_apply=False)
manifest={'author':'Original custom contour anatomy/outfit/twin-tail/gun geometry, authored rig/IK and baked clips. No imported official assets/textures.','revision':'layla-workshop-r1','approval':'UNAPPROVED PREVIEW ONLY','bones':list(bones),'clips':[{'name':a.name,'duration':(a.frame_range[1]-a.frame_range[0])/FPS}for a in bpy.data.actions],'sourceRelease':{n:r for n,(r,d,k) in clips.items()},'sourceDuration':{n:d for n,(r,d,k) in clips.items()},'vertices':len(body.data.vertices),'polygons':len(body.data.polygons),'blender':bpy.app.version_string,'limits':['Stylized original interpretation, not official asset or commercial likeness guarantee','Rigid-panel outfit; no cloth/fur or facial expressions','Two bones per tail with keyed motion; no hair physics','Arm IK baked in GLB; no arbitrary-aim runtime IK','In-place walk/run, no foot-plant/navigation system','Fingers modeled but not separately rigged']}
(OUT.parent/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest,indent=2));sys.stdout.flush();os._exit(0)
