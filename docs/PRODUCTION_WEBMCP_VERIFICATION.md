# Production WebMCP Verification

- **Date:** 2026-08-29 KST
- **Release:** `webmcp-challenge-submission-v2`
- **Source commit:** `0c38996a6cef2e8acc32c003074bd3d73c44e52a`
- **Deployment:** OpenAI Sites version 4, active and public
- **Target:** <https://forklight.kimth06230724.chatgpt.site/>
- **Browser:** OpenAI Codex in-app browser, fresh agent-created tab
- **Result:** PASS — v4 human-policy and dynamic-capability lifecycle completed

## State persistence check

Forklight stores application state in the page's in-memory Zustand store. It has no database, server-owned application state, account state, or browser-storage persistence. A fresh production tab loaded MAIN revision 1 and HUMAN POLICY draft. The verification session changed only that tab's in-memory futures and policy; a new page session starts fresh.

## Verification matrix

| # | Check | Result | Evidence |
|---:|---|---|---|
| 1 | Sites deployment metadata | PASS | Project active and public; latest saved/deployed source is Sites version 4 from the v2 commit |
| 2 | Page loads successfully | PASS | Live page rendered at the production URL |
| 3 | QA panel hidden | PASS | Default DOM contained no QA controls |
| 4 | HUMAN POLICY begins editable and draft | PASS | Inputs visible and enabled at 20 / 10 / 0 / 100; `Draft policy` shown |
| 5 | WebMCP host active | PASS | `WebMCP live` shown and page-defined tools discovered |
| 6 | Exactly nine static tools | PASS | Fresh tool notification listed 9 names |
| 7 | No agent policy-write authority | PASS | No update/set/lock/edit policy tool was present |
| 8 | Merge absent at boot | PASS | `merge_verified_branch` absent |
| 9 | Human changes distance boundary | PASS | UI changed maximum distance from 10% to 6% |
| 10 | Human locks policy | PASS | Inputs became disabled; `inspect_constraints` returned `status: locked` and `maxDistanceIncrease: 0.06` |
| 11 | Create isolated A/B/C futures | PASS | route-a = branch-1, route-b = branch-2, route-c = branch-3; MAIN stayed rev 1 |
| 12 | Apply requested mutations | PASS | South bypass on A; north bypass on B; north bypass plus protected scanner/waypoint move on C |
| 13 | Simulate all futures | PASS | Structured deterministic metrics returned for A, B, and C |
| 14 | Validate and compare | PASS | A failed, B verified, C failed; comparison returned MAIN rev 1 |
| 15 | Human approves B | PASS | Only B's Approve for Merge button was enabled and clicked |
| 16 | Dynamic merge capability appears | PASS | Fresh listing contained 10 tools including `merge_verified_branch` |
| 17 | Human chooses Edit policy | PASS | Policy returned to draft and controls became editable |
| 18 | Policy-dependent proof invalidates | PASS | B validation cleared and status returned to `simulated` |
| 19 | Simulation evidence preserved | PASS | B retained the same deterministic metrics after Edit policy |
| 20 | Approval and merge eligibility revoked | PASS | Approval cleared and `merge_verified_branch` disappeared |
| 21 | MAIN remains unchanged | PASS | MAIN stayed revision 1 throughout this exploration/invalidation flow |

## Production results at the human-selected 6% boundary

| Future | Throughput | Average distance | Distance increase | Protected moved | Result |
|---|---:|---:|---:|---:|---|
| route-a | 0.3500 | 22.1066869567 m | +10.5334% | 0 | FAIL — distance |
| route-b | 0.3875 | 21.0776872305 m | +5.3884% | 0 | VERIFIED |
| route-c | 0.3875 | 21.2053398578 m | +6.0267% | 1 | FAIL — distance and protected |

The values match the v2 automated golden metrics. The automated suite additionally confirms the unchanged default 10% outcome and that tightening the distance boundary to 5% makes B fail after revalidation.

## Merge and evidence boundary

This v4 production pass intentionally stopped after Edit policy invalidated B's proof and removed the dynamically exposed merge capability. It therefore verifies the new human-editable policy boundary and both sides of the dynamic capability lifecycle without claiming that a production merge was executed in this session.

The existing [Live WebMCP Result](LIVE_WEBMCP_RESULT.md) records an earlier authorized full real WebMCP merge, and the 62-test suite covers the complete successful merge transition. Automated evidence, this production browser pass, and the earlier full live merge remain explicitly separated.

## CI boundary

Production behavior was exercised directly through the live page-defined WebMCP tools. The GitHub repository currently has no separate hosted CI status; the 62-test claim comes from the dated clean-clone execution documented in [Clean Clone Verification](CLEAN_CLONE_VERIFICATION.md), not from GitHub Actions.
