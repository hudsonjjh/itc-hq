# ITC HQ — repo conventions for Claude Code

## Shared AI workspace

Codex and Claude Code use this repository together. `CLAUDE.md` remains the
shared source of truth for product and repository conventions; `AGENTS.md`
is the Codex entry point and refers back here.

When this checkout is inside the Inside The Case research workspace, the
private knowledge base lives at `../../ITC KNOWLEDGE BASE/`. Before changing
dossier storage, retrieval, research prompts, production prompts,
cross-dossier tools, imports, exports, or backup behavior, read:

1. `../../ITC KNOWLEDGE BASE/00 START HERE/AI_START_HERE.md`
2. `../../ITC KNOWLEDGE BASE/00 START HERE/CATALOG.md`

This GitHub repository is public. Never commit dossier text, claims TSV
files, scripts, sources, backup JSON, or other private knowledge-base data.
Keep those outside the repo and design explicit local import/export paths.
Work on feature branches because every push to `main` deploys the live app.

This repo is a single-file PWA: `index.html` is the entire app (guided Work
surface, Library, Card Generator, and Case Writer for the Inside The Case Auto
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
5. **Stored data is user data.** Small settings and the v7 fallback use
   `localStorage` keys prefixed `itc_`; v8 dossiers use IndexedDB database
   `itc_hq`, object store `dossiers`. Never rename, clear, or overwrite either
   layer without a copy-and-verify migration. The legacy `itc_dossiers` value
   stays untouched after a successful migration. Dossiers represent hours of
   research and may exist only on the device plus an exported package.
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
- The workflow is playbook v8.6, two tracks, on both Claude
  (Opus/Fable) and ChatGPT. The **research track** (R1 scope and
  coverage plan, R2 deep research, R3 second pass, R4 expansion, R5
  accuracy audit, R6 gap hunt, R7 finalize) builds one permanent
  dossier per part to the fixed schema and shelves it
  in the Library. The **production track** follows the channel's real work:
  P1 content plan, a user-written choice or combination of ideas, P2A/B/C
  writing with unrestricted conversational revision, P3 final audit, P4
  cards, and P5 upload details from the transcript of the edited video.
  R1 through R4 share one research chat; R5 through R7 share a separate
  blank audit chat. The final script audit should run cold when practical.
- **Research is file-first.** R1 through R8, including L2 and L3, return
  downloadable UTF-8 `.txt` artifacts instead of PDFs or long pasted chat
  replies. R7, L3 and R8B also return a required `.tsv` claims companion.
  Every Work research checkpoint loads those files with `bsArtifactField()`;
  the collapsed textarea is only a review and manual fallback surface. Do not
  restore PDF outputs or require users to copy artifact text out of chat.
  `artifactContract()` prepends the exact filename, extension, encoding, MIME
  type, and forbidden formats before the task instructions. Keep the matching
  delivery instruction at the end as a second guard. R7 and R8B are explicitly
  self-tested as TXT plus TSV two-file outputs.
- **The light spine** (R1, then L2, then L3) is the same research track
  with steps merged, for a subject too small to earn seven prompts. It
  is allowed to shorten by merging and never by dropping: all six
  sweeps run, the gap hunt still measures against R1's question list,
  and L3 still runs cold in a chat that did not write the dossier. The
  self-test fails if any of those three disappear. A light job is
  `kind:'research'` with `light:true`, not a separate kind, so
  everything that asks "is this research" keeps working.
- **Delta passes.** R3, R5 and R6 return only what changed. Only the
  last step in a chat restates the whole dossier, which is why R7
  assembles the R4 base plus the R5 and R6 deltas. Do not "fix" a
  delta pass by asking it to restate the dossier again.
- **CORE and REFERENCE.** Every claim is routed. Production prompts
  receive `CORE_NOTE` via `withDossier()` and write from CORE only;
  REFERENCE is background. R8 deliberately does not get that note,
  because a revision pass has to re-attack everything. Keep the note
  in one place, not copied into the seven P prompts.
- Every claim carrying a figure carries a verbatim QUOTE, and section
  27 gathers every figure in the dossier into one ledger. Both exist
  for the same reason: a wrong digit is invisible in prose and obvious
  next to the words it came from.
- Research is the product. A dossier is never scoped to one video, and
  R1's question list plus R6's gap hunt exist so a missing answer is
  visible rather than silent. Do not collapse those two steps, and do
  not let R7 mine angles again: that split is what fixed narrow,
  thin content planning.
- The standing rules and the sweeps live in exactly one place each,
  `<pre id="rules">` and `<pre id="sweeps">`, and are appended at copy
  time by `withBlocks()`. Never paste tier, source-hierarchy, or style
  rules back into an individual prompt: that duplication is what the
  v6.2 revision removed, and the load-time self-test now fails if the
  blocks stop attaching.
- **One visible surface.** Work is the only guided route for research and
  production. The old Playbook DOM remains hidden as the prompt engine and
  reference source, with no navigation tab and no `FULL STEP` escape hatch.
  Work buttons use the builders in `FLOW_BUILD`, which inject saved documents
  and selected dossiers. If you add a prompt, keep its builder and Work stage
  together so an unfilled copy can never become a second workflow.
- Coverage and accuracy are different questions. Accuracy asks whether
  the claims are true (R5); coverage asks whether the right questions
  were ever generated (the sweeps, R6). Completeness reports four
  separate axes and deliberately has no blended total, because a
  single number gets quoted as "we know this much about the subject"
  when it only ever meant "we answered our own question list".
- **Across the shelf** (Library, v7.2) reads every finished dossier at
  once. The only structure it relies on is the schema's numbered
  section headers, parsed by `sectionMap()`; anything it cannot find
  is reported as not found, never guessed at. `FIT_SECTIONS` is the
  slice that describes how a part meets other parts and is what the
  X1 bundle carries by default; if you renumber a schema section,
  that constant and the self-test move with it.
- **The v8 Library is portable and verified.** App version, dossier schema,
  and package schema are independent (`v8.6`, dossier schema 2, package schema
  1). IndexedDB is canonical when available; `file://` and unsupported
  browsers fall back to localStorage. Every migration, import, and save is
  read back and checked. Real `.itc-library.json` packages are private data
  and never belong in this repository.
- **A finished dossier imports from its real final artifacts.** The primary
  Library import accepts the matching final TXT and claims TSV from R7, L3,
  or R8B, validates the filenames and required claim columns, lets the user
  confirm the tag and subject, then saves and verifies one dossier. JSON
  library packages remain whole-shelf backup and restore files. Do not make a
  user build JSON merely to add one completed dossier.
- **Production can use multiple dossiers.** A job keeps a primary
  `dossierTag` for compatibility and a `dossierTags` array for the full
  selection. `productionBundle()` carries sections 00 to 15, 26 and 27 plus
  the claims companion, and namespaces every claim as `TAG:C123`. Do not
  replace that bounded retrieval with the complete shelf. R8 still receives
  the complete single parent dossier.
- **X1 is optional and needs two or more finished dossiers.** It is
  the pass that can answer a `CROSS-CHECK NEEDED` item. P3 receives every
  dossier the user selected for production and only a tag list for the rest;
  it flags an omitted boundary instead of guessing. Do not solve that by
  pasting every dossier on the shelf into P3.
- R8 is optional and only for a dossier that is already finished. R8A and R8B
  have permanent direct Copy buttons at the top of Work, even with an active
  job or empty Library. Those standalone prompts tell the user which TXT files
  to attach to the AI chat; they do not require pasting the full documents.
  The guided route selects an imported or finished dossier, copies R8A with
  the parent attached, accepts the pass, then copies R8B with both documents.
  It never requires R1 through R7. Do not route new subjects through it.
  Every step output must stand alone. Keep all prompt copy model-agnostic; do not write
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

## Card studio

The v7.1 studio is a second way into the spec text, never a second
format. The text stays the source of truth because it is what the AI
writes and what the parser reads. Every control serializes one card's
block through `workToBlock()`, splices it back with `specParts()` /
`partsText()`, and re-parses: what the canvas shows is always the
result of parsing real spec text.

- **A studio round trip must be byte-identical** when nothing was
  edited. Only emit a key the card actually set, which is what
  `setKeys` is for. Emitting a default is not harmless: writing
  `accent:` onto a popup pins it to that colour and silently kills the
  style preset, which is exactly the bug this rule exists to stop.
- Rebuild the form only on structural change (`studioCommit(true)`).
  Rebuilding on every keystroke steals focus mid-word.
- P4B generates interesting facts only, `POPUP_PROMPT_STYLES`. The
  renderer and the studio still offer warning and correction by hand;
  the prompt does not write them, and the self-test enforces that.
- **Popup shape is `width`, `textsize`, `font`, popup only.** Width sets
  the panel *and* `maxW`, so text reflows rather than crops; the guard
  asserts a narrower popup gets taller. `textsize` scales every font
  and every vertical advance together through `V()` and `pf()` -- scale
  one without the other and lines collide. Mono has only 400 and 700,
  so weights map through `MONO_WEIGHT` instead of being synthesised.
- **A popup label has three states, not two.** No `kicker` line means
  the style names itself (what P4B writes); a `kicker` line left blank
  means no label row at all and the block shortens; a filled one wins.
  `setKeys` is what separates the first two, so the studio carries
  `setKicker` alongside the value. Do not "simplify" this to empty
  string equals no label: that silently strips the label off every
  popup the prompt has ever produced.
- **Popups export at `popupScale()`**, default 3x, chosen next to the
  file tag. The layout constants stay in layout units and the scale is
  applied once, as the canvas size and a matching `setTransform`, so
  more pixels never means a different crop. `renderPopup` takes the
  scale as an optional third argument: the self-test drives it that
  way because `localStorage` is unavailable under `data:` and a guard
  that needs writable storage fails on a perfectly healthy app.
- **Alignment is popup only** (`ALIGNS`, `ALIGN_FIELDS`,
  `ALIGN_DEFAULT`, resolved by `alignOf()`). The 1080x1920 layouts hang
  text off fixed geometry, the accent rule, the underline bar, the row
  dots, so alignment there would break the card rather than restyle it,
  and a full card that sets it gets a warning instead of silence. All
  five lines are laid inside one column, X to X+maxW, so the three
  alignments share a ruler. The ITC mark defaults right and does not
  follow the blanket `align` line.
