# Forklight

> **Before an agent changes your live application, let it try several futures first.**

Forklight is a static React/Vite 3D logistics sandbox for the OpenAI WebMCP Challenge. A human first locks the goal policy, an agent experiments in isolated futures, the deterministic validator checks those human-defined rules, and only a verified future approved through the page UI can expose the dynamic merge capability.

## Human policy lifecycle

```text
Human defines and locks acceptable boundaries
→ Agent explores isolated futures
→ Simulator measures objective consequences
→ Validator checks the human policy
→ Human approves one verified future for merge
→ WebMCP exposes merge_verified_branch
→ Agent merges only after permission
```

The challenge policy keeps the validated golden limits: throughput `≥ +20%`, distance increase `≤ +10%`, protected moves `= 0`, and congestion `≤ MAIN baseline`. Policy locking and approval are human UI actions; WebMCP can inspect the policy but cannot change or lock it.

> The human defines what must never be violated. The agent explores what could work. The simulator verifies what actually works. The human decides what becomes real.

Forklight gives agents freedom inside branches while humans define the boundaries and control the commit.

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

Open `http://127.0.0.1:8080/`, review HUMAN POLICY, and select **Lock policy** before exploration. Deterministic rehearsal controls are intentionally hidden from the submission view; use `http://127.0.0.1:8080/?qa=1` only for manual QA.

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
- [`docs/HUMAN_POLICY_RESULT.md`](docs/HUMAN_POLICY_RESULT.md) — human-policy UX and regression evidence

## Product thesis

**Forklight — Try the future before you merge it.**

Public deployment: <https://forklight.kimth06230724.chatgpt.site>

## License

MIT.
