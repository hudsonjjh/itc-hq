# v8 test fixtures

Everything in this directory is public-safe synthetic data. Never replace it
with a real Inside The Case dossier or backup.

`script-workflow.cjs` checks the v8.11 script-first route with an empty
Library, two core steps, external verification instructions, source-note
handoff, immediate edits, reload persistence, optional card prompts, legacy
job compatibility, removable references, and 400px mobile layout. Run
`node tests/script-workflow.cjs` with the same Playwright/browser settings
as the card tests. `SCRIPT_TEST_SCREENSHOT` optionally saves a review image
outside the repository. It uses an isolated browser profile and synthetic text.

`library-v1.itc-library.json` exercises two records, namespaced claims,
Markdown and plain section headers, metadata, and a cross-dossier relationship.
The in-app load-time self-test covers the pure parsers and bundle rules; this
fixture supports manual import, export, migration, and mobile smoke tests.

`card-formats.cjs` checks every full-card type in portrait, square, and
landscape, actual PNG dimensions, Studio controls, draft persistence,
400px phone layout, overflow blocking, mixed popup/full-card rendering,
and pixel equality of Classic full cards and popups with the v8.9 renderers.
Run `node tests/card-formats.cjs` with Playwright available via Node's
module path. Set `CARD_TEST_BROWSER` to a browser executable if needed.
`CARD_TEST_BASE_REF` selects the Git revision for pixel comparisons
(defaults to HEAD for checking uncommitted renderer edits).
`CARD_TEST_SCREENSHOT` optionally saves mobile, desktop, and card previews.
The test uses an isolated browser profile and synthetic/example cards.

`card-studio.cjs` checks bulk size and design updates, exact one-step undo,
preservation of popup blocks, per-card overrides, remembered new-card size,
saved design controls, typing focus, the expanded and actual-pixel preview with keyboard controls,
dense square cards with notes, long labels and glyph bounds for all full-card
types and formats, overflow blocking, and 400/768/1000/1200/1600px layouts.
Run `node tests/card-studio.cjs` with the same Playwright/browser settings.
`CARD_STUDIO_OUTPUT` optionally names a directory for desktop, expanded,
mobile, and square-card review images. Keep generated images outside the repo.
