# athari.dev

Personal developer homepage at https://athari.dev — software, AI/cloud, business development, consultancy, open source and community.

The frontend is static HTML/CSS/JS on GitHub Pages. The existing artwork and visual design are preserved. GitHub and X profile links were intentionally removed.

The collaboration form uses an owned Vercel function and the existing Google Workspace mailbox, with no additional hosted form/email service. It has no newsletter, analytics, submission database, or visitor autoresponse.

**Start with [AGENTS.md](AGENTS.md) and [the contact delivery runbook](docs/CONTACT-DELIVERY.md).** They record the owner's architectural decision, exact resources, deployment steps and remaining secret setup so future AI sessions do not reintroduce rejected services.

## Source

- `index.html`, `gateway.js`: bilingual language entrance and remembered-language redirect.
- `ar/index.html`, `en/index.html`: complete Arabic/English editions, with reciprocal language links and preserved contact delivery.
- `language.js`, `style.css`, `site.js`: language preferences, responsive RTL/LTR design and animated artwork.
- `sitemap.xml`: entrance and localized canonical pages.
- `showcase.js`: local website, booking and business-tool demos with keyboard navigation and enquiry prefill.
- `contact.js`: isolated collaboration form enhancement.
- `services/contact-api/`: Vercel Node function, SMTP delivery and tests.
- `assets/`: original wire sculpture and self-hosted Manrope font.
- `CNAME`, `_config.yml`: GitHub Pages domain and backend-source exclusions.

Push frontend edits to `main` to publish GitHub Pages. Backend edits require a separate Vercel deployment. Production SMTP acceptance was verified on 2026-10-19; see the runbook for the exact scope and remaining inbox verification. The page keeps direct email available and shows success only after API acceptance.

First-time visitors choose Arabic or English; returning visitors go directly to their choice. Use `/?choose=1` to reopen the entrance, or the header language switch on either edition. The choice is stored only in the browser. Both localized pages work without JavaScript.

## In-person QR card

`https://athari.dev/qr/` is a permanent, animated business card using the existing art direction. Pick English, Arabic or Hebrew. Arabic encodes `https://athari.dev/ar/`; English and Hebrew encode `https://athari.dev/en/`. Hebrew intentionally opens the English edition. A different QR mask gives each choice its own visible pattern.

The four-module quiet zone, fixed code geometry and high contrast are retained during animation. Present mode, optional native sharing/clipboard, motion pause, and matching PNG downloads work without a third-party QR or tracking service. Fullscreen and screen wake lock are progressive enhancements.

To regenerate: install Python `qrcode` and `Pillow`, then run `python scripts/generate-qr.py`. This synchronizes all SVG/PNG variants and the inline code bank. Install `zxing-cpp` to run `python tests/qr-decode.py`. Client behavior is checked with `node --test tests/qr-client.test.cjs`.
