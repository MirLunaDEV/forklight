# Forklight Phase 1 Result — Static Cleanroom

**Date:** 2026-08-27 KST  
**Status:** COMPLETE  
**Scope:** architecture cleanup only; Forklight product behavior preserved

## Outcome

Forklight is now a normal static React/Vite application. Production builds create `dist/` directly and no longer invoke TanStack Start, SSR, Nitro, server functions, database bootstrap, migrations, authentication, OAuth, Grok PWA, app-env, multiplayer, or preview-host infrastructure.

The protected Forklight core remained unchanged and all 29 existing Forklight tests stayed green.

## Runtime architecture before and after

### Before

```text
with-app-env wrapper
→ TanStack Start router
→ SSR build
→ Nitro Vercel preset
→ server middleware
→ .vercel/output/functions
→ build-time DB migration
```

### After

```text
index.html
→ src/main.tsx
→ React createRoot
→ existing ForklightApp
→ Vite static build
→ dist/
```

Required production libraries remain React, React Three Fiber/Three.js, Zustand, Tailwind CSS, and the small active UI helper set.

## Files added

- `index.html`
- `src/main.tsx`
- `docs/PHASE1_RESULT.md`

## Files replaced or simplified

- `vite.config.ts`: reduced to React, Tailwind, aliases, and static Vite server/preview settings.
- `package.json`: direct Vite scripts, honest Vitest command, minimal active dependencies.
- `package-lock.json`: regenerated from the clean manifest.
- `tsconfig.json`: TypeScript-only `src` scope; no server or JavaScript migration coupling.
- `eslint.config.mjs`: removed TanStack/Nitro/generated-output assumptions.

## Files and systems removed

### Generated application shell

- `src/router.tsx`
- `src/routeTree.gen.ts`
- `src/routes/**`
- `src/lib/error-component.tsx`

### Backend, data, auth, and platform runtime

- `src/lib/auth/**`
- `src/lib/app-data/**`
- `src/lib/multiplayer/**`
- `src/lib/db.ts`
- `src/components/preview-host-bridge.tsx`
- `src/lib/preview-host-bridge.ts`
- `src/lib/preview-embedder-origin.ts`
- `src/lib/og/**`
- `server/**`
- `migrations/**`

### Generator scripts and obsolete tests

- `scripts/**`
- `startup.sh`

The obsolete script tests were removed with the systems they owned. `npm test` now runs the intended Forklight Vitest suite directly and cannot pass after discovering zero script tests.

### Unused state facades

- `src/state/approvalStore.ts`
- `src/state/branchStore.ts`
- `src/state/timelineStore.ts`
- `src/state/worldStore.ts`

## Dependencies removed

### Runtime dependencies: 41

Removed DB/auth/server packages, TanStack Start/router/query/table packages, PreviewHostBridge-only `zod`, 20 unused Radix controls, and unused form/chart/date/panel/toast/template packages.

Key removals include:

```text
@electric-sql/pglite
@tanstack/react-router
@tanstack/react-start
@tanstack/router-plugin
better-auth
jose
kysely
pg
zod
recharts
react-hook-form
@tanstack/react-query
@tanstack/react-table
```

Only `@radix-ui/react-slot` remains from Radix because the active button component imports it.

### Development dependencies: 4

```text
@types/pg
eslint-plugin-prettier
nitro
playwright
```

## Package-script changes

```text
dev       → vite --host 0.0.0.0 --port 8080
build     → vite build
preview   → vite preview --host 127.0.0.1 --port 8081
typecheck → tsc --noEmit
test      → vitest run
```

Removed migration, auth invariant, app-env wrapper, generator preview, and quoted recursive Node test-glob scripts.

## Verification results

| Gate | Result |
|---|---:|
| `npm ci` | PASS — 279 packages installed, 0 audit vulnerabilities |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 2 files, 29/29 tests |
| Core Forklight | PASS — 23/23 |
| WebMCP baseline | PASS — 6/6 |
| `npm run build` | PASS |
| `dist/index.html` | PRESENT |
| `.vercel` output after clean build | ABSENT |
| server/migrations/scripts directories | ABSENT |
| `npm run lint` | PASS — 0 errors, 1 Fast Refresh warning in `status.tsx` |

Static output contains 6 files totaling 1,274,427 bytes in the audited build. The build still reports a non-blocking large `Warehouse` chunk warning and an ineffective dynamic-import warning for `capabilityManager`; neither changes behavior.

## Browser render verification

The local static app rendered successfully in the in-app browser at `http://127.0.0.1:8080/`:

- title and top status bar render;
- the 3D warehouse, entities, routes, and labels render;
- constraints, futures, MAIN metrics, and agent activity render;
- WebMCP is detected and nine static tools become available;
- no auth, login, generator, PWA, or server UI appears.

No visual regression attributable to the static-shell conversion was observed.

## Remaining Phase 2 tasks

- return structured WebMCP values instead of JSON strings;
- apply exact ten locked tool titles;
- harden confirmed bounded static/dynamic same-name re-registration;
- prevent React Strict Mode teardown from surfacing a console error while asynchronous registration is in flight;
- hide QA on `/` and expose it only on `/?qa=1`;
- add direct tests for structured errors, titles, lifecycle timeout, QA separation, and unavailable Model Context.

## Known non-blocking warnings

- `Warehouse` client chunk is approximately 929 kB before gzip (about 248 kB gzip).
- Three.js reports deprecations for `Clock` and `PCFSoftShadowMap` through the current R3F/Drei path.
- ESLint reports one Fast Refresh warning for `status.tsx` exporting a component-adjacent value.

These are not Phase 1 correctness blockers and no visual/polish redesign was started.
