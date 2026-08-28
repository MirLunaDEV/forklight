# Production WebMCP Verification

**Date:** 2026-08-28 KST  
**Target:** <https://forklight.kimth06230724.chatgpt.site/>  
**Browser:** OpenAI Codex in-app browser, fresh agent-created tab  
**Result:** PARTIAL PASS — full flow reached dynamic merge exposure; final merge call was blocked by browser-host auto-review

## State persistence check

Forklight stores application state in the page's in-memory Zustand store. It has no database, server-owned application state, account state, or browser-storage persistence. A fresh tab loaded MAIN revision 1 and HUMAN POLICY draft. Closing the test tab discarded the session, so the public app remains fresh for each new page session.

## Verification matrix

| # | Check | Result | Evidence |
|---:|---|---|---|
| 1 | Page loads successfully | PASS | Live page rendered at the production URL |
| 2 | QA panel hidden | PASS | Default DOM contained no QA controls |
| 3 | HUMAN POLICY begins draft | PASS | `Draft policy` and `Exploration paused` visible |
| 4 | `document.modelContext` exists | NOT DIRECTLY OBSERVABLE | The browser's read-only page evaluation realm returned `false`, while the host's WebMCP capability simultaneously discovered and invoked the page-defined tools. This realm difference is recorded without claiming a direct property check passed. |
| 5 | Exactly nine static tools | PASS | Fresh tool listing returned the nine locked names |
| 6 | Merge absent at boot | PASS | `merge_verified_branch` absent |
| 7 | Human-owned constraints | PASS | `definedBy: human`, `status: draft`, values 0.2 / 0.1 / 0 / 1 |
| 8 | Pre-lock branch rejected | PASS | `POLICY_NOT_LOCKED`; MAIN rev 1 and zero branches before/after |
| 9 | Lock through human UI | PASS | Click produced `Policy locked` and `Agent exploration enabled` |
| 10 | Create A/B/C | PASS | route-a = branch-1, route-b = branch-2, route-c = branch-3 |
| 11 | Simulate all | PASS | Structured metrics returned for all three |
| 12 | Validate all | PASS | Structured check sets returned for all three |
| 13 | Compare | PASS | Comparison returned MAIN rev 1 and three futures |
| 14 | B only verified | PASS | A failed, B verified, C failed |
| 15 | Human approves B | PASS | Only B's Approve for Merge control was enabled and clicked |
| 16 | Merge tool appears | PASS | Fresh listing contained ten tools including `merge_verified_branch` |
| 17 | Invoke merge | BLOCKED BY HOST | Browser Use auto-review denied the production WebMCP mutation |
| 18 | MAIN becomes rev 2 | NOT EXECUTED | Blocked at step 17; app correctly remained rev 1 |
| 19 | B merged | NOT EXECUTED | B remained verified and approved |
| 20 | A/C stale | NOT EXECUTED | A/C remained failed |
| 21 | Merge tool disappears | NOT EXECUTED | Tool remained available because the merge did not occur |

No workaround, raw page command, alternate browser, QA mutation, or policy circumvention was used after the denial.

## Production golden results

| Future | Throughput | Average distance | Protected moved | Result |
|---|---:|---:|---:|---|
| route-a | 0.3500 | 22.1066869567 m | 0 | FAIL — distance |
| route-b | 0.3875 | 21.0776872305 m | 0 | VERIFIED |
| route-c | 0.3875 | 21.2053398578 m | 1 | FAIL — protected |

The production values match the automated and earlier live-local evidence.

## Merge evidence boundary

The final production merge was not completed and is not claimed. The existing [Live WebMCP Result](LIVE_WEBMCP_RESULT.md) documents an earlier authorized full real WebMCP merge in the Codex in-app browser:

- result `{ ok: true, revision: 2, mergedBranchId: "branch-2", status: "merged" }`;
- B became merged;
- A/C became stale;
- the dynamic merge tool disappeared.

The 47-test automated suite independently covers the same complete state transition. This report keeps production evidence, live-local evidence, and mocked/unit evidence separate.

## Screenshot automation boundary

The built-in browser screenshot API was attempted at 1440×960 and 1200×800. Each production WebGL capture timed out before returning image bytes. No heavy screenshot dependency was installed. Submission framing instructions are provided in `submission/SCREENSHOT_CAPTURE_GUIDE.md`.
