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
- Form: `ar/index.html` and `en/index.html`, `contact.js`, appended contact styles in `style.css`. Root `index.html` is the bilingual entrance.
- API: `services/contact-api/`, deployed as the Vercel project recorded in the contact documentation.
- Server tests: `npm ci --prefix services/contact-api --ignore-scripts`, then `npm test --prefix services/contact-api` and `node --test tests/contact-client.test.cjs`.
- Production mail credentials were supplied directly by the owner in Vercel. A live browser form test on 2026-10-19 succeeded with Google SMTP acceptance. Inbox receipt has not been independently checked. Preferred secret is SMTP_PASS; the owner-created legacy name emailrecieving is also supported. Never read or print either value.

## Security and honest states

Keep server-side fixed recipient, authenticated sender, visitor Reply-To, input limits, TLS certificate verification, allowed-origin checks, signed expiring form token, honeypot, and safe errors. In-memory throttling is best-effort per instance, not a distributed/global limit. Do not represent it as such. Stronger abuse control must remain within the approved stack and budget.

Until SMTP is configured, the endpoint returns `ready:false` and POST 503. The page keeps the direct email link and disables sending with an honest setup message. Never show a success message for a queued placeholder, a missing credential, or an SMTP failure.

## Arabic and language selection — 2026-10-19

- `/` is a bilingual language entrance. `/ar/` and `/en/` are complete static pages, usable without JavaScript, with reciprocal hreflang and their own canonical URLs.
- Arabic uses RTL layout, authored Arabic copy, and self-hosted Noto Sans Arabic / Noto Naskh Arabic fonts with bundled OFL licenses. Preserve Arabic shaping: never use negative letter spacing or artificial italic on Arabic.
- `gateway.js` redirects only a valid previously selected `ar`/`en` locale. `/?choose=1` explicitly reopens the entrance. `language.js` remembers the choice in localStorage and preserves section hashes in links. Storage failure must not block entry. No language guessing, flags, analytics, or cookies are needed.
- Keep content parity between `ar/index.html` and `en/index.html`. Keep the Latin brand and email direction LTR. Contact category **values** stay `Creator` and `Business` for API compatibility, regardless of translated labels.
- Dynamic form notices and artwork control labels follow the document language. Backend source and mail configuration are unchanged by this localization.
- Checks: `node --check gateway.js`, `node --check language.js`, `node --check site.js`, `node --check contact.js`, `node --test tests/*.test.cjs`.

## Business showcase — 2026-10-19

- The owner explicitly requested a business demo section, superseding the earlier preference for no project gallery. Keep this section in both languages, matching the established art style.
- `#showcase` offers three local interactive concepts: a fictional consulting website, booking flow, and request-management desk. Content and records are illustrative, not client work, customer statistics, or real appointments.
- `showcase.js` manages accessible keyboard-operated tabs, local demo state, and enquiry prefill. No demo data is saved or sent. Website details remain usable without JavaScript, and all three panels remain visible without enhancement.
- Enquiry links select the existing Business category and populate an empty message only. Never overwrite a visitor draft or submit the contact form automatically.
- Keep mobile overflow containment and min-width constraints when changing previews. Use Arabic commas in Arabic prose and the full term «الذكاء الاصطناعي والحوسبة السحابية».
- Validate interactions with `node --test tests/showcase.test.cjs`, plus existing client and language tests. Frontend-only changes require GitHub Pages publication.

## QR business card — 2026-10-19

- `/qr/` extends the existing GitHub Pages site. The intended domain is `athari.dev`, consistent with this project. Do not redirect the QR page through the homepage's language entrance.
- Recipient buttons change the actual QR, destination link, share payload and PNG download together. Arabic goes directly to `/ar/`. English goes directly to `/en/`. The owner later restored Hebrew and requested a compact Other languages dropdown in QR only. Keep Arabic and English as the two primary buttons; extra choices are Hebrew, Russian, Spanish, Simplified Chinese, French and Turkish. The main bilingual entrance remains Arabic/English only.
- Eight fixed, standards-based QR codes use high error correction and a four-module quiet zone. Motion changes only dark ink tone and artwork outside the paper. Never deform, move, obscure or fade code modules, finder patterns or quiet zones. No central logo masks are needed.
- `scripts/generate-qr.py` regenerates SVGs, PNGs and the inline HTML code bank together. QR targets are permanent owned URLs, with no tracking, external QR API or expiration.
- `qr.js` remembers recipient selection only in sessionStorage. Reading the main site language as an initial hint must not overwrite the owner's preference when choosing someone else's language. `?for=en`, `ar`, `he`, `ru`, `es`, `zh`, `fr`, `tr` are supported, with a strict whitelist. Every supported choice updates the QR, direct URL, PNG, accessible label and share payload together. Invalid values fall back to ar/en.
- Presentation, sharing and keeping the screen awake are progressive enhancements. Keep the QR, destination link and PNG download usable if these browser capabilities are unavailable. Do not claim control of screen brightness. Respect reduced motion.
- Check decoding using `python tests/qr-decode.py` and behavior with `node --test tests/qr-client.test.cjs`. Real-camera and mobile Safari verification remain separate from synthetic decoder tests.

- QR touch correction: decorative stage, pseudo-elements, paper and SVGs must have `pointer-events:none`. Keep the recipient picker above the scene, with explicit width, two fixed columns, at least 56px button height and `touch-action:manipulation`.
- Recipient choice must **not** flip the whole interface language/direction. UI locale follows the owner’s existing site preference at page load. Keep button positions, headings and geometry stable while changing the destination.


## Explicit extra QR locales — 2026-10-19

- `/he/`, `/ru/`, `/es/`, `/zh/`, `/fr/`, `/tr/` are static translated introductions, with the original artwork, three concise service descriptions, localized contact form and recovery messages. Generate them with `python scripts/build-extra-locales.py` from `scripts/extra-locales.json`. They intentionally do not duplicate the interactive ar/en showcase.
- Do not expose these languages on the root entrance or add automatic redirects to them. Only explicit QR selection or their direct URLs discovers them. Extra locale pages never overwrite `athari-language`; gateway and main language preference stay ar/en.
- Hebrew uses RTL. Chinese uses platform CJK fonts. Artwork control labels and contact messages use authored locale text. Contact category values remain Creator/Business.
- Say «الحوسبة السحابية» in Arabic, including the short hero eyebrow.
- Regenerate all SVG, PNG and inline QR variants together with `python scripts/generate-qr.py`. Verify all eight with `python tests/qr-decode.py` and run `node --test tests/*.test.cjs`. Keep the picker touch targets and quiet zones intact.
