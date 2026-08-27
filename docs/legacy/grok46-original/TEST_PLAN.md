# Forklight Test Plan

## Priority 0 — Day 1

- branch creation does not mutate MAIN;
- editing A does not mutate B or MAIN;
- view switch renders selected branch state.

## Priority 0 — Day 2

- simulator is deterministic;
- north/south blockers work;
- validator checks all four constraints;
- golden Future A fails distance;
- golden Future B passes all four;
- golden Future C fails protected;
- B is the only verified future.

## Priority 0 — Day 4

- merge absent at boot;
- approve verified current B → merge tool register request;
- mutate approved B → approval revoked and merge tool removed;
- merge current approved B → MAIN revision increments;
- A/C become stale;
- merge tool disappears.

## Regression matrix

| Scenario | Expected |
|---|---|
| move barrier in branch | MAIN unchanged |
| move protected then move back | protected check still fails |
| validate after mutation | simulator reruns |
| approve failed branch | rejected |
| approve verified stale branch | rejected |
| merge unapproved verified branch | rejected |
| merge stale approved branch | rejected + approval cleared |
| WebMCP missing | manual app works |
| tool invalid branch ID | compact error, no mutation |
| tool invalid position | compact error, no mutation |

## Golden fixture assertion

Golden A/B/C tests are product tests, not loose unit tests.
If they fail, Day 2 is not done.
