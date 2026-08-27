# Forklight Codex Handoff v1.2

This archive is the **only package Codex should receive initially**.

It contains:

- the Grok 4.6 implementation as the engineering base;
- original Grok governance docs archived under `docs/legacy/grok46-original/`;
- locked `MASTER_SPEC v1.2`;
- strict staged Codex prompts.

## Do not upload the Manus source into the same Codex project

The Manus prototype is visual reference only and would create two competing implementations.

## Start sequence

1. Extract this ZIP to a normal local folder.
2. Open the extracted `Forklight` folder in Codex.
3. Start a fresh Codex thread.
4. Paste `docs/CODEX_PHASE0_AUDIT.md`.
5. Let Codex create `docs/AUDIT_RESULT.md` and STOP.
6. Review the audit before any cleanup.
7. Then run `docs/CODEX_PHASE1_CLEANROOM.md`.
8. After Phase 1 is green, run `docs/CODEX_PHASE2_WEBMCP.md`.
9. Live acceptance is `docs/CODEX_PHASE3_LIVE.md`.

Do not tell Codex “finish the whole project” in the first turn.
