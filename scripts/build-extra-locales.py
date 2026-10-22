"""Build explicit, static QR recipient introductions. Never change default ar/en discovery."""
from pathlib import Path
import json, re, html
ROOT=Path(__file__).resolve().parents[1]
locales=json.loads((ROOT/'scripts/extra-locales.json').read_text())
base=(ROOT/'en/index.html').read_text()
hero=re.search(r'<section class="hero"[\s\S]*?</section>',base)[0]
contact=re.search(r'<section class="connect"[\s\S]*?</section>',base)[0]
e=lambda x:html.escape(x,quote=True)
for code,c in locales.items():
 h=hero
 h=h.replace('Software. Cloud. Business.',e(c['eyebrow']))
 h=re.sub(r'(<h1[^>]*>)[\s\S]*?(<span class="title-dot")',lambda m:m[1]+e(c['title'][0])+'<br><span class="serif">'+e(c['title'][1])+'</span>'+m[2],h)
 h=re.sub(r'(<p class="hero-description entrance">)[\s\S]*?</p>',lambda m:m[1]+e(c['intro'])+'</p>',h)
 h=h.replace('Explore what I build',e(c['explore']))
 h=h.replace('FIG. 01 — THE RIPPLE EFFECT',e(c['artindex'])).replace('One idea. Infinite possibility.',e(c['artpoint'])).replace('Small beginnings. Lasting impact.',e(c['caption']))
 h=h.replace('Pause artwork motion',e(c['pause']))
 h=h.replace('id="motion-toggle"',f'id="motion-toggle" data-pause-label="{e(c["pause"])}" data-play-label="{e(c["play"])}"')
 services='<section class="perspective" id="showcase" aria-labelledby="work-title"><div class="section-intro"><h2 id="work-title">'+e(c['services'])+'</h2></div><div class="principles">'
 for i,(title,description) in enumerate(c['work'],1):
  services+=f'<article class="principle"><span class="number">0{i}</span><div><h3>{e(title)}</h3><p>{e(description)}</p></div></article>'
 services+='</div></section>'
 f=contact
 replacements={'02 / Get in touch':c['contact'],'Have a project in mind? Tell me what you need.':c['connectIntro'],'A small beginning.':c['beginning'],'I’m reaching out as a':c['kind'],'>Creator<':'>'+c['creator']+'<','>Business<':'>'+c['business']+'<','Your email':c['email'],'What do you have in mind?':c['message'],'Optional':c['optional'],'An idea, a challenge, a possibility…':c['placeholder'],'Start a conversation':c['submit'],'Only to reply to your enquiry. No mailing list.':c['privacy'],'The form is being connected. Please email adam@athari.dev directly for now.':c['messages']['unavailable'],'A conversation, started.':c['successTitle'],'Your enquiry has been received. Thanks for reaching out.':c['successBody'],'Collaboration enquiry':c['contact']}
 for a,b in replacements.items():f=f.replace(a,e(b) if not a.startswith('>') else b)
 f=re.sub(r'(<h2 id="connect-title">)[\s\S]*?</h2>',lambda m:m[1]+e(c['connectTitle'][0])+'<br><span class="serif">'+e(c['connectTitle'][1])+'</span></h2>',f)
 f=re.sub(r'<noscript>[\s\S]*?</noscript>','<noscript><p class="contact-privacy">'+e(c['nojs'])+' <a href="mailto:adam@athari.dev">adam@athari.dev</a></p></noscript>',f)
 f=f.replace('id="collaboration-form"','id="collaboration-form" data-messages="'+e(json.dumps(c['messages'],ensure_ascii=False))+'"')
 page=f'''<!doctype html>
<html lang="{code}" dir="{c['dir']}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#121410">
<title>athari.dev — {e(' '.join(c['title']))}</title><meta name="description" content="{e(c['intro'])}">
<meta property="og:type" content="website"><meta property="og:title" content="athari.dev — {e(' '.join(c['title']))}"><meta property="og:description" content="{e(c['intro'])}"><meta property="og:url" content="https://athari.dev/{code}/"><meta property="og:image" content="https://athari.dev/og.png?v=20261017">
<link rel="canonical" href="https://athari.dev/{code}/"><link rel="alternate" hreflang="ar" href="https://athari.dev/ar/"><link rel="alternate" hreflang="en" href="https://athari.dev/en/"><link rel="alternate" hreflang="{code}" href="https://athari.dev/{code}/"><link rel="alternate" hreflang="x-default" href="https://athari.dev/">
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20261019-dev"><link rel="stylesheet" href="/style.css?v=20261022-living-ripple"><link rel="stylesheet" href="/extra-languages.css?v=20261019"><script src="/site.js?v=20261022-living-ripple" defer></script><script src="/contact.js?v=20261019-extra" defer></script>
</head><body id="top"><a class="skip" href="#main">{e(c['skip'])}</a><div class="page">
<header class="header"><a class="brand" dir="ltr" href="#top" aria-label="athari.dev"><span>athari<span class="brand-extension">.dev</span></span></a><nav aria-label="{e(c['explore'])}"><a href="#connect">{e(c['contact'])}</a><a class="language-switch" href="/ar/" lang="ar" dir="rtl">العربية</a><a class="language-switch" href="/en/" lang="en" dir="ltr">English</a></nav></header>
<main id="main">{h}{services}{f}</main><footer><a class="footer-brand" dir="ltr" href="#top">athari.dev</a><span>© <span id="year">2026</span></span></footer></div></body></html>'''
 folder=ROOT/code;folder.mkdir(exist_ok=True);(folder/'index.html').write_text(page)
 print('Built',code)
