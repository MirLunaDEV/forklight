# Forklight Demo Script v1.2

Target 2:20–2:40.

## 0:00–0:15

> Agents can increasingly change live software. But experimentation is risky when every attempt touches the state we actually care about.

## 0:15–0:30

> Forklight lets an agent try isolated futures before it changes yours.

## 0:30–1:30

Real ChatGPT site tools:

```text
inspect
create A/B/C
mutate
simulate
validate
compare
```

No QA panel visible.

## 1:30–1:50

```text
A — FAIL: DISTANCE
B — VERIFIED
C — FAIL: PROTECTED
```

> The agent explores. The deterministic validator decides whether hard constraints pass.

## 1:50–2:10

Human clicks **Approve Future B**.

Show:

**CAPABILITY UNLOCKED**

ChatGPT discovers `Merge approved future` and invokes it.

MAIN becomes B.

## 2:10–2:30

> The agent explored. The simulator verified. The human decided. WebMCP changed what the agent was actually allowed to do.

End:

**Forklight — Try the future before you merge it.**

Rules:

- no fake tool calls
- no fake timeline
- no QA panel in primary recording
- backup successful real recording is allowed
