# Codex Phase 3 — Live WebMCP Acceptance

This phase is a live acceptance phase, not feature development.

## Target real session

From a fresh deployed/localhost secure-compatible session, ChatGPT site tools must be able to:

```text
inspect_world
inspect_constraints
create_branch A/B/C
move_entity / modify_route
run_simulation
validate_branch
compare_branches
```

Then stop.

Human approves B in the page.

Verify the tool surface changes and `merge_verified_branch` appears.

ChatGPT then invokes merge.

Verify:

- MAIN visibly becomes B;
- MAIN revision increments;
- B becomes merged;
- A/C become stale;
- merge tool disappears;
- timeline shows real calls only.

## Record failures

If ChatGPT/site-tools behavior differs from local mocked WebMCP tests, record exact behavior and fix compatibility only.

No feature expansion.

Create `/docs/LIVE_WEBMCP_RESULT.md`.
