import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandlers } from '../lib/contact-handler.mjs';
const origin = 'https://athari.dev', url = 'https://contact.athari.dev/api/contact';
const request = (body, extra = {}) => new Request(url, { method: 'POST', headers: { origin, 'Content-Type': 'application/json', 'x-forwarded-for': '192.0.2.1', ...extra }, body: JSON.stringify(body) });
function setup({ configured = true, fail = false } = {}) {
 let time = 1000000, sent = [], errors = [];
 const handlers = createHandlers({ getEnv: () => configured ? { SMTP_USER: 'adam@athari.dev', SMTP_PASS: 'test-only-secret' } : {}, now: () => time,
  logError: (...args) => errors.push(args), createTransport: options => ({ sendMail: async message => { sent.push({ options, message }); if (fail) throw Object.assign(new Error('sensitive SMTP error'), { code: 'EAUTH' }); return { accepted: ['adam@athari.dev'] }; } }) });
 const token = async () => { const x = await (await handlers.GET(new Request(url, { headers: { origin } }))).json(); time += 1600; return x.token; };
 return { ...handlers, token, sent, errors, advance: n => time += n };
}
const fields = token => ({ email: 'visitor@example.com', collaboration: 'Creator', message: 'A useful idea', website: '', token });
test('missing credentials never report success or send', async () => {
 const s = setup({ configured: false }); assert.deepEqual(await (await s.GET(new Request(url))).json(), { ready: false });
 assert.equal((await s.POST(request(fields('x')))).status, 503); assert.equal(s.sent.length, 0);
});
test('origin rejection and narrow CORS', async () => {
 const s = setup(); assert.equal((await s.POST(request(fields('x'), { origin: 'https://evil.example' }))).status, 403);
 const r = await s.OPTIONS(new Request(url, { method: 'OPTIONS', headers: { origin } })); assert.equal(r.status, 204); assert.equal(r.headers.get('Access-Control-Allow-Origin'), origin);
 assert.equal((await s.GET(new Request(url, { headers: { origin: 'https://evil.example' } }))).headers.get('Access-Control-Allow-Origin'), null);
});
test('fixed recipient, authenticated sender, visitor reply-to and verified SMTP acceptance', async () => {
 const s = setup(), token = await s.token(); const r = await s.POST(request({ ...fields(token), to: 'attacker@example.com' }));
 assert.equal(r.status, 200); assert.equal((await r.json()).success, true);
 assert.equal(s.sent[0].message.to, 'adam@athari.dev'); assert.equal(s.sent[0].message.replyTo, 'visitor@example.com'); assert.equal(s.sent[0].message.from.address, 'adam@athari.dev');
 assert.equal(s.sent[0].options.secure, true); assert.equal(s.sent[0].options.tls.rejectUnauthorized, true);
 assert.equal((await s.POST(request(fields(token)))).status, 400); assert.equal(s.sent.length, 1);
});
test('validation, honeypot and oversized requests cannot send', async () => {
 for (const change of [{ email: 'a@example.com\r\nBcc: bad@example.com' }, { collaboration: 'Other' }, { website: 'spam' }, { message: 'x'.repeat(2001) }]) {
  const s = setup(); assert.equal((await s.POST(request({ ...fields(await s.token()), ...change }))).status, 422); assert.equal(s.sent.length, 0);
 }
 const s = setup(); assert.equal((await s.POST(request({ ...fields('x'), message: 'x'.repeat(5000) }))).status, 413);
});
test('expired or forged tokens are rejected', async () => {
 const s = setup(), token = await s.token(); s.advance(16 * 60 * 1000); assert.equal((await s.POST(request(fields(token)))).status, 400);
 assert.equal((await s.POST(request(fields(token + 'x')))).status, 400); assert.equal(s.sent.length, 0);
});
test('SMTP rejection is honest and does not log private form contents', async () => {
 const s = setup({ fail: true }); const r = await s.POST(request(fields(await s.token()))); assert.equal(r.status, 502); assert.equal((await r.json()).success, false);
 const log = JSON.stringify(s.errors); assert.ok(log.includes('EAUTH')); assert.ok(!log.includes('visitor@example.com')); assert.ok(!log.includes('useful idea')); assert.ok(!log.includes('test-only-secret'));
});
test('per-instance burst control returns 429', async () => {
 const s = setup(); for (let i=0;i<5;i++) await s.POST(request(fields('bad'))); assert.equal((await s.POST(request(fields('bad')))).status, 429);
});
test('AJobs origins issue tokens and keep the fixed recipient', async () => {
 for (const ajobsOrigin of ['https://ajobs.athari.dev','https://ajobs-phi.vercel.app','https://ajobs.athridev.chatgpt.site']) {
  const s=setup();
  const r=await s.GET(new Request(url,{headers:{origin:ajobsOrigin}}));
  assert.equal(r.headers.get('Access-Control-Allow-Origin'),ajobsOrigin);
  const {token}=await r.json();s.advance(1600);
  const posted=await s.POST(request({...fields(token),message:'AJobs — Hiring enquiry'}, {origin:ajobsOrigin}));
  assert.equal(posted.status,200);assert.equal(s.sent[0].message.to,'adam@athari.dev');
 }
});
test('AJobs tokens cannot be used from another allowed origin', async () => {
 const s=setup();const {token}=await(await s.GET(new Request(url,{headers:{origin:'https://ajobs.athari.dev'}}))).json();s.advance(1600);
 assert.equal((await s.POST(request(fields(token)))).status,400);assert.equal(s.sent.length,0);
});

test('Sabab business and provider onboarding keep role, callback details, and fixed recipient', async () => {
 for (const collaboration of ['Business','Creator']) {
  const s=setup(), sababOrigin='https://sabab.athari.dev';
  const options=await s.OPTIONS(new Request(url,{method:'OPTIONS',headers:{origin:sababOrigin}}));
  assert.equal(options.status,204);assert.equal(options.headers.get('Access-Control-Allow-Origin'),sababOrigin);
  const {token}=await(await s.GET(new Request(url,{headers:{origin:sababOrigin}}))).json();s.advance(1600);
  const message='Sabab — '+collaboration+'\nName: Test\nPhone / WhatsApp: +972501234567\nService: Repairs\nRequested follow-up: registration and guided onboarding.';
  const r=await s.POST(request({...fields(token),collaboration,message},{origin:sababOrigin}));
  assert.equal(r.status,200);assert.equal(s.sent[0].message.to,'adam@athari.dev');assert.ok(s.sent[0].message.text.includes(message));
 }
});
test('Sabab tokens cannot be used from another allowed origin', async () => {
 const s=setup();const {token}=await(await s.GET(new Request(url,{headers:{origin:'https://sabab.athari.dev'}}))).json();s.advance(1600);
 assert.equal((await s.POST(request(fields(token)))).status,400);assert.equal(s.sent.length,0);
});


test('Sidor contractor and owner enquiries preserve exact origin, fixed recipient, and callback details', async () => {
 for (const sidorOrigin of ['https://sidor.athari.dev','https://sidor.athridev.chatgpt.site']) {
  for (const collaboration of ['Business','Creator']) {
   const s=setup(); const options=await s.OPTIONS(new Request(url,{method:'OPTIONS',headers:{origin:sidorOrigin}}));
   assert.equal(options.status,204); assert.equal(options.headers.get('Access-Control-Allow-Origin'),sidorOrigin);
   const {token}=await(await s.GET(new Request(url,{headers:{origin:sidorOrigin}}))).json();s.advance(1600);
   const message='Sidor — '+collaboration+'\nPhone: +972501234567\nArea: Tira\nEquipment: Tracked excavator';
   const r=await s.POST(request({...fields(token),collaboration,message},{origin:sidorOrigin}));
   assert.equal(r.status,200);assert.equal(s.sent[0].message.to,'adam@athari.dev');assert.ok(s.sent[0].message.text.includes(message));
   assert.equal((await s.POST(request(fields(token)))).status,400);
  }
 }
});
