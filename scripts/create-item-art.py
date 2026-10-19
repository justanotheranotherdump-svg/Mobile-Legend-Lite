"""Author original local equipment illustrations. No reference pixels/assets used.
Optional development dependency: Pillow. Committed PNGs require no Python at runtime.
"""
import json,math,hashlib
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
root=Path(__file__).resolve().parents[1];out=root/'src/ui/assets/items';out.mkdir(parents=True,exist_ok=True)
for item in json.loads((root/'src/data/match/items.json').read_text())['items']:
 if item.get('legacy'):continue
 id=item['id'];seed=int(hashlib.sha256(id.encode()).hexdigest()[:8],16);pal=[(53,183,233),(175,78,230),(225,167,45),(215,65,98),(57,196,136)];c=({'arcane-boots':(65,154,238),'basic-boots':(165,112,69),'demon-shoes':(56,198,206),'magic-shoes':(221,62,105),'rapid-boots':(218,192,103),'swift-boots':(229,147,53),'tough-boots':(159,83,232),'warrior-boots':(73,171,116)}.get(id,pal[seed%len(pal)]));N=512;im=Image.new('RGBA',(N,N));pix=im.load()
 for y in range(N):
  for x in range(N):
   r=math.hypot(x-256,y-256)/248
   if r<1:
    light=max(0,1-r)*.9+max(0,1-math.hypot(x-210,y-145)/420)*.3;pix[x,y]=(int(12+c[0]*light*.32),int(18+c[1]*light*.32),int(30+c[2]*light*.4),255)
 d=ImageDraw.Draw(im);d.ellipse((10,10,502,502),outline=(173,196,215,255),width=8);d.ellipse((23,23,489,489),outline=(*c,255),width=5)
 glow=Image.new('RGBA',im.size);g=ImageDraw.Draw(glow);g.ellipse((75,85,430,445),fill=(*c,95));im=Image.alpha_composite(im,glow.filter(ImageFilter.GaussianBlur(32)));d=ImageDraw.Draw(im)
 def poly(points,fill,outline=(15,25,40),w=8):d.polygon(points,fill=fill);d.line(points+[points[0]],fill=outline,width=w,joint='curve')
 def gem(x,y,r=28):poly([(x,y-r),(x+r,y),(x,y+r),(x-r,y)],c,(236,230,191),4);d.line([(x,y-r+6),(x,y+r-6)],fill=(213,250,255),width=3)
 if item['category']=='Movement':
  poly([(181,103),(323,103),(305,273),(369,327),(403,342),(398,392),(144,392),(120,356),(165,291)],(59,66,88));poly([(195,111),(301,111),(282,284),(335,322),(291,342),(173,328)],c);poly([(144,355),(299,366),(381,345),(393,375),(151,382)],(234,202,124));d.line([(189,138),(291,150),(185,196),(285,210),(177,254),(279,270)],fill=(235,216,162),width=9);gem(311,320,30)
  if id!='basic-boots':
   if id in ['rapid-boots','swift-boots']:
    for offset in range(3):poly([(144,318-offset*23),(63-offset*8,255-offset*38),(151,285-offset*21)],(235,220,159),c,3)
   elif id in ['tough-boots','warrior-boots']:
    poly([(229,139),(276,158),(268,215),(231,241),(196,215),(189,158)],(222,228,216),c,4);gem(232,181,21)
   else:
    for angle in range(4):
     a=angle*math.pi/2;d.line([(235+math.cos(a)*8,183+math.sin(a)*8),(235+math.cos(a)*39,183+math.sin(a)*39)],fill=(220,245,255),width=9)
 elif id=='haas-claws':
  poly([(118,343),(179,266),(267,267),(330,349),(257,411),(167,391)],(114,64,87))
  for off in range(3):poly([(153+off*69,310),(174+off*70,152-off*15),(211+off*69,97),(207+off*66,251),(194+off*64,330)],(221,229,235),c,7)
  gem(234,354,34)
 elif id=='corrosion-scythe':
  d.line([(144,422),(306,136)],fill=(216,177,112),width=24);poly([(132,190),(191,86),(318,66),(420,146),(389,253),(347,180),(271,135),(193,150)],c);gem(282,121,31)
 elif any(t in id for t in ['bow','windtalker']):
  d.arc((100,76,387,424),-100,100,fill=(225,200,139),width=30);d.line([(244,89),(244,422)],fill=(207,246,255),width=6);poly([(92,337),(331,139),(325,224)],(176,226,245));poly([(331,139),(376,105),(353,180)],c);gem(298,269,31)
 elif any(t in id for t in ['meteor','magic-blade']):
  poly([(103,360),(246,87),(346,95),(413,195),(286,332),(103,400)],c);poly([(185,288),(261,112),(328,121),(376,190),(276,286)],(223,232,242));gem(276,218,61);d.line([(163,339),(274,312),(364,228)],fill=(244,199,107),width=15)
 elif any(t in id for t in ['staff','spear','javelin','halberd']):
  d.line([(122,415),(351,113)],fill=(25,31,46),width=43);d.line([(126,409),(351,113)],fill=(219,173,97),width=24);poly([(286,137),(336,55),(409,79),(415,151),(349,204)],c);gem(354,129,40);d.line([(122,411),(161,421)],fill=(223,235,239),width=14)
 elif any(t in id for t in ['axe','hammer','tomahawk','mallet']):
  d.line([(140,416),(327,134)],fill=(37,28,24),width=45);d.line([(140,409),(323,137)],fill=(168,124,77),width=27);poly([(156,169),(272,81),(380,117),(424,222),(332,276),(266,208),(193,244)],(181,203,217));poly([(284,97),(368,132),(401,209),(331,243),(289,194)],c);gem(284,166,30)
 elif 'gun' in id or 'roar' in id:
  poly([(104,281),(156,194),(377,100),(416,176),(267,264),(271,352),(222,404),(181,290)],(193,206,215));poly([(156,209),(367,124),(385,166),(218,245)],c);d.line([(153,267),(235,281)],fill=(239,202,123),width=20);gem(243,222,33)
 elif 'nature' in id:
  poly([(256,74),(405,153),(382,308),(256,423),(130,308),(107,153)],(211,226,239));poly([(256,110),(367,173),(342,291),(256,373),(170,291),(145,173)],c);gem(256,236,64)
 else:
  poly([(118,407),(164,333),(137,305),(176,274),(207,298),(340,88),(409,64),(389,145),(257,339),(287,364),(255,397),(221,373),(168,439)],(191,215,230));poly([(215,299),(346,104),(388,83),(369,139),(243,326)],c);d.line([(181,300),(264,371)],fill=(244,211,140),width=21);d.line([(132,415),(202,346)],fill=(120,79,56),width=22);gem(219,340,22)
 for k in range(3):
  x=72+(seed//(k+1)%350);y=70+(seed//(k+8)%350);d.line([(x-9,y),(x+9,y)],fill=(217,240,255,170),width=2);d.line([(x,y-9),(x,y+9)],fill=(217,240,255,170),width=2)
 im.resize((128,128),Image.Resampling.LANCZOS).save(out/f'{id}.png',optimize=True)
print('Authored 37 original equipment PNG icons')
