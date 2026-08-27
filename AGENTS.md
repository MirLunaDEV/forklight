# AGENTS.md — Forklight v1.2

Read `/docs/MASTER_SPEC.md` before touching product code.

The Grok 4.6 source is the implementation base. The master spec is the source of truth.

## Absolute rules

- Do not rebuild Forklight from scratch.
- Do not add features.
- Do not preserve app-builder infrastructure merely because it exists.
- Do not add backend, DB, auth, accounts, multiplayer, or LLM API.
- Do not use `navigator.modelContext`, `provideContext`, or `unregisterTool`.
- Do not return JSON-stringified outer tool results; return structured values.
- UI and WebMCP must use the same shared domain commands.
- `merge_verified_branch` must be absent at boot.
- Agent cannot approve a branch.
- Mutation invalidates proof and approval.
- Never fake agent timeline entries.
- Do not alter golden simulator behavior silently.
- Do not begin visual polish before live WebMCP loop works.
- Avoid unrelated refactors.

## Before any patch

Report:

1. spec sections touched;
2. files planned;
3. tests proving success;
4. whether the patch is P0/P1/P2.

## After any patch

Report:

- files changed/removed;
- dependencies changed;
- commands run;
- test/typecheck/build results;
- remaining spec divergences;
- risk to the locked demo.

If instructions conflict with `MASTER_SPEC.md`, stop and report the conflict.
