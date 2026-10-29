# Contact delivery — architecture and runbook

Decision date: 2026-10-19 (Asia/Jerusalem).

## Owner requirement

Use GitHub/Vercel and the existing mailbox, without an additional form-processing or email-delivery service. FormSubmit was removed at the owner's request. This is an architectural preference; do not claim a provider is discontinued without independent verification.

## Architecture

1. `athari.dev` stays on GitHub Pages. Its existing hero and artwork are preserved.
2. `contact.js` checks `https://contact.athari.dev/api/contact` when the form approaches the viewport.
3. When configured, the API issues a short-lived signed form token. The browser sends JSON over HTTPS.
4. A Vercel Node 24 function uses Nodemailer as a **local software library**, not a hosted service. It connects directly to the existing Google Workspace SMTP server (`smtp.gmail.com:465`, verified TLS).
5. Email goes only to `adam@athari.dev`. Sender is the authenticated mailbox. The visitor's email is Reply-To. The email contains creator/business selection, reply email, optional brief, and a reference ID. No automatic email is sent to the visitor.

Vercel provides compute, not a native mailbox or free mail relay. It supports outbound SMTP except port 25. An existing authenticated mail account is still required. No new paid integration, database, or subscription was provisioned. Vercel compute and Google mail remain subject to their existing plan policies and quotas; this is not an unlimited/free-forever guarantee.

GitHub Actions was not chosen as the public submission receiver: securely starting Actions from anonymous browsers needs an authenticated server anyway. A public token, issue-based intake, or visitor details in workflow logs would be inappropriate. Actions may later run code checks without contact data or mail credentials.

## Exact resources

- Repository: `atharidev/athari.dev`, default branch `main`.
- Vercel team: `team_mnG6oXYH1Mo2TLT0c4VEQefS` (athridevs-projects).
- Vercel project: `athari-contact-api`, ID `prj_yQhwc9Tp6ZqMwvQTNVEXqtcAZ5cL`.
- API deployment source directory: `services/contact-api`.
- Public API: `https://contact.athari.dev/api/contact`.
- Porkbun DNS: CNAME `contact` -> `6f3f2e46189d2916.vercel-dns-017.com`, TTL 600.
- Only this new DNS record was added. Existing apex/www, Sabab, Brainstorm, MX, SPF and DKIM records were preserved.
- Vercel default deployment protection remains on for generated deployment URLs. The dedicated custom hostname is the public API; do not disable account/project protection to test previews.

## Credential setup and verified status

The function defaults `SMTP_USER` to `adam@athari.dev`; setting that variable is optional. The preferred secret name is `SMTP_PASS`. The owner saved the production credential under `emailrecieving`; the server supports that exact legacy name as a fallback. Do not ask the owner to paste it again or print its value. `SMTP_PASS` takes precedence when both exist.

1. In the Google account for **adam@athari.dev**, create a dedicated Google app password for `athari.dev contact`, if Workspace policy allows app passwords. This normally requires 2-Step Verification. Use Google's secure account settings, not chat. Never use the ordinary Google sign-in password.
2. In Vercel, open the **athari-contact-api** project, Settings -> Environment Variables.
3. Add **SMTP_PASS**, type **Sensitive**, target **Production only**. Paste it there directly. Do not commit `.env` or show the value in logs, screenshots, chat or shell arguments.
4. Redeploy this API project using the existing production source. Environment variable changes do not change a running deployment.
5. Check readiness, submit one clearly labelled test from athari.dev, and confirm it arrived in adam@athari.dev, with the visitor as Reply-To.

If Workspace policy does not allow app passwords, use Google-supported OAuth/relay authorization after the owner authorizes that setup. Do not weaken 2FA, use normal account passwords, or substitute another mail provider automatically.

Initial implementation limitation: the connected Vercel API returned **403: additional permissions required to create production environment variables**. No Vercel CLI was installed/authenticated as an alternative. No credential was created, read, or stored, and no SMTP delivery was performed. The owner must configure the secret through the authorized dashboard or grant an appropriate configuration capability. This is an access limitation, not a mail-server failure.

Verification on 2026-10-19: the owner configured the production mail credential in Vercel directly. Deployment `dpl_Btez47MqSA6JaJZEX9SCi43ojWSh` reached READY; the public API reported `ready:true`. A labelled SETUP TEST submitted through the live form completed successfully, confirming Google SMTP accepted the fixed recipient and the browser rendered its success panel. Inbox arrival has not been independently checked. The credential value was never read by the agent. The owner also reported adding a new variable and redeploying afterward; retain support for both documented variable names.

## Deploying changes

### Frontend

Push root HTML/CSS/JS to `main` using the GitHub connection. Keep existing artwork and assets. GitHub Pages builds from the root. `_config.yml` excludes backend/maintenance files. Increment asset query versions when changing contact CSS or JS.

### Backend

The initial API was deployed via the Vercel connector from these files, relative to `services/contact-api`:

- `api/contact.js`
- `lib/contact-handler.mjs`
- `package.json`
- `package-lock.json`
- `vercel.json`

Deployment target: production, existing project ID above. Keep `api/contact.js` as the function entrypoint and Node 24. Do not deploy the whole frontend directory as this API. Do not upload `.env*`, credentials, `node_modules`, tests, or this runbook. Source is in GitHub, but the API is **not automatically linked to the repository**: future backend edits need a separate Vercel deployment. A future explicit Git integration should use root directory `services/contact-api`.

### Checks

```sh
npm ci --prefix services/contact-api --ignore-scripts
npm test --prefix services/contact-api
npm audit --prefix services/contact-api --omit=dev
node --check contact.js
node --test tests/contact-client.test.cjs
```

The seven server tests cover missing credentials, strict origins/CORS, fixed recipient and TLS, input/honeypot/body limits, token expiry/replay, SMTP failures without private logs, and best-effort burst throttling. Mail is mocked in tests; they do not prove real inbox delivery.

Readiness: GET `/api/contact` without an Origin returns only `{"ready":false}` or `{"ready":true}`. With the allowed Origin, a ready API also returns an expiring token. POST while unconfigured returns 503 and never reports success.

## Data and abuse controls

No submission database or form archive is created. Successful enquiries live in the owner's existing email account, subject to Google's mail retention/settings. Vercel infrastructure may retain normal request metadata; application logs deliberately omit addresses, bodies, passwords and SMTP responses.

The API validates content type, 4 KiB body cap, email, category and 2,000-character brief; rejects other origins; uses an expiring HMAC token with a short minimum age and a hidden honeypot; fixes recipient server-side; verifies TLS. Per-instance attempt/replay maps contain only hashed IP keys/nonces temporarily and have size limits. They are not a durable distributed rate limiter and Origin is not authentication against non-browser clients. Monitor mail volume and Vercel usage; do not promise zero spam or unlimited capacity.

There is no persistent queue or automatic SMTP retry. On failure/uncertain delivery the page keeps entered text and offers direct email. SMTP acceptance is required for API success; downstream inbox delivery must still be verified during setup.

## Primary references

- https://vercel.com/kb/guide/serverless-functions-and-smtp
- https://vercel.com/docs/functions/runtimes/node-js
- https://support.google.com/a/answer/176600
- https://support.google.com/accounts/answer/185833
- https://nodemailer.com/smtp

## AJobs form — 2026-10-21

AJobs reuses the owned endpoint and fixed `adam@athari.dev` recipient. The exact allowed origins now also include `https://ajobs.athari.dev`, `https://ajobs-phi.vercel.app`, and the owner-private saved Site `https://ajobs.athridev.chatgpt.site`. No wildcard origins or new mail provider were added. AJobs preserves the Business/Creator category values and prefixes the plain-text brief with AJobs, enquiry type, and visitor name. Existing athari.dev delivery behavior and credentials are unchanged. Backend regression tests now cover all three AJobs origins and token isolation between allowed origins.

## Sabab onboarding form — 2026-10-24

Sabab reuses this endpoint at the exact allowed origin https://sabab.athari.dev. Business/Creator map to businesses posting jobs and freelancers/service providers offering services. Messages are prefixed Sabab and include name, phone/WhatsApp, business/service, optional brief, and the requested registration/onboarding callback. The fixed recipient, credentials and other sites are unchanged. Deployment remains separate from the frontend.

## Sidor early access — 2026-10-24

Sidor uses the same fixed-recipient API from the exact origins https://sidor.athari.dev and https://sidor.athridev.chatgpt.site. Business maps to contractors; Creator maps to equipment and truck owners. Messages include Sidor, role, name, phone/WhatsApp, town/service area, company or equipment, optional notes, chosen language, and a request for launch onboarding. Submissions do not create accounts or book equipment. No additional mail service or database is added. Regression coverage includes both roles and origins, CORS, callback content, fixed recipient, and token isolation. Deploy this backend separately from the Sidor frontend.

## Hamra rebrand — 2026-10-29

Sidor is now Hamra / حمرا / חמרה. The exact Hamra origins https://hamra.athari.dev and https://hamra.athridev.chatgpt.site are allowed alongside the retained Sidor origins. The fixed recipient, role values, SMTP acceptance checks and token isolation remain unchanged. The API must be deployed separately from both frontends.
