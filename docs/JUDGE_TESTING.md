# Judge Testing Guide

This guide tests Forklight from the live product surface. No source-code knowledge, credentials, paid API, database, or external LLM key is required.

Live app: <https://forklight.kimth06230724.chatgpt.site/>

## Expected initial state

- Header shows `MAIN rev 1`.
- HUMAN POLICY shows `Draft policy` and `Exploration paused`.
- Four editable controls show defaults `20 / 10 / 0 / 100`.
- `document.modelContext` exists in a WebMCP-capable browser.
- `getTools()` returns exactly nine static tools.
- `merge_verified_branch` is absent.
- The QA panel is not visible on the default URL.

## Test 1 — policy gate

Ask the agent to call:

```text
create_branch({ name: "pre-lock-check" })
```

Expected structured result:

```json
{
  "ok": false,
  "error": {
    "code": "POLICY_NOT_LOCKED",
    "message": "The human must lock the goal policy before future exploration begins."
  }
}
```

Call `inspect_world` again. MAIN must still be revision 1 and no branch may have been created.

## Human step — choose and lock policy

In the right-side HUMAN POLICY panel, change **Maximum route distance increase** from `10` to `6`, then click **Lock policy**.

Expected UI:

- `Policy locked`
- `Agent exploration enabled`
- All four chosen values remain visible and read-only

There is intentionally no agent tool that locks or edits policy.

## Agent test — create A/B/C

Create three isolated futures named `route-a`, `route-b`, and `route-c`.

### route-a

1. Move `barrier-south` to `x=11`, `z=3.8`.
2. Enable `r-south`.

### route-b

1. Move `barrier-north` to `x=11`, `z=11.3`.
2. Enable `r-north`.

### route-c

1. Move `barrier-north` to `x=11`, `z=11.3`.
2. Enable `r-north`.
3. Move protected `scan-1` to `x=14`, `z=12.5`.
4. Update the third waypoint of `r-north` to `x=14`, `z=12.5`, preserving the other route waypoints:

```json
[
  { "x": 2, "z": 8 },
  { "x": 8, "z": 12 },
  { "x": 14, "z": 12.5 },
  { "x": 22, "z": 8 }
]
```

Run `run_simulation` and `validate_branch` for all three futures, then call `compare_branches`.

## Expected comparison

| Future | Expected status | Decisive result |
|---|---|---|
| route-a | FAIL | distance increases about 10.5%, above the 6% limit |
| route-b | VERIFIED | all four HUMAN POLICY checks pass |
| route-c | FAIL | protected equipment moved = 1; exact distance is also slightly above 6% |

Expected metric family:

| Future | Throughput | Average distance |
|---|---:|---:|
| MAIN | 0.2000 | 20.0000 m |
| route-a | 0.3500 | 22.1067 m |
| route-b | 0.3875 | 21.0777 m |
| route-c | 0.3875 | 21.2053 m |

B must be the only verified future. The agent cannot approve it.

## Human step — approve B

Click **Approve for Merge** on `route-b`.

Expected:

- B shows `Approved for Merge`.
- The interface shows the capability-unlocked state.
- A refreshed `getTools()` result now contains `merge_verified_branch` as the tenth tool.

## Agent step — merge

Invoke:

```text
merge_verified_branch({ branchId: "branch-2" })
```

Use the actual branch ID returned for route-b if it differs.

Expected final state:

- MAIN revision changes from 1 to 2.
- route-b becomes `merged`.
- route-a and route-c become `stale`.
- `merge_verified_branch` disappears from a fresh tool listing.
- Agent Activity records the real merge call.

## Copy-paste natural-language prompt

```text
Inspect the current Forklight warehouse and its human-owned constraints. Before policy is locked, try to create a future named pre-lock-check and confirm the structured POLICY_NOT_LOCKED result and that MAIN remains revision 1. Then stop and ask me to set the maximum route distance increase to 6% and click Lock policy.

After I confirm policy is locked, create three isolated futures named route-a, route-b, and route-c. Do not modify MAIN.

For route-a, move barrier-south to x=11, z=3.8 and enable r-south.

For route-b, move barrier-north to x=11, z=11.3 and enable r-north.

For route-c, move barrier-north to x=11, z=11.3, enable r-north, move the protected scan-1 entity to x=14, z=12.5, and update the third r-north waypoint to x=14, z=12.5 while preserving the other waypoints.

Run and validate all three futures, compare them, and stop so I can approve one. After I approve route-b in the UI, refresh the available tools, invoke merge_verified_branch for the approved branch, and verify that MAIN becomes revision 2, route-b is merged, route-a and route-c are stale, and the merge tool disappears.
```
