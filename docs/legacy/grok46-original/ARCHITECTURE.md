# Forklight Architecture

This document summarizes the implementation boundaries. `MASTER_SPEC.md` remains authoritative.

## Data flow

```text
                       ┌───────────────────┐
                       │      HUMAN UI     │
                       └─────────┬─────────┘
                                 │
                                 ▼
                         shared domain commands
                                 ▲
                                 │
                       ┌─────────┴─────────┐
                       │   WebMCP tools    │
                       └───────────────────┘

                                 │
                                 ▼
┌──────────────┐       ┌───────────────────┐
│ MAIN World   │──────►│ Branch Store      │
└──────┬───────┘ clone └─────────┬─────────┘
       │                          │
       │                          ├────► Simulator
       │                          │         │
       │                          │         ▼
       │                          └────► Validator
       │
       └──────────────────────────────► R3F Scene
```

## Import boundaries

### `domain/`
Pure serializable types, initial fixture, and shared commands.
Must not import React, Three.js, browser WebMCP APIs, or UI components.

### `simulation/`
Pure deterministic calculation.
May import domain types.
Must not import stores, React, Three.js, DOM, WebMCP, Date, or `Math.random`.

### `constraints/`
Pure validation.
May import domain types and metrics.
Must not import UI/WebMCP/Three.js.

### `state/`
Zustand state orchestration.
May invoke pure domain/simulation/validator functions.
Does not contain rendering objects.

### `webmcp/`
Experimental browser integration only.
Wraps shared domain commands.
Owns tool schemas, registration lifecycle, tool execution timeline wrapper, dynamic merge capability.

### `scene/`
Read-only visualization of selected `WorldState`.
May render decorative package motion.
Never supplies simulation metrics.

### `ui/`
Human controls and status panels.
Calls shared commands.
Must not duplicate branch/simulation logic.

## Single command path

Bad:

```text
UI button ──► ui-specific mutation
WebMCP   ──► tool-specific mutation
```

Good:

```text
UI button ──┐
            ├──► commandMoveEntity(...)
WebMCP ─────┘
```

## Failure domains

- WebMCP unavailable → manual QA UI still works
- tool execution error → timeline records error, no partial mutation
- stale branch → merge rejected
- invalid mutation → no state change
- simulation exception → branch remains unverified
- approval invalidated → merge tool removed
