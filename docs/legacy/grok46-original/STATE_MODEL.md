# Forklight State Model

`MASTER_SPEC.md` is authoritative.

## State layers

### MAIN

The live world the human currently cares about.

```ts
{
  worldState: WorldState,
  revision: number
}
```

MAIN is not mutated by experiment tools.

### Candidate branches

Each branch owns a deep clone of MAIN taken at one `baseRevision`.

```text
MAIN rev 1
├─ route-a baseRevision 1
├─ route-b baseRevision 1
└─ route-c baseRevision 1
```

### Approval

Approval is separate from branch state.

```ts
{
  branchId: string | null,
  approvedAt: number | null
}
```

Approval is human-only UI state.

### Capability state

AbortController and tool registration state are browser/runtime-only and must never enter serializable world/domain state.

## Invariants

1. MAIN is never directly changed by `move_entity` / `modify_route`.
2. Branches do not share mutable nested references.
3. Any branch mutation:
   - increments `mutationVersion`;
   - clears `metrics`;
   - clears `validationResult`;
   - sets status `draft`;
   - revokes approval if needed.
4. Fresh simulation:
   `simulatedMutationVersion === mutationVersion`.
5. Fresh validation:
   `validatedMutationVersion === mutationVersion`.
6. Merge requires:
   verified + fresh + same MAIN revision + human approval + registered merge capability.
7. MAIN revision change makes previous candidates stale.
8. Only successful merge changes MAIN.
9. Successful merge removes merge capability.
10. Protected moves remain violations even if reverted later.

## Command names

Use the same domain-command naming across UI and WebMCP wrappers:

```text
createBranch
moveEntity
modifyRoute
runSimulation
validateBranch
compareBranches
approveBranch        // human UI only
revokeApproval       // human UI only
mergeVerifiedBranch  // domain command, WebMCP exposed dynamically
switchView           // UI only
```

## Transaction rule

A failed command must not partially mutate state.

Prefer:

1. validate input;
2. clone/update target;
3. commit state once;
4. log success.

Do not mutate nested Zustand state in-place unless the implementation explicitly uses a safe immutable helper.
