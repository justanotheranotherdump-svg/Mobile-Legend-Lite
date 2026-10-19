"""63 original individual PNG illustrations, no downloaded/reference pixels.
Pillow authors explicit item-specific vector-like silhouettes at 512px then
supersamples to square RGBA tiles. Runtime loads committed PNGs, not Python.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import json, math, hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'src/ui/assets/items';OUT.mkdir(exist_ok=True)
items=json.loads((ROOT/'src/data/match/extra-items.json').read_text())['items']+json.loads((ROOT/'src/data/match/special-equipment.json').read_text())['items']
manifest=[]
for item in items:
 id=item['id'];seed=int(hashlib.sha256(id.encode()).hexdigest()[:8],16)
 palettes=[(125,91,219),(66,164,223),(210,95,144),(80,190,153),(225,173,79)]
 c=palettes[seed%5];dark=(18,27,43);gold=(226,194,114);silver=(194,219,230);white=(236,247,250)
 im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im)
 # Consistent badge frame, but the equipment itself is never a generic badge.
 d.rounded_rectangle((14,14,498,498),radius=80,fill=(15,29,48),outline=(130,157,173),width=8)
 light=Image.new('RGBA',(512,512));g=ImageDraw.Draw(light);g.ellipse((70,45,450,470),fill=(*c,165));im=Image.alpha_composite(im,light.filter(ImageFilter.GaussianBlur(55)));d=ImageDraw.Draw(im)
 def poly(p,fill,outline=dark,width=8):d.polygon(p,fill);d.line(p+[p[0]],fill=outline,width=width,joint='curve')
 def line(p,fill=gold,width=10):d.line(p,fill=fill,width=width,joint='curve')
 def gem(x,y,rx,ry=None,color=None):
  ry=ry or rx;color=color or c;poly([(x,y-ry),(x+rx,y),(x,y+ry),(x-rx,y)],color,silver,5);line([(x,y-ry+8),(x-rx*.45,y),(x,y+ry-8),(x,y-ry+8),(x+rx-8,y)],white,3)
 def star(x,y,r=38,color=white):
  pts=[]
  for j in range(8):a=j*math.pi/4-math.pi/2;rr=r if j%2==0 else r*.25;pts.append((x+math.cos(a)*rr,y+math.sin(a)*rr))
  poly(pts,color,c,3)
 def flame(x,y,r,color=(237,107,48)):
  poly([(x,y-r*1.7),(x+r*.1,y-r*.4),(x+r*.65,y-r*.9),(x+r,y+r*.25),(x+r*.4,y+r),(x-r*.55,y+r),(x-r,y+r*.1),(x-r*.55,y-r*.75),(x-r*.25,y-r*.2)],color,gold,5);poly([(x,y-r*.5),(x+r*.4,y+r*.5),(x,y+r*.8),(x-r*.35,y+r*.45)],(255,228,129),color,4)
 def bottle(x,y,w,h,color,style=0):
  neck=w*.35;poly([(x-neck,y-h*.6),(x+neck,y-h*.6),(x+neck,y-h*.25),(x+w,y),(x+w*.85,y+h*.65),(x+w*.4,y+h),(x-w*.5,y+h),(x-w*.95,y+h*.6),(x-w,y),(x-neck,y-h*.25)],(66,98,119),silver,7);poly([(x-w*.75,y+h*.1),(x+w*.75,y+h*.1),(x+w*.65,y+h*.63),(x+w*.3,y+h*.84),(x-w*.38,y+h*.84),(x-w*.72,y+h*.5)],color,color,2);d.rounded_rectangle((x-neck-7,y-h*.68,x+neck+7,y-h*.5),radius=6,fill=gold,outline=dark,width=4);line([(x-w*.5,y),(x-w*.6,y+h*.45)],white,6)
 def leaf(x,y,scale=1,flip=1,color=(66,175,137)):
  poly([(x,y),(x+flip*65*scale,y-65*scale),(x+flip*100*scale,y-60*scale),(x+flip*105*scale,y-10*scale),(x+flip*35*scale,y+30*scale)],color,gold,4);line([(x,y),(x+flip*85*scale,y-40*scale)],silver,3)
 def wings(color,variant):
  for sign in [-1,1]:
   for j in range(5):
    if variant==0:pts=[(256+sign*12,230+j*24),(256+sign*(182-j*11),90+j*25),(256+sign*(144-j*8),238+j*29),(256+sign*25,347+j*12)]
    else:pts=[(256+sign*15,220+j*25),(256+sign*(200-j*15),110+j*20),(256+sign*(185-j*14),269+j*25),(256+sign*40,400-j*3)]
    poly(pts,color,gold if variant else silver,5)
  gem(256,287,40,90,(226,68,107) if variant==0 else (137,85,210))
 if id in ['mystery-codex','book-of-sages','tome-of-evil']:
  if id=='book-of-sages':
   for sg in [-1,1]:poly([(256,149),(256+sg*155,113),(256+sg*155,354),(256,405)],(222,217,183),gold,8)
   for j in range(5):line([(277,190+j*31),(383,163+j*31)],(95,132,151),5);line([(235,190+j*31),(129,163+j*31)],(95,132,151),5)
   gem(256,296,25,55)
  else:
   poly([(126,116),(334,82),(401,137),(389,384),(181,430),(113,378)],(115,66,139) if id=='mystery-codex' else (76,48,63),gold,9);poly([(145,132),(329,104),(374,140),(363,359),(181,402),(136,371)],c if id=='mystery-codex' else (48,48,65),silver,4);line([(161,141),(155,364)],gold,11)
   if id=='mystery-codex':gem(264,244,62,77);d.arc((223,204,305,294),25,330,fill=white,width=7)
   else:poly([(194,214),(235,191),(257,219),(280,185),(325,203),(307,259),(264,300),(222,267)],(185,63,101),gold,5);star(267,245,24)
   line([(173,384),(351,344)],gold,6)
 elif id in ['magic-necklace','healing-necklace']:
  color=(56,188,161) if id=='healing-necklace' else (102,126,228);d.arc((106,75,405,369),0,180,fill=gold,width=15)
  for j in range(11):a=math.pi*j/10;x=256+149*math.cos(a);y=200+150*math.sin(a);d.ellipse((x-12,y-12,x+12,y+12),fill=silver if j%2 else color,outline=gold,width=3)
  gem(256,361,62,72,color)
 elif id in ['power-crystal','vitality-crystal','holy-crystal']:
  color={'power-crystal':(64,166,236),'vitality-crystal':(224,83,116),'holy-crystal':(164,107,235)}[id]
  if id=='power-crystal':gem(256,250,95,164,color);gem(125,339,30,63,color)
  elif id=='vitality-crystal':poly([(172,151),(240,83),(335,121),(362,264),(292,409),(166,368),(126,246)],color,silver,7);line([(240,83),(218,233),(166,368),(292,409),(284,230),(335,121)],white,5)
  else:
   for j in range(8):a=j*math.pi/4;line([(256+math.cos(a)*105,256+math.sin(a)*105),(256+math.cos(a)*195,256+math.sin(a)*195)],gold,7)
   gem(256,253,112,168,color);gem(131,344,38,70,color);gem(383,344,38,70,color)
 elif id=='expert-gloves':
  poly([(139,352),(130,221),(168,172),(204,204),(220,139),(253,167),(279,140),(309,176),(340,164),(369,209),(352,337),(293,415),(182,403)],(87,62,111),gold,9)
  for j in range(4):line([(168+j*50,218),(185+j*45,294)],silver,17)
  gem(252,327,61,55,(155,96,230))
 elif id=='enchanted-talisman':
  d.arc((113,56,399,340),180,360,fill=gold,width=15);poly([(184,177),(252,140),(327,177),(357,281),(324,370),(256,429),(181,369),(153,281)],(76,141,163),gold,9);poly([(202,201),(256,179),(307,202),(324,278),(298,349),(256,389),(207,349),(181,278)],(58,86,127),silver,6);star(256,281,78,(126,217,230));gem(256,280,30,47,(204,172,239))
 elif id=='lightning-truncheon':
  line([(142,427),(294,171)],gold,26);poly([(228,201),(229,121),(279,71),(343,94),(388,162),(359,235),(299,270)],(67,114,153),silver,9);poly([(303,107),(260,174),(298,167),(275,226),(349,146),(310,153)],(177,229,244),gold,5);star(392,98,31);line([(206,307),(227,321)],silver,19)
 elif id in ['magic-wand','genius-wand','glowing-wand','ice-queen-wand']:
  line([(145,425),(304,154)],gold,24);line([(156,416),(312,150)],silver,6)
  if id=='magic-wand':d.arc((198,64,387,239),-90,190,fill=gold,width=20);gem(298,139,44,66,(110,152,239));star(385,102,23)
  elif id=='glowing-wand':poly([(240,188),(358,188),(339,253),(280,277)],(112,69,55),gold,7);flame(301,136,78)
  elif id=='genius-wand':
   for j in range(3):d.arc((205+j*17,65+j*17,398-j*17,258-j*17),25+j*45,295+j*45,fill=(174,118,224),width=13)
   gem(302,160,32,49,(190,122,241));star(216,90,20)
  else:
   for j in range(6):a=j*math.pi/3;x=299+math.cos(a)*91;y=151+math.sin(a)*91;line([(299,151),(x,y)],(153,229,244),13);line([(x,y),(x-26*math.cos(a+.7),y-26*math.sin(a+.7))],silver,7)
   gem(299,151,39,54,(91,193,237))
 elif id in ['azure-blade','divine-glaive','starlium-scythe']:
  line([(117,425),(312,148)],gold,24);gem(151,376,22)
  if id=='azure-blade':poly([(208,306),(267,148),(385,63),(363,222),(255,318)],(99,198,235),silver,9);line([(244,298),(359,103)],white,6);line([(174,278),(293,345)],gold,23)
  elif id=='divine-glaive':poly([(185,174),(224,83),(325,57),(416,129),(429,209),(343,167),(290,176),(263,247),(199,281),(230,199)],(220,218,177),gold,8);gem(315,137,34,49)
  else:poly([(162,160),(236,67),(356,57),(443,143),(424,250),(358,169),(294,123),(224,154)],(156,158,235),silver,8);star(304,125,43);line([(327,175),(366,221)],gold,10)
 elif id in ['blood-wings','queens-wings']:wings((187,58,101) if id=='blood-wings' else (79,66,111),0 if id=='blood-wings' else 1)
 elif id=='clock-of-destiny':
  for j in range(12):a=j*math.pi/6;poly([(256+math.cos(a)*131,243+math.sin(a)*131),(256+math.cos(a)*177,243+math.sin(a)*177),(256+math.cos(a+.17)*177,243+math.sin(a+.17)*177),(256+math.cos(a+.17)*131,243+math.sin(a+.17)*131)],gold)
  d.ellipse((110,97,402,389),fill=(47,67,94),outline=gold,width=16);d.ellipse((137,124,375,362),outline=silver,width=7)
  for j in range(12):a=j*math.pi/6;line([(256+math.cos(a)*96,243+math.sin(a)*96),(256+math.cos(a)*108,243+math.sin(a)*108)],gold,6)
  line([(216,193),(256,243),(309,228)],white,13);gem(256,243,14);poly([(216,403),(298,403),(319,434),(197,434)],gold)
 elif id=='concentrated-energy':
  for j in range(3):a=j*2*math.pi/3;x=256+math.cos(a)*65;y=254+math.sin(a)*65;d.ellipse((x-105,y-105,x+105,y+105),outline=gold if j==0 else (169,126,231),width=15)
  gem(256,255,73,100,(159,84,225));star(120,112,27);star(394,393,22)
 elif id in ['elegant-gem','mystic-container']:
  if id=='elegant-gem':
   poly([(140,294),(165,126),(256,82),(347,126),(374,294),(320,394),(192,394)],gold,silver,8);gem(256,247,86,139,(167,93,222));poly([(151,285),(207,343),(256,382),(306,343),(364,285),(339,402),(173,402)],(195,153,77),gold,5)
  else:
   poly([(129,176),(178,116),(337,116),(388,177),(372,368),(310,422),(191,416),(138,360)],(62,71,99),gold,9);d.ellipse((157,155,355,349),fill=(111,57,177),outline=silver,width=11);star(256,250,81,(201,156,243));line([(150,182),(362,359),(150,359),(362,182)],gold,12)
 elif id in ['flask-of-the-oasis','magic-potion','rock-potion']:
  if id=='flask-of-the-oasis':bottle(250,217,99,181,(72,188,153));leaf(307,181,.65,1);leaf(189,271,.6,-1);star(257,306,33)
  elif id=='magic-potion':bottle(250,211,110,182,(94,123,226));d.ellipse((219,294,279,354),outline=white,width=8);star(351,164,31)
  else:bottle(250,216,105,178,(173,137,75));poly([(201,264),(251,237),(299,273),(279,339),(218,350),(181,309)],(130,128,116),silver,7);line([(251,237),(245,286),(279,339)],gold,4)
 elif id=='exotic-veil':
  poly([(121,93),(366,97),(405,216),(350,419),(282,351),(190,423),(110,268)],(129,77,197),gold,7)
  for j in range(6):line([(146+j*36,123),(168+j*28,338)],(187,137,224),5)
  d.arc((136,97,371,305),0,180,fill=gold,width=13);gem(256,220,45,72)
 elif id=='feather-of-heaven':
  line([(121,432),(370,88)],gold,12)
  for j in range(8):x=157+j*26;y=383-j*35;poly([(x,y),(x-42,y-85),(x+40,y-90),(x+63,y-17)],(128+j*8,210,225),silver,4)
  star(352,121,33)
 elif id in ['fleeting-time','winter-crown']:
  if id=='fleeting-time':
   poly([(161,102),(351,102),(328,139),(293,225),(293,280),(338,383),(357,414),(156,414),(176,379),(218,280),(218,225),(176,139)],(127,83,173),gold,10);poly([(192,150),(321,150),(282,223),(256,245),(233,224)],(151,216,235),silver,5);poly([(256,292),(311,373),(198,373)],(233,196,107),gold,5);line([(156,102),(357,102)],white,13);line([(155,415),(358,415)],white,13)
  else:
   poly([(102,171),(183,248),(201,98),(261,204),(330,92),(340,248),(418,171),(368,385),(144,385)],(103,172,206),silver,9);line([(154,345),(357,345)],gold,15)
   for x,y in [(165,288),(254,263),(345,288)]:gem(x,y,25,45,(165,226,245))
   star(260,156,31)
 elif id=='wishing-lantern':
  line([(256,72),(256,118)],gold,10);d.arc((208,46,304,138),180,360,fill=gold,width=12);poly([(127,159),(203,112),(311,112),(389,159),(359,352),(307,407),(204,407),(152,352)],(118,88,151),gold,9)
  for j in range(4):line([(169+j*55,164),(184+j*47,356)],gold,8)
  gem(256,263,64,92,(208,146,223));line([(208,408),(303,408)],silver,12);line([(256,412),(256,455)],gold,10)
 elif id=='sky-piercer':
  poly([(93,362),(258,173),(309,70),(347,174),(422,214),(326,258),(163,425)],(147,51,91),gold,8);poly([(144,361),(296,195),(317,118),(331,204),(384,217),(305,232),(176,395)],(232,168,163),silver,5);gem(275,271,35,49,(223,83,113))
 elif id in ['ares-belt','thunder-belt']:
  color=(66,123,96) if id=='ares-belt' else (62,111,151);poly([(78,171),(207,186),(309,186),(429,161),(443,300),(318,332),(203,332),(79,319)],color,gold,9)
  for x in [112,151,362,403]:d.ellipse((x-9,222,x+9,240),fill=silver)
  d.rounded_rectangle((176,154,337,355),radius=35,fill=gold,outline=silver,width=8);d.rounded_rectangle((196,176,317,333),radius=23,fill=dark,outline=color,width=7)
  if id=='ares-belt':gem(256,254,45,66,(92,187,126))
  else:poly([(272,180),(214,269),(254,263),(237,331),(303,234),(263,241)],(163,225,242),gold,4)
 elif id=='heros-ring':
  d.ellipse((110,149,400,439),outline=gold,width=42);d.arc((120,160,388,427),20,165,fill=silver,width=10);poly([(153,182),(185,112),(259,71),(331,113),(362,181),(305,217),(210,217)],gold,silver,6);gem(258,146,65,71,(160,101,220))
 elif id=='dominance-ice':
  poly([(121,133),(192,161),(256,93),(323,161),(392,133),(407,293),(354,373),(257,427),(158,373),(106,294)],(61,106,151),silver,9);poly([(160,183),(256,152),(354,185),(329,322),(257,380),(183,321)],(74,144,180),gold,6)
  for sg in [-1,1]:poly([(256+sg*15,243),(256+sg*100,116),(256+sg*82,267),(256+sg*34,315)],(150,224,234),silver,5)
  gem(256,264,39,79,(114,197,232));star(256,150,29)
 elif id in ['black-ice-shield','athenas-shield']:
  if id=='black-ice-shield':
   poly([(114,119),(185,144),(256,90),(325,144),(398,120),(377,305),(256,430),(135,305)],(63,96,132),silver,9);poly([(153,160),(256,139),(359,161),(339,290),(256,371),(174,290)],(90,157,196),gold,5)
   for j in range(6):a=j*math.pi/3;line([(256,249),(256+math.cos(a)*77,249+math.sin(a)*77)],white,10)
   gem(256,249,30,44,(149,221,241))
  else:
   poly([(104,146),(256,78),(407,146),(375,330),(256,431),(137,330)],gold,silver,9);poly([(132,166),(256,108),(379,166),(347,309),(256,391),(164,309)],(66,110,130),gold,7);d.ellipse((179,168,333,337),fill=(91,174,190),outline=silver,width=13);star(256,250,66,(203,242,234))
 elif id in ['antique-cuirass','blade-armor','brute-force-breastplate','chastise-pauldron','dreadnaught-armor','radiant-armor']:
  variants=['antique-cuirass','blade-armor','brute-force-breastplate','chastise-pauldron','dreadnaught-armor','radiant-armor'];v=variants.index(id);colors=[(162,116,73),(86,111,133),(94,104,126),(132,72,117),(78,74,97),(199,165,92)];color=colors[v]
  poly([(149,102),(207,139),(307,139),(364,102),(425,183),(381,241),(362,403),(286,434),(222,434),(151,399),(131,242),(87,182)],color,gold if v in [0,5] else silver,9)
  poly([(181,173),(253,201),(330,171),(344,329),(292,388),(219,387),(169,331)],(30+v*11,54+v*8,79+v*7),gold,6)
  if v==0:
   for y in [233,283,334]:line([(185,y),(256,y+24),(328,y)],gold,17)
   gem(257,218,28)
  elif v==1:
   for sg in [-1,1]:
    for j in range(3):poly([(256+sg*(83+j*18),194+j*57),(256+sg*(151+j*9),147+j*52),(256+sg*(116+j*16),246+j*48)],silver,dark,5)
   line([(256,203),(256,371)],gold,14)
  elif v==2:
   for sg in [-1,1]:poly([(256,266),(256+sg*100,209),(256+sg*64,338),(256+sg*17,302)],silver,gold,5)
   gem(256,268,39,66,(85,184,192));poly([(217,350),(256,375),(293,350),(281,412),(232,412)],gold)
  elif v==3:poly([(185,216),(229,248),(259,201),(288,247),(333,216),(304,299),(256,345),(206,299)],(208,102,133),silver,5);star(257,282,39)
  elif v==4:poly([(173,204),(256,274),(340,204),(311,306),(256,371),(198,304)],(103,75,151),silver,9);gem(256,295,31,52)
  else:
   for j in range(8):a=j*math.pi/4;line([(256+math.cos(a)*41,275+math.sin(a)*41),(256+math.cos(a)*88,275+math.sin(a)*88)],gold,11)
   gem(256,275,47,65,(226,225,157))
 elif id in ['guardian-helmet','cursed-helmet']:
  if id=='cursed-helmet':flame(256,139,93,(233,97,50))
  poly([(154,190),(190,112),(257,88),(328,118),(363,201),(351,334),(292,416),(218,419),(160,350)],(116,72,85) if id=='guardian-helmet' else (71,66,77),gold,9)
  poly([(178,222),(256,251),(338,224),(321,335),(257,382),(193,336)],dark,silver,6)
  if id=='guardian-helmet':line([(254,109),(254,211)],gold,19);poly([(187,243),(236,262),(228,285),(189,277)],(127,219,221));poly([(278,262),(325,243),(323,278),(283,285)],(127,219,221));line([(256,259),(256,362)],gold,10)
  else:poly([(186,249),(238,264),(232,294),(199,297)],(245,133,53));poly([(277,264),(327,249),(312,297),(280,294)],(245,133,53));poly([(242,317),(272,317),(285,352),(228,352)],gold);gem(256,184,33,49,(226,102,45))
 elif id in ['leather-jerkin','silence-robe','magic-resist-cloak']:
  if id=='leather-jerkin':
   poly([(142,127),(203,98),(217,159),(295,159),(312,97),(372,127),(352,252),(365,399),(282,425),(256,390),(227,425),(144,399),(159,252)],(137,96,64),gold,8);line([(256,163),(256,389)],silver,7)
   for j in range(5):line([(230,191+j*35),(281,210+j*35),(230,226+j*35)],(224,199,139),5)
  else:
   col=(71,113,165) if id=='silence-robe' else (153,80,112);poly([(201,105),(255,69),(315,108),(342,184),(403,370),(328,424),(257,399),(182,428),(107,370),(171,184)],col,gold,7);poly([(202,147),(255,110),(312,147),(305,222),(258,254),(208,224)],dark,silver,5)
   for x in [173,211,303,341]:line([(x,260),(x-20 if x<256 else x+20,375)],(187,186,203),5)
   if id=='magic-resist-cloak':gem(258,265,32,45,(140,221,207))
   else:line([(208,179),(306,179)],gold,9);star(256,308,34)
 elif id=='steel-legplates':
  for sg in [-1,1]:
   x=256+sg*93;poly([(x-54,87),(x+53,87),(x+57,245),(x+39,365),(x+67,407),(x-57,426),(x-66,366),(x-47,242)],(99,133,158),silver,8);poly([(x-44,205),(x,173),(x+45,204),(x+32,266),(x,287),(x-33,263)],gold,silver,5);line([(x,293),(x,363)],white,7)
 elif id=='molten-essence':flame(256,241,129);gem(256,303,42,66,(242,173,59));d.arc((110,232,406,440),-10,190,fill=gold,width=14)
 elif id=='oracle':
  poly([(104,324),(214,307),(256,343),(301,307),(409,324),(379,399),(256,423),(131,397)],(107,141,118),gold,9);d.ellipse((145,85,367,307),fill=(66,110,121),outline=gold,width=15);d.ellipse((177,117,334,276),fill=(105,201,185),outline=silver,width=7);star(255,196,65);line([(255,312),(255,410)],gold,9)
 elif id=='immortality':
  wings((181,169,99),1);poly([(224,112),(289,112),(289,209),(362,209),(362,267),(289,267),(289,389),(224,389),(224,267),(151,267),(151,209),(224,209)],gold,silver,6);gem(256,239,34,51,(155,218,183))
 elif id in ['bloody-retribution','flame-retribution','ice-retribution']:
  line([(151,419),(309,143)],gold,25)
  if id=='bloody-retribution':poly([(149,173),(211,91),(316,80),(404,136),(404,248),(346,286),(348,182),(273,137),(217,185)],(191,67,111),silver,8);gem(278,169,29,49,(243,120,143));poly([(193,269),(224,325),(204,364),(175,331)],(217,63,100),gold,4)
  elif id=='flame-retribution':flame(301,153,94);poly([(262,233),(339,233),(321,292),(275,292)],(171,102,54),gold,8);star(131,321,29,(244,180,72))
  else:poly([(204,143),(234,56),(287,101),(324,57),(355,113),(399,94),(384,201),(313,259),(250,218)],(108,202,226),silver,7);line([(241,119),(352,210),(312,249),(312,107)],white,6)
 elif id=='conceal':
  poly([(137,168),(198,87),(283,78),(358,137),(391,236),(368,406),(300,374),(260,420),(185,386),(122,400),(116,256)],(61,142,119),gold,8);poly([(178,185),(244,139),(318,175),(337,269),(287,328),(218,329),(167,271)],dark,silver,7);line([(188,225),(231,238),(278,234),(313,213)],(153,228,197),10);poly([(181,269),(255,293),(321,265),(302,329),(211,329)],(90,163,142),gold,4)
 elif id=='dire-hit':
  for a in [0,2*math.pi/3,4*math.pi/3]:
   def pt(x,y):return(256+x*math.cos(a)-y*math.sin(a),256+x*math.sin(a)+y*math.cos(a))
   poly([pt(-20,16),pt(-54,-94),pt(-4,-188),pt(34,-77),pt(61,-31),pt(14,21)],(204,80,113),silver,7)
  gem(256,256,53,61,(239,151,167))
 elif id=='encourage':
  poly([(101,285),(199,213),(308,173),(368,124),(409,209),(348,230),(248,298),(145,347)],(200,166,82),silver,9);poly([(339,118),(381,94),(434,193),(412,219),(378,181)],gold,silver,7);poly([(246,288),(276,291),(292,383),(243,406),(220,365)],(92,117,151),gold,7);line([(145,306),(180,329)],gold,19);star(113,154,38);line([(147,108),(167,138)],white,9)
 elif id=='favor':
  line([(161,421),(311,128)],gold,20);leaf(234,302,.8,-1);leaf(289,236,.7,1);poly([(259,160),(245,123),(263,83),(300,77),(323,105),(347,76),(385,88),(403,119),(390,160),(325,222)],(93,194,151),silver,6);star(324,144,37,(207,241,194));gem(191,373,27,40,(112,226,161))
 elif id in ['flower-of-hope','lantern-of-hope']:
  line([(254,253),(238,431)],gold,15);leaf(246,351,.9,1);leaf(248,301,.8,-1)
  if id=='flower-of-hope':
   for j in range(5):a=j*2*math.pi/5;x=256+math.cos(a)*79;y=209+math.sin(a)*79;d.ellipse((x-55,y-55,x+55,y+55),fill=(211,129+j*8,182),outline=silver,width=6)
   gem(256,209,46,52,(233,219,142))
  else:
   for sg in [-1,1]:poly([(256,309),(256+sg*116,201),(256+sg*88,92),(256+sg*37,122),(256+sg*63,213)],(82,154,133),gold,6)
   poly([(190,169),(256,105),(322,169),(309,278),(256,332),(204,278)],(119,174,144),silver,7);gem(256,223,48,82,(226,231,148));star(257,221,27)
 else:raise RuntimeError('Missing explicit original illustration: '+id)
 # Original highlights, bounded framing, real separate PNG payload per ID.
 d.arc((32,32,480,480),210,290,fill=(196,216,228,220),width=5)
 im=im.resize((160,160),Image.Resampling.LANCZOS);path=OUT/(id+'.png');im.save(path,optimize=True)
 manifest.append(dict(id=id,path=str(path.relative_to(ROOT)),width=160,height=160,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),author='Original local procedural illustration; explicit silhouette in scripts/create-expansion-art.py',source='No downloaded art, reference-image pixels, emoji or runtime asset service'))
(ROOT/'docs/preparation-expansion-asset-manifest.json').write_text(json.dumps({'version':1,'count':len(manifest),'assets':manifest},indent=2)+'\n')
print(len(manifest),'individual original PNGs authored')
