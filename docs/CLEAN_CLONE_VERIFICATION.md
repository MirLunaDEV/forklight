# Clean Clone Verification

- **Date:** 2026-08-29 KST
- **Verified release tag:** `webmcp-challenge-submission-v2`
- **Verified commit:** `0c38996a6cef2e8acc32c003074bd3d73c44e52a`
- **Public GitHub clone result:** PASS — <https://github.com/MirLunaDEV/forklight>

## Method

A new temporary directory was created outside the working checkout. Git cloned the public v2 release tag over HTTPS with:

```text
git clone --depth 1 --branch webmcp-challenge-submission-v2 https://github.com/MirLunaDEV/forklight.git <temporary-directory>
```

The clone entered detached HEAD at the verified commit. It did not reuse the original checkout, `node_modules`, or `dist`.

## Results

| Step | Exit | Result |
|---|---:|---|
| Public GitHub clone over HTTPS | 0 | PASS — v2 tag resolved to the expected commit |
| Initial `git status --short` | 0 | PASS — clean |
| `npm ci` | 0 | PASS — 314 packages installed; 0 vulnerabilities reported |
| `npm run typecheck` | 0 | PASS — no TypeScript errors |
| `npm test` | 0 | PASS — 5 files, 62/62 tests |
| `npm run lint` | 0 | PASS — 0 errors, 1 warning |
| `npm run build` | 0 | PASS — production server and client outputs generated |
| Focused/skipped test scan | — | PASS — no `.skip`, `.todo`, or `.only` declarations |
| Required source/assets/config | — | PASS |

Required checks included `src/main.tsx`, `src/tests/policy-editability.test.ts`, all five `*.test.ts` files, `public/og.jpg`, `.openai/hosting.json`, `package-lock.json`, and the root `LICENSE`.

## Test-suite composition

| File | Count | Coverage summary |
|---|---:|---|
| `src/tests/forklight.test.ts` | 23 | Branching, isolation, simulator, geometry, validator, golden metrics, merge, comparison |
| `src/tests/webmcp.test.ts` | 16 | Static/dynamic WebMCP lifecycle, structured results, authority boundary, merge capability synchronization |
| `src/tests/policy-editability.test.ts` | 15 | Editable constraints, validation/invalidation, 6% and 5% boundaries, no agent policy-write tool, UX copy |
| `src/tests/policy.test.ts` | 6 | Human policy lock/edit gate and proof/approval invalidation |
| `src/tests/qa-mode.test.ts` | 2 | Explicit QA-mode isolation |
| **Total** | **62** | **All passed** |

## Evidence boundary

This proves that the public v2 release tag is self-contained and reproducible from a judge-style clean checkout. The test explanations above summarize executed automated checks; they are not a claim that every real browser or hosting behavior is unit-tested.

The GitHub repository currently has no separately reported hosted CI status. These results came from the dated local clean-clone execution in this environment. The subsequent change on `main` only synchronizes these three evidence documents; the v2 tag is not moved, and product source, dependencies, tests, simulator values, and build configuration remain identical to the verified clone.
