# ITC HQ v8.0 specification

## Outcome

v8.0 turns the Library into a durable, portable knowledge shelf. A production
job can select every relevant dossier, and every production prompt receives a
single bounded bundle made from those dossiers. Private research never enters
this public repository.

## Version boundaries

- App version: `8.0`
- Dossier schema: `2` (unchanged)
- Portable library package schema: `1`
- IndexedDB database: `itc_hq`, database version `1`

These versions are independent. A change to the app does not silently change
the dossier or package contracts.

## Storage contract

- IndexedDB is the canonical store for dossier records when it is available.
- `localStorage` remains the store for small app settings and the v7 fallback.
- The legacy `itc_dossiers` value is never deleted or overwritten by migration.
- On first v8 load, legacy dossiers are copied to IndexedDB, read back, and
  verified by tag, character count, claim-row count, and deterministic hash.
- A failed or interrupted migration is reported and can be retried. The app
  continues to read the untouched legacy library.
- `file://` and browsers without IndexedDB retain the v7 localStorage path.
- Save failures are visible to the user. The app must not claim that a dossier
  was saved when persistence failed.

## Dossier record

Each IndexedDB record is keyed by `tag` and may contain:

```text
tag, name, type, text, claims, contentPlan, status, dossierSchema,
years, version, blockers, relatedTags, updatedAt, integrity
```

Unknown fields survive an import/export round trip.

## Portable package contract

The file suffix is `.itc-library.json`. A package contains no executable code:

```json
{
  "format": "itc-library-package",
  "packageSchema": 1,
  "appVersion": "v8.0",
  "exportedAt": "ISO-8601 timestamp",
  "dossiers": []
}
```

Every dossier entry contains its manifest metadata, `dossierText`,
`claimsTsv`, optional `contentPlanText`, and an integrity object. Import
validates the package and verifies the stored copy. Existing tags require an
explicit overwrite confirmation.

## Multi-dossier production

- Every production job stores `dossierTags`; old jobs migrate from their
  singular `dossierTag` without data loss.
- The primary dossier is always selected. The user can add or remove shelf
  companions before copying a production prompt.
- The bundle names every dossier used, exposes status and blockers, namespaces
  claim IDs as `TAG:C123`, and includes the bounded CORE production sections
  plus the claims ledger.
- R8 remains a full, single-dossier revision pass and does not receive the
  compact production bundle.
- X1 remains the dedicated conflict-resolution pass. Selecting multiple
  dossiers for production does not authorize the model to invent a resolution
  when the sources conflict.

## Public/private boundary

Real dossier text, claims TSV files, scripts, sources, backups, and generated
library packages stay outside this public repository. Tests use synthetic
fixtures about imaginary components only.

## v8.0 acceptance checks

1. A v7 library migrates once, verifies, and remains present in legacy storage.
2. A failed migration leaves v7 usable and displays a retryable failure.
3. Package export/import round-trips text, claims, metadata, and unknown fields.
4. Duplicate tags cannot overwrite silently.
5. A production job can select multiple dossiers and copied prompts list them.
6. Every claim ID in a multi-dossier bundle is namespaced.
7. Section parsing accepts the supported plain-text and Markdown header forms.
8. Storage/quota errors are surfaced.
9. The app remains usable near 400 px width and through `file://` fallback.
10. `APP_VERSION`, service-worker cache, and changelog all say v8.0.
11. The load-time self-test passes and no real research data is committed.

