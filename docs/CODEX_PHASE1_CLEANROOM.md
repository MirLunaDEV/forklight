# Codex Phase 1 — Cleanroom Extraction

Run only after Phase 0 audit is reviewed.

Read:

- `/AGENTS.md`
- `/docs/MASTER_SPEC.md`
- `/docs/AUDIT_RESULT.md`

## Goal

Preserve the verified Forklight core while removing unrelated Grok App Builder runtime infrastructure.

No product feature work.

## Patch order

### 1. Protect core with tests first

Before deleting infrastructure, ensure the golden Forklight/Vitest suite covers:

- branch isolation
- A/B/C golden results
- approval/merge
- capability lifecycle

Commit/record this baseline.

### 2. Remove backend/data/auth coupling

Remove active runtime dependency on:

- auth provider
- PreviewHostBridge
- DB/PGLite
- migrations
- OAuth popup
- multiplayer
- server runtime

Do not remove a file merely by directory name; verify imports first.

### 3. Convert to a normal static Vite app

Target production flow:

```text
vite build
→ static dist
```

No migration command.
No Nitro preset.
No server directory requirement.

A simple React/Vite entry is preferred over retaining TanStack Start solely for one route, **but only simplify routing if the audit proves it is low risk**.

### 4. Remove generator/PWA/app-env coupling

Remove active use of:

- Grok PWA plugin
- app-env plugin
- generator-only preview scripts
- generator-only manifest URLs

Keep local favicon/OG assets if useful.

### 5. Clean package scripts/dependencies

Prune only dependencies proven unused after runtime extraction.

Do not blindly delete Radix/UI dependencies still imported by active Forklight components.

## Gates after each logical patch

Run:

```text
typecheck
Forklight tests
production build
```

At final Phase 1 gate:

```text
all golden tests green
static build green
no DB migration during build
no auth/backend dependency on startup
Forklight UI renders
```

## Do not yet

- change WebMCP result strings to objects unless needed for compile after cleanup;
- redesign the UI;
- add features;
- change simulator constants;
- alter A/B/C behavior.

## Deliverable

Create `/docs/PHASE1_RESULT.md` containing:

- files removed;
- dependencies removed;
- package-script changes;
- runtime architecture before/after;
- tests/typecheck/build results;
- remaining P1 WebMCP tasks;
- any visual regressions.

Stop after Phase 1.
