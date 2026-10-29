import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
const ORIGINS = new Set(['https://athari.dev', 'https://www.athari.dev', 'https://ajobs.athari.dev', 'https://sabab.athari.dev', 'https://sidor.athari.dev', 'https://hamra.athari.dev', 'https://hamra.athridev.chatgpt.site', 'https://sidor.vercel.app', 'https://sidor.athridev.chatgpt.site', 'https://ajobs-phi.vercel.app', 'https://ajobs.athridev.chatgpt.site']);
const RECIPIENT = 'adam@athari.dev', WINDOW = 15 * 60 * 1000, MAX_BYTES = 4096;
const emailValid = value => typeof value === 'string' && value.length <= 254 && /^[^\s<>\r\n@]{1,64}@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/i.test(value);
export function createHandlers({ getEnv, createTransport, now = Date.now, logError = console.error }) {
  // Per-instance controls, not a distributed rate limiter. No persistent visitor data.
  const attempts = new Map(), usedTokens = new Map();
  const credentials = () => {
    const env = getEnv(), user = env.SMTP_USER || RECIPIENT, pass = (env.SMTP_PASS || env.emailrecieving || '').replace(/\s/g, '');
    return emailValid(user) && pass ? { user, pass } : null;
  };
  const key = auth => createHmac('sha256', auth.pass).update('athari-contact-token-v1').digest();
  const sign = (body, auth) => createHmac('sha256', key(auth)).update(body).digest('base64url');
  const headers = origin => ({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', Vary: 'Origin', ...(ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}) });
  const json = (origin, status, value, extra = {}) => Response.json(value, { status, headers: { ...headers(origin), ...extra } });
  const rejectOrigin = request => !ORIGINS.has(request.headers.get('origin'));
  const cleanup = () => {
    for (const [id, value] of attempts) if (now() - value.start >= WINDOW) attempts.delete(id);
    for (const [id, expires] of usedTokens) if (now() >= expires) usedTokens.delete(id);
    while (attempts.size >= 1000) attempts.delete(attempts.keys().next().value);
    while (usedTokens.size >= 1000) usedTokens.delete(usedTokens.keys().next().value);
  };
  const allowedAttempt = (request, auth) => {
    cleanup();
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const id = createHmac('sha256', key(auth)).update(ip).digest('hex');
    const entry = attempts.get(id) || { start: now(), count: 0 };
    entry.count++; attempts.set(id, entry); return entry.count <= 5;
  };
  const validToken = (token, origin, auth) => {
    if (typeof token !== 'string' || token.length > 512) return false;
    const [body, signature, extra] = token.split('.'); if (!body || !signature || extra) return false;
    const expected = Buffer.from(sign(body, auth)), supplied = Buffer.from(signature);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString()), age = now() - payload.issued;
      if (payload.origin !== origin || !Number.isFinite(age) || age < 1500 || age > WINDOW || typeof payload.nonce !== 'string') return false;
      if (usedTokens.has(payload.nonce)) return false;
      usedTokens.set(payload.nonce, now() + WINDOW); return true;
    } catch { return false; }
  };
  async function GET(request) {
    const origin = request.headers.get('origin');
    if (origin && rejectOrigin(request)) return json(origin, 403, { ready: false });
    const auth = credentials(); if (!auth) return json(origin, 200, { ready: false });
    if (!origin) return json(origin, 200, { ready: true });
    const body = Buffer.from(JSON.stringify({ issued: now(), nonce: randomUUID(), origin })).toString('base64url');
    return json(origin, 200, { ready: true, token: `${body}.${sign(body, auth)}`, minWaitMs: 1500 });
  }
  async function OPTIONS(request) {
    const origin = request.headers.get('origin');
    if (rejectOrigin(request)) return json(origin, 403, { success: false });
    return new Response(null, { status: 204, headers: { ...headers(origin), 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } });
  }
  async function POST(request) {
    const origin = request.headers.get('origin'); if (rejectOrigin(request)) return json(origin, 403, { success: false });
    const auth = credentials(); if (!auth) return json(origin, 503, { success: false, code: 'delivery_unavailable' });
    if (!allowedAttempt(request, auth)) return json(origin, 429, { success: false, code: 'try_later' }, { 'Retry-After': '900' });
    if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) return json(origin, 415, { success: false });
    let fields;
    try {
      const reader = request.body?.getReader(); if (!reader) throw new Error('No body');
      const chunks = []; let bytes = 0;
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        bytes += value.byteLength; if (bytes > MAX_BYTES) { await reader.cancel(); return json(origin, 413, { success: false }); }
        chunks.push(Buffer.from(value));
      }
      fields = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch { return json(origin, 400, { success: false }); }
    const email = typeof fields?.email === 'string' ? fields.email.trim() : '', message = fields?.message ?? '';
    if (fields?.website || !emailValid(email) || !['Creator', 'Business'].includes(fields?.collaboration) || typeof message !== 'string' || message.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(message)) return json(origin, 422, { success: false, code: 'invalid_fields' });
    if (!validToken(fields.token, origin, auth)) return json(origin, 400, { success: false, code: 'refresh_form' });
    const id = randomUUID();
    try {
      const transport = createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth,
        connectionTimeout: 7000, greetingTimeout: 7000, socketTimeout: 12000, tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
        disableFileAccess: true, disableUrlAccess: true });
      const info = await transport.sendMail({ from: { name: 'athari.dev enquiries', address: auth.user }, to: RECIPIENT, replyTo: email,
        subject: `athari.dev — ${fields.collaboration} enquiry`,
        text: `New enquiry from athari.dev\n\nType: ${fields.collaboration}\nReply email: ${email}\n\n${message || '(No brief provided.)'}\n\nReference: ${id}`,
        disableFileAccess: true, disableUrlAccess: true });
      if (!info.accepted?.some(address => address.toLowerCase() === RECIPIENT)) throw new Error('Not accepted');
      return json(origin, 200, { success: true, reference: id });
    } catch (error) {
      logError('contact_delivery_failed', { reference: id, code: /^[A-Z0-9_]{1,32}$/.test(error?.code || '') ? error.code : 'DELIVERY_FAILED' });
      return json(origin, 502, { success: false, code: 'delivery_unconfirmed' });
    }
  }
  return { GET, POST, OPTIONS };
}

