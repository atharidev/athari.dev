# athari.dev

Personal developer homepage at https://athari.dev — software, AI/cloud, business development, consultancy, open source and community.

The frontend is static HTML/CSS/JS on GitHub Pages. The existing artwork and visual design are preserved. GitHub and X profile links were intentionally removed.

The collaboration form uses an owned Vercel function and the existing Google Workspace mailbox, with no additional hosted form/email service. It has no newsletter, analytics, submission database, or visitor autoresponse.

**Start with [AGENTS.md](AGENTS.md) and [the contact delivery runbook](docs/CONTACT-DELIVERY.md).** They record the owner's architectural decision, exact resources, deployment steps and remaining secret setup so future AI sessions do not reintroduce rejected services.

## Source

- `index.html`, `style.css`, `site.js`: homepage and animated artwork.
- `contact.js`: isolated collaboration form enhancement.
- `services/contact-api/`: Vercel Node function, SMTP delivery and tests.
- `assets/`: original wire sculpture and self-hosted Manrope font.
- `CNAME`, `_config.yml`: GitHub Pages domain and backend-source exclusions.

Push frontend edits to `main` to publish GitHub Pages. Backend edits require a separate Vercel deployment. SMTP delivery remains **unconfigured and unverified until SMTP_PASS is added securely to the Vercel API project and a real inbox test passes**. The page keeps direct email available and does not pretend a disabled form has sent anything.
