# Devpost Final Copy

## Project name

Forklight

## Elevator pitch

Forklight lets AI agents explore isolated futures before changing live state, while humans define the rules and control what gets merged.

## Project story

### Inspiration

AI agents are becoming capable of taking meaningful actions inside live applications, but most tool interfaces jump directly from intent to mutation. I wanted to explore a different interaction primitive: let an agent branch the current state, try multiple futures, measure the consequences, and earn access to the irreversible action only after deterministic verification and a human decision.

Forklight uses a warehouse because routes, barriers, throughput, distance, congestion, and protected equipment make cause and effect visible. It is not a warehouse optimizer. The warehouse is a concrete demonstration of a pattern that can apply to infrastructure, operations, creative systems, configuration, and other stateful tools.

### What Forklight does

Forklight begins with MAIN revision 1 and a HUMAN POLICY in draft. The policy belongs to the human and defines four boundaries: throughput must improve by at least 20%, planned distance may increase by at most 10%, protected equipment cannot move, and congestion cannot be worse than MAIN.

Before the human locks policy, the agent cannot create or modify a future. After the human clicks Lock policy, the agent can create isolated branches, move barriers, enable routes, run a deterministic simulation, validate the result, and compare futures without touching MAIN.

The demonstration creates three futures. A improves throughput but fails the distance limit. B passes all four checks and is the only verified future. C matches B's routing improvement but moves a protected scanner, so it fails the protected-equipment rule. The agent cannot approve any branch. When the human clicks Approve for Merge on B, the page dynamically exposes `merge_verified_branch`. After the agent invokes it, MAIN advances to revision 2, B becomes merged, A and C become stale, and the merge tool disappears.

The human defines what must never be violated. The agent explores what could work. The simulator verifies what actually works. The human decides what becomes real.

### Why WebMCP matters

WebMCP is the authority boundary of the product, not a wrapper around UI buttons. Forklight registers tools directly on `document.modelContext`. Nine tools are available at boot for inspection, branching, mutation, simulation, validation, and comparison. There is no tool for locking policy or granting approval.

The tenth tool, `merge_verified_branch`, does not exist until the page state contains a current, freshly verified branch that a human approved. Human approval therefore changes the live capability surface visible to the agent. Revoke, mutation, policy edit, staleness, a MAIN revision change, or a successful merge removes that capability again.

This makes WebMCP valuable in a way a conventional API is not: the agent's available actions reflect the same live document state the human is viewing and controlling.

### How I built it

Forklight is a React and TypeScript application built with Vite. Zustand stores serializable MAIN, branch, policy, validation, approval, and capability state. Three.js and React Three Fiber render the warehouse as a view of that state. A fixed-seed discrete-flow simulator calculates throughput, planned travel distance, completion, and congestion. A deterministic validator applies the four human-owned policy rules.

The human UI and WebMCP tools call the same domain commands, so there is no agent-only mutation path. WebMCP registrations use AbortController-based lifecycles and `document.modelContext.getTools()` polling so the dynamic merge capability can be removed and re-registered safely without duplicate names or unbounded waits.

Vitest covers branch isolation, deterministic A/B/C metrics, policy gating, proof invalidation, approval and revoke behavior, dynamic capability exposure, structured tool results, merge transitions, QA isolation, and unavailable-WebMCP fallback. The final suite contains 47 passing tests, and the full workflow was also exercised through the real page-defined tools in the OpenAI Codex in-app browser.

### Challenges I faced

The hardest challenge was separating four kinds of authority cleanly. The agent may explore, the simulator may measure, the validator may decide whether rules pass, and only the human may define policy and grant merge permission. A branch also needs a fresh proof tied to its exact mutation version and MAIN revision; otherwise an old approval could accidentally authorize a changed or stale future.

Dynamic tool registration introduced another challenge. Removing a same-name browser tool is asynchronous, so Forklight aborts the previous registration, polls the actual tool surface with a bounded timeout, and only then registers a replacement. The browser activity timeline also records real WebMCP calls only, keeping deterministic QA actions separate.

Finally, I treated generated code as untrusted until tested. I removed unrelated app-builder infrastructure, kept the application free of database, auth, account, and external LLM dependencies, and separated mocked unit evidence from real browser behavior and public deployment evidence.

### What I learned

I learned that human-in-the-loop design becomes much clearer when human authority changes capability rather than merely confirming a hidden action. I also learned to model verification as a versioned proof: any mutation must invalidate metrics, validation, approval, and merge eligibility.

WebMCP made it possible to express that model directly in the browser document. The agent sees tools that correspond to the application's current state, while the human sees the consequences and owns the boundaries. Forklight gives agents freedom inside branches while humans define the boundaries and control the commit.

## Built with

- WebMCP
- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Zustand
- Vitest
- Tailwind CSS
- Cloudflare Workers
- OpenAI Codex
- OpenAI / ChatGPT Sites

## Try it out

<https://forklight.kimth06230724.chatgpt.site/>

## Public code repository

<https://github.com/MirLunaDEV/forklight>

## Testing instructions

1. Open the live URL in a WebMCP-capable browser. Confirm MAIN rev 1, HUMAN POLICY draft, nine tools, and no merge tool.
2. Before locking policy, ask the agent to create a branch. Expect `POLICY_NOT_LOCKED` and unchanged MAIN.
3. Click **Lock policy**.
4. Ask the agent to create route-a, route-b, and route-c using the exact operations in `docs/JUDGE_TESTING.md`; simulate, validate, and compare them.
5. Confirm A fails distance, B alone is verified, and C fails protected equipment.
6. Click **Approve for Merge** on B. Confirm `merge_verified_branch` appears.
7. Ask the agent to merge B. Confirm MAIN rev 2, B merged, A/C stale, and the merge tool removed.

No credentials or paid API are required. Full copy-paste instructions are in `docs/JUDGE_TESTING.md`.

## Additional info

**Submitter Type:** USER MUST CONFIRM: Individual / Team / Organization

**Country:** USER MUST CONFIRM country of residence

**Organization:** N/A unless user specifies otherwise

**App Status:** New

**Existing-project explanation:** N/A

**Agents / clients tested:**

- OpenAI Codex in-app browser with page-defined WebMCP tools
- Google Chrome with WebMCP enabled (Model Context and tool-surface verification)

**AI tools leveraged:**

- ChatGPT — architecture, product reasoning, review, and submission planning
- OpenAI Codex — integration, refactoring, tests, browser verification, deployment, and submission preparation
- Grok 4.6 — implementation and prototype engineering
- Manus — early visual and product prototype

**Learning level:** Significant

**Career AI value:** Yes

Yes. I learned how to design agent-facing tools, separate human and agent authority, use AI coding tools as engineering collaborators, and validate an AI-assisted product with deterministic tests and real browser behavior rather than trusting generated code alone.

## Video

USER ACTION REQUIRED — public YouTube video under 3 minutes with audio.
