"""Original local raster menu icons/flags. Optional regeneration requires Pillow.
No screenshots or third-party icon packs used. Never touches Layla illustration.
"""
from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import math
ROOT=Path(__file__).resolve().parent.parent/'src/menu/assets'
def star(x,y,r,n=5,inner=.45):
 return [(x+math.cos(-math.pi/2+i*math.pi/n)*r*(1 if i%2==0 else inner),y+math.sin(-math.pi/2+i*math.pi/n)*r*(1 if i%2==0 else inner)) for i in range(n*2)]
def icon(name):
 im=Image.new('RGBA',(192,192));d=ImageDraw.Draw(im)
 gold='#edcb83';light='#fff2ba';blue='#66e7ef';navy='#173d60'
 d.ellipse((16,16,176,176),fill='#071c36aa',outline='#ae8c53',width=3)
 d.polygon([(96,24),(156,65),(148,139),(96,168),(44,139),(36,65)],fill=navy,outline=gold,width=3)
 if name in ('profile','heroes','male','female'):
  d.ellipse((73,49,119,98), fill=gold)
  d.pieslice((49,98,143,162),180,360,fill=gold)
  if name=='female':d.arc((60,38,133,122),170,370,fill=blue,width=12)
  else:d.polygon([(70,61),(96,42),(122,61),(116,78),(96,64),(76,78)],fill=light)
 elif name=='mail':
  d.rounded_rectangle((46,61,146,128),6,fill=gold);d.line([(49,65),(96,104),(143,65)],fill=navy,width=7)
 elif name=='friends':
  for x,y in [(70,84),(122,84),(96,63)]:d.ellipse((x-13,y-14,x+13,y+14),fill=gold)
  d.rounded_rectangle((48,105,144,133),12,fill=gold)
 elif name=='resources':
  d.ellipse((58,49,134,143),fill=gold,outline=light,width=6);d.polygon([(96,64),(115,96),(96,126),(77,96)],fill=blue)
 elif name=='settings':
  d.polygon(star(96,96,53,12,.82),fill=gold);d.ellipse((70,70,122,122),fill=navy,outline=light,width=5);d.ellipse((85,85,107,107),fill=blue)
 elif name=='shop':
  d.rectangle((57,83,135,138),fill=gold);d.polygon([(45,85),(61,52),(131,52),(147,85)],fill=light);d.rectangle((85,104,108,138),fill=navy)
  for x in (61,86,111):d.rectangle((x,58,x+10,81),fill='#b1864e')
 elif name in ('events','daily'):
  d.rounded_rectangle((54,57,138,139),7,fill=gold);d.rectangle((54,72,138,82),fill=navy)
  for x in (70,122):d.line((x,47,x,67),fill=light,width=8)
  if name=='events':d.polygon(star(96,110,24),fill=navy)
  else:
   for x in (73,96,119):
    for y in (98,120):d.rectangle((x-5,y-5,x+5,y+5),fill=navy)
 elif name in ('starlight','achievements','ranked'):
  if name!='starlight':
   d.polygon([(48,77),(27,65),(50,117),(82,125),(96,151),(110,125),(142,117),(165,65),(144,77),(133,119),(59,119)],fill=gold)
  d.polygon(star(96,88,44),fill=gold,outline=light,width=3);d.polygon(star(96,88,24),fill=blue)
 elif name=='inventory':
  d.rounded_rectangle((49,67,143,134),8,fill=gold);d.rectangle((49,91,143,103),fill=navy);d.rectangle((87,90,105,119),fill=light)
 elif name in ('preparation','brawl'):
  for flip in (False,True):
   pts=[(63,136),(79,99),(119,48),(135,44),(133,63),(89,106),(75,142)]
   if flip:pts=[(192-x,y) for x,y in pts]
   d.polygon(pts,fill=gold,outline=light,width=3)
  d.ellipse((87,87,105,105),fill=blue)
 elif name=='classic':
  d.rectangle((61,74,131,137),fill=gold)
  for x in (52,82,112):d.rectangle((x,52,x+26,91),fill=gold);d.polygon([(x-4,53),(x+13,34),(x+30,53)],fill=blue)
  d.rounded_rectangle((84,107,108,146),10,fill=navy)
 elif name=='training':
  for r,c in [(51,gold),(36,navy),(23,gold),(11,blue)]:d.ellipse((96-r,96-r,96+r,96+r),fill=c)
  d.line((96,29,96,55),fill=light,width=5);d.line((137,96,163,96),fill=light,width=5)
 elif name=='back':d.line([(115,54),(73,96),(115,138)],fill=gold,width=13)
 im.resize((96,96),Image.Resampling.LANCZOS).save(ROOT/'icons'/f'{name}.png')
for n in 'profile mail friends resources settings shop events starlight daily preparation heroes achievements inventory classic ranked brawl training male female back'.split():icon(n)
# Accurate local image flags, deliberately limited to PH/US/JP.
for country in ('PH','US','JP'):
 size={'PH':(480,240),'US':(380,200),'JP':(300,200)}[country]
 im=Image.new('RGB',size,'white');d=ImageDraw.Draw(im)
 if country=='PH':
  d.rectangle((0,0,480,120),fill='#0038a8');d.rectangle((0,120,480,240),fill='#ce1126');d.polygon([(0,0),(208,120),(0,240)],fill='white')
  d.ellipse((57,97,103,143),fill='#fcd116')
  for a in range(8):
   t=a*math.pi/4;d.line([(80+math.cos(t)*25,120+math.sin(t)*25),(80+math.cos(t)*38,120+math.sin(t)*38)],fill='#fcd116',width=5)
  for x,y in ((22,30),(22,210),(175,120)):d.polygon(star(x,y,13),fill='#fcd116')
 elif country=='US':
  for i in range(13):
   if i%2==0:d.rectangle((0,round(i*200/13),380,round((i+1)*200/13)),fill='#b22234')
  d.rectangle((0,0,152,108),fill='#3c3b6e')
  for row in range(9):
   for col in range(6 if row%2==0 else 5):d.polygon(star(13+col*25+(12.5 if row%2 else 0),7+row*11.5,5),fill='white')
 else:d.ellipse((90,40,210,160),fill='#bc002d')
 im.save(ROOT/'flags'/f'{country}.png')
print('Created 20 original PNG icons and exactly 3 local country flags.')
