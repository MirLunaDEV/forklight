# Forklight Master Specification v1.2 — Challenge Cleanroom

**Status:** LOCKED FOR MVP  
**Implementation base:** Grok 4.6 Forklight prototype  
**Authoritative for:** Codex / Antigravity / Grok / human review  
**Locked:** 2026-08-27 KST

> If source code, legacy docs, generated comments, template conventions, or an agent recommendation conflicts with this file, **this file wins** until the human project lead explicitly revises it.

---

## 0. Product lock

### Human policy amendment — 2026-08-27

The project lead explicitly added one pre-exploration human boundary without changing the golden simulator or futures:

```text
human reviews and locks the fixed challenge policy
→ agent exploration becomes available
→ validator checks that human-owned policy
→ human still approves the verified future for merge
```

The challenge values remain `+20%` minimum throughput, `+10%` maximum distance increase, zero protected moves, and congestion no worse than MAIN. Policy starts as `draft`; only the page UI can lock or edit it. There is no policy-mutation WebMCP tool. Experiment commands fail with `POLICY_NOT_LOCKED` while draft. Editing policy invalidates active validation proof, revokes approval, and removes merge capability.

### One sentence

**Before an agent changes your live application, let it try several futures first.**

### Submission build

> **Forklight is a WebMCP-powered 3D logistics sandbox where an AI agent branches the current live world, experiments on isolated futures, machine-verifies each future against deterministic constraints, and can merge only a future that a human explicitly approves.**

### Tagline

**Forklight — Try the future before you merge it.**

### Core interaction

`merge_verified_branch` **does not exist at boot**.

It becomes available only after:

```text
fresh verified branch
+ current MAIN revision
+ explicit human approval
= dynamic merge capability
```

The human does not merely click “yes” on a hidden action.  
**The human defines the exploration boundary and later changes which capability the live page exposes to the agent.**

---

## 1. Base-selection decision

The Grok 4.6 implementation is the **main codebase**.

The previous Manus prototype is **not** a second codebase and must not be merged wholesale. It may be used later only as a visual reference.

### Preserve the Grok core unless tests prove it wrong

Preserve:

- `src/domain/*`
- `src/simulation/*`
- `src/constraints/*`
- Forklight-specific state in `src/state/*`
- `src/webmcp/*`
- `src/scene/*`
- `src/ui/*` Forklight product components
- `src/tests/forklight.test.ts`
- `src/tests/webmcp.test.ts`
- golden A/B/C behavior
- same-camera branch visualization
- ghost diff
- human approval
- dynamic merge-capability lifecycle
- real WebMCP activity timeline

### Do not rewrite from scratch

A full restart is forbidden unless Codex demonstrates with failing tests that the existing core cannot satisfy this spec.

Prefer the smallest corrective diff.

---

## 2. Cleanroom target

The final challenge repository must behave like a small purpose-built static web app, not an app-builder template.

### Required production shape

```text
Vite
React + TypeScript
React Three Fiber / Three.js
Zustand
Vitest
Tailwind/CSS
static HTTPS deployment
```

Production:

```text
vite build
→ static dist
→ HTTPS host
```

### Forbidden runtime architecture

Remove from the challenge runtime:

- server-side app architecture
- Nitro server requirement
- Express server requirement
- PGLite / PostgreSQL
- migrations
- authentication / Better Auth
- OAuth popup handling
- user accounts
- multiplayer
- preview-host bridge
- Grok app-builder PWA scaffolding
- generated app-env runtime
- database bootstrap
- backend API dependency

These features are unrelated to Forklight and must not survive merely because the generator supplied them.

---

## 3. Non-goals

- NO backend LLM
- NO LLM API key in app
- NO database
- NO auth
- NO accounts
- NO multiplayer
- NO real factory physics
- NO industrial optimization claim
- NO generalized branch framework
- NO cross-origin OpenMesh
- NO entity creation/deletion
- NO agent modification of route speed/capacity
- NO custom shader project
- NO mobile-specific feature work
- NO landing-page detour
- NO internal multi-agent orchestration
- NO template feature preserved “just in case”

After feature freeze: polish and reliability only.

---

## 4. Locked world and demo futures

World:

```text
24m × 16m
revision = 1
seed = 42
10 entities
3 routes
```

Locked future operations:

### A — distance failure

```text
move barrier-south → (11, 3.8)
enable r-south
```

Expected: throughput improves, but planned distance increases by >10%.

### B — only verified future

```text
move barrier-north → (11, 11.3)
enable r-north
```

Expected: all four constraints pass.

### C — protected-equipment failure

```text
perform B
move protected scan-1 → (14, 12.5)
update r-north scanner waypoint → (14, 12.5)
```

Expected: protected violation causes failure.

Exactly one candidate in the golden demo is verified: **B**.

### Golden metric family

Existing Grok tests already encode the intended deterministic family and should remain the primary regression guard:

```text
MAIN ≈ throughput 0.20, distance 20.0
A    ≈ throughput 0.35, distance 22.1067 → distance fail
B    ≈ throughput 0.3875, distance 21.0777 → verified
C    ≈ throughput 0.3875, distance 21.2053 → protected fail
```

Do not silently change formulas or constants merely to make UI copy convenient.

---

## 5. State and proof invariants

`WorldState` is source of truth. Three.js is a view.

All domain state is JSON-serializable.

A candidate mutation must:

```text
mutationVersion++
metrics = null
validationResult = null
simulation proof becomes stale
validation proof becomes stale
status = draft
```

If that branch was approved:

```text
approval cleared
merge capability removed
```

Moving protected equipment records a violation even if later moved back.

Merge requires all:

```text
status === verified
baseRevision === MAIN.revision
fresh validation
all four checks passed
human approval points to this branch
merge capability is currently registered
```

Successful merge:

```text
MAIN ← clone(approved branch)
MAIN.revision++
merged branch → merged
other old candidates → stale
approval cleared
merge capability removed
```

---

## 6. Four hard constraints

```text
throughput improvement >= 20%
average planned distance increase <= 10%
protected equipment moved == 0
congestion <= baseline
```

The deterministic validator, not the LLM, decides pass/fail.

The agent may propose and explore.  
The agent may not self-declare safety.

---

## 7. WebMCP contract

Implementation reference: current WebMCP draft at  
`https://webmachinelearning.github.io/webmcp/`

### API

Use:

```ts
document.modelContext.registerTool(toolDefinition, { signal });
document.modelContext.getTools();
```

Do not use:

- `navigator.modelContext`
- `provideContext`
- `unregisterTool`
- unofficial compatibility polyfills

### Static tools — 9

Read-only:

1. `inspect_world`
2. `inspect_constraints`
3. `inspect_branch`
4. `compare_branches`

Experiment:

5. `create_branch`
6. `move_entity`
7. `modify_route`
8. `run_simulation`
9. `validate_branch`

Dynamic:

10. `merge_verified_branch`

### Tool titles

All tools have short human-facing titles.

Examples:

```text
inspect_world → Inspect world
create_branch → Create future
validate_branch → Validate future
merge_verified_branch → Merge approved future
```

### Read annotations

The four read tools use:

```ts
annotations: {
  readOnlyHint: true;
}
```

### Execute return values

Tool callbacks return **plain structured JSON-serializable values**.

Correct:

```ts
return { ok: true, branch: ... };
```

Incorrect:

```ts
return JSON.stringify({ ok: true, branch: ... });
```

Do not double-encode tool results.

### Errors

Return compact structured errors:

```ts
{
  ok: false,
  error: {
    code: "BRANCH_STALE",
    message: "..."
  }
}
```

Never expose raw stack traces.

---

## 8. Capability Bloom

The current Grok implementation's AbortController + `getTools()` lifecycle is valuable and should be preserved/hardened.

Register merge only when:

```text
human-approved branch exists
AND verified
AND current revision
AND validation fresh
```

Remove on:

- revoke
- branch mutation
- branch stale
- MAIN revision change
- successful merge

For same-name re-registration:

```text
abort old controller
→ poll getTools()
→ confirm old merge tool disappeared
→ bounded timeout
→ register new tool
```

No infinite waits.

Primary demo path is approve once → merge once.

---

## 9. Human-only boundary

There is **no approval WebMCP tool**.

Only the human UI can:

```text
Approve Future
Revoke Approval
```

This boundary is a core judging point and must remain obvious in the UI and video.

---

## 10. Shared command path

UI and WebMCP must invoke the same domain commands.

Bad:

```text
UI → ui-specific mutation
WebMCP → tool-specific mutation
```

Required:

```text
UI ─────┐
        ├─→ shared command
WebMCP ─┘
```

No duplicated simulator, validator, mutation, or merge logic.

---

## 11. Activity logging

`AGENT ACTIVITY` contains **real WebMCP executions only**.

Each real tool execution records:

- timestamp
- tool name
- start/success/error
- duration
- concise summary

Manual QA actions must be logged separately as QA or not shown in agent activity.

Never fabricate tool history for recording.

---

## 12. QA controls

QA controls are required for deterministic testing, but hidden in default submission mode.

Default:

```text
https://.../
→ no QA panel/tab
```

Developer rehearsal:

```text
https://.../?qa=1
→ QA controls visible
```

QA helpers call the same shared commands.

Manual QA merge must target **the actual human-approved branch ID**, never “the first verified branch.”

---

## 13. Product UI

Keep the existing control-room / observatory direction.

Required layout:

```text
Top: Forklight / MAIN-A-B-C / WebMCP / capability
Center-left: 3D observed world
Right: hard constraints + futures + metrics
Bottom: real agent activity
```

Preserve:

- same-camera branch switching
- protected indicator
- ghost diff from MAIN
- obvious verified/failed/stale/merged status
- `CAPABILITY UNLOCKED` moment

Improve after correctness:

- show each future's decisive metrics directly on its card
- make A/B/C failure reasons understandable instantly
- hide generator/template chrome
- do not rely on color alone

The Manus prototype may later inform visual polish, but not architecture.

---

## 14. Cleanroom deletion candidates

These are removal candidates, not automatic delete commands. Codex must confirm imports/tests before deletion.

High-confidence unrelated areas include:

```text
src/lib/auth/**
src/lib/app-data/**
src/lib/multiplayer/**
src/lib/db.ts
OAuth popup middleware
PGLite bootstrap
migrations
PreviewHostBridge
Grok PWA plugin/scaffolding
app-env plugin/scaffolding
Nitro server config
server/**
DB/auth-specific scripts
```

Also audit:

- generated routing framework vs simple one-screen Vite entry
- unused Radix components
- unused TanStack Query/Table
- unused Recharts
- unused form libraries
- unused auth/db dependencies

Do not perform large dependency deletion before import analysis and baseline tests.

---

## 15. Target repository shape

Do not waste time moving correct Forklight source merely to match exact folder aesthetics, but the conceptual end state should be roughly:

```text
Forklight/
├─ AGENTS.md
├─ README.md
├─ LICENSE
├─ docs/
├─ public/
├─ src/
│  ├─ domain/
│  ├─ state/
│  ├─ simulation/
│  ├─ constraints/
│  ├─ webmcp/
│  ├─ scene/
│  ├─ ui/
│  ├─ tests/
│  ├─ App.tsx or equivalent
│  └─ main.tsx or equivalent
├─ index.html
├─ vite.config.ts
└─ package.json
```

The final static build must not require server/database/auth infrastructure.

---

## 16. Required test gates

### Core state

- create branch leaves MAIN unchanged
- A edit leaves B and MAIN unchanged
- mutation invalidates proof
- mutation after approval revokes approval/capability
- protected move remains violation after move-back

### Simulator/golden

- deterministic
- no `Math.random()` simulation dependency
- A fails distance
- B passes all four
- C fails protected
- B only verified

### Merge

- merge capability absent at boot
- failed branch cannot approve
- unapproved branch cannot merge
- stale branch cannot merge
- approve current verified B exposes merge
- revoke removes merge
- mutation after approval removes merge
- merge increments MAIN revision
- B becomes merged
- A/C become stale
- merge capability disappears

### WebMCP

- static 9 tools register under `document.modelContext`
- four read tools have `readOnlyHint`
- tool results are objects, not JSON strings
- tool errors structured
- same-name dynamic re-registration bounded
- real timeline only
- WebMCP unavailable state does not break manual app

### Cleanroom

- no backend required to run production
- no DB migration in `build`
- QA hidden without `?qa=1`
- core UI has no auth/OAuth/multiplayer dependency
- static production build succeeds

---

## 17. Codex execution sequence

### Phase 0 — baseline audit

No feature work.

Run current Grok implementation as-is enough to establish:

```text
install
typecheck
Forklight unit tests
WebMCP tests
production build
```

Write `docs/AUDIT_RESULT.md`.

### Phase 1 — cleanroom extraction

Remove template/runtime infrastructure with smallest safe diffs.

Goal:

```text
tests green
typecheck green
static build green
core behavior unchanged
```

### Phase 2 — WebMCP contract hardening

- structured object results
- titles
- dynamic lifecycle tests
- QA hidden
- WebMCP unavailable state

### Phase 3 — live ChatGPT site-tools test

Real session must complete:

```text
inspect
→ branch
→ mutate
→ simulate
→ validate
→ compare
→ human approve
→ merge tool appears
→ agent merge
```

### Phase 4 — visual polish

Only after Phase 3 works.

---

## 18. Schedule lock

Feature freeze: **2026-09-01 KST**.

Priority order:

```text
correctness
> real WebMCP
> reliable deployment
> demo clarity
> visual polish
> everything else
```

---

## 19. Demo lock

Primary 3-minute demo moment:

```text
A — FAIL DISTANCE
B — VERIFIED
C — FAIL PROTECTED
        ↓
human approves B
        ↓
CAPABILITY UNLOCKED
        ↓
merge_verified_branch appears
        ↓
agent invokes it
        ↓
MAIN becomes B
```

No QA panel in primary recording.
No fake tool timeline.
No prerecorded imitation of a tool call.

---

## 20. Final rule

**Build the proof, not the platform.**

Forklight wins if the branch → verify → human-grant-capability → merge loop is unmistakably real and polished.
