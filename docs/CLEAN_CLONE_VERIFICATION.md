# Clean Clone Verification

**Date:** 2026-08-28 KST  
**Verified committed source:** `47ff469c6a3737233f5dd86c3caeedad754f931a`  
**Local clean-clone result:** PASS  
**Public GitHub clone result:** BLOCKED — no authenticated/public GitHub repository is available yet

## Method

A new temporary directory was created outside the working checkout. Git cloned the committed repository with local-object shortcuts disabled, reproducing a judge-style clean working tree without relying on the original `node_modules` or `dist` directories.

From that clean clone:

| Step | Exit | Result |
|---|---:|---|
| Git clone of committed tree | 0 | PASS |
| `npm ci` | 0 | PASS — 314 packages installed |
| `npm run typecheck` | 0 | PASS |
| `npm test` | 0 | PASS — 4 files, 47/47 tests |
| `npm run build` | 0 | PASS |
| Required source/assets/config | — | PASS |
| Temporary clone cleanup | — | PASS |

Required checks included `src/main.tsx`, `public/og.jpg`, `.openai/hosting.json`, and the root `LICENSE`.

## Evidence boundary

This proves that the committed local repository is self-contained and reproducible from a clean Git checkout. It is not claimed as a clone from GitHub.

GitHub CLI is installed but unauthenticated, and no public remote exists. After the user publishes the repository using `submission/GITHUB_PUBLISH_STEPS.md`, the same four commands must be run from a fresh clone of the public URL:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Record the public clone URL and results in Devpost before final submission.
