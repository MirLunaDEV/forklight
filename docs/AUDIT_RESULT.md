# Forklight Phase 0 Audit Result

**Audit date:** 2026-08-27 KST  
**Scope:** baseline and source audit only  
**Implementation base:** Grok 4.6 handoff v1.2  
**Product changes made:** none

## Executive verdict

The Forklight-specific core is a credible base and should be preserved. The isolated branch model, deterministic A/B/C simulator, four-constraint validator, human approval boundary, shared commands, dynamic merge lifecycle, and WebMCP/QA timeline separation are present in source and the 29 Forklight Vitest tests pass in the recovery environment.

The repository is not currently a reproducible clean static application. The checked-in package manifest and lockfile disagree, the declared production command fails on Windows before Vite starts, and a direct Vite build emits a TanStack Start/Nitro Vercel server function tree under `.vercel/output` rather than a static `dist`. WebMCP callbacks also return JSON strings instead of structured objects, and QA is exposed on every default desktop and mobile route.

**Phase 0 conclusion:** preserve the Forklight domain/UI/scene core, but do not call the current package submission-ready. Phase 1 should begin only after human review of this report.

## 1. Baseline commands and results

### Environment and package-manager path

- OS/shell: Windows PowerShell
- Node: `v22.16.0`
- npm: `10.9.2`
- Package manager selected: npm, because `package-lock.json` is the only lockfile and `package.json` uses npm scripts.
- Archive state: source was supplied as `forklight-codex-handoff-v1.2.zip`; it was checked for absolute/parent-traversal entries and extracted into `Forklight/` without modifying product files.

### Command matrix

| Gate | Exact command | Result | Evidence / warning |
|---|---|---:|---|
| Install, first sandbox attempt | `npm ci` | FAIL | Environment-level `EACCES` while fetching/writing npm cache. Re-run outside the restricted sandbox to separate environment from repository failure. |
| Install, authoritative retry | `npm ci` | **FAIL** | `ETARGET No matching version found for @radix-ui/react-label@^1.1.8.` The manifest requests `^1.1.8`; the lock root requests `^2.1.8` and locks `2.1.15`. This is an actual checked-in reproducibility defect. |
| Recovery environment only | `npm install --no-save --package-lock=false @radix-ui/react-label@2.1.15` | PASS | Installed 494 packages without changing `package.json`/`package-lock.json`; `npm audit` reported 0 vulnerabilities. Warned that Recharts 2.x and ESLint 9.39.5 are deprecated. All later executable gates are explicitly recovery-environment results, not proof that `npm ci` works. |
| Typecheck | `npm run typecheck` | **PASS** | `tsc --noEmit`, exit 0. |
| Forklight Vitest | `npm run test:unit` | **PASS** | 2 files, 29/29 tests. |
| Core only | `npm exec vitest run src/tests/forklight.test.ts` | **PASS** | 23/23 tests. |
| WebMCP only | `npm exec vitest run src/tests/webmcp.test.ts` | **PASS** | 6/6 tests. These tests currently expect JSON-string outer results, so green is not v1.2 contract compliance. |
| Declared full test | `npm test` | **MISLEADING PASS** | Exit 0; app-data/auth tests 32/32 and Vitest 29/29 pass, but `node --test 'scripts/**/*.test.mjs'` runs **0 script tests** on this Windows path. |
| Explicit script tests | PowerShell enumerated `scripts/*.test.mjs`, then `node --test <nine explicit paths>` | **FAIL** | 195 total: 177 pass, 18 fail. Failures are confined to generator/template suites: brand-check 3, auth-invariant 2, Grok PWA 9, app-env 3, write-atomic 1. Missing `.grok` guidance/assets, missing PWA icons/app-env, two Windows symlink `EPERM`s, and stale template expectations are the meaningful causes. |
| Declared production build | `npm run build` | **FAIL** | `node scripts/with-app-env.mjs vite build` fails with `spawn vite ENOENT`; `db:migrate` is never reached. |
| Direct code build | `npm exec vite build` | PASS with **spec divergence** | Builds client + SSR + Nitro/Vercel server output. Produces `.vercel/output` (36 files, 5,392,349 bytes), no `dist`; logs `nitro:vercel`, SSR and Nitro phases, and a >500 kB chunk warning (`Warehouse` client chunk about 927.73 kB). |
| Migration stage in isolation | `npm run db:migrate` | PASS with **spec divergence** | Logs: `DATABASE_URL not set — skipping (the PGLite fallback migrates itself).` A production build must not invoke or describe a DB fallback. |

### Baseline status summary

- **Install:** fail as checked in; recovery install only.
- **Typecheck:** pass in recovery environment.
- **Forklight tests:** pass, 29/29 (Core 23, WebMCP 6).
- **Current full test:** exit 0 but incomplete because nine script files are skipped; explicit execution fails 18/195.
- **Production build:** declared command fails. Direct Vite build succeeds only as a server/Nitro build, not the required static build.

## 2. Current Forklight core verdict

| Required path | Source evidence | Runtime/test evidence | Verdict |
|---|---|---|---|
| MAIN/branch isolation | `makeBranch` deep-clones MAIN with `structuredClone`; store commands mutate a cloned snapshot and commit only on success. | Tests prove branch creation leaves MAIN unchanged and editing A leaves MAIN/B unchanged. | **KEEP** |
| Mutation/fresh proof | `bumpMutation` increments `mutationVersion`, clears metrics/validation and both proof-version fields, returns status to draft, then `revokeIfApproved` clears approval and merge registration. | Mutation and approved-mutation tests pass. | **KEEP** |
| Deterministic simulator | `simulate` is a fixed 240-tick discrete-flow loop; no `Math.random`, Date, DOM, store, React, or Three.js dependency is used in the simulation. | Determinism and source guard tests pass. | **KEEP** |
| A distance failure | Locked A moves `barrier-south` to `(11, 3.8)` and enables `r-south`. | Golden test: 28 complete, distance about 22.1067; distance check fails. | **KEEP** |
| B only verified | Locked B moves `barrier-north` to `(11, 11.3)` and enables `r-north`. | Golden test: 31 complete, distance about 21.0777; all four checks pass; exactly B is verified. | **KEEP** |
| C protected failure | Locked C applies B, moves protected `scan-1` to `(14, 12.5)`, then changes the scanner waypoint. Protected touches remain in change history even after move-back. | C and move-back tests fail the protected check. | **KEEP** |
| Human approval source | No approval tool exists in the 9 static tools. `BranchPanel` is the only approval/revoke UI path and calls the shared store/domain approval command. | Approval/merge tests pass. Human actions are recorded with the QA source, not agent activity. | **KEEP** |
| Dynamic merge registration | Approval sets `mergeRegisteredFor`; `shouldExposeMerge` independently requires approved, verified, current revision, fresh validation, and all checks. Registration uses `document.modelContext.registerTool(..., { signal })`. | Merge is absent at boot and appears only after approved verified B in the mock Model Context. | **KEEP, HARDEN** |
| Merge lifecycle removal | Mutation/revoke/merge clear domain registration; the capability manager aborts its controller; merge increments MAIN revision, marks B merged, and stales other candidates. | Revoke and successful merge removal tests pass. | **KEEP, HARDEN** |
| Timeline source distinction | `recordTimeline` sends only `source === "webmcp"` to `timeline`; QA/human events go to `qaLog`. `AgentTimeline` renders only `timeline`. | WebMCP start/success test passes; source separation is clear in source but lacks a direct negative QA-in-agent-timeline test. | **KEEP, ADD TEST** |

The core verdict is therefore **functionally strong but surrounded by a noncompliant delivery shell**. There is no evidence requiring a rewrite.

## 3. P0/P1/P2 divergence table

Counts use one row per independently actionable divergence, not one count per affected file.

| ID | Severity | Divergence | Evidence | Required direction |
|---|---|---|---|---|
| P0-01 | P0 | Reproducible install is broken. | `package.json` asks for `@radix-ui/react-label ^1.1.8`; lock root asks for `^2.1.8` and locks 2.1.15; `npm ci` fails ETARGET. | Align/remove the unused dependency and regenerate the npm lock deterministically. |
| P0-02 | P0 | Declared production command does not start on Windows. | `npm run build` ends at `spawn vite ENOENT` inside `with-app-env`. | Replace the wrapper path with direct portable Vite scripts as part of cleanroom extraction. |
| P0-03 | P0 | Production shape is SSR/server, not static. | Direct Vite build runs TanStack Start SSR and Nitro, generates a Vercel function tree under `.vercel/output`, and creates no `dist`. | Introduce one-screen static Vite entry and ensure `vite build -> dist`. |
| P0-04 | P0 | Production build is coupled to database migration. | `build` chains `npm run db:migrate`; migration output advertises PGLite fallback. | Remove migration from build and remove DB bootstrap/migration runtime. |
| P0-05 | P0 | Vite configuration owns forbidden server/runtime features. | Active plugins include PGLite bootstrap, OAuth popup, app-env, Grok PWA, TanStack Start, Nitro Vercel, and `serverDir`. | Reduce `vite.config.ts` to React, Tailwind, aliases, and static Vite behavior. |
| P0-06 | P0 | The only application entry is a generated TanStack Start/router shell. | `router.tsx`, `routeTree.gen.ts`, and `routes/*` are the active root; no static `index.html`/`main.tsx` exists. | Replace with static React root while preserving `ForklightApp`. |
| P1-01 | P1 | Root UI carries generator coupling. | `routes/__root.tsx` mounts passthrough `AuthProvider`, active `PreviewHostBridge`, and Grok manifest/icon paths. | Remove bridge/auth/PWA chrome from the product root. |
| P1-02 | P1 | Forbidden template surfaces remain compiled/tested even where not imported by the Forklight core. | `src/lib/auth` (16 files), app-data (7), multiplayer (2), `db.ts`, server, migrations, auth/app-env/PWA tests and scripts remain. | Remove by import group after the static entry is green. |
| P1-03 | P1 | WebMCP returns double-encoded results. | `runTool`, `errorResult`, and all callbacks return `Promise<string>` through `JSON.stringify`. Tests call `JSON.parse(String(result))`. | Return structured JSON-serializable objects and structured compact errors. |
| P1-04 | P1 | Tool cleanup/re-registration is only partially safe. | Dynamic polling is bounded to 400 ms/20 ms but silently proceeds after timeout without confirming removal; static re-registration aborts then immediately registers same names without `getTools` polling. | Make disappearance confirmation bounded and explicit for dynamic and static same-name reload paths. |
| P1-05 | P1 | Tool titles exist but do not match the locked v1.2 contract. | Examples: `Create branch` vs `Create future`; `Merge verified branch` vs `Merge approved future`; inspect/validate branch wording also differs. | Apply the exact `WEBMCP_TOOLS.md` titles and test all ten. |
| P1-06 | P1 | QA is public by default. | Desktop always renders `QaPanel`; mobile always includes a QA tab; there is no `?qa=1` check. Production uses the same component tree. | Hide QA unless `URLSearchParams(location.search).get("qa") === "1"`; test both modes. |
| P1-07 | P1 | The declared full test command can report false green. | Quoted recursive glob executes zero script tests on the audited Windows environment; explicit enumeration exposes 18 failures. | Remove obsolete generator suites or use a cross-platform explicit test runner/list; never accept zero discovered tests. |
| P2-01 | P2 | Large direct dependency surface has no source import. | Static import inventory finds 34 direct dependency candidates, mainly unused Radix controls, form/table/chart/date/panel/toast packages. | Prune after active import graph is reduced; retain peers actually required by React/Tailwind tooling. |
| P2-02 | P2 | Obsolete generator utilities/tests reference files absent from the handoff. | Brand, PWA, app-env, and write-atomic suites expect `.grok` guidance, app-env, icons, or references that are not shipped. | Remove with their generator features; do not fabricate missing assets to keep dead tests green. |
| P2-03 | P2 | Unused state facade files add duplicate surface. | `approvalStore.ts`, `branchStore.ts`, `timelineStore.ts`, and `worldStore.ts` only re-export `useAppStore` and have no consumers in the current tree. | Delete after a final import check. |

**Counts: P0 = 6, P1 = 7, P2 = 3.**

## 4. Generator/runtime contamination inventory

| Area | Actual usage/import path | Classification |
|---|---|---|
| `src/lib/auth/**` | Only active product import is the passthrough `AuthProvider` in the root. Better Auth/Jose/Kysely/PG code is otherwise self-contained or exercised by template tests; OAuth middleware dynamically loads auth during dev. | **P1 REMOVE** |
| `src/lib/app-data/**` | No Forklight product import. It is included by TypeScript and explicitly run by `npm test`; server client imports TanStack Start server APIs. | **P1 REMOVE** |
| `src/lib/multiplayer/**` | No import outside its own barrel; no Forklight call path. | **P2 PRUNE** |
| `src/lib/db.ts` | Dynamically loaded by the Vite PGLite dev bootstrap when top-level migrations exist; imported by auth server; included by TypeScript. | **P0 REMOVE** |
| `server/**` | Nitro `serverDir` auto-registers Grok PWA middleware and declaration. Direct build packages it into the server function. | **P0 REMOVE** |
| PGLite/PostgreSQL/migrations | PGLite and PG are confined to DB/auth; `build` chains the deploy migrator; `vite.config.ts` contains dev bootstrap. | **P0 REMOVE** |
| Better Auth/OAuth | Better Auth lives in auth modules; the active Vite dev server installs `/auth/popup` middleware and can SSR-load it. No Forklight need. | **P1 REMOVE** |
| `PreviewHostBridge` | Actively mounted by the root; depends on TanStack router and `zod`; modifies history and listens for Grok parent messages. | **P1 REMOVE** |
| Grok PWA | Active Vite plugin and Nitro server middleware; root points at `/__grok/*`; tests expect unshipped assets. | **P0 REMOVE** |
| app-env | Active wrapper for dev/build/preview and active Vite dev plugin; missing `.grok/app-env.json`; wrapper is the immediate Windows build failure. | **P0 REMOVE** |
| Nitro | Active on build/preview and produces a Vercel server function. | **P0 REMOVE** |
| TanStack Start/router | Active application entry and SSR build architecture. One route only, so static React entry is the smaller target. | **P0 REMOVE** |
| Forklight core/UI/scene | Direct active product path; tests and direct build prove it compiles. | **KEEP** |

## 5. WebMCP v1.2 contract audit

| Contract item | Current result |
|---|---|
| `document.modelContext` only | **PASS.** No `navigator.modelContext`, `provideContext`, or `unregisterTool` use. |
| 9 static + 1 dynamic | **PASS.** Nine static definitions; merge is separate and absent at boot. |
| `readOnlyHint` | **PASS.** Exactly the four inspect/compare tools set `true`; mutation tools set `false`. |
| Titles | **PARTIAL.** Every tool has a title, but several do not match locked v1.2 wording. |
| AbortSignal | **PASS.** Static and dynamic registrations receive controller signals. |
| Bounded `getTools` polling | **PARTIAL.** Dynamic path polls up to 400 ms every 20 ms, but timeout is not surfaced/confirmed; static same-name reload does not poll. |
| Outer result | **FAIL.** It is a JSON string, not an object. |
| Error shape | **PARTIAL.** Inner content is `{ ok:false, error:{code,message} }`, but it is string-encoded; exception messages are passed through without stack traces. |
| Static cleanup/reload | **PARTIAL.** Teardown aborts correctly, but immediate same-name re-registration can race host removal. |
| Unavailable Model Context | **PASS in current unit test.** Registration returns false and manual app state remains available. |

## 6. QA exposure

- **Desktop:** always rendered in the right sidebar by `ForklightApp`; no query gate.
- **Mobile:** QA is always present as a selectable tab and renders the same `QaPanel`.
- **Production default `/`:** same component tree, therefore QA is visible by default. The direct production build contains no alternate production-only gate.
- **Required target:** hide the QA panel/tab on `/`; show it only for `/?qa=1`.
- **Positive semantic:** the manual QA merge uses `mergeRegisteredFor`, the actual approved capability target, not the first verified branch.

## 7. Exact removal candidates

These are candidates for Phase 1 after human approval, not deletions performed during this audit.

### Files/directories

**Static-architecture replacement/removal**

- `src/router.tsx`
- `src/routeTree.gen.ts`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/lib/error-component.tsx`
- replace with `index.html` and `src/main.tsx` (or equivalent) mounting the existing `ForklightApp`

**Forbidden backend/auth/template runtime**

- `src/lib/auth/**`
- `src/lib/app-data/**`
- `src/lib/multiplayer/**`
- `src/lib/db.ts`
- `src/components/preview-host-bridge.tsx`
- `src/lib/preview-host-bridge.ts`
- `src/lib/preview-embedder-origin.ts`
- `server/**`
- `migrations/**`

**Generator scripts tied to removed runtime**

- `scripts/app-env-plugin.mjs`
- `scripts/check-auth-invariant.mjs`
- `scripts/check-auth-invariant.test.mjs`
- `scripts/grok-pwa-plugin.mjs`
- `scripts/grok-pwa-plugin.test.mjs`
- `scripts/grok-pwa-shared.mjs`
- `scripts/grok-pwa-shared.d.mts`
- `scripts/install-page.html`
- `scripts/migrate.mjs`
- `scripts/migration-plan.mjs`
- `scripts/migration-plan.test.mjs`
- `scripts/sign-out-plan.mjs`
- `scripts/sign-out-plan.test.mjs`
- `scripts/with-app-env.mjs`
- `scripts/with-app-env.test.mjs`
- assess `scripts/preview.mjs`, `scripts/preview.test.mjs`, brand/OG utilities, and write-atomic utilities after static `vite preview` replaces platform preview management

**Repo-only facade prune**

- `src/state/approvalStore.ts`
- `src/state/branchStore.ts`
- `src/state/timelineStore.ts`
- `src/state/worldStore.ts`

### Dependency removal candidates

**Forbidden architecture / coupled runtime**

- `@electric-sql/pglite`
- `@tanstack/react-router`
- `@tanstack/react-start`
- `@tanstack/router-plugin`
- `better-auth`
- `jose`
- `kysely`
- `pg`
- `zod` (used only by PreviewHostBridge after auth removal)
- `nitro`
- `@types/pg`

**Direct-unused UI/template candidates (confirm after static entry build)**

- `@hookform/resolvers`
- Radix packages other than the actively used `@radix-ui/react-slot`: accordion, alert-dialog, avatar, checkbox, collapsible, dialog, dropdown-menu, label, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toggle, toggle-group, tooltip
- `@tanstack/react-query`
- `@tanstack/react-table`
- `cmdk`
- `date-fns`
- `react-day-picker`
- `react-hook-form`
- `react-resizable-panels`
- `recharts`
- `sonner`
- `tw-animate-css`
- `vaul`
- `playwright` only if the retained cleanroom QA no longer uses the generic browser smoke scripts

**Expected KEEP set for the current product path**

- React/DOM, Vite/React plugin, TypeScript/Vitest
- React Three Fiber, Drei, Three.js
- Zustand
- Tailwind CSS/Vite plugin
- `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`
- `lucide-react`
- lint/format tooling that remains wired to scripts

## 8. Proposed smallest Phase 1 patch sequence

### Patch 1 — restore deterministic installation (P0)

- Resolve the single manifest/lock disagreement. Since `react-label` is unused, prefer deleting it rather than changing to another unused version; regenerate `package-lock.json` with the selected npm version.
- Do not remove other architecture yet.

Required green gates:

```text
npm ci
npm run typecheck
npm exec vitest run src/tests/forklight.test.ts
npm exec vitest run src/tests/webmcp.test.ts
```

### Patch 2 — introduce the static shell (P0)

- Add `index.html` plus a minimal `src/main.tsx` that imports styles and mounts `ForklightApp`.
- Reduce Vite config to React, Tailwind, and path aliases.
- Change `dev`, `build`, and `preview` to direct Vite commands.
- Remove TanStack route/root/generated entry and `server` from `tsconfig` include.
- Do not change domain, simulator, constraints, store, scene, or WebMCP behavior.

Required green gates:

```text
npm run typecheck
npm exec vitest run src/tests/forklight.test.ts
npm exec vitest run src/tests/webmcp.test.ts
npm run build
```

Additional assertions: `dist/index.html` exists; `.vercel/output/functions` is not produced by a clean build; build output contains no SSR, Nitro, migration, DB, auth, OAuth, PWA, or app-env messages.

### Patch 3 — remove forbidden runtime by import group (P0/P1)

1. Remove PreviewHostBridge/AuthProvider root coupling.
2. Remove `auth`, `app-data`, `db`, migrations, and their scripts/tests/dependencies.
3. Remove multiplayer and server/PWA/app-env remnants.
4. Regenerate the lockfile.

Run the four gates from Patch 2 after **each numbered group**, plus `npm ci` after dependency/lock changes. Keep the current 29 Forklight tests green at every stop.

### Patch 4 — prune dead template surface and make tests honest (P2)

- Remove confirmed unused UI/form/chart/table packages and unused state facades.
- Replace the misleading recursive script glob with a cross-platform command that cannot succeed after discovering zero intended tests.
- Retain only cleanroom-relevant lint/format/browser checks.

Required green gates:

```text
npm ci
npm run typecheck
npm test
npm run build
```

Phase 2 should then address structured WebMCP results, exact titles, bounded confirmed re-registration, and QA query gating. Mixing those semantic changes into the architecture deletion would make regressions harder to isolate.

## 9. Tests that must remain green after every Phase 1 patch

At minimum:

1. Core 23 tests: isolation, mutation invalidation, deterministic/golden A/B/C, protected move history, merge safety, JSON serialization, route rules, comparison.
2. WebMCP 6 baseline tests: document Model Context availability, nine static tools, four read annotations, merge absent/appears/revokes, real timeline, invalid input isolation, merge removal.
3. TypeScript strict typecheck.
4. Static production build.

Before Phase 1 is considered complete, add/convert gates for:

- structured object results and structured errors;
- exact ten tool titles;
- bounded confirmed static/dynamic same-name re-registration;
- QA absent on `/` and present on `/?qa=1`;
- QA actions never appearing in Agent Activity;
- `dist` exists and no backend/migration/server runtime is required.

## 10. Top three demo risks

1. **The submission cannot currently be reproduced or delivered in the required shape.** `npm ci` and `npm run build` fail, while the only successful direct build is a Nitro SSR/Vercel server deployment rather than static `dist`.
2. **The real WebMCP loop may reject or misinterpret results.** Every tool returns a JSON string, and same-name cleanup can race host removal; mock tests currently normalize the wrong contract with `JSON.parse(String(result))`.
3. **The primary recording can expose internal QA and misleading readiness signals.** QA is visible by default on desktop/mobile, while `npm test` reports success after silently skipping all nine script suites.

## Stop boundary

No cleanroom deletion, dependency edit, WebMCP behavior change, QA gating, or visual redesign was performed. Human review is required before Phase 1 begins.
