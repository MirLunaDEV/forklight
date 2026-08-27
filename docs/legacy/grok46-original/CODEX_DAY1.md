# Codex Day 1 — Integration Prompt

You are the integration lead for Forklight.

Read these files before writing code:

1. `/AGENTS.md`
2. `/docs/MASTER_SPEC.md`
3. `/docs/ARCHITECTURE.md`
4. `/docs/STATE_MODEL.md`

`MASTER_SPEC.md` is the only source of truth.

## DAY 1 GOAL ONLY

Build a Vite + React + TypeScript + R3F app where the locked Forklight fixture exists and branch isolation is visibly real.

Do **not** implement the simulator, validator, WebMCP, capability bloom, merge, landing page, advanced lighting, backend, database, physics engine, or extra features today.

### Required behavior

1. Scaffold the repository structure from `MASTER_SPEC.md`.
2. Implement the locked domain types and `initialWorld`.
3. Render:
   - warehouse floor;
   - all locked entities;
   - all three route polylines;
   - a small decorative set of dummy packages;
   - obvious protected markers.
4. Store serializable `WorldState` only. No `THREE.Object3D` in state.
5. Implement:
   - `createBranch(name)` via `structuredClone`;
   - `switchView("main" | branchId)`;
   - a Day-1-only QA control to move `barrier-north` in the selected branch to `{x: 11, z: 11.3}`.
6. Switching back to MAIN must show `barrier-north` at `{x: 7, z: 11.3}`.
7. Add Vitest tests:
   - creating a branch leaves MAIN serialized JSON unchanged;
   - editing branch A leaves MAIN and branch B unchanged.
8. Create the empty/stub directories needed for later days, but do not implement later-day behavior.
9. Keep the UI simple. State correctness is the deliverable.

### Acceptance test

I can:

```text
Create Branch "Future A"
→ select Future A
→ move barrier-north
→ switch to MAIN
→ see the barrier in its original location
→ switch back to Future A
→ see the moved barrier
```

Both isolation tests pass.

### Restrictions

- No simulator.
- No WebMCP.
- No merge.
- No `navigator.modelContext`.
- No physics engine.
- No custom shaders.
- No backend.
- No database.
- No feature invention.
- No route-generation UI.
- No landing page.

### When finished, report only

- files created/changed;
- `pnpm`/`npm` commands to run dev and tests;
- test results;
- any divergence from the master spec;
- any risk that could block Day 2.

If you find a contradiction in the spec, do not guess. Report it.
