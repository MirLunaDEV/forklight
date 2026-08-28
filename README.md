# Forklight

> **Try the future before you merge it.**

Forklight is not a warehouse optimizer. The warehouse is a visual demonstration substrate for a broader interaction primitive:

```text
live state
→ isolated futures
→ deterministic verification
→ human decision
→ dynamic capability
→ merge
```

Forklight is a browser-based WebMCP application where an AI agent can explore alternative futures without changing MAIN. A deterministic simulator checks each future against boundaries owned by the human, and only a freshly verified future approved in the page can expose the capability to merge.

> The human defines what must never be violated. The agent explores what could work. The simulator verifies what actually works. The human decides what becomes real.

Forklight gives agents freedom inside branches while humans define the boundaries and control the commit.

## Why it exists

Agent tools often expose live mutation immediately. Forklight demonstrates a safer collaboration model: branch first, measure consequences, verify deterministic rules, show the trade-offs to a human, and unlock the irreversible action only after approval.

## Human-agent workflow

1. MAIN starts at revision 1.
2. The human chooses the HUMAN POLICY thresholds and locks them.
3. The agent creates and edits isolated futures.
4. The simulator produces deterministic metrics.
5. The validator checks the human-owned policy.
6. The human approves one verified future with **Approve for Merge**.
7. The page dynamically exposes `merge_verified_branch`.
8. The agent merges the approved future; MAIN advances and older candidates become stale.

The agent cannot lock or edit policy and cannot approve a future.

## HUMAN POLICY

Policy begins in `draft`. The page UI lets the human edit all four thresholds before clicking **Lock policy**. Until then, experiment tools return `POLICY_NOT_LOCKED` and MAIN remains unchanged.

| Boundary | Default requirement |
|---|---:|
| Throughput improvement | at least `+20%` versus MAIN |
| Average planned distance | no more than `+10%` versus MAIN |
| Protected equipment moves | exactly `0` |
| Congestion | no worse than MAIN |

The default A/B/C scenario remains unchanged. For a visible policy demo, the human can tighten maximum distance from `10%` to `6%` before locking: A still fails while B still passes. At `5%`, B fails distance after revalidation. Editing or changing policy invalidates active verification, preserves fresh world metrics, revokes approval, and removes merge capability.

## Why WebMCP matters

WebMCP is part of Forklight's authority model, not a wrapper around page buttons. The browser document registers tools through `document.modelContext`, and the available tool surface changes with live application state. Human approval creates a capability the agent could not call before.

## WebMCP tools

Forklight registers exactly nine tools at boot.

| Tool | Purpose |
|---|---|
| `inspect_world` | Read MAIN, routes, metrics, and branch summaries |
| `inspect_constraints` | Read the human-owned policy and lock state |
| `inspect_branch` | Read one candidate future |
| `compare_branches` | Compare all futures with MAIN |
| `create_branch` | Create an isolated future |
| `move_entity` | Move an entity inside a future |
| `modify_route` | Enable or update a route inside a future |
| `run_simulation` | Run the deterministic simulation |
| `validate_branch` | Check a future against HUMAN POLICY |

The four inspection tools are annotated read-only. Results and errors are structured JSON-serializable objects. There is no policy-writing, policy-locking, approval, or revoke WebMCP tool.

## Capability Bloom

`merge_verified_branch` is absent at boot. It is registered only while all of these are true:

```text
verified branch
+ fresh validation
+ current MAIN revision
+ human approval
= merge capability
```

Revoke, mutation, policy edit, staleness, revision change, or successful merge removes the tool.

## Demo A/B/C scenario

| Future | Change | Deterministic result |
|---|---|---|
| A | Move south barrier and enable south route | **FAIL** — distance `+10.5%` |
| B | Move north barrier and enable north route | **VERIFIED** — all four rules pass |
| C | Perform B, then move protected Scanner and its waypoint | **FAIL** — protected equipment moved |

B is the only verified future. Detailed steps and expected results are in [Judge Testing](docs/JUDGE_TESTING.md).

## Architecture

```text
Human UI ─────┐
              ├─→ shared domain commands → serializable state
WebMCP tools ─┘             │
                            ├─→ deterministic simulator
                            ├─→ policy validator
                            └─→ capability lifecycle

Serializable state → React UI + React Three Fiber scene
```

Three.js is a view of `WorldState`, not the source of truth. The app has no database, authentication, accounts, multiplayer, server-owned application state, or external LLM API key.

## Tech stack

- React 19 and TypeScript
- Vite
- Three.js, React Three Fiber, and Drei
- Zustand
- Tailwind CSS
- Vitest and ESLint
- WebMCP `document.modelContext`
- Cloudflare Workers-compatible static asset adapter through OpenAI Sites

## Running locally

Requirements: Node.js 22+ and npm. No GitHub account, credentials, or paid API is required.

```bash
npm ci
npm run dev
```

Open <http://127.0.0.1:8080/>. Deterministic manual QA controls are hidden by default and available only at <http://127.0.0.1:8080/?qa=1>.

## Tests

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

The final suite contains 62 tests covering branch isolation, deterministic A/B/C metrics, editable HUMAN POLICY boundaries, input validation, proof invalidation, human approval, dynamic capability registration, merge state transitions, WebMCP structured results, QA isolation, and fallback behavior when WebMCP is unavailable.

See [Final Verification](docs/FINAL_VERIFICATION.md) and [Production WebMCP Verification](docs/PRODUCTION_WEBMCP_VERIFICATION.md).

## Live demo

<https://forklight.kimth06230724.chatgpt.site/>

## Judge testing instructions

Follow [docs/JUDGE_TESTING.md](docs/JUDGE_TESTING.md) for the complete copy-paste test flow and expected states.

## License

Forklight is available under the [MIT License](LICENSE).
