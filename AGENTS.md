# ITC HQ - shared instructions for Codex

`CLAUDE.md` is the shared repository-conventions document. Read it completely before changing this repository and follow every hard rule in it. The rules are model-agnostic even though the filename is Claude-specific.

## Shared local knowledge base

When this checkout lives in the Inside The Case research workspace, the private knowledge base is two directories above this repository:

1. `../../ITC KNOWLEDGE BASE/00 START HERE/AI_START_HERE.md`
2. `../../ITC KNOWLEDGE BASE/00 START HERE/CATALOG.md`

Read those files before changing dossier storage, retrieval, research prompts, production prompts, cross-dossier tools, imports, exports, or backup behavior.

The GitHub repository is public. Never commit dossier text, claims TSV files, scripts, research sources, backup JSON, browser data, or other knowledge-base content. The app may define an import format and read user-selected local files, but private content stays outside this repository.

## Collaboration rules

- Keep the working tree understandable to both Codex and Claude Code. Do not rely on tool-specific hidden state.
- Put lasting product decisions in `CLAUDE.md` or another committed document referenced by both instruction files.
- Inspect current changes before editing and preserve work created by the other tool.
- Work on a feature branch. `main` deploys the live GitHub Pages app.
- Do not push, open a pull request, merge, or deploy unless the user explicitly asks.
- An `index.html` change must also update `APP_VERSION`, `CACHE_VERSION` in `sw.js`, and the in-app changelog as required by `CLAUDE.md`.

