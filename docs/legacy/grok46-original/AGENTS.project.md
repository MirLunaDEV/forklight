# Forklight project rules

Read `docs/MASTER_SPEC.md` before changing product behavior.

- Do not add features not present in the master spec.
- Do not use `navigator.modelContext`, `provideContext`, `unregisterTool`, or an unofficial WebMCP polyfill.
- Do not add a backend, database, authentication, LLM API, multiplayer, physics engine, or generalized branch framework.
- Do not store Three.js objects in domain/state.
- Do not use `Math.random()` in the simulator.
- UI actions and WebMCP tools must use the same domain commands.
- `merge_verified_branch` must not be registered at boot.
- A branch mutation invalidates its simulation/validation and revokes approval.
- Never fake WebMCP timeline events.
