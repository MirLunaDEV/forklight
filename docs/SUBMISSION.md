# Forklight Submission Draft v1.2

## Forklight

**Try the future before you merge it.**

Forklight is a WebMCP-powered 3D logistics sandbox where an AI agent can create isolated futures of a live application, experiment on them, and validate each future against deterministic constraints before anything touches MAIN.

The merge capability does not exist at first.

After the human compares the futures and explicitly approves a freshly verified branch, the live page dynamically exposes `merge_verified_branch` to the agent. The agent can then merge exactly that approved future.

### Why WebMCP

WebMCP is part of Forklight's capability model, not a wrapper around buttons.

The agent and human share the same live page state, and a human decision changes the page's exposed tool surface.

### Collaboration

Agent:
- explores alternatives
- runs simulations
- compares metrics
- checks hard constraints

Human:
- sees the 3D consequences
- judges trade-offs
- grants merge capability

**The agent explored. The simulator verified. The human decided.**
