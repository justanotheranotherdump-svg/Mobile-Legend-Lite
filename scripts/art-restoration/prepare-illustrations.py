"""Pillow authoring helper; never renders models or edits gameplay.
Usage: python prepare-illustrations.py [white-cutout-directory]
With cutout sources, make genuine RGBA masters by removing white background
islands; without them, reproducibly crop existing transparent masters/paintings.
User reference uploads are excluded from source delivery; generated masters ship.
"""
from PIL import Image, ImageOps, ImageFilter
from pathlib import Path
from collections import deque
import sys
for hero in ['layla','franco']:
    p=Path('src/heroes')/hero/'assets'
    if len(sys.argv)>1:
        im=Image.open(Path(sys.argv[1])/(hero+'-cutout.png')).convert('RGBA')
        w,h=im.size; px=im.load(); seen=bytearray(w*h); alpha=Image.new('L',im.size,255); ap=alpha.load()
        # All large white islands, including holes between hair/chain links.
        def white(x,y):
            r,g,b,a=px[x,y]; return min(r,g,b)>245 and max(r,g,b)-min(r,g,b)<12
        for y in range(h):
            for x in range(w):
                i=y*w+x
                if seen[i] or not white(x,y): continue
                q=deque([(x,y)]);seen[i]=1;island=[]
                while q:
                    a,b=q.popleft();island.append((a,b))
                    for nx,ny in [(a-1,b),(a+1,b),(a,b-1),(a,b+1)]:
                        if 0<=nx<w and 0<=ny<h and not seen[ny*w+nx] and white(nx,ny):
                            seen[ny*w+nx]=1;q.append((nx,ny))
                if len(island)>20:
                    for a,b in island:ap[a,b]=0
        alpha=alpha.filter(ImageFilter.GaussianBlur(.35))
        # De-matte pale cyan magic against white: a transparent glow, not white paper.
        for y in range(h):
            for x in range(w):
                r,g,b,_=px[x,y];a=alpha.getpixel((x,y))
                if r>160 and min(g,b)>225 and r+10<min(g,b):
                    a=min(a,round((255-r)*2.3))
                if 0<a<255:
                    f=a/255;px[x,y]=tuple(max(0,min(255,round((c-255*(1-f))/f)))for c in (r,g,b))+(255,)
                alpha.putpixel((x,y),a)
        im.putalpha(alpha)
        box=im.getbbox();im=im.crop(box);im=ImageOps.expand(im,border=24,fill=(0,0,0,0));im.save(p/'character.png',optimize=True)
    char=Image.open(p/'character.png').convert('RGBA')
    thumb=Image.new('RGBA',(512,768),(0,0,0,0));fit=ImageOps.contain(char,(500,748),Image.Resampling.LANCZOS);thumb.alpha_composite(fit,((512-fit.width)//2,(768-fit.height)//2));thumb.save(p/'character-portrait.png',optimize=True)
    poster=Image.open(p/'illustration.png').convert('RGBA')
    box={'layla':(.49,.045,.76,.45),'franco':(.52,.015,.855,.515)}[hero]
    box=tuple(round(v*(poster.width if i%2==0 else poster.height))for i,v in enumerate(box))
    ImageOps.fit(poster.crop(box),(512,512),method=Image.Resampling.LANCZOS).save(p/'portrait.png',optimize=True)
