# Codex Phase 2 — WebMCP Contract Hardening

Run only after Phase 1 static cleanroom is green.

## Required changes

1. Change outer WebMCP execute results from JSON strings to structured objects.
2. Update local WebMCP TypeScript declarations accordingly.
3. Preserve compact structured errors.
4. Preserve/add human-readable tool titles.
5. Preserve `readOnlyHint` on the four read tools.
6. Test static tool count = 9.
7. Test merge tool absent at boot.
8. Harden same-name AbortSignal/getTools re-registration with bounded polling.
9. Hide QA panel/tab unless `?qa=1`.
10. Ensure default product works if `document.modelContext` is missing.
11. Ensure manual QA actions never appear as WebMCP agent activity.

## Human approval boundary

Do not add an approval tool.

Human click must remain the only source of approval.

## Gates

```text
typecheck
tests
static build
```

Then create `/docs/PHASE2_RESULT.md`.

Do not begin visual polish.
