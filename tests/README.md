# v8 test fixtures

Everything in this directory is public-safe synthetic data. Never replace it
with a real Inside The Case dossier or backup.

`library-v1.itc-library.json` exercises two records, namespaced claims,
Markdown and plain section headers, metadata, and a cross-dossier relationship.
The in-app load-time self-test covers the pure parsers and bundle rules; this
fixture supports manual import, export, migration, and mobile smoke tests.

`card-formats.cjs` checks every full-card type in portrait, square, and
landscape, actual PNG dimensions, Studio controls, draft persistence,
400px phone layout, overflow blocking, mixed popup/full-card rendering,
and pixel equality with the existing portrait and popup renderers.
Run `node tests/card-formats.cjs` with Playwright available via Node's
module path. Set `CARD_TEST_BROWSER` to a browser executable if needed.
`CARD_TEST_BASE_REF` selects the Git revision for pixel comparisons
(defaults to HEAD for checking uncommitted renderer edits).
`CARD_TEST_SCREENSHOT` optionally saves mobile, desktop, and card previews.
The test uses an isolated browser profile and synthetic/example cards.
