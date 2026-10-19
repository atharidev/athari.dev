"""Decode the real QR vectors and downloads under simulated display conditions.
Needs Pillow and zxing-cpp. This does not replace testing a real camera/phone.
"""
from pathlib import Path
import math,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw,ImageFilter
import zxingcpp
ROOT=Path(__file__).resolve().parents[1]
PAPER='#edf1df';DARK=(23,32,20);LIGHT=(48,65,40)
def raster(svg,time):
 tree=ET.fromstring(svg);units=float(tree.attrib['viewBox'].split()[2]);scale=32
 im=Image.new('RGB',(int(units*scale),)*2,PAPER);draw=ImageDraw.Draw(im)
 def render(el,fill='#172014'):
  fill=el.attrib.get('fill',fill)
  classes=el.attrib.get('class','').split()
  if 'qr-ink' in classes:
   phase=int(next(c for c in classes if c.startswith('qr-phase-')).rsplit('-',1)[1])
   amount=(1-math.cos(2*math.pi*(time-phase*1.5)/9))/2
   fill=tuple(round(a+(b-a)*amount) for a,b in zip(DARK,LIGHT))
  if el.tag.endswith('rect'):
   x=float(el.attrib.get('x',0));y=float(el.attrib.get('y',0));w=float(el.attrib['width']);h=float(el.attrib['height'])
   if fill!=PAPER:assert x>=4 and y>=4 and x+w<=units-4 and y+h<=units-4,'Quiet zone was altered'
   draw.rounded_rectangle([x*scale,y*scale,(x+w)*scale-1,(y+h)*scale-1],radius=float(el.attrib.get('rx',0))*scale,fill=fill)
  for child in el:render(child,fill)
 render(tree);return im
count=0
html=(ROOT/'qr/index.html').read_text()
for language,destination in [('en','en'),('ar','ar')]:
 expected=f'https://athari.dev/{destination}/';svg=(ROOT/f'qr/code-{language}.svg').read_text()
 assert svg in html,'Inline code differs from its verified asset'
 download=Image.open(ROOT/f'qr/athari-qr-{language}.png')
 result=zxingcpp.read_barcode(download);assert result and result.text==expected,(language,'PNG');count+=1
 for time in [0,2.25,4.5]:
  frame=raster(svg,time)
  for size in [196,244,312,480]:
   scaled=frame.resize((size,size),Image.Resampling.LANCZOS)
   for angle in [-7,0,7]:
    case=scaled.rotate(angle,Image.Resampling.BICUBIC,expand=True,fillcolor=PAPER)
    if angle:case=case.filter(ImageFilter.GaussianBlur(.25))
    result=zxingcpp.read_barcode(case)
    assert result and result.text==expected,(language,time,size,angle)
    count+=1
 print(language,'PNG and animated vector frames decode to',expected)
def luminance(rgb):
 c=[v/255 for v in rgb];c=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in c]
 return sum(a*b for a,b in zip(c,[.2126,.7152,.0722]))
contrast=(luminance((237,241,223))+.05)/(luminance(LIGHT)+.05)
assert contrast>=7
print(f'{count} decoding checks passed. Minimum ink contrast: {contrast:.2f}:1. Quiet zones intact.')
