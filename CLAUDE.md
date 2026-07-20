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
- The workflow is playbook v5.0: seven steps, one subject per
  production cycle, on both Claude (Opus/Fable) and ChatGPT. Steps 1
  and 2 (deep research, second pass) share one chat; every other step
  runs cold in a fresh chat with its full inputs pasted in, ideally
  alternating models between writing and auditing. Every step output
  must stand alone. Keep all prompt copy model-agnostic; do not write
  Claude-only instructions, and do not reintroduce the correction
  log, the per-platform fact bank, or workspace-dependent
  instructions.

## Card renderer

The canvas renderer (parseSpecs/renderCard and friends) began as a port
of the standalone Card Generator v1.1 and was extended in v4.0 with the
compare card type, the source credit line, kicker tick, and spec row
separators. It draws true 1080x1920 PNGs. Changes to its layout
constants change every card the channel exports, so treat visual edits
there as high-risk and describe the effect before making them. The
accepted card types live in CARD_TYPES/RENDERERS and are guarded by the
load-time self-test; keep prompts, worked example, and renderers in
sync through those constants.
