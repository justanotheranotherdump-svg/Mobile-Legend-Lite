"""Original offline ability illustrations/backgrounds; approved GLBs supply character art separately."""
from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import math,shutil
S=768
for hero in ('layla','franco'):
 p=Path('src/heroes')/hero/'assets';p.mkdir(exist_ok=True,parents=True)
 for slot in ('passive','skill-1','skill-2','ultimate'):
  im=Image.new('RGBA',(S,S));d=ImageDraw.Draw(im)
  for y in range(S):
   f=y/S; c=(int(10+8*f),int(24+18*f),int(43+20*f),255) if hero=='layla' else (int(38+13*f),int(27+10*f),int(26+7*f),255)
   d.line([(0,y),(S,y)],fill=c)
  color='#57e1fa' if hero=='layla' else '#e6b56c'; light='#f0feff' if hero=='layla' else '#fff0d1'
  d.rounded_rectangle((18,18,750,750),radius=104,outline=color,width=11)
  if hero=='layla':
   if slot=='passive':
    d.line([(100,600),(660,160)],fill=color,width=22)
    for i in range(4):
     x=220+i*105;y=510-i*82;r=18+i*11;d.line([(x-r,y),(x+r,y)],fill=light,width=9);d.line([(x,y-r),(x,y+r)],fill=light,width=9)
    d.line([(200,650),(670,280)],fill='#316c97',width=10)
   elif slot=='skill-1':
    d.polygon([(185,510),(525,196),(640,176),(615,291),(285,598)],fill=color)
    d.polygon([(235,513),(540,230),(587,220),(567,269),(277,546)],fill=light)
    for i in range(3):d.line([(110+i*55,584),(200+i*55,500)],fill='#3e91ba',width=17)
    d.polygon([(455,280),(450,152),(535,205)],fill='#d5b76a');d.polygon([(520,362),(656,374),(583,285)],fill='#d5b76a')
   elif slot=='skill-2':
    d.ellipse((237,225,541,529),fill='#596bc8',outline='#c5b7ff',width=14)
    d.arc((187,290,601,460),0,355,fill=light,width=19);d.arc((290,172,468,581),0,355,fill=color,width=16)
    d.ellipse((310,275,360,325),fill=light);d.polygon([(383,548),(420,614),(383,683),(345,614)],fill='#d7a2ff')
   else:
    d.polygon([(70,490),(630,142),(699,250),(139,605)],fill='#2588b8')
    d.line([(99,548),(660,190)],fill=color,width=93);d.line([(99,548),(660,190)],fill=light,width=24)
    d.arc((58,396,257,666),68,255,fill='#d9ba79',width=22)
    d.line([(400,154),(440,214)],fill=color,width=10);d.line([(548,430),(585,490)],fill=color,width=10)
  else:
   if slot=='passive':
    d.polygon([(180,190),(384,90),(590,190),(556,443),(383,644),(210,443)],fill='#77543d',outline=color,width=13)
    d.polygon([(384,171),(430,337),(531,355),(420,421),(384,560),(348,421),(237,355),(338,337)],fill=color)
    d.line([(120,575),(219,575)],fill=light,width=15);d.line([(552,136),(652,136)],fill=light,width=15)
   elif slot=='skill-1':
    for i in range(5):
     x=130+i*49;y=137+i*48;d.rounded_rectangle((x-30,y-44,x+30,y+44),radius=28,outline='#c1c9c9',width=13)
    d.arc((295,263,649,617),315,598,fill=color,width=65);d.line([(342,344),(488,485)],fill=color,width=65)
    d.polygon([(550,309),(666,290),(630,422)],fill=light)
    d.line([(355,339),(477,458)],fill=light,width=17)
   elif slot=='skill-2':
    d.polygon([(245,96),(379,76),(482,393),(369,442)],fill='#ced2c4')
    d.polygon([(178,385),(379,311),(550,447),(365,548)],fill=color)
    for box,start,end in [((75,435,697,710),185,355),((159,480,607,665),185,355)]:d.arc(box,start,end,fill='#f6b767',width=23)
    for x in (139,610):d.line([(x,399),(x-40 if x<300 else x+40,299)],fill=light,width=12)
    d.polygon([(381,510),(437,641),(384,597),(335,673)],fill='#ee784e')
   else:
    d.polygon([(166,121),(285,157),(497,595),(406,643)],fill='#b9c1bb')
    d.polygon([(605,132),(477,153),(270,599),(365,645)],fill=color)
    d.polygon([(135,112),(276,72),(341,240),(197,282)],fill='#f2d2a2')
    d.polygon([(634,102),(491,65),(430,239),(575,282)],fill='#e09b66')
    for i in range(6):
     a=i*math.tau/6;x=384+math.cos(a)*265;y=395+math.sin(a)*265;d.line([(x,y),(x+math.cos(a)*38,y+math.sin(a)*38)],fill='#ff7966',width=15)
  im.resize((256,256),Image.Resampling.LANCZOS).save(p/(slot+'.png'))
 # Distinct original environmental plates, deliberately separate from the rendered character.
 bg=Image.new('RGB',(1280,720));d=ImageDraw.Draw(bg)
 for y in range(720):
  t=y/720;c=(int(18+23*t),int(39+36*t),int(66+30*t)) if hero=='layla' else (int(52+14*t),int(32+20*t),int(35+12*t));d.line([(0,y),(1280,y)],fill=c)
 if hero=='layla':
  for i in range(8):
   x=i*190-90;d.polygon([(x,620),(x+95,190+(i%3)*73),(x+165,620)],fill=(30+i*2,62+i*2,85+i*2));d.line([(x+95,260+(i%3)*73),(x+135,584)],fill='#5b91ac',width=3)
  d.polygon([(0,620),(470,550),(1280,620),(1280,720),(0,720)],fill='#1a2d46')
 else:
  for i in range(7):
   x=i*230;d.rectangle((x,350+(i%3)*55,x+170,640),fill='#392d32');d.line([(x+30,350),(x+75,194),(x+140,350)],fill='#8a6954',width=11)
  d.rectangle((0,638,1280,720),fill='#292a33')
  for i in range(10):d.line([(0,648+i*8),(1280,648+i*8)],fill='#4d4042',width=2)
 bg.save(p/'showcase-background.png')
