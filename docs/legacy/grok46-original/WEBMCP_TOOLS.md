# Forklight WebMCP Tools

This file is an operational summary. `MASTER_SPEC.md` is authoritative.

## Current API

Use:

```ts
await document.modelContext.registerTool(
  {
    name,
    description,
    inputSchema,
    annotations,
    execute: async (args, options) => JSON.stringify(result),
  },
  { signal: controller.signal }
);
```

Do not use old proposal examples based on `navigator.modelContext`, `provideContext`, or `unregisterTool`.

If `document.modelContext` is unavailable, show `WebMCP unavailable`; manual QA must remain usable.

## Static tool table

| Tool | Read-only | Purpose |
|---|---:|---|
| `inspect_world` | yes | MAIN revision, entities, routes, baseline, branch summary |
| `inspect_constraints` | yes | hard constraints in machine-readable and human-readable form |
| `inspect_branch` | yes | changes, metrics, validation, status for one branch |
| `compare_branches` | yes | compact comparison of all candidate futures |
| `create_branch` | no | deep-clone MAIN into an isolated candidate |
| `move_entity` | no | move an entity inside a candidate only |
| `modify_route` | no | enable/disable or edit route waypoints inside a candidate |
| `run_simulation` | no | calculate deterministic metrics |
| `validate_branch` | no | produce four hard checks; re-simulate if stale |

Read tools use:

```ts
annotations: { readOnlyHint: true }
```

## Dynamic tool

`merge_verified_branch`

Must be absent on boot.

Register only after a human approves a verified, current, fresh branch.

Abort registration on:
- revoke;
- mutation;
- stale;
- successful merge.

## Tool descriptions

Descriptions should tell the agent:
- what state is read/written;
- that MAIN cannot be mutated by experiment tools;
- what must happen before merge;
- compact expected result.

Avoid marketing language inside tool descriptions.

## Recommended ChatGPT demo prompt

```text
Inspect the current warehouse and its constraints.

Try three isolated alternatives named route-a, route-b, and route-c before
changing MAIN.

For route-a, open and enable the south bypass.
For route-b, open and enable the north bypass.
For route-c, start from the north-bypass idea but also move the protected
Scanner to z=12.5 and update that route waypoint to follow it.

Run and validate every branch, then compare them.
Do not attempt to modify MAIN.
Stop after the comparison and let me choose which verified future to approve.
```

After human approves B:

```text
A new site capability may now be available. Inspect the available site tools
and, if the approved verified branch can be merged, merge it into MAIN.
```

## Manual inspection checklist

- address bar/site-tools UI shows Forklight tools;
- static tools appear before approval;
- merge tool is absent before approval;
- after B approval, merge tool appears;
- after merge, merge tool disappears;
- tool results are compact;
- timeline contains only real tool executions.

## TypeScript

Add a local `src/types/webmcp.d.ts`.

Keep it minimal and aligned with the current draft members Forklight actually uses:
- `Document.modelContext`
- `ModelContext.registerTool`
- `ModelContext.getTools`
- `ModelContextTool`
- `ModelContextRegisterToolOptions`
- `ToolAnnotations`

Do not pretend the declarations are a standards polyfill.
