# padeliteapp.com — deployment notes

The site is a static Cloudflare Pages project. Every push to `main`
triggers a fresh build and deploy in ~30 seconds. No build tools;
Cloudflare serves the files as-is.

## Structure

```
website/
├── index.html                 Home (pillar cards)
├── contact.html
├── privacy.html
├── terms.html
├── delete-account.html
├── t.html                     Legacy tournament share URL (?id=...)
├── about/                     About Padelite (+ community, press)
├── tournaments/               Tournaments hub + calendar + 5 formats
├── rankings/                  Padel Elite (rules, seasons)
├── sponsors/                  Sponsorship hub (audience, packages, inquiry form)
├── app/                       The Padelite app (features, download)
├── resources/                 Stories, recaps, guides
├── partials/                  Shared nav + footer (injected via fetch)
├── functions/api/             Cloudflare Pages Functions
│   └── sponsor-inquiry.js     POST target for the sponsor form
├── assets/                    logo.png, favicon.png
├── styles.css
├── script.js                  Nav toggle + partial include + form wiring
└── DEPLOY.md                  You're reading it.
```

## Publishing

Cloudflare Pages is connected to the GitHub repo `padelite-site`.
Push `main` to deploy:

```bash
cd ~/Projects/PadelTournaments/website
git add .
git commit -m "site update"
git push
```

## Sponsor inquiry form (MailChannels)

`functions/api/sponsor-inquiry.js` sends inquiries by POSTing to
MailChannels, Cloudflare's built-in transactional email transport.
It's free from any Worker whose outbound domain routes through
Cloudflare — no API key required.

Optional hardening (recommended once volume grows):

1. Add a `_mailchannels` TXT record for lockdown:
   `v=mc1 cfid=<your-cloudflare-account-id>`
2. Add a DKIM key to sign outbound `no-reply@padeliteapp.com` messages.

Neither is required for the form to work — it just improves
deliverability into Gmail/Outlook.

## Custom domain

`padeliteapp.com` points to Cloudflare nameservers
(`brad.ns.cloudflare.com`, `fish.ns.cloudflare.com`). Cloudflare Pages
serves the site at both apex and `www`.

## Legacy tournament share URL

`https://ahmedhamouda100.github.io/padelite-legal/t.html?id=...` still
works; the new equivalent is `https://padeliteapp.com/t.html?id=...`.
Once App Links / Universal Links are wired inside the mobile app,
we'll move to `https://padeliteapp.com/t/<id>` as the canonical form
and the .well-known association files will live under
`website/.well-known/`.
