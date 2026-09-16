# Deploying padeliteapp.com to Cloudflare Pages

Everything in this folder is a static site. Push it to GitHub, connect
Cloudflare Pages, and the site is live at `padeliteapp.com` in about
10 minutes total.

## 1. Push the website folder to a new GitHub repo

```bash
cd ~/Projects/PadelTournaments/website
git init
git add .
git commit -m "Padelite marketing site — initial"
gh repo create padelite-site --public --push --source=.
```

If you don't have the `gh` CLI, create the repo manually on
github.com, then:

```bash
git remote add origin https://github.com/ahmedhamouda100/padelite-site.git
git branch -M main
git push -u origin main
```

## 2. Connect to Cloudflare Pages

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create**.
2. Pick **Pages** → **Connect to Git** → authorize GitHub if needed.
3. Pick the `padelite-site` repo.
4. Framework preset: **None** (static HTML). Build command: empty.
   Output directory: `/` (root).
5. Click **Save and Deploy**. Cloudflare gives you a
   `padelite-site.pages.dev` URL right away — check it in the browser
   to confirm it looks right.

## 3. Point padeliteapp.com at Cloudflare Pages

Two paths; pick one.

### Option A — Move DNS to Cloudflare (recommended)

1. In Cloudflare dashboard → **Add a site** → enter `padeliteapp.com`
   → **Free plan** → **Continue**.
2. Cloudflare shows two nameservers, e.g. `x.ns.cloudflare.com` and
   `y.ns.cloudflare.com`.
3. In Contabo → Domain Management → padeliteapp.com → **Update Domain
   Nameservers** → paste both. Save.
4. Nameserver switch takes 1–24 hours. Cloudflare emails you once it's
   active.
5. Back in Cloudflare Pages → **Custom domains** → **Set up a custom
   domain** → enter `padeliteapp.com`. Cloudflare handles the CNAME
   automatically.

### Option B — Keep DNS at Contabo, point via CNAME

In Contabo DNS Zone add:

- **CNAME** `www` → `padelite-site.pages.dev`

Root records (`@`) don't support CNAME, so we'd need a redirect. Option
A is cleaner — recommended.

## 4. Verify

- https://padeliteapp.com/ loads the marketing site.
- https://padeliteapp.com/privacy → Privacy Policy.
- https://padeliteapp.com/terms → Terms.
- https://padeliteapp.com/delete-account → Delete Account.
- https://padeliteapp.com/t.html?id=SOME-UUID → the "Open in Padelite"
  share page.

## 5. (Later) Wire deep-link redirects

Once we set up Universal Links / App Links for the mobile apps, the
share URLs will change from `padeliteapp.com/t.html?id=...` to a
cleaner `padeliteapp.com/t/<id>` — and the OS will open the app
directly instead of showing this page. That step requires:

- Apple Team ID + app bundle → generate `apple-app-site-association`
- Android package name + SHA-256 signing fingerprint → generate
  `assetlinks.json`

Both files go under a `.well-known/` folder in this repo. Ping me
when you're ready to do that step and I'll produce both files.
