# Codex Phase 0 — Baseline Audit Only

You are the Forklight integration lead.

## Read first

1. `/AGENTS.md`
2. `/docs/MASTER_SPEC.md`
3. `/docs/GROK46_PREAUDIT.md`
4. `/docs/TEST_PLAN.md`
5. `/docs/WEBMCP_TOOLS.md`

## Important

This task is **audit only**.

Do not redesign, do not add features, and do not perform the cleanroom deletion yet.

The Grok 4.6 code is the main base. We need evidence before cleanup.

## A. Establish baseline

Determine the current package-manager path and run the appropriate commands for:

```text
install
typecheck
Forklight/Vitest tests
current full test command (if practical)
production build
```

Record exact commands and meaningful warnings/errors.

If the current production build triggers migrations/server output, record that as a spec divergence rather than hiding it.

## B. Trace actual Forklight call paths

Verify from source, not comments:

- MAIN/branch state isolation
- mutationVersion/fresh-proof behavior
- deterministic simulator
- A distance fail
- B only verified
- C protected fail
- human approval source
- dynamic merge registration
- merge lifecycle removal
- timeline source distinction

## C. Audit generator/runtime contamination

Inventory actual usage/imports for:

- `src/lib/auth/**`
- `src/lib/app-data/**`
- `src/lib/multiplayer/**`
- `src/lib/db.ts`
- `server/**`
- PGLite
- Better Auth
- OAuth
- migrations
- `PreviewHostBridge`
- Grok PWA plugin
- app-env plugin/scripts
- Nitro
- TanStack Start/router
- unused component/dependency surface

Classify each as:

```text
KEEP — required by active Forklight
P0 REMOVE — blocks clean static architecture
P1 REMOVE — unnecessary runtime coupling
P2 PRUNE — repo cleanliness only
UNKNOWN — requires more evidence
```

## D. Audit WebMCP v1.2 contract

Verify:

- `document.modelContext`
- 9 static + 1 dynamic tool
- `readOnlyHint`
- tool titles
- AbortSignal
- bounded getTools polling
- current outer result type (string vs object)
- error shape
- static registration cleanup/reload behavior

## E. Audit QA exposure

Confirm how QA is currently rendered on:

- desktop
- mobile
- production default URL

## Deliverable

Create:

`/docs/AUDIT_RESULT.md`

It must contain:

1. baseline commands/results;
2. current Forklight core verdict;
3. P0/P1/P2 divergence table;
4. exact dependency/file removal candidates;
5. proposed smallest Phase 1 patch sequence;
6. tests that must remain green after each patch;
7. top three demo risks.

## Stop

After writing `AUDIT_RESULT.md`, STOP.

Do not start cleanup until the human reviews the audit.

## Final chat response

Return only:

- baseline test status;
- typecheck status;
- build status;
- P0/P1/P2 counts;
- highest-risk issue;
- `docs/AUDIT_RESULT.md` path.
