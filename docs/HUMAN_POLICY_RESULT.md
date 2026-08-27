# Forklight Human Policy Result

**Date:** 2026-08-27 KST  
**Scope:** one pre-exploration human-policy step; no simulator, golden-future, tool-count, or deployment-architecture redesign  
**Local implementation status:** COMPLETE

## Product outcome

Forklight now requires the human both before and after agent exploration:

```text
HUMAN reviews and locks acceptable boundaries
→ AGENT explores isolated futures
→ SIMULATOR measures consequences
→ VALIDATOR checks the human policy
→ HUMAN approves one verified future for merge
→ merge_verified_branch appears
→ AGENT may merge only after permission
```

The right-side HARD CONSTRAINTS block is now a HUMAN POLICY panel with unmistakable ownership, fixed challenge-safe values, draft/locked status, an explicit `Lock policy` action, and the message `Agent exploration enabled` after lock. The existing approval button is now `Approve for Merge`.

## Policy-state architecture

`GoalPolicy` is serializable domain state:

```ts
{
  status: "draft" | "locked";
  definedBy: "human";
  minThroughputImprovement: 0.2;
  maxDistanceIncrease: 0.1;
  maxProtectedMoved: 0;
  maxCongestionRatio: 1;
}
```

The challenge build deliberately keeps the validated numerical values fixed. The human reviews and locks those boundaries through the UI; no arbitrary editor can destabilize the golden demonstration.

While policy is draft, `create_branch`, `move_entity`, `modify_route`, `run_simulation`, and `validate_branch` return the structured error `POLICY_NOT_LOCKED`. Locking policy enables the existing commands. Selecting `Edit policy` after exploration clears active validation proof, revokes approval, removes merge eligibility, and returns active branches to an unvalidated `simulated` or `draft` state.

The validator receives the current policy from the shared snapshot. No browser or WebMCP object is stored in domain state.

## Human and agent boundary

- Policy locking/editing is available only through page UI/state actions.
- Approval remains page-UI-only.
- No `set_policy`, `update_constraints`, `lock_policy`, or approval WebMCP tool exists.
- `inspect_constraints` remains read-only and now reports the policy object, `definedBy: "human"`, lock status, and whether exploration is enabled.
- Static WebMCP count remains exactly 9.
- The only dynamic tool remains `merge_verified_branch`.

## Automated verification

| Gate | Result |
|---|---:|
| `npm ci` | PASS — 314 packages installed |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 4 files, 47/47 tests |
| `npm run lint` | PASS — 0 errors, 1 existing Fast Refresh warning |
| `npm run build` | PASS |
| Cloudflare-compatible `dist/server/index.js` | PRESENT |
| Static client build | PRESENT |

Focused tests cover default golden values, human ownership, draft exploration rejection, all experiment-command gates, post-lock workflow, policy-edit proof invalidation, approval revocation, merge-capability removal, `inspect_constraints`, absence of policy-writing tools, nine static tools, and the existing approve/merge lifecycle.

## Local real WebMCP verification

The local in-app browser confirmed:

- default UI shows `HUMAN POLICY`, `DEFINED BY HUMAN`, `Draft policy`, and `Exploration paused`;
- `create_branch` before lock returns `POLICY_NOT_LOCKED` and MAIN remains revision 1;
- clicking `Lock policy` changes the UI to `Policy locked` and `Agent exploration enabled`;
- `inspect_constraints` returns the locked human policy and `explorationEnabled: true`;
- all nine static tools remain present and no merge tool exists at boot;
- A still fails only distance;
- B remains the only verified future;
- C still fails protected equipment;
- `Approve for Merge` on B exposes `CAPABILITY UNLOCKED` and the one dynamic merge tool;
- clicking `Edit policy` removes validation, approval, the capability banner, and `merge_verified_branch`.

The browser host's automatic security review denied the repeated local MAIN-mutating merge call. No workaround was used. The unchanged automated merge lifecycle remains green, and the earlier full live acceptance in `LIVE_WEBMCP_RESULT.md` already proves a real approved merge from revision 1 to 2.

## Golden outcome confirmation

| Future | Throughput | Average distance | Protected moved | Result |
|---|---:|---:|---:|---|
| A | 0.3500 | 22.1067 m | 0 | FAIL — distance |
| B | 0.3875 | 21.0777 m | 0 | VERIFIED — only passing future |
| C | 0.3875 | 21.2053 m | 1 | FAIL — protected |

No simulator formula, golden coordinate, candidate count, backend surface, deployment adapter, or WebMCP tool name/count changed.
