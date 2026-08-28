import { useAppStore } from "../state/appStore";
import {
  abortMergeCapability,
  isModelContextAvailable,
  syncMergeCapability,
} from "./capabilityManager";
import { TOOL_SCHEMAS } from "./schemas";
import {
  waitUntilToolsGone,
  type ToolRemovalWaitOptions,
} from "./toolLifecycle";
import { runTool } from "./toolWrapper";

let staticController: AbortController | null = null;
let staticSyncChain: Promise<boolean> = Promise.resolve(false);

function argString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function staticTools() {
  return [
    {
      name: "inspect_world",
      title: "Inspect world",
      description:
        "Read MAIN only: revision, entities, routes (with length and barrier blockers), baseline metrics, and a compact branch list. Does not mutate state.",
      inputSchema: TOOL_SCHEMAS.inspect_world,
      annotations: { readOnlyHint: true },
      execute: async () =>
        runTool("inspect_world", "inspect MAIN", () =>
          useAppStore.getState().inspectWorld(),
        ),
    },
    {
      name: "inspect_constraints",
      title: "Inspect constraints",
      description:
        "Read the human-defined goal policy, its lock status, and the four hard constraints a future must pass before it can be verified. Does not mutate state; the agent cannot change or lock policy.",
      inputSchema: TOOL_SCHEMAS.inspect_constraints,
      annotations: { readOnlyHint: true },
      execute: async () =>
        runTool("inspect_constraints", "inspect human policy", () => {
          const state = useAppStore.getState();
          const policy = { ...state.policy };
          return {
            policy,
            explorationEnabled: state.policy.status === "locked",
            protectedEquipment: state.main.entities
              .filter((entity) => entity.protected)
              .map((entity) => ({ id: entity.id, name: entity.name })),
            readable: [
              `Throughput must improve by at least ${formatPercent(policy.minThroughputImprovement)} versus MAIN baseline.`,
              `Average planned travel distance may increase by at most ${formatPercent(policy.maxDistanceIncrease)}.`,
              `Protected-equipment moves may not exceed ${policy.maxProtectedMoved}.`,
              `Congestion may not exceed ${formatPercent(policy.maxCongestionRatio)} of the MAIN baseline.`,
            ],
          };
        }),
    },
    {
      name: "inspect_branch",
      title: "Inspect future",
      description:
        "Read one candidate future: changes, metrics, validation, and status. Pass branchId from create_branch or inspect_world. Does not mutate state.",
      inputSchema: TOOL_SCHEMAS.inspect_branch,
      annotations: { readOnlyHint: true },
      execute: async (input: Record<string, unknown>) => {
        const branchId = argString((input as { branchId?: unknown }).branchId);
        return runTool("inspect_branch", `inspect ${branchId}`, () => {
          const result = useAppStore.getState().inspectBranch(branchId);
          if (!result.ok) return result;
          return result.data;
        });
      },
    },
    {
      name: "compare_branches",
      title: "Compare futures",
      description:
        "Compact comparison of every candidate versus MAIN baseline. Does not mutate state. Stop here and wait for the human to approve a verified future before any merge.",
      inputSchema: TOOL_SCHEMAS.compare_branches,
      annotations: { readOnlyHint: true },
      execute: async () =>
        runTool("compare_branches", "compare futures", () => {
          const result = useAppStore.getState().compareBranches();
          if (!result.ok) return result;
          return result.data;
        }),
    },
    {
      name: "create_branch",
      title: "Create future",
      description:
        "After the human locks the goal policy, deep-clone MAIN into an isolated candidate. The agent supplies a display name; the page assigns branchId. Experiment tools cannot mutate MAIN.",
      inputSchema: TOOL_SCHEMAS.create_branch,
      annotations: { readOnlyHint: false },
      execute: async (input: Record<string, unknown>) => {
        const name = argString((input as { name?: unknown }).name);
        return runTool("create_branch", `create ${name}`, () => {
          const result = useAppStore.getState().createBranch(name);
          if (!result.ok) return result;
          const branch = result.data.branch;
          return {
            id: branch.id,
            name: branch.name,
            status: branch.status,
            baseRevision: branch.baseRevision,
          };
        });
      },
    },
    {
      name: "move_entity",
      title: "Move entity in future",
      description:
        "After the human locks the goal policy, move one entity inside a candidate branch. MAIN cannot be mutated. Out-of-bounds positions are rejected, not clamped. Moving a protected entity records a permanent protected violation even if later reverted.",
      inputSchema: TOOL_SCHEMAS.move_entity,
      annotations: { readOnlyHint: false },
      execute: async (input: Record<string, unknown>) => {
        const record = input as {
          branchId?: unknown;
          entityId?: unknown;
          position?: { x?: unknown; z?: unknown };
        };
        const branchId = argString(record.branchId);
        const entityId = argString(record.entityId);
        const x = Number(record.position?.x);
        const z = Number(record.position?.z);
        return runTool("move_entity", `${entityId} → (${x},${z})`, () => {
          const result = useAppStore.getState().moveEntity({
            branchId,
            entityId,
            position: { x, z },
          });
          if (!result.ok) return result;
          return {
            branchId: result.data.branch.id,
            mutationVersion: result.data.branch.mutationVersion,
            status: result.data.branch.status,
            summary: result.data.branch.changes.at(-1)?.summary,
          };
        });
      },
    },
    {
      name: "modify_route",
      title: "Modify route in future",
      description:
        "After the human locks the goal policy, enable/disable a route or replace its waypoints inside a candidate. Speed, capacity, source, and target cannot be changed. MAIN cannot be mutated. Requires enabled and/or waypoints.",
      inputSchema: TOOL_SCHEMAS.modify_route,
      annotations: { readOnlyHint: false },
      execute: async (input: Record<string, unknown>) => {
        const record = input as {
          branchId?: unknown;
          routeId?: unknown;
          enabled?: unknown;
          waypoints?: unknown;
        };
        const branchId = argString(record.branchId);
        const routeId = argString(record.routeId);
        const payload: {
          branchId: string;
          routeId: string;
          enabled?: boolean;
          waypoints?: { x: number; z: number }[];
        } = { branchId, routeId };
        if (typeof record.enabled === "boolean")
          payload.enabled = record.enabled;
        if (Array.isArray(record.waypoints)) {
          payload.waypoints = record.waypoints.map((point) => {
            const item = point as { x?: unknown; z?: unknown };
            return { x: Number(item.x), z: Number(item.z) };
          });
        }
        return runTool("modify_route", `${routeId}`, () => {
          const result = useAppStore.getState().modifyRoute(payload);
          if (!result.ok) return result;
          return {
            branchId: result.data.branch.id,
            mutationVersion: result.data.branch.mutationVersion,
            status: result.data.branch.status,
            summary: result.data.branch.changes.at(-1)?.summary,
          };
        });
      },
    },
    {
      name: "run_simulation",
      title: "Simulate future",
      description:
        "After the human locks the goal policy, run the deterministic discrete-flow simulator on a candidate and store metrics. Does not change MAIN. Does not grant merge capability.",
      inputSchema: TOOL_SCHEMAS.run_simulation,
      annotations: { readOnlyHint: false },
      execute: async (input: Record<string, unknown>) => {
        const branchId = argString((input as { branchId?: unknown }).branchId);
        return runTool("run_simulation", `simulate ${branchId}`, () => {
          const result = useAppStore.getState().runSimulation(branchId);
          if (!result.ok) return result;
          return {
            branchId: result.data.branch.id,
            status: result.data.branch.status,
            metrics: result.data.branch.metrics,
          };
        });
      },
    },
    {
      name: "validate_branch",
      title: "Validate future",
      description:
        "After the human locks the goal policy, check a candidate against its four hard constraints. Re-runs simulation if metrics are stale. Verified status is required before a human can approve merge capability. The agent cannot change policy, approve, or merge from this tool.",
      inputSchema: TOOL_SCHEMAS.validate_branch,
      annotations: { readOnlyHint: false },
      execute: async (input: Record<string, unknown>) => {
        const branchId = argString((input as { branchId?: unknown }).branchId);
        return runTool("validate_branch", `validate ${branchId}`, () => {
          const result = useAppStore.getState().validateBranch(branchId);
          if (!result.ok) return result;
          const branch = result.data.branch;
          return {
            branchId: branch.id,
            status: branch.status,
            allPassed: branch.validationResult?.allPassed ?? false,
            checks: branch.validationResult?.checks ?? [],
            metrics: branch.metrics,
          };
        });
      },
    },
  ];
}

export const STATIC_TOOL_NAMES = staticTools().map((tool) => tool.name);

async function registerStaticToolsInner(
  options: ToolRemovalWaitOptions,
): Promise<boolean> {
  if (!isModelContextAvailable() || !document.modelContext) {
    useAppStore.getState().setWebmcpAvailable(false);
    return false;
  }
  const modelContext = document.modelContext;
  if (staticController) {
    if (!staticController.signal.aborted) {
      staticController.abort("reregister-static");
    }
    await waitUntilToolsGone(modelContext, STATIC_TOOL_NAMES, options);
  }

  const controller = new AbortController();
  staticController = controller;
  try {
    for (const tool of staticTools()) {
      if (controller.signal.aborted) return false;
      await modelContext.registerTool(tool, { signal: controller.signal });
    }
    if (controller.signal.aborted) return false;
    useAppStore.getState().setWebmcpAvailable(true);
    return true;
  } catch (caught) {
    useAppStore.getState().setWebmcpAvailable(false);
    if (controller.signal.aborted) return false;
    controller.abort("static-registration-failed");
    throw caught;
  }
}

export function registerStaticTools(
  options: ToolRemovalWaitOptions = {},
): Promise<boolean> {
  const next = staticSyncChain.then(
    () => registerStaticToolsInner(options),
    () => registerStaticToolsInner(options),
  );
  staticSyncChain = next;
  return next;
}

export function unregisterStaticTools(): void {
  if (staticController && !staticController.signal.aborted) {
    staticController.abort("teardown-static");
  }
  useAppStore.getState().setWebmcpAvailable(false);
}

export function bootstrapWebmcp(): () => void {
  if (!isModelContextAvailable()) {
    useAppStore.getState().setWebmcpAvailable(false);
    return () => {};
  }
  let active = true;
  void registerStaticTools()
    .then((registered) => {
      if (active && registered) return syncMergeCapability();
    })
    .catch((caught) => {
      if (!active) return;
      const message =
        caught instanceof Error ? caught.message : "Unknown registration error";
      console.error(`[WebMCP] static registration failed: ${message}`);
      useAppStore.getState().setWebmcpAvailable(false);
    });
  return () => {
    active = false;
    unregisterStaticTools();
    abortMergeCapability();
  };
}
