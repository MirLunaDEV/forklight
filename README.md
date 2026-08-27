# Forklight

> **Before an agent changes your live application, let it try several futures first.**

Forklight is a static React/Vite 3D logistics sandbox for the OpenAI WebMCP Challenge. An agent experiments in isolated futures, the deterministic validator checks four hard constraints, and only a future approved through the page UI can expose the dynamic merge capability.

## Source of truth

Read in this order:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md)
3. [`docs/WEBMCP_TOOLS.md`](docs/WEBMCP_TOOLS.md)

## Run locally

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:8080/`. Deterministic rehearsal controls are intentionally hidden from the submission view; use `http://127.0.0.1:8080/?qa=1` only for manual QA.

## Verify and build

```bash
npm run typecheck
npm test
npm run build
```

The production output is the static `dist/` directory. No backend, database, authentication, account, multiplayer, migration, or LLM API key is required.

## Implementation results

- [`docs/AUDIT_RESULT.md`](docs/AUDIT_RESULT.md) — baseline audit
- [`docs/PHASE1_RESULT.md`](docs/PHASE1_RESULT.md) — static cleanroom extraction
- [`docs/PHASE2_RESULT.md`](docs/PHASE2_RESULT.md) — WebMCP contract hardening
- [`docs/LIVE_WEBMCP_RESULT.md`](docs/LIVE_WEBMCP_RESULT.md) — complete live local WebMCP acceptance evidence

## Product thesis

**Forklight — Try the future before you merge it.**

## License

MIT.
