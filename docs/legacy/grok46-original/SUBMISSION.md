# Forklight Submission Draft

## Name

Forklight

## Tagline

**Try the future before you merge it.**

## One-line description

Forklight lets an AI agent branch a live web application into isolated futures, test each future against deterministic constraints, and merge only a future that a human explicitly approves.

## Inspiration

Agents can increasingly take real actions inside software, but experimentation is risky when every attempt touches the live state. Code has branches. Stateful web applications usually do not.

Forklight asks: **what if an agent could try multiple futures before it changes yours?**

## What it does

Forklight is a 3D logistics sandbox powered by WebMCP.

The live page exposes structured tools that let an agent:

- inspect the current warehouse;
- create isolated branches;
- move objects and modify routes inside a branch;
- run a deterministic simulation;
- validate each future against hard constraints;
- compare futures.

The agent cannot merge any candidate at first.

After the human visually compares the results and approves a verified branch, the page dynamically exposes a new WebMCP capability:

`merge_verified_branch`

The agent can then merge exactly that approved future into MAIN.

## Why WebMCP

The core experience depends on the agent and the human sharing the same live page state.

WebMCP is not used as a button-shaped API layer. It is part of the product's permission model:

**human approval changes the tool surface the page exposes to the agent.**

Without that state-aware tool lifecycle, Forklight's central interaction disappears.

## Human-agent collaboration

The agent is good at:
- exploring multiple alternatives;
- running repeated simulations;
- comparing metrics;
- checking hard constraints.

The human is good at:
- setting the goal;
- seeing the 3D consequences;
- judging trade-offs that are not captured by metrics;
- deciding which verified future deserves merge capability.

Neither side is reduced to a spectator.

## Technical implementation

- React + TypeScript + React Three Fiber
- JSON-serializable `WorldState` as source of truth
- isolated branches via `structuredClone`
- deterministic discrete simulator
- four hard validation constraints
- WebMCP tools registered from the live page
- `readOnlyHint` on inspection tools
- dynamic `merge_verified_branch` registration with `AbortSignal`
- real WebMCP execution timeline
- no backend or LLM API key required by the app

## What makes it different

Most agent integrations ask whether an agent can operate an app.

Forklight asks a different question:

**How should an app let an agent experiment safely before it grants the ability to change the live world?**

The answer is branch, verify, human-approve, then expose capability.

## Built during the challenge

The submission build is a new, tightly scoped Forklight implementation created for the WebMCP Challenge.

## Links

- Live app: TODO
- Source: TODO
- Demo video: TODO
