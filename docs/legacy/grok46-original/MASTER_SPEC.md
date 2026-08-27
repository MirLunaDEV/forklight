# Forklight Master Specification v1.0

**Status:** LOCKED FOR MVP  
**Spec owner:** Human project lead  
**Consumers:** Codex / Antigravity / Grok / any other coding agent  
**Last locked:** 2026-08-27 KST  
**WebMCP spec snapshot:** Draft Community Group Report, 2026-08-19

> If code, prompts, comments, or another document disagree with this file, **this file wins** until a human explicitly changes it.

---

## 0. Product lock

### One-sentence product

**Before an agent changes your live application, let it try several futures first.**

### Submission build

> **Forklight is a WebMCP-powered 3D logistics sandbox where an AI agent branches the current live world, experiments on isolated futures, machine-verifies each future against deterministic constraints, and can merge only a future that a human explicitly approves.**

### Tagline

**Forklight — Try the future before you merge it.**

### The submission's core claim

The human does not merely approve an action.

**Human approval changes the agent's available WebMCP tool surface.**

`merge_verified_branch` **must not exist** until a verified branch is explicitly approved by the human.

Do not dilute this claim with unrelated features.

---

## 1. Why this is a WebMCP project

Forklight is not a chatbot attached to a simulator and is not browser automation.

The live page itself exposes a small set of structured tools over the same state the human is looking at.

The intended collaboration loop is:

```text
Human sets goal and constraints
        ↓
Agent inspects the current live world
        ↓
Agent creates isolated futures
        ↓
Agent mutates and simulates each future
        ↓
Deterministic validator checks hard constraints
        ↓
Human visually compares the verified / failed futures
        ↓
Human approves one verified future
        ↓
WebMCP tool surface changes
        ↓
merge_verified_branch appears
        ↓
Agent merges the approved future into MAIN
```

### Judging alignment

| Criterion | Forklight behavior |
|---|---|
| Usefulness | Agents can explore alternatives without damaging the live state |
| Originality | A verified + human-approved state transition unlocks a new agent capability |
| Execution | One polished, deterministic vertical slice instead of a generalized platform |
| Thoughtful WebMCP | Few deep tools, shared page state, read-only annotations, dynamic registration via AbortSignal |
| Human-agent experience | Agent explores; validator proves hard constraints; human makes the final judgment and grants capability |

---

## 2. Locked scope

### In scope

- One 24m × 16m warehouse fixture
- One MAIN world
- Up to three active candidate branches in the demo (`route-a`, `route-b`, `route-c`)
- Deterministic discrete flow simulation
- Four hard constraints
- 9 static WebMCP tools
- 1 dynamically registered merge tool
- Human approval / revoke
- Branch comparison
- Real tool execution timeline
- 3D visualization of the selected world state
- Static HTTPS deployment

### Explicit non-goals

- NO backend-required LLM
- NO in-app LLM API key
- NO accounts
- NO database
- NO multiplayer
- NO real factory physics
- NO industrial optimizer
- NO procedural world generation
- NO cross-origin OpenMesh
- NO custom shader system
- NO WebGPU requirement
- NO in-app multi-agent orchestration
- NO generalized branching framework
- NO Git semantics beyond the metaphor
- NO entity creation/deletion
- NO speed/capacity editing by agent
- NO arbitrary code execution
- NO mobile-specific work
- NO landing page before the product screen works
- NO `navigator.modelContext`
- NO `provideContext`
- NO `unregisterTool`
- NO unofficial WebMCP polyfill

If time remains after the feature freeze: **polish, reliability, and demo clarity only.**

---

## 3. Demo contract

The following demo must be reproducible **without an LLM** through QA controls, and reproducible **with ChatGPT site tools** through WebMCP.

### Demo request

```text
Increase throughput by at least 20%.
Don't move protected equipment.
Don't increase average planned travel distance by more than 10%.
Keep congestion no worse than the current layout.
Try multiple alternatives before changing the live world.
```

### Expected path

1. `inspect_world`
2. `inspect_constraints`
3. `create_branch("route-a")`
4. `create_branch("route-b")`
5. `create_branch("route-c")`
6. Mutate A → simulate → validate
7. Mutate B → simulate → validate
8. Mutate C → simulate → validate
9. `compare_branches`
10. Human visually inspects the futures
11. Human clicks **Approve Future B**
12. UI shows **CAPABILITY UNLOCKED**
13. `merge_verified_branch` becomes a registered WebMCP tool
14. Agent invokes `merge_verified_branch({ branchId })`
15. MAIN becomes B
16. MAIN revision increments
17. B becomes `merged`; other old branches become `stale`
18. Merge capability disappears

### Locked demo futures

Exactly **one** branch passes all constraints.

| Future | Locked operations | Intended failure/pass |
|---|---|---|
| A `route-a` | Move `barrier-south` out of the south corridor; enable `r-south` | **FAIL distance** |
| B `route-b` | Move `barrier-north` out of the north corridor; enable `r-north` | **PASS all four** |
| C `route-c` | Perform B's operations, then move protected `scan-1` and update the north waypoint to follow it | **FAIL protected** |

A and C may pass/fail additional non-core checks during tuning, but **B must be the only verified future**.

If Day 2 tuning cannot achieve this with the locked formulas, only numerical fixture constants may be tuned.  
Do not add new entities, routes, constraints, or simulator concepts without a human spec revision.

---

## 4. Technology lock

```text
Vite
React
TypeScript strict
@react-three/fiber
@react-three/drei
zustand
vitest
pnpm if available, otherwise npm
static HTTPS deployment
```

### Source-of-truth rule

`WorldState` is the source of truth.

Three.js / R3F is a **view**.

```text
WorldState ───────────────► R3F / Three.js
    │
    ├─ structuredClone ──► Branch.worldState
    │
    └─ simulate() ───────► SimulationMetrics
                              │
                              ▼
                         validate()
```

Never derive metrics from rendered meshes or animation.

---

## 5. Coordinate system

- Ground plane axes: `x` east/west, `z` north/south
- `y` is vertical
- 1 world unit = 1 meter
- Floor bounds: `x ∈ [0, 24]`, `z ∈ [0, 16]`
- Movable entity center bounds: `x ∈ [1, 23]`, `z ∈ [1, 15]`
- Entity `position.y = 0`
- Routes are x/z polylines
- Camera must stay fixed when switching MAIN/A/B/C so differences are visually comparable

**This project uses a 24 × 16 world.**  
Any earlier note saying 24 × 14 is obsolete.

---

## 6. Domain model

```ts
export type EntityType =
  | "machine"
  | "barrier"
  | "spawn"
  | "destination"
  | "junction";

export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  position: Vec3;
  size: { w: number; h: number; d: number };
  protected: boolean;
  capacity: number;
}

export interface RouteWaypoint {
  x: number;
  z: number;
}

export interface Route {
  id: string;
  name: string;
  sourceId: string;
  targetId: string;
  waypoints: RouteWaypoint[];
  speed: number;
  capacity: number;
  enabled: boolean;
}

export interface WorldState {
  revision: number;
  seed: number;
  name: string;
  entities: Entity[];
  routes: Route[];
  baselineMetrics: SimulationMetrics | null;
}

export interface SimulationMetrics {
  seed: number;
  ticks: number;
  packages: number;
  spawned: number;
  completed: number;
  throughput: number;
  averageDistance: number;
  averageTravelTime: number;
  congestionScore: number;
}

export interface ConstraintSet {
  minThroughputImprovement: number;
  maxDistanceIncrease: number;
  maxProtectedMoved: number;
  maxCongestionRatio: number;
}

export interface Change {
  id: string;
  at: number;
  tool: "move_entity" | "modify_route";
  summary: string;
  payload: unknown;
  touchedProtectedEntity: boolean;
}

export type BranchStatus =
  | "draft"
  | "simulated"
  | "verified"
  | "failed"
  | "stale"
  | "merged";

export interface Branch {
  id: string;
  name: string;
  baseRevision: number;
  worldState: WorldState;
  changes: Change[];
  mutationVersion: number;
  simulatedMutationVersion: number | null;
  validatedMutationVersion: number | null;
  metrics: SimulationMetrics | null;
  validationResult: ValidationResult | null;
  status: BranchStatus;
}

export interface ValidationCheck {
  id: "throughput" | "distance" | "protected" | "congestion";
  passed: boolean;
  actual: number;
  required: string;
  message: string;
}

export interface ValidationResult {
  allPassed: boolean;
  checks: ValidationCheck[];
}

export interface TimelineEvent {
  id: string;
  ts: number;
  tool: string;
  status: "start" | "success" | "error";
  durationMs?: number;
  summary: string;
}

export interface ApprovalState {
  branchId: string | null;
  approvedAt: number | null;
}
```

### Serialization invariant

All domain state must survive:

```ts
JSON.parse(JSON.stringify(state))
```

No `THREE.Object3D`, functions, Map, Set, class instances, DOM nodes, signals, controllers, or browser handles inside domain state.

---

## 7. Locked initial world

File target: `src/domain/initialWorld.ts`

### World metadata

```text
name = "Forklight Demo Warehouse"
revision = 1
seed = 42
floor = 24 × 16
entities = 10
routes = 3
```

### Entities

| id | type | name | position (x,z) | size (w,h,d) | protected | capacity |
|---|---|---|---:|---:|---:|---:|
| `spawn-1` | spawn | Inbound Dock | 2,8 | 2,1,2 | true | 99 |
| `dest-1` | destination | Outbound Dock | 22,8 | 2,1,2 | true | 99 |
| `pack-1` | machine | Packing Station | 14,8 | 2,1.5,2 | true | 1 |
| `scan-1` | machine | Scanner | 14,12 | 2,1.5,2 | true | 2 |
| `j-center` | junction | Center Hub | 8,8 | 1.5,0.5,1.5 | true | 2 |
| `j-north` | junction | North Hub | 8,12 | 1.5,0.5,1.5 | false | 3 |
| `j-south` | junction | South Hub | 8,3 | 1.5,0.5,1.5 | false | 3 |
| `barrier-north` | barrier | North Barrier | 7,11.3 | 1.5,1.5,1.0 | false | 0 |
| `barrier-south` | barrier | South Barrier | 7,3.8 | 1.5,1.5,1.0 | false | 0 |
| `rack-1` | barrier | Overflow Rack | 11,14 | 1.2,1.2,1.2 | false | 0 |

### Routes

All route speeds are locked to `0.5` meters/tick in MVP.  
All route capacities are locked to `3` simultaneous moving packages.

#### `r-main`

```text
enabled: true
spawn-1 (2,8)
→ j-center (8,8)
→ pack-1 (14,8)
→ dest-1 (22,8)
```

Polyline length: **20.0m**

#### `r-north`

```text
enabled: false
spawn-1 (2,8)
→ j-north (8,12)
→ scan-1 (14,12)
→ dest-1 (22,8)
```

Approx. length: **22.155m**

Initially blocked by `barrier-north`.

#### `r-south`

```text
enabled: false
spawn-1 (2,8)
→ j-south (8,3)
→ (18,3)
→ dest-1 (22,8)
```

Approx. length: **24.214m**

Initially blocked by `barrier-south`.

### Locked "open corridor" mutations

North bypass opens when:

```text
barrier-north → { x: 11, z: 11.3 }
```

South bypass opens when:

```text
barrier-south → { x: 11, z: 3.8 }
```

For C, move the protected scanner to:

```text
scan-1 → { x: 14, z: 12.5 }
```

and update the corresponding north route waypoint to `{ x: 14, z: 12.5 }`.

### Baseline

On app bootstrap:

1. Create locked MAIN.
2. Run `simulate(MAIN, 42)` once.
3. Store the result as `MAIN.baselineMetrics`.

After a successful merge:

- do **not** re-run the simulator just to establish a baseline;
- set `MAIN.baselineMetrics = structuredClone(mergedBranch.metrics)`;
- increment MAIN revision.

---

## 8. Mutation rules

Only two domain mutations exist.

### 8.1 `move_entity`

Inputs:

```ts
{
  branchId: string;
  entityId: string;
  position: { x: number; z: number };
}
```

Rules:

1. MAIN cannot be mutated by this command.
2. Branch must exist and not be `stale` or `merged`.
3. Entity must exist.
4. Reject out-of-bounds coordinates; **do not silently clamp**.
5. Apply the mutation even when the entity is protected.
6. If the entity was protected at call time, the change record sets `touchedProtectedEntity = true`.
7. A protected move remains a violation even if the entity is later moved back.
8. Increment `branch.mutationVersion`.
9. Clear metrics and validation.
10. Set branch to `draft`.
11. If this branch was human-approved, immediately revoke approval and remove merge capability.

### 8.2 `modify_route`

Inputs:

```ts
{
  branchId: string;
  routeId: string;
  enabled?: boolean;
  waypoints?: { x: number; z: number }[];
}
```

Allowed fields:

- `enabled`
- `waypoints`

Forbidden:

- `speed`
- `capacity`
- `sourceId`
- `targetId`
- creating/deleting routes

Runtime rules:

1. At least one of `enabled` or `waypoints` must be supplied.
2. `waypoints.length >= 2`.
3. First waypoint must be within 1.5m of source center.
4. Last waypoint must be within 1.5m of target center.
5. Every waypoint must be inside floor bounds.
6. Increment mutation version and invalidate simulation/validation exactly like `move_entity`.
7. If branch was approved, revoke approval.

---

## 9. Barrier blocking

A route is blocked when a barrier AABB intersects any route segment.

### 2D AABB

For barriers only:

```text
minX = x - w/2
maxX = x + w/2
minZ = z - d/2
maxZ = z + d/2
```

Use a deterministic segment-vs-AABB test on x/z.

Disabled routes are never candidates.

Blocked routes are never candidates.

Do not "slow" a blocked route. Treat it as unavailable.

This makes the demo state easy to reason about:

```text
boot:
r-main  = enabled + open
r-north = disabled + blocked
r-south = disabled + blocked
```

---

## 10. Branch engine

### Creation

```text
create_branch(name)
→ clone MAIN using structuredClone
→ baseRevision = MAIN.revision
→ mutationVersion = 0
→ status = draft
```

Branch IDs are app-generated deterministic UUID-like strings or `branch-N`; agent supplies only the display name.

### Isolation

- Branch A mutation must never change MAIN.
- Branch A mutation must never change Branch B.
- Tests compare serialized snapshots before and after mutations.

### State machine

```text
                         mutate
                           ▲
                           │
draft ─run_simulation→ simulated ─validate→ verified
  ▲                              └────────→ failed
  └──────────── any mutation ──────────────┘

MAIN revision change:
candidate branch → stale

successful selected branch:
verified → merged
```

### Simulation freshness

A simulation is fresh only when:

```text
simulatedMutationVersion === mutationVersion
```

Validation is fresh only when:

```text
validatedMutationVersion === mutationVersion
```

`validate_branch` must call `run_simulation` internally if the branch does not have a fresh simulation.

### Merge preconditions

Reject merge unless **all** are true:

```text
branch.status === "verified"
branch.baseRevision === main.revision
branch.validationResult?.allPassed === true
branch.validatedMutationVersion === branch.mutationVersion
approval.branchId === branch.id
merge capability is currently registered
```

### Merge success

```text
previousRevision = MAIN.revision
MAIN = structuredClone(branch.worldState)
MAIN.revision = previousRevision + 1
MAIN.baselineMetrics = structuredClone(branch.metrics)

selected branch.status = "merged"
all other non-merged branches from previous revision = "stale"

approval = null
remove merge tool
```

There is no rebase, cherry-pick, conflict resolver, or partial merge.

---

## 11. Deterministic simulator

File target: `src/simulation/simulator.ts`

Signature:

```ts
simulate(world: WorldState, seed = world.seed): SimulationMetrics
```

### Locked constants

```text
TICKS = 240
PACKAGES = 80
SPAWN_EVERY = 2
ROUTE_SPEED = 0.5 m/tick
```

The `seed` is included in the API and result so the model is future-safe, but **MVP metrics do not use randomness**.

`Math.random()` is forbidden in simulation code.

### Purpose

This is a deliberately small deterministic flow model, not industrial physics.

### Route preparation

1. Collect routes where `enabled === true`.
2. Remove routes blocked by a barrier.
3. Sort candidates by route ID for deterministic ordering.
4. Precompute each polyline length.

### Package spawning and route assignment

At ticks `0, 2, 4, ...` until 80 packages have spawned:

- assign the new package using round-robin over the currently available routes;
- assignment happens even if that route is currently at capacity;
- assigned-but-not-yet-moving packages wait in that route's FIFO queue.

This is intentional: with two available routes, planned distance is a stable 50/50 average.

### Movement

For each tick and each route:

1. While moving count `< route.capacity`, admit packages from that route's queue FIFO.
2. Each moving package advances `route.speed`.
3. When progress reaches route length, the package completes and leaves occupancy.
4. Newly freed slots may admit more packages on the next tick.

### Metrics

```text
spawned
  number of packages created by end of simulation

completed
  number that reached destination by TICKS

throughput
  completed / PACKAGES

averageDistance
  mean planned route length over all SPAWNED packages
  (not only completed packages)

averageTravelTime
  mean completionTick - spawnTick for COMPLETED packages
  0 if none completed

congestionScore
  totalWaitingPackageTicks /
  max(1, totalWaitingPackageTicks + totalMovingPackageTicks)
```

### Why `averageDistance` uses spawned packages

The constraint represents the route plan the agent created.  
If only completed packages were counted, a slow long route could hide its distance by failing to finish.

### Determinism invariant

For structurally equal `WorldState` and the same seed:

```ts
deepEqual(
  simulate(structuredClone(world), seed),
  simulate(structuredClone(world), seed)
) === true
```


### Verified golden metrics for the locked simulator

The locked constants and route geometry have been dry-run against the simulator algorithm in this specification.

Expected deterministic values before implementation rounding differences:

| World | completed / 80 | throughput | avg. distance | distance vs baseline | congestion | throughput vs baseline |
|---|---:|---:|---:|---:|---:|---:|
| MAIN | 16 | 0.2000 | 20.0000 | baseline | 0.9357 | baseline |
| A south bypass | 28 | 0.3500 | 22.1067 | **+10.53%** | 0.8562 | +75.0% |
| B north bypass | 31 | 0.3875 | 21.0777 | **+5.39%** | 0.8540 | +93.75% |
| C north + protected scanner move | 31 | 0.3875 | 21.2053 | **+6.03%** | 0.8540 | +93.75% |

Therefore:

```text
A → FAIL distance (> 10%)
B → PASS all four
C → FAIL protected (protectedMoved > 0)
```

These are **golden acceptance values**, not marketing copy.

Implementation may differ only by tiny floating-point tolerance. Tests should use an explicit tolerance for floating-point metrics rather than exact string equality.

Barrier geometry was also dry-run against the specified segment-vs-AABB test:

```text
barrier-north at (7,11.3) blocks r-north
barrier-north at (11,11.3) does not block r-north

barrier-south at (7,3.8) blocks r-south
barrier-south at (11,3.8) does not block r-south

neither barrier blocks r-main
```

If implementation produces a materially different result, treat it as a bug before changing these golden values.

---

### Demo tuning gate

By the end of Day 2:

- A: throughput improvement ≥20%, distance increase >10%
- B: throughput improvement ≥20%, distance increase ≤10%, congestion ≤ baseline
- C: same performance family as B but protected violation >0
- B is the only verified branch

If the exact throughput/congestion numbers miss because of discrete boundaries, the human may tune only:

```text
TICKS
PACKAGES
SPAWN_EVERY
route.capacity
route.speed
```

in a single explicit spec revision.

Do not change formulas silently.

---

## 12. Validator

Files:

```text
src/constraints/rules.ts
src/constraints/validator.ts
```

Locked constraints:

```text
minThroughputImprovement = 0.20
maxDistanceIncrease = 0.10
maxProtectedMoved = 0
maxCongestionRatio = 1.00
```

### Derived values

```ts
throughputImprovement =
  (candidate.throughput - baseline.throughput) /
  baseline.throughput

distanceIncrease =
  (candidate.averageDistance - baseline.averageDistance) /
  baseline.averageDistance

protectedMoved =
  branch.changes.filter(c => c.touchedProtectedEntity).length

congestionRatio =
  candidate.congestionScore / baseline.congestionScore
```

Fail closed when:

- baseline is missing
- baseline throughput ≤ 0
- baseline average distance ≤ 0
- baseline congestion score ≤ 0 and candidate congestion > 0

When baseline congestion is exactly 0:
- candidate congestion 0 passes;
- any positive candidate congestion fails.

### Required checks

1. throughput improvement ≥ 0.20
2. distance increase ≤ 0.10
3. protectedMoved === 0
4. candidate congestion ≤ baseline congestion

All four pass → `verified`  
Otherwise → `failed`

### Human-readable output examples

```text
Throughput: +41.7%  (need ≥ +20%) ✓
Distance:    +5.4%  (need ≤ +10%) ✓
Protected:       0  (need 0)      ✓
Congestion:   0.31  (baseline 0.42) ✓
```

Numbers above are examples, not golden constants.

---

## 13. WebMCP compatibility contract

### Authoritative API

Use the current draft API only:

```ts
document.modelContext.registerTool(toolDefinition, { signal })
```

The implementation must feature-detect:

```ts
if (!("modelContext" in document)) {
  // WebMCP unavailable
}
```

There is **no `navigator.modelContext` fallback** in Forklight v1.0.

### Experimental DOM types

Current TypeScript DOM libraries may not include WebMCP.

Create:

```text
src/types/webmcp.d.ts
```

with the **minimal local ambient declarations required by this app**.

Do not install an unofficial polyfill just to satisfy TypeScript.

### Secure context

WebMCP is a secure-context API.

- `localhost` is valid for local development.
- submission deployment must use HTTPS.

### Primary compatibility target

1. ChatGPT desktop app built-in browser / site tools
2. Chromium WebMCP testing environment as a secondary API check

Do not assume ChatGPT site tools work in ordinary Chrome tabs.

---

## 14. WebMCP tools

Files:

```text
src/webmcp/schemas.ts
src/webmcp/registerTools.ts
src/webmcp/capabilityManager.ts
```

### Static tools: 9

#### Read-only (`readOnlyHint: true`)

1. `inspect_world`
2. `inspect_constraints`
3. `inspect_branch`
4. `compare_branches`

#### Mutating / experimental

5. `create_branch`
6. `move_entity`
7. `modify_route`
8. `run_simulation`
9. `validate_branch`

### Dynamic tool: 1

10. `merge_verified_branch`

**It is not registered at boot.**

### Tool principle

UI buttons and WebMCP tools call the **same domain commands**.

Never maintain a "UI implementation" and an "agent implementation" of the same action.

---

## 15. WebMCP schemas

Use compact JSON Schema with `additionalProperties: false`.

### `inspect_world`

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

### `inspect_constraints`

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

### `inspect_branch`

```json
{
  "type": "object",
  "properties": {
    "branchId": { "type": "string" }
  },
  "required": ["branchId"],
  "additionalProperties": false
}
```

### `compare_branches`

```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

### `create_branch`

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 40
    }
  },
  "required": ["name"],
  "additionalProperties": false
}
```

### `move_entity`

```json
{
  "type": "object",
  "properties": {
    "branchId": { "type": "string" },
    "entityId": { "type": "string" },
    "position": {
      "type": "object",
      "properties": {
        "x": { "type": "number" },
        "z": { "type": "number" }
      },
      "required": ["x", "z"],
      "additionalProperties": false
    }
  },
  "required": ["branchId", "entityId", "position"],
  "additionalProperties": false
}
```

### `modify_route`

```json
{
  "type": "object",
  "properties": {
    "branchId": { "type": "string" },
    "routeId": { "type": "string" },
    "enabled": { "type": "boolean" },
    "waypoints": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "properties": {
          "x": { "type": "number" },
          "z": { "type": "number" }
        },
        "required": ["x", "z"],
        "additionalProperties": false
      }
    }
  },
  "required": ["branchId", "routeId"],
  "additionalProperties": false
}
```

Runtime rejects a call containing neither `enabled` nor `waypoints`.

### `run_simulation`

```json
{
  "type": "object",
  "properties": {
    "branchId": { "type": "string" }
  },
  "required": ["branchId"],
  "additionalProperties": false
}
```

### `validate_branch`

```json
{
  "type": "object",
  "properties": {
    "branchId": { "type": "string" }
  },
  "required": ["branchId"],
  "additionalProperties": false
}
```

### `merge_verified_branch`

```json
{
  "type": "object",
  "properties": {
    "branchId": { "type": "string" }
  },
  "required": ["branchId"],
  "additionalProperties": false
}
```

---

## 16. Tool return contract

WebMCP tool callbacks return compact JSON strings.

### `inspect_world`

Return MAIN only:

```ts
{
  revision,
  seed,
  entities: [
    { id, type, name, position, protected, capacity }
  ],
  routes: [
    { id, name, enabled, capacity, length, blockedBy }
  ],
  baselineMetrics,
  branches: [
    { id, name, status }
  ]
}
```

Do not return:

- Three.js objects
- full mesh data
- decorative state
- giant snapshots
- source code

### `inspect_branch`

Return:

```ts
{
  id,
  name,
  status,
  baseRevision,
  mutationVersion,
  changes,
  metrics,
  validationResult
}
```

### `compare_branches`

Return one compact row per branch:

```ts
{
  mainRevision,
  branches: [
    {
      id,
      name,
      status,
      throughputImprovement,
      distanceIncrease,
      protectedMoved,
      congestionRatio,
      allPassed
    }
  ]
}
```

### Error shape

Tool failures return a compact JSON string:

```ts
{
  ok: false,
  error: {
    code: "BRANCH_STALE",
    message: "Branch route-b was created from revision 1 but MAIN is revision 2."
  }
}
```

Do not throw raw internal stack traces to the agent.

---

## 17. Real activity timeline

Every WebMCP execution uses one wrapper:

```text
timeline start
    ↓
domain command
    ↓
timeline success/error
    ↓
stringified tool result
```

Required timeline information:

- timestamp
- tool name
- start/success/error
- duration
- compact human-readable summary

Examples:

```text
00:41:20 inspect_world        ✓ 10 entities, rev 1
00:41:26 create_branch        ✓ route-b
00:41:31 move_entity          ✓ barrier-north → (11,11.3)
00:41:34 modify_route         ✓ r-north enabled
00:41:35 run_simulation       ✓ throughput +...
00:41:36 validate_branch      ✓ VERIFIED
```

**Never generate fake timeline events for the demo.**

UI-only QA actions may use a separate clearly labeled `QA ACTIONS` log or call the same domain command without pretending they came from an agent.

---

## 18. Capability Bloom

File target:

```text
src/webmcp/capabilityManager.ts
```

Runtime-only state:

```ts
type MergeCapabilityState = {
  controller: AbortController | null;
  registeredForBranchId: string | null;
  registrationGeneration: number;
};
```

### Register merge tool only when

```text
approval.branchId !== null
approved branch exists
approved branch.status === verified
approved branch.baseRevision === MAIN.revision
approved branch validation is fresh
```

### Human approve

When human clicks **Approve Future X**:

1. X must be `verified`.
2. X must be based on current MAIN revision.
3. Set approval to X.
4. Register `merge_verified_branch` with a **new AbortController**.
5. UI shows `CAPABILITY UNLOCKED`.
6. Timeline/UI must distinguish "human approval" from agent tool execution.

### Revoke / invalidate

Abort and clear merge capability when:

- human clicks revoke
- approved branch mutates
- approved branch becomes stale
- MAIN revision changes
- merge succeeds
- branch is deleted in future versions (not MVP)

### Re-registration safety

The draft API notes races around quick abort/re-register of a tool with the same name.

For MVP:

- serialize capability updates;
- abort the old controller before re-registering;
- if re-registering the same tool after a revoke, wait until `getTools()` no longer reports the previous registration, with a short bounded timeout;
- demo flow should approve once and merge once.

### Core statement

> **The human does not approve a hidden backend action. The human changes which capability the live page exposes to the agent.**

---

## 19. UI layout

Build the product screen first.

```text
┌────────────────────────────────────────────────────────────┐
│ FORKLIGHT        MAIN / A / B / C        WebMCP ● / ○     │
├──────────────────────────────────┬─────────────────────────┤
│                                  │ HARD CONSTRAINTS        │
│                                  │                         │
│          3D WAREHOUSE            │ Throughput ≥ +20%       │
│                                  │ Distance ≤ +10%         │
│                                  │ Protected moved = 0     │
│                                  │ Congestion ≤ baseline   │
│                                  ├─────────────────────────┤
│                                  │ FUTURES                 │
│                                  │ A  FAIL                 │
│                                  │ B  VERIFIED             │
│                                  │ C  FAIL                 │
│                                  │ [Approve] [Revoke]      │
├──────────────────────────────────┴─────────────────────────┤
│ AGENT ACTIVITY — real WebMCP tool executions only         │
└────────────────────────────────────────────────────────────┘
```

### Required visual language

| State | Treatment |
|---|---|
| MAIN | neutral |
| Candidate branch | branch name + visible badge |
| Protected entity | lock marker / outline |
| Modified entity | ghost at MAIN position |
| Verified | clear pass marker |
| Failed | failed constraint visible |
| Stale | dimmed, merge impossible |
| Merged | merged badge |
| WebMCP unavailable | visible status, app still works manually |
| Merge capability unlocked | obvious but tasteful header pulse/banner |

Do not depend on color alone for pass/fail.

### Branch switching

- Keep same camera position.
- Keep same zoom.
- Keep same orientation.
- Swap only the selected world state and overlays.

---

## 20. QA controls

The no-agent QA path is mandatory.

Provide a developer/QA panel that can:

- create A/B/C
- apply locked Future A preset
- apply locked Future B preset
- apply locked Future C preset
- run simulation
- validate
- approve/revoke
- merge if capability is available

### Important

The preset buttons are **QA helpers**, not extra WebMCP tools.

They must call the same domain commands as the WebMCP tools.

This provides:

- deterministic testing
- backup demo rehearsal
- rapid visual QA
- no duplicated logic

---

## 21. Test contract

Use Vitest.

### Domain / state

1. Create branch → MAIN serialized JSON unchanged.
2. Edit A → B and MAIN unchanged.
3. Branch mutation increments `mutationVersion`.
4. Branch mutation clears metrics / validation and sets `draft`.
5. Approved branch mutation revokes approval.
6. Out-of-bounds entity move is rejected.
7. Protected move records a permanent protected violation.

### Simulator

8. Same world + seed twice → deep-equal metrics.
9. No `Math.random` use in simulator.
10. Boot world has only `r-main` available.
11. Opening north + enabling north makes two routes available.
12. Opening south + enabling south makes two routes available.

### Validator

13. Throughput below threshold fails.
14. Distance above threshold fails.
15. Protected move fails even if entity is moved back.
16. Congestion above baseline fails.
17. All four pass → branch `verified`.

### Branch / merge

18. `validate_branch` re-simulates when simulation is stale.
19. Stale branch cannot merge.
20. Unverified branch cannot merge.
21. Verified but unapproved branch cannot merge.
22. Approved verified current branch can merge.
23. Merge increments MAIN revision.
24. Merged branch becomes `merged`.
25. Other old branches become `stale`.
26. Merge capability disappears after merge.

### WebMCP

27. Static tools register only when `document.modelContext` exists.
28. Read tools have `readOnlyHint: true`.
29. `merge_verified_branch` is absent at boot.
30. Approving a verified current branch registers merge capability.
31. Revoking approval aborts merge registration.
32. Timeline records real tool start/success/error.
33. WebMCP unavailable state does not break manual app.

### Golden demo acceptance

34. Future A fails distance.
35. Future B passes all four.
36. Future C fails protected.
37. B is the only verified future.

---

## 22. Repository structure

```text
forklight/
├─ AGENTS.md
├─ README.md
├─ LICENSE
├─ docs/
│  ├─ MASTER_SPEC.md
│  ├─ ARCHITECTURE.md
│  ├─ STATE_MODEL.md
│  ├─ WEBMCP_TOOLS.md
│  ├─ TEST_PLAN.md
│  ├─ CODEX_DAY1.md
│  ├─ DEMO_SCRIPT.md
│  └─ SUBMISSION.md
├─ src/
│  ├─ types/
│  │  └─ webmcp.d.ts
│  ├─ domain/
│  │  ├─ world.ts
│  │  ├─ branch.ts
│  │  ├─ metrics.ts
│  │  ├─ commands.ts
│  │  └─ initialWorld.ts
│  ├─ state/
│  │  ├─ worldStore.ts
│  │  ├─ branchStore.ts
│  │  ├─ approvalStore.ts
│  │  └─ timelineStore.ts
│  ├─ simulation/
│  │  ├─ geometry.ts
│  │  └─ simulator.ts
│  ├─ constraints/
│  │  ├─ rules.ts
│  │  └─ validator.ts
│  ├─ webmcp/
│  │  ├─ schemas.ts
│  │  ├─ toolWrapper.ts
│  │  ├─ registerTools.ts
│  │  └─ capabilityManager.ts
│  ├─ scene/
│  │  ├─ Warehouse.tsx
│  │  ├─ EntityMesh.tsx
│  │  ├─ RouteLines.tsx
│  │  ├─ PackageFlow.tsx
│  │  └─ WorldDiffOverlay.tsx
│  ├─ ui/
│  │  ├─ TopBar.tsx
│  │  ├─ BranchPanel.tsx
│  │  ├─ ConstraintPanel.tsx
│  │  ├─ MetricsPanel.tsx
│  │  ├─ AgentTimeline.tsx
│  │  └─ QaPanel.tsx
│  ├─ tests/
│  ├─ App.tsx
│  └─ main.tsx
└─ package.json
```

`src/domain/commands.ts` is the shared command layer used by UI and WebMCP.

---

## 23. Agent development rules

Every coding agent must:

1. Read `AGENTS.md`.
2. Read this file before coding.
3. State which locked sections its task touches.
4. Avoid unrelated refactors.
5. Add/adjust tests for behavior changes.
6. Report any requested behavior that contradicts this spec.
7. Never silently revise the simulator formula or constraints.
8. Never add a feature because it "would be useful" without explicit approval.

### Responsibility split

**Codex**
- integration owner
- domain/state
- simulator
- tests
- final merges

**Antigravity**
- scene/UI work in isolated tasks
- compatibility checks
- visual QA

**Grok or another independent model**
- spec-vs-code review
- state mutation audit
- determinism review
- missing tests
- alternative bug hypotheses

The repository, not chat history, is the shared memory.

---

## 24. Schedule

Internal plan:

| Day | Date | Exit gate |
|---|---|---|
| Day 1 | Aug 27 | MAIN + one isolated branch + visible barrier move + tests |
| Day 2 | Aug 28 | deterministic simulator + validator + golden A/B/C results |
| Day 3 | Aug 29 | 6 core WebMCP tools work live; agent verifies one branch |
| Day 4 | Aug 30 | compare + approval + dynamic merge + stale behavior; full loop |
| Day 5 | Aug 31 | visual polish only |
| Day 6 | Sep 1 | feature freeze, deployment, compatibility, README |
| Day 7 | Sep 2 | video rehearsal, submission copy, bug fixes only |
| Day 8 | Sep 3 | final recording and submission |

### Day 3 core-tool cut

Day 3 requires only:

```text
inspect_world
inspect_constraints
create_branch
move_entity
modify_route
run_simulation
validate_branch
```

`compare_branches` and Capability Bloom may finish Day 4.

### GO / NO-GO gate — Aug 30 night

GO only when this complete loop works:

```text
agent creates branch
→ agent mutates
→ simulation
→ validation
→ human approval
→ merge tool appears
→ agent merges
→ MAIN changes
```

NO-GO response:

- stop feature work;
- fix only this loop;
- preserve submission viability.

### Feature freeze

**Sep 1 KST**

After freeze:
- bug fixes
- compatibility fixes
- UI polish
- copy
- recording
- deployment

No feature expansion.

---

## 25. Video contract

Target: **2:20–2:40**, never 3:00.

```text
0:00–0:15
Problem:
Agents are increasingly able to change live software, but experimentation
usually happens on the state we actually care about.

0:15–0:30
Forklight:
"Try multiple futures before changing yours."

0:30–1:30
Live ChatGPT site-tool session:
inspect → create A/B/C → mutate → simulate → validate

1:30–1:50
Branch comparison:
A FAIL / B VERIFIED / C FAIL
Human visually selects B.

1:50–2:10
Human clicks Approve Future B.
CAPABILITY UNLOCKED.
merge_verified_branch appears.
Agent calls it.
MAIN changes.

2:10–2:30
"The agent explored.
The simulator verified.
The human decided.
WebMCP changed what the agent was allowed to do."

2:30
Forklight — Try the future before you merge it.
```

Never fake:
- tool calls
- tool timeline
- validation
- capability registration
- merge

A successful real session may be recorded and edited for pacing.

---

## 26. Day 1 acceptance gate

Do not begin simulator/WebMCP work until:

- Vite/React/TypeScript app boots
- locked fixture renders
- `WorldState` is the source of truth
- Create Branch works
- selected branch is visible
- moving `barrier-north` in a branch changes only that branch
- switching back to MAIN shows original barrier position
- branch isolation tests pass

The scene may be ugly.

**Day 1 success is state isolation, not graphics.**

---

## 27. Feature-freeze success bar

By Sep 1:

```text
[ ] MAIN world works
[ ] Branches are isolated
[ ] Golden A/B/C are reproducible
[ ] Simulation is deterministic
[ ] Four constraints work
[ ] Real WebMCP calls work
[ ] Agent can manipulate a branch
[ ] Branch comparison works
[ ] Human approval works
[ ] Merge tool is dynamically absent/present
[ ] Verified merge works
[ ] Stale protection works
[ ] Real tool activity timeline works
[ ] Manual QA fallback works
[ ] Public HTTPS URL works
[ ] README is clean
[ ] Demo can be completed from a fresh session
```

---

## 28. External compatibility references

Use these as the implementation reference, not old examples:

- WebMCP current draft: https://webmachinelearning.github.io/webmcp/
- OpenAI WebMCP Challenge: https://openai.com/webmcp-challenge/
- OpenAI site tools help: https://help.openai.com/en/articles/20001423-using-site-tools-in-the-chatgpt-desktop-app

If those references change during the hackathon, a human must decide whether to revise this spec.

---

## 29. Final lock

Only these implementation details may change without a product-level redesign:

- purely visual styling
- exact component file splitting
- Zustand store splitting
- test helper organization
- simulator numerical constants **only through an explicit Day 2 tuning revision**

Everything else is closed for MVP.

**Build the proof, not the platform.**
