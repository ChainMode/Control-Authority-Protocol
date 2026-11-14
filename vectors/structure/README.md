# CAP structure-only draft vectors

Status: draft, non-normative.

This directory starts the CAP vector layer without freezing any unresolved
Product Owner decisions from
`docs/en/specification/draft/faying-alignment/08-PO-Decision-Brief.md`.

The vectors here are limited to JSON parseability, envelope naming, and index
metadata. They do not assert authorization outcomes, grade outcomes,
criticality outcomes, confirmation outcomes, revocation outcomes, or canonical
error-code outcomes.

Rules for this directory:

- `metadata.normative` must stay `false`.
- `metadata.scope` must stay `structure-only`.
- Each case must set `freezes_semantics` to `false`.
- Any field shaped by D-1, D-2, D-3, D-4, D-5, D-6, D-7, D-8, D-9, or D-10
  must be listed in `decision_fields_pending`.
- Semantic vector families such as `grade-alignment`, `destructive-confirm`,
  and `revocation` remain blocked until the relevant PO decisions are recorded.

The index format is checked by `vectors/schema/vector-index.schema.json`.
