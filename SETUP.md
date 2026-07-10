# ITC HQ · Setup and updates

One-time setup is about ten minutes. After that, updates are: replace a file, done.

## 1 · Put it on GitHub Pages (one time, on the desktop)

1. Go to github.com and sign in. Click **New repository**.
2. Name it `itc-hq`. Set it to **Public** (required for free Pages). Do not add a README. Create it.
   - If you want the playbook contents private, make the repo **Private** instead and use Cloudflare Pages for hosting (also free). GitHub Pages on a free account only serves public repos.
3. On the new repo page, click **uploading an existing file** and drag in all the files from this folder:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
   - `icon-maskable.png`
   - `CLAUDE.md` (conventions file so Claude Code knows the repo's rules)
4. Commit the upload.
5. Go to **Settings → Pages**. Under Build and deployment, set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
6. Wait a minute or two. The page will show the live URL, something like:
   `https://YOURUSERNAME.github.io/itc-hq/`

## 2 · Install on the phones (one time each)

**Samsung S26 (Chrome):** open the URL, tap the three-dot menu, tap **Add to Home screen → Install**.

**Partner's iPhone (Safari):** open the URL in Safari (must be Safari, not Chrome), tap the **Share** button, tap **Add to Home Screen**.

Both phones now have an ITC HQ icon that opens full screen and works offline.

## 3 · Updating the app later

1. Ask Claude for the change ("add X to the playbook", "change prompt 4"). Claude edits `index.html`.
   - If the change touches `index.html`, the `CACHE_VERSION` line at the top of `sw.js` must be bumped too (v3.0 → v3.1). Claude will do this if you mention it, and Claude Code does it automatically when working in the repo.
2. On github.com, open the repo, click the changed file, click the pencil (or re-upload via **Add file → Upload files**), commit.
3. Both phones pick up the new version the next time the app is opened with a connection. No reinstall.

**Better long-term:** point Claude Code at the repo (`git clone`, describe the change, it edits, bumps the cache version, commits, and pushes). GitHub Pages redeploys automatically on every push.

## Notes

- The single `index.html` also works as a plain local file opened in Chrome on a computer — handy as a backup. Only the install/offline features need the hosted URL.
- Everything typed into the app (QC checklist, corrections inbox, card drafts, Writer document) saves to that phone only. It never leaves the device.
- Keep a copy of these files in `PLAYBOOK/` on Drive as the master backup.
