# ITC HQ — repo conventions for Claude Code

This repo is a single-file PWA: `index.html` is the entire app (Playbook,
Card Generator, Case Writer, Home dashboard for the Inside The Case Auto
YouTube channel). It deploys automatically via GitHub Pages on every push
to main. Two phones (a Samsung running Chrome, an iPhone running Safari)
have it installed as a home-screen app.

## Hard rules

1. **Single file.** All HTML, CSS, and JS live in `index.html`. Do not
   split it into separate .css/.js files or add a build step, bundler, or
   framework. Vanilla JS only.
2. **Bump the cache on every index.html change.** If `index.html` changes
   in any way, increment `CACHE_VERSION` in `sw.js` (e.g. `itc-hq-v3.1`
   → `itc-hq-v3.2`) in the same commit, and update `APP_VERSION` near the
   top of the script in `index.html` to match. Installed phones only pick
   up updates when the cache version changes.
3. **Add a changelog entry.** Every version bump gets one line in the
   Changelog details block in the Home view of `index.html`.
4. **Embedded fonts stay embedded.** The giant base64 @font-face blocks
   at the top of `index.html` are intentional (offline + pixel-identical
   card exports). Never replace them with CDN links or delete them.
5. **localStorage keys are user data.** Keys are prefixed `itc_`
   (corrections, QC state, card drafts, writer doc). Do not rename keys
   without migrating old values, or people lose their saved work.
6. **Mobile first.** Primary viewport is a phone in portrait. Touch
   targets stay at least 36px. Test reasoning against a ~400px width.
7. **file:// must keep working.** The app doubles as a plain local file:
   clipboard uses the execCommand fallback, and the service worker only
   registers on http(s). Do not use APIs that hard-require a secure
   context without a fallback.

## House style (applies to any playbook/prompt copy edited in the app)

- No em dashes in script or card copy. No emojis.
- Ranges written as "1994 to 1997".
- Facts carry tiers: LOCKED / LIKELY / UNVERIFIED. Only LOCKED goes on
  cards or in scripts.
- The workflow is Claude-only and one topic per session: topic research
  uses Claude with web search inside the ITC Project; the fact-sheet
  audit uses a fresh Claude chat outside the Project. Do not
  reintroduce other AI tools, or the old per-platform fact-bank
  workflow, into the copy.

## Card renderer

The canvas renderer (parseSpecs/renderCard and friends) is a stable port
of the standalone Card Generator v1.1. It draws true 1080x1920 PNGs.
Changes to its layout constants change every card the channel exports,
so treat visual edits there as high-risk and describe the effect before
making them.
