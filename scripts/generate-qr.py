from pathlib import Path
import qrcode
from PIL import Image,ImageDraw
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]/'qr'
paper='#edf1df';ink='#172014'
LANGUAGES = [('en','en',1),('ar','ar',3),('he','he',2),('ru','ru',4),('es','es',5),('zh','zh',6),('fr','fr',7),('tr','tr',0)]
for language,destination,mask in LANGUAGES:
 url=f'https://athari.dev/{destination}/'
 qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H,box_size=20,border=4,mask_pattern=mask)
 qr.add_data(url);qr.make(fit=True)
 matrix=qr.modules;n=len(matrix);border=4;size=n+border*2
 finders=[(0,0),(n-7,0),(0,n-7)]
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" class="qr-symbol" viewBox="0 0 {size} {size}" role="img" aria-labelledby="qr-symbol-title-{language}" shape-rendering="geometricPrecision">',f'<title id="qr-symbol-title-{language}">Scan to open {url}</title>',f'<rect width="{size}" height="{size}" fill="{paper}"/>']
 for phase in range(6):
  parts.append(f'<g class="qr-ink qr-phase-{phase}" fill="{ink}">')
  for y,row in enumerate(matrix):
   for x,dark in enumerate(row):
    if dark and not any(fx<=x<fx+7 and fy<=y<fy+7 for fx,fy in finders) and (x+y*2)%6==phase:
     parts.append(f'<rect x="{x+border}" y="{y+border}" width="1" height="1" rx=".16"/>')
  parts.append('</g>')
 for x,y in finders:
  x+=border;y+=border
  parts.extend([f'<g class="qr-finder"><rect x="{x}" y="{y}" width="7" height="7" rx=".6" fill="{ink}"/>',f'<rect x="{x+1}" y="{y+1}" width="5" height="5" rx=".28" fill="{paper}"/>',f'<rect x="{x+2}" y="{y+2}" width="3" height="3" rx=".3" fill="{ink}"/></g>'])
 parts.append('</svg>');svg='\n'.join(parts);(root/f'code-{language}.svg').write_text(svg)
 scale=32;im=Image.new('RGB',(size*scale,size*scale),paper);d=ImageDraw.Draw(im)
 def render(el,color=ink):
  color=el.attrib.get('fill',color)
  if el.tag.endswith('rect'):
   x=float(el.attrib.get('x',0))*scale;y=float(el.attrib.get('y',0))*scale
   w=float(el.attrib['width'])*scale;h=float(el.attrib['height'])*scale;r=float(el.attrib.get('rx',0))*scale
   d.rounded_rectangle([x,y,x+w-1,y+h-1],radius=r,fill=color)
  for child in el:render(child,color)
 render(ET.fromstring(svg));im.save(root/f'athari-qr-{language}.png',optimize=True)
 print({'language':language,'payload':url,'version':qr.version,'quiet_zone':border,'pixels':im.width})
# Keep inline code variants synchronized with the generated vectors.
import re
page=root/'index.html'
if page.exists():
 html=page.read_text()
 bank='\n'.join(f'<div class="qr-code" data-code="{lang}"'+(' hidden' if lang!='en' else '')+'>'+(root/f'code-{lang}.svg').read_text()+'</div>' for lang,_,_ in LANGUAGES)
 assert html.count('<!-- QR BANK START -->')==1 and html.count('<!-- QR BANK END -->')==1
 html=re.sub(r'(?s)(<!-- QR BANK START -->).*?(<!-- QR BANK END -->)',lambda m:m.group(1)+bank+'\n'+m.group(2),html)
 page.write_text(html)

