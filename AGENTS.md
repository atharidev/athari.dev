# Instructions for future maintainers and AI agents

## User decisions — preserve these

- athari.dev is a personal developer/creator/business site. Preserve its current visual design, custom SVG artwork, motion controls, and accessible responsive layout.
- GitHub and X profile links were intentionally removed. Do not restore them without asking.
- The owner explicitly rejected external hosted form processors and additional email-delivery services. Do not add FormSubmit, Formspree, Web3Forms, Resend, SendGrid, or equivalent services as a shortcut.
- Contact delivery must use the existing stack: GitHub Pages frontend, an owned Vercel API, and the existing Google Workspace mailbox. Recipient is fixed server-side: adam@athari.dev.
- Never put a GitHub token, Google app password, OAuth refresh token, or SMTP credential in browser code, repository contents, logs, chat, a URL, or GitHub issues.
- Do not collect contact submissions in public GitHub issues/discussions or in Actions logs/artifacts. Do not build a public browser-triggered Actions endpoint using a client-side GitHub token.
- No newsletter, extra database, form archive, tracking, or visitor autoresponse is required.

## Source and delivery

Read `docs/CONTACT-DELIVERY.md` before editing the form, backend, DNS, or mail configuration. The frontend and API have separate deployment steps. A GitHub Pages success does NOT mean the Vercel API was deployed.

- Frontend: repository root, `main`, GitHub Pages, https://athari.dev/.
- Form: `index.html`, `contact.js`, appended contact styles in `style.css`.
- API: `services/contact-api/`, deployed as the Vercel project recorded in the contact documentation.
- Server tests: `npm ci --prefix services/contact-api --ignore-scripts`, then `npm test --prefix services/contact-api` and `node --test tests/contact-client.test.cjs`.
- Production mail credentials were supplied directly by the owner in Vercel. A live browser form test on 2026-10-19 succeeded with Google SMTP acceptance. Inbox receipt has not been independently checked. Preferred secret is SMTP_PASS; the owner-created legacy name emailrecieving is also supported. Never read or print either value.

## Security and honest states

Keep server-side fixed recipient, authenticated sender, visitor Reply-To, input limits, TLS certificate verification, allowed-origin checks, signed expiring form token, honeypot, and safe errors. In-memory throttling is best-effort per instance, not a distributed/global limit. Do not represent it as such. Stronger abuse control must remain within the approved stack and budget.

Until SMTP is configured, the endpoint returns `ready:false` and POST 503. The page keeps the direct email link and disables sending with an honest setup message. Never show a success message for a queued placeholder, a missing credential, or an SMTP failure.
