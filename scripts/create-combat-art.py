"""Original offline combat PNG authoring; Pillow is a development-only prerequisite."""
from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import math
out=Path('src/ui/assets');out.mkdir(parents=True,exist_ok=True)
for name,color in [('skill-1',(55,204,250)),('skill-2',(160,101,247)),('skill-ultimate',(63,191,245)),('recall',(73,149,255)),('regen',(76,221,138)),('bot',(238,159,86))]:
 im=Image.new('RGBA',(192,192));p=im.load()
 for y in range(192):
  for x in range(192):
   r=math.hypot(x-96,y-96)/96
   if r<1:p[x,y]=tuple(int(c*(.16+.42*(1-r))) for c in color)+(255,)
 d=ImageDraw.Draw(im);d.ellipse((4,4,187,187),outline=(*color,255),width=5)
 if name=='skill-1':
  d.polygon([(26,124),(115,48),(155,86),(62,153)],fill=(40,76,101),outline='white',width=3);d.line([(65,110),(137,55)],fill=(*color,255),width=14);d.ellipse((125,31,164,70),fill=(206,249,255));d.line((44,91,78,124),fill=(255,225,144),width=6)
 elif name=='skill-2':
  d.ellipse((49,49,143,143),fill=(*color,255),outline='white',width=4);d.arc((26,26,167,167),15,310,fill=(205,232,255),width=5);d.polygon([(92,57),(127,97),(92,137),(66,95)],fill=(225,216,255))
 elif name=='skill-ultimate':
  for off in [-25,0,25]:d.polygon([(26,125+off),(144,45+off),(131,78+off),(174,53+off),(45,150+off)],fill=(150+off,226,255))
 elif name=='recall':
  d.ellipse((35,122,158,159),outline=(154,219,255),width=6);d.polygon([(76,119),(76,57),(59,57),(96,25),(133,57),(116,57),(116,119)],fill=(170,227,255));d.line((96,60,96,134),fill='white',width=5)
 elif name=='regen':
  d.polygon([(52,131),(65,72),(139,40),(139,98),(99,143)],fill=(*color,255),outline=(203,255,216),width=3);d.line((57,145,124,68),fill='white',width=5);d.rectangle((82,74,106,130),fill=(226,255,226));d.rectangle((66,90,122,114),fill=(226,255,226))
 else:
  d.rounded_rectangle((45,47,147,139),20,fill=(74,94,111),outline=(*color,255),width=6);d.rectangle((60,76,83,96),fill=(128,238,255));d.rectangle((109,76,132,96),fill=(128,238,255));d.line((96,47,96,28),fill='white',width=5)
 im.save(out/(name+'.png'))
# Portrait is a derivative thumbnail of the already approved illustration only;
# the source creation artwork itself is not overwritten or changed.
im=Image.open('src/assets/images/layla-creation.png').convert('RGBA')
b=im.getbbox();im=im.crop(b);im.thumbnail((192,192))
portrait=Image.new('RGBA',(192,192),(16,36,57,255));portrait.alpha_composite(im,((192-im.width)//2,(192-im.height)//2));portrait.save(out/'layla.png')
