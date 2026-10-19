const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../qr/qr.js'),'utf8');
function element(values={}) {
  return { attrs:{},events:{},dataset:{},hidden:false,disabled:true,textContent:'',
    setAttribute(key,value){this.attrs[key]=value;},toggleAttribute(key,enabled){if(enabled)this.attrs[key]='';else delete this.attrs[key];},
    addEventListener(key,fn){this.events[key]=fn;},querySelector(){return this.title;},...values };
}
function setup({search='',language='en',remembered=null,blocked=false,reducedMotion=false,shareNative,clipboard}={}) {
  const storage={'athari-language':language},session={'athari-qr-recipient':remembered};
  const choices=['en','ar','he'].map(value=>element({dataset:{recipient:value}}));
  const codes=['en','ar','he'].map(value=>element({dataset:{code:value},title:element()}));
  const labels=['edition','eyebrow','title','titleArt','subtitle','choose','present','share','save','footer'].map(key=>element({dataset:{i18n:key}}));
  const ids=Object.fromEntries(['qr-destination','qr-destination-note','qr-save','qr-status','qr-share','qr-present','qr-motion'].map(id=>['#'+id,element()]));
  const body=element(),events={},media=element({matches:reducedMotion});
  const document={body,hidden:false,fullscreenElement:null,documentElement:{lang:'en',dir:'ltr'},
    querySelector:key=>ids[key],querySelectorAll:key=>({'[data-recipient]':choices,'[data-code]':codes,'[data-i18n]':labels})[key],
    addEventListener:(key,fn)=>events[key]=fn};
  const navigator={};if(shareNative)navigator.share=shareNative;if(clipboard)navigator.clipboard={writeText:clipboard};
  const api=(obj)=>({getItem(key){if(blocked)throw Error('storage blocked');return obj[key]||null;},setItem(key,value){if(blocked)throw Error('storage blocked');obj[key]=value;}});
  vm.runInNewContext(source,{document,navigator,location:{search},URLSearchParams,window:{matchMedia:()=>media},localStorage:api(storage),sessionStorage:api(session)});
  return {choices,codes,labels,ids,body,document,events,media,storage,session,navigator};
}
const select=(s,value)=>s.choices.find(el=>el.dataset.recipient===value).events.click();
test('recipient selection changes QR, target and download together without changing owner language',()=>{
 const s=setup();assert.equal(s.ids['#qr-destination'].href,'https://athari.dev/en/');
 select(s,'ar');assert.equal(s.ids['#qr-destination'].href,'https://athari.dev/ar/');
 assert.deepEqual(s.codes.map(el=>el.hidden),[true,false,true]);assert.equal(s.document.documentElement.dir,'rtl');
 assert.equal(s.ids['#qr-save'].href,'/qr/athari-qr-ar.png');
 select(s,'he');assert.deepEqual(s.codes.map(el=>el.hidden),[true,true,false]);
 assert.equal(s.ids['#qr-destination'].href,'https://athari.dev/en/');assert.equal(s.ids['#qr-save'].download,'athari-qr-he.png');
 assert.match(s.ids['#qr-destination-note'].textContent,/Hebrew speakers/);
 assert.equal(s.storage['athari-language'],'en');assert.equal(s.session['athari-qr-recipient'],'he');
});
test('valid URL selection wins over stored hints and blocked storage does not prevent entry',()=>{
 assert.equal(setup({search:'?for=he',language:'ar'}).ids['#qr-destination'].href,'https://athari.dev/en/');
 assert.equal(setup({search:'?for=ar',blocked:true}).ids['#qr-destination'].href,'https://athari.dev/ar/');
 assert.equal(setup({search:'?for=https://example.com',blocked:true}).ids['#qr-destination'].href,'https://athari.dev/en/');
 assert.equal(setup({language:'ar'}).ids['#qr-destination'].href,'https://athari.dev/ar/');
});
test('native share and clipboard fallback use the selected destination',async()=>{
 const shares=[],copies=[];const s=setup({shareNative:async value=>shares.push(value)});
 select(s,'ar');await s.ids['#qr-share'].events.click();assert.equal(shares[0].url,'https://athari.dev/ar/');
 select(s,'he');await s.ids['#qr-share'].events.click();assert.equal(shares[1].url,'https://athari.dev/en/');
 const fallback=setup({clipboard:async value=>copies.push(value)});select(fallback,'ar');await fallback.ids['#qr-share'].events.click();
 assert.deepEqual(copies,['https://athari.dev/ar/']);assert.match(fallback.ids['#qr-status'].textContent,/نُسخ/);
});
test('cancelled native sharing is silent and clipboard refusal offers a manual fallback',async()=>{
 let copied=false;const cancelled=setup({shareNative:async()=>{const e=Error();e.name='AbortError';throw e;},clipboard:async()=>copied=true});
 await cancelled.ids['#qr-share'].events.click();assert.equal(copied,false);assert.equal(cancelled.ids['#qr-status'].textContent,'');
 const denied=setup({clipboard:async()=>{throw Error('denied');}});await denied.ids['#qr-share'].events.click();
 assert.match(denied.ids['#qr-status'].textContent,/Press and hold/);
});
test('presentation mode works without fullscreen support and Escape exits',()=>{
 const s=setup();s.ids['#qr-present'].events.click();assert.equal(s.body.attrs['data-presenting'],'');
 assert.equal(s.ids['#qr-present'].attrs['aria-pressed'],'true');
 s.events.keydown({key:'Escape'});assert.equal(s.body.attrs['data-presenting'],undefined);
 assert.equal(s.ids['#qr-present'].attrs['aria-pressed'],'false');
});
test('motion respects system preference, user pause and page visibility',()=>{
 const reduced=setup({reducedMotion:true});assert.equal(reduced.ids['#qr-motion'].hidden,true);
 assert.equal(reduced.body.attrs['data-motion-paused'],'');
 const s=setup();s.ids['#qr-motion'].events.click();assert.equal(s.body.attrs['data-motion-paused'],'');
 s.ids['#qr-motion'].events.click();assert.equal(s.body.attrs['data-motion-paused'],undefined);
 s.document.hidden=true;s.events.visibilitychange();assert.equal(s.body.attrs['data-motion-paused'],'');
 s.document.hidden=false;s.events.visibilitychange();assert.equal(s.body.attrs['data-motion-paused'],undefined);
});
