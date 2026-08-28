# Forklight Phase 3 Result — Live Local WebMCP Acceptance

**Date:** 2026-08-27 KST  
**Session:** Codex in-app browser, `http://127.0.0.1:8080/`  
**Status:** COMPLETE — LOCAL LIVE ACCEPTANCE PASS

## Outcome

The real browser WebMCP host—not the Vitest mock—successfully completed the full locked flow through inspect, branch, mutate, simulate, validate, compare, UI approval, dynamic merge-capability exposure, and merge.

The first merge attempt was denied by Browser Use auto-review. After the human project lead explicitly authorized the operation, the original tab had expired, so the complete scenario was reproduced in a fresh local session and the same real WebMCP call was retried. No alternate script, QA merge, raw browser command, or other workaround was used.

The authorized merge returned:

```json
{
  "ok": true,
  "revision": 2,
  "mergedBranchId": "branch-2",
  "status": "merged"
}
```

## Session provenance

- Local Vite page: `http://127.0.0.1:8080/`
- Browser surface: Codex in-app browser
- Tool source: the page's real `document.modelContext` registration
- Initial tool surface: exactly 9 static tools
- Default QA state: hidden
- Approval path: the page's enabled `Approve` button for B
- Approval WebMCP tool: absent, as required
- Dynamic surface after approval: 9 static tools plus `merge_verified_branch`

The approval click was performed by the browser acceptance harness against the human-only page control. The project lead explicitly authorized the final merge operation. This proves that the product exposes no agent approval tool and that the UI action changes the WebMCP surface; it does not claim that a separate person physically operated the browser during the automated run.

## Real tool sequence completed

```text
inspect_world
inspect_constraints
create_branch × 3
move_entity / modify_route for A, B, C
run_simulation × 3
validate_branch × 3
compare_branches
UI Approve B
merge_verified_branch
inspect_world
```

Created futures:

| Future | Branch ID | Locked change |
|---|---|---|
| A — distance | `branch-1` | move south barrier; enable `r-south` |
| B — verified | `branch-2` | move north barrier; enable `r-north` |
| C — protected | `branch-3` | perform B; move protected scanner; update scanner waypoint |

All successful callbacks returned structured objects containing `ok: true`.

## Golden results from the live host

| Future | Throughput | Avg distance | Protected moved | Result |
|---|---:|---:|---:|---|
| MAIN | 0.2000 | 20.0000 m | 0 | baseline |
| A | 0.3500 | 22.1067 m | 0 | FAIL — distance +10.5% |
| B | 0.3875 | 21.0777 m | 0 | VERIFIED — all four pass |
| C | 0.3875 | 21.2053 m | 1 | FAIL — protected equipment |

`compare_branches` reported B as the only `allPassed: true` future.

## Capability Bloom observed

Before approval:

- A and C Approve buttons were disabled;
- B was `VERIFIED` and had the only enabled Approve button;
- `merge_verified_branch` was absent.

After clicking B's UI approval:

- B's button became `Approved` and disabled;
- the header showed `Merge ready`;
- the page showed `Capability unlocked — merge_verified_branch is now available`;
- the browser emitted a changed tool surface containing the exact title `Merge approved future`.

## Authorized merge and final state

Authorized real operation:

```text
merge_verified_branch({ branchId: "branch-2" })
```

WebMCP result:

```text
{ mergedBranchId: "branch-2", ok: true, revision: 2, status: "merged" }
```

Post-merge verification used a fresh WebMCP tool listing, a real `inspect_world` call, and the visible page DOM:

- MAIN revision was 2 in both `inspect_world` and the header;
- B (`branch-2`) was `merged`;
- A (`branch-1`) and C (`branch-3`) were `stale`;
- `merge_verified_branch` was absent from the refreshed tool surface;
- Agent Activity contained real start and success entries for `merge_verified_branch`;
- the success summary was `MAIN rev 2` with a measured duration of 21 ms.

## First-attempt permission incident

Before the authorized retry, Browser Use auto-review denied the first MAIN-mutating call and required explicit user direction. The app correctly remained at MAIN revision 1 with B approved and merge capability exposed. The denial was a Codex browser-host permission decision, not an application error. The subsequent authorized retry used the same WebMCP method and parameters; no workaround path was used.

All Phase 3 local acceptance checks are now represented by live-host evidence.

## External deployment boundary

Forklight is publicly deployed over HTTPS at:

<https://forklight.kimth06230724.chatgpt.site>

The deployment packages the validated Vite client with a Cloudflare-compatible static-assets Worker. The full WebMCP acceptance above was executed in the real local in-app browser host. A separate production ChatGPT conversation has not repeated the entire A/B/C scenario, so the local live acceptance and public deployment evidence remain explicitly distinguished.
