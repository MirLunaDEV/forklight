# Forklight WebMCP Tool Contract v1.2

Reference: `https://webmachinelearning.github.io/webmcp/`

## API

```ts
document.modelContext.registerTool(tool, { signal });
document.modelContext.getTools();
```

## Static tools

| Name                | Title                  | Read-only |
| ------------------- | ---------------------- | --------: |
| inspect_world       | Inspect world          |       yes |
| inspect_constraints | Inspect constraints    |       yes |
| inspect_branch      | Inspect future         |       yes |
| compare_branches    | Compare futures        |       yes |
| create_branch       | Create future          |        no |
| move_entity         | Move entity in future  |        no |
| modify_route        | Modify route in future |        no |
| run_simulation      | Simulate future        |        no |
| validate_branch     | Validate future        |        no |

The five experiment tools require the human-owned goal policy to be locked. While policy is draft they return:

```json
{
  "ok": false,
  "error": {
    "code": "POLICY_NOT_LOCKED",
    "message": "The human must lock the goal policy before future exploration begins."
  }
}
```

`inspect_constraints` remains read-only and exposes the current human policy without adding a policy-writing tool:

```json
{
  "ok": true,
  "policy": {
    "status": "locked",
    "definedBy": "human",
    "minThroughputImprovement": 0.2,
    "maxDistanceIncrease": 0.1,
    "maxProtectedMoved": 0,
    "maxCongestionRatio": 1
  },
  "explorationEnabled": true
}
```

Static tool count remains exactly nine. The agent cannot change or lock policy.

## Dynamic

| Name                  | Title                 |
| --------------------- | --------------------- |
| merge_verified_branch | Merge approved future |

Absent at boot.

## Return contract

Return objects, not JSON strings.

```ts
{ ok: true, ... }
```

Errors:

```ts
{ ok: false, error: { code, message } }
```

## Capability lifecycle

```text
verified + fresh + current + human-approved
→ register merge tool
```

Abort on revoke/mutation/stale/merge.

When re-registering same name:

```text
abort
→ getTools polling
→ bounded timeout
→ register
```

## Human boundary

No approval WebMCP tool.

No policy mutation or policy lock WebMCP tool. Policy configuration and locking are page-UI-only human actions.

## Demo prompt

```text
Inspect the warehouse and its constraints. Create three isolated futures named
route-a, route-b, and route-c without modifying MAIN.

For route-a, move barrier-south to x=11 z=3.8 and enable r-south.
For route-b, move barrier-north to x=11 z=11.3 and enable r-north.
For route-c, use the north bypass, then move the protected scan-1 to x=14 z=12.5
and update the north scanner waypoint to x=14 z=12.5.

Run and validate every future, compare them, and stop so I can choose.
```

After approving B:

```text
Check the available site tools again. If the human-approved verified future can
now be merged, merge it into MAIN.
```
