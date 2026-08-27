# Forklight Phase 2 Result — WebMCP Contract Hardening

**Date:** 2026-08-27 KST  
**Status:** COMPLETE  
**Scope:** WebMCP contract, capability lifecycle, QA isolation, and regression tests

## Outcome

Forklight now returns plain structured objects from every WebMCP callback, exposes the locked human-readable titles, keeps exactly four read tools annotated read-only, and registers exactly nine static tools at boot. The merge capability remains absent until a current, freshly verified future is approved through the page UI.

Static and dynamic same-name registration now follow a serialized, bounded lifecycle:

```text
abort previous controller
→ poll document.modelContext.getTools()
→ confirm the old tool name is absent
→ register the replacement
```

If the host does not remove the old tool before the deadline, registration fails explicitly with `WEBMCP_TOOL_REMOVAL_TIMEOUT`; it does not wait forever or attempt a duplicate registration.

## Contract changes

- WebMCP `execute` callbacks return JSON-serializable objects rather than JSON strings.
- Success values always contain `ok: true`.
- Command and exception failures return `{ ok: false, error: { code, message } }`.
- Exception messages are whitespace-compacted and capped; raw stacks are not returned.
- Local WebMCP declarations now type callback results as structured records.
- All ten locked titles are implemented, including `Merge approved future`.
- Only `inspect_world`, `inspect_constraints`, `inspect_branch`, and `compare_branches` use `readOnlyHint: true`.

## Capability lifecycle

- Static registration is serialized to tolerate React Strict Mode setup/cleanup replay.
- Static availability becomes true only after all nine tools finish registering.
- Dynamic merge registration becomes visible in application state only after the host registration promise resolves and eligibility is rechecked.
- Revoke, approved-branch mutation, staleness, revision change, and successful merge abort the dynamic capability and clear its banner.
- The banner no longer turns on optimistically at approval time.
- Registration and synchronization failures are caught by the application bootstrap path and leave capability UI off.
- No approval WebMCP tool was added. Approval and revocation remain UI-only commands.

## QA isolation

- `/` renders no QA panel or QA tab.
- `/?qa=1` renders the deterministic QA controls.
- QA actions continue to use shared domain commands but write only to the separate QA log.
- `AGENT ACTIVITY` continues to contain WebMCP executions only.
- The manual application remains usable when `document.modelContext` is missing.

## Files added

- `src/webmcp/toolLifecycle.ts`
- `src/ui/qaMode.ts`
- `src/tests/qa-mode.test.ts`
- `docs/PHASE2_RESULT.md`

## Files changed

- `src/types/webmcp.d.ts`
- `src/webmcp/toolWrapper.ts`
- `src/webmcp/registerTools.ts`
- `src/webmcp/capabilityManager.ts`
- `src/state/appStore.ts`
- `src/ui/ForklightApp.tsx`
- `src/tests/webmcp.test.ts`

No simulator, validator, locked-world constant, approval command, or merge-domain rule was changed.

## Automated verification

| Gate | Result |
|---|---:|
| `npm run typecheck` | PASS |
| `npm test` | PASS — 3 files, 38/38 tests |
| Core Forklight behavior | PASS — 23/23 tests |
| WebMCP and QA contract | PASS — 15/15 tests |
| `npm run build` | PASS — static `dist/` |
| `npm run lint` | PASS — 0 errors, 1 existing Fast Refresh warning |

The WebMCP tests directly cover:

- unavailable Model Context fallback;
- static count of nine and merge absence at boot;
- exact static titles and exactly four read annotations;
- structured success and error values;
- compact exception conversion without stack exposure;
- real timeline versus QA-log separation;
- approval exposure, revoke removal, and mutation removal;
- merge revision/status/staleness results and post-merge removal;
- delayed static removal followed by safe re-registration;
- explicit static and dynamic removal timeouts with no duplicate attempt.

## Browser verification

The local app was reloaded in the Codex in-app browser at `http://127.0.0.1:8080/` with the real browser WebMCP host:

- the page rendered normally with `WebMCP live`;
- the host reported all nine static tools with their exact titles;
- the default DOM contained no QA controls or QA tab;
- `http://127.0.0.1:8080/?qa=1` contained the `QA controls` panel;
- a Strict Mode reload completed and the full tool surface returned without the former `teardown-static` registration failure surfacing.

## Non-blocking build notes

- The `Warehouse` bundle remains approximately 929 kB before gzip (about 248 kB gzip).
- Vite notes that `capabilityManager` is both statically and dynamically imported.
- ESLint retains one Fast Refresh warning in `src/ui/status.tsx`.

These were already known after Phase 1 and are not WebMCP correctness failures.
