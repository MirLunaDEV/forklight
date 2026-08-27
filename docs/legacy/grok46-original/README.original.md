# Forklight

> **Before an agent changes your live application, let it try several futures first.**

Forklight is a WebMCP-powered 3D logistics sandbox for experimenting with branchable live application state.

An agent can create isolated futures, mutate and simulate them, and validate them against deterministic constraints. A merge capability is exposed only after a human approves a verified future.

## Product thesis

**Try the future before you merge it.**

## Current scope

This repository implements one polished vertical slice for the OpenAI WebMCP Challenge:

- deterministic warehouse fixture;
- isolated state branches;
- WebMCP inspection / experiment tools;
- hard constraint validation;
- human approval;
- dynamically exposed verified merge capability.

See [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) before changing behavior.

## Development

```bash
npm install
npm run dev
npm run test:unit
```

## WebMCP

The app targets the current `document.modelContext` draft API.

When WebMCP is unavailable, the product remains usable through its manual QA controls.

## License

MIT
