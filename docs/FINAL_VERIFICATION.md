# Final Verification

- **Status:** PASS
- **Executed:** 2026-08-29 21:53:38 +09:00
- **Verified release tag:** `webmcp-challenge-submission-v2`
- **Verified commit:** `0c38996a6cef2e8acc32c003074bd3d73c44e52a`
- **Production deployment:** OpenAI Sites version 4

## Environment

| Item | Value |
|---|---|
| OS | Microsoft Windows NT 10.0.26200.0 |
| Node.js | v22.16.0 |
| npm | 10.9.2 |

## Clean gate results

The public v2 tag was cloned into a new temporary directory. Its dependency tree was created by `npm ci`; the original checkout, `node_modules`, and `dist` were not reused.

| Command | Exit | Exact result |
|---|---:|---|
| Public HTTPS clone of v2 tag | 0 | PASS — detached at the verified commit above |
| `npm ci` | 0 | PASS — 314 packages installed; 0 vulnerabilities reported |
| `npm run typecheck` | 0 | PASS — TypeScript emitted no errors |
| `npm test` | 0 | PASS — 5 files, 62/62 tests |
| `npm run lint` | 0 | PASS — 0 errors, 1 warning |
| `npm run build` | 0 | PASS — server and client production outputs generated |

No `.skip`, `.todo`, or focused `.only` declarations were found under `src/tests`. Vitest discovered all five intended test files, including `policy-editability.test.ts`.

## What the 62 tests verify

| Test file | Tests | Main evidence |
|---|---:|---|
| `forklight.test.ts` | 23 | Branch isolation; MAIN protection; mutation versioning; deterministic simulation; route/barrier geometry; A/B/C validation and locked metrics; merge guards and state transitions; serialization and comparison |
| `webmcp.test.ts` | 16 | Exactly nine static tools; read-only annotations; structured success/errors; unavailable-WebMCP fallback; real-tool activity logging; human approval boundary; dynamic merge registration/removal; successful merge lifecycle; capability synchronization failure handling |
| `policy-editability.test.ts` | 15 | Default values; draft-only policy updates; range and integer validation; proof/approval invalidation; metric preservation; no policy-writing WebMCP tool; 9-tool boot count; 6%, 5%, and default A/B/C outcomes; browser guidance and non-overstated impact copy |
| `policy.test.ts` | 6 | Human-owned draft policy; lock gate on every experiment command; normal locked workflow; Edit policy invalidation, approval revocation, and merge ineligibility |
| `qa-mode.test.ts` | 2 | QA controls disabled by default and enabled only by the explicit `qa=1` switch |
| **Total** | **62** | **All passed** |

## Authority and behavior confirmation

The suite, source inspection, and production v4 browser pass confirm:

- HUMAN POLICY is owned by `human`, starts in `draft`, and exposes editable defaults of 20% / 10% / 0 / 100%.
- Policy changes are accepted only in draft state and are rejected after lock.
- No policy-writing, policy-locking, approval, revoke, or ordinary merge WebMCP tool exists at boot.
- Exactly nine static tools register at boot; `merge_verified_branch` is the only dynamic tool.
- Under the default 10% distance boundary, A fails distance, B verifies, and C fails protected-equipment policy.
- Under a human-selected 6% boundary, A fails distance, B verifies, and C fails; under 5%, B fails distance after revalidation.
- Changing or editing policy invalidates validation proof, revokes approval, preserves fresh world metrics, and removes merge eligibility.
- A successful approved merge is covered by automated tests: MAIN increments, the selected branch becomes merged, peers become stale, and the dynamic merge tool is removed.

## Production alignment

OpenAI Sites reports the public project active at version 4. Version 4 was saved from the verified v2 commit and is live at <https://forklight.kimth06230724.chatgpt.site/>. The current production WebMCP pass is documented separately in [Production WebMCP Verification](PRODUCTION_WEBMCP_VERIFICATION.md).

## Evidence and CI boundary

These command results were produced by a fresh local clean-clone run in the Codex environment on 2026-08-29. The GitHub repository does not currently expose a separate hosted CI status, so this report does not claim a GitHub Actions or third-party CI run.

## Non-blocking warnings

- ESLint reports one pre-existing `react-refresh/only-export-components` warning in `src/ui/status.tsx`; there are zero lint errors.
- Vite reports that `src/webmcp/capabilityManager.ts` is both statically and dynamically imported.
- The minified Warehouse chunk is approximately 929 kB before gzip and 248 kB after gzip, above Vite's advisory chunk-size threshold.
- npm reports the resolved ESLint 9.39.5 release as deprecated. This is an install-time advisory, not a failing audit or runtime dependency.

No product code, A/B/C mutation, or deterministic simulator value was changed during this documentation verification pass.
