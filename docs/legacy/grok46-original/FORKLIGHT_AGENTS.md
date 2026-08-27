# AGENTS.md — Forklight

Read `/docs/MASTER_SPEC.md` before writing code. It is the source of truth.

## Absolute rules

- Do not add features not present in the master spec.
- Do not use `navigator.modelContext`, `provideContext`, `unregisterTool`, or an unofficial WebMCP polyfill.
- Do not add a backend, database, authentication, LLM API, multiplayer, physics engine, generalized branch framework, or landing page.
- Do not store Three.js objects in domain/state.
- Do not use `Math.random()` in the simulator.
- Do not change simulator formulas or hard constraints silently.
- UI actions and WebMCP tools must use the same domain commands.
- `merge_verified_branch` must not be registered at boot.
- A branch mutation invalidates its simulation/validation and revokes approval.
- Never fake WebMCP timeline events.

## Before coding

Report:

1. the master-spec sections your task touches;
2. the files you plan to modify;
3. the tests that prove success.

If the requested task conflicts with the master spec, stop and report the conflict instead of guessing.

## Finish condition

When done, report:

- files changed;
- tests run and results;
- any divergence from the master spec;
- any risk that could affect the locked demo path.

Avoid unrelated refactors.
