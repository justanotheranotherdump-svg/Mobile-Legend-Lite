"""Original derivative of the project's own portrait, never reference extraction.
Optional authoring: Python + Pillow. No runtime/install dependency for the game.
"""
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parent.parent
art = root / 'src/ui/assets'
im = Image.open(art / 'layla.png').convert('RGBA').crop((37, 16, 144, 123)).resize((256, 256), Image.Resampling.LANCZOS)
mask = Image.new('L', (256, 256))
ImageDraw.Draw(mask).ellipse((3, 3, 252, 252), fill=255)
bg = Image.new('RGBA', (256, 256), '#102637')
bg.alpha_composite(im)
bg.putalpha(mask)
ImageDraw.Draw(bg).ellipse((3, 3, 252, 252), outline='#dec68a', width=6)
bg.save(art / 'layla-portrait.png')
