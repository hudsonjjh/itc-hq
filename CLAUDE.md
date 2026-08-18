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
   (`itc_dossiers` is the research library, `itc_shorts` the job
   queue, plus card drafts and the writer doc). Do not rename keys
   without migrating old values, or people lose their saved work.
   Dossiers are the most valuable thing in there: they represent hours
   of research per part and are only on the device plus the backup
   file.
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
- The workflow is playbook v7.0, two tracks, on both Claude
  (Opus/Fable) and ChatGPT. The **research track** (R1 scope and
  coverage plan, R2 deep research, R3 second pass, R4 expansion, R5
  accuracy audit, R6 gap hunt, R7 finalize) builds one permanent
  dossier per part to the fixed schema and shelves it
  in the Library. The **production track** (P1 content plan, P2A/B/C
  write, P3 copy audit, P4 cards, P5 packaging) draws content out of a
  finished dossier, repeatedly. R2 and R3 share one chat; every other
  step runs cold in a fresh chat with its inputs pasted in, ideally
  alternating models between writing and auditing.
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
- **One surface.** The Playbook and the Home flow must never hand over
  different text for the same prompt. Playbook copy buttons go through
  `livePrompt()`, which uses the flow builder whenever a job of the
  matching kind is running. If you add a prompt, add it to `FLOW_BUILD`
  too, or that button quietly starts copying an unfilled version again.
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
- **X1 is optional and needs two or more finished dossiers.** It is
  the only pass that can answer a `CROSS-CHECK NEEDED` item, because
  P3 is deliberately given one dossier and can therefore only flag.
  Do not solve that by pasting every dossier into P3.
- R8 is optional and only for a dossier that is already finished.
  Do not route new subjects through it. Every step output
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
