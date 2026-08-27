import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../state/appStore";
import {
  MERGE_TOOL_NAME,
  abortMergeCapability,
  getMergeCapabilityState,
  isModelContextAvailable,
  syncMergeCapability,
} from "../webmcp/capabilityManager";
import {
  STATIC_TOOL_NAMES,
  registerStaticTools,
  unregisterStaticTools,
} from "../webmcp/registerTools";
import { runQaAction, runTool } from "../webmcp/toolWrapper";

type StoredTool = {
  name: string;
  title?: string;
  description: string;
  annotations?: { readOnlyHint?: boolean };
  execute: (
    input: Record<string, unknown>,
    options?: { signal: AbortSignal },
  ) => Promise<Record<string, unknown>>;
};

type MockOptions = {
  removalDelayMs?: number;
  keepOnAbortNames?: readonly string[];
};

function installMockModelContext(options: MockOptions = {}) {
  const tools = new Map<string, StoredTool>();
  const attempts: string[] = [];
  const kept = new Set(options.keepOnAbortNames ?? []);
  const modelContext = {
    async registerTool(
      tool: StoredTool,
      registerOptions?: { signal?: AbortSignal },
    ) {
      attempts.push(tool.name);
      if (registerOptions?.signal?.aborted) throw new Error("aborted");
      if (tools.has(tool.name)) {
        throw new Error(`duplicate tool registration: ${tool.name}`);
      }
      tools.set(tool.name, tool);
      registerOptions?.signal?.addEventListener("abort", () => {
        if (kept.has(tool.name)) return;
        const remove = () => {
          if (tools.get(tool.name) === tool) tools.delete(tool.name);
        };
        if (options.removalDelayMs) {
          setTimeout(remove, options.removalDelayMs);
        } else {
          remove();
        }
      });
    },
    async getTools() {
      return [...tools.values()].map((tool) => ({
        name: tool.name,
        title: tool.title,
        description: tool.description,
        annotations: tool.annotations,
      }));
    },
  };
  Object.defineProperty(globalThis, "document", {
    value: { modelContext },
    configurable: true,
  });
  return { tools, attempts, modelContext };
}

async function createAndApproveLockedB() {
  const demo = useAppStore.getState().runLockedDemo();
  expect(demo.ok).toBe(true);
  if (!demo.ok) throw new Error("locked demo did not initialize");
  const branchId = demo.data.created[1];
  expect(useAppStore.getState().approveBranch(branchId).ok).toBe(true);
  await syncMergeCapability();
  return branchId;
}

describe("WebMCP registration", () => {
  beforeEach(async () => {
    Object.defineProperty(globalThis, "document", {
      value: {},
      configurable: true,
    });
    abortMergeCapability();
    unregisterStaticTools();
    useAppStore.getState().resetSession();
    await syncMergeCapability();
  });

  afterEach(async () => {
    abortMergeCapability();
    unregisterStaticTools();
    Object.defineProperty(globalThis, "document", {
      value: {},
      configurable: true,
    });
    await syncMergeCapability();
  });

  it("keeps manual state usable when document.modelContext is unavailable", async () => {
    expect(isModelContextAvailable()).toBe(false);
    expect(await registerStaticTools()).toBe(false);
    const created = useAppStore.getState().createBranch("manual-future");
    expect(created.ok).toBe(true);
  });

  it("registers exactly nine static tools and no merge tool at boot", async () => {
    const mock = installMockModelContext();
    expect(await registerStaticTools()).toBe(true);
    expect([...mock.tools.keys()].sort()).toEqual([...STATIC_TOOL_NAMES].sort());
    expect(mock.tools).toHaveLength(9);
    expect(mock.tools.has(MERGE_TOOL_NAME)).toBe(false);
  });

  it("uses the exact titles and marks only the four read tools read-only", async () => {
    const mock = installMockModelContext();
    await registerStaticTools();
    const expectedTitles: Record<string, string> = {
      inspect_world: "Inspect world",
      inspect_constraints: "Inspect constraints",
      inspect_branch: "Inspect future",
      compare_branches: "Compare futures",
      create_branch: "Create future",
      move_entity: "Move entity in future",
      modify_route: "Modify route in future",
      run_simulation: "Simulate future",
      validate_branch: "Validate future",
    };
    for (const [name, title] of Object.entries(expectedTitles)) {
      expect(mock.tools.get(name)?.title).toBe(title);
    }
    expect(
      [...mock.tools.values()]
        .filter((tool) => tool.annotations?.readOnlyHint)
        .map((tool) => tool.name)
        .sort(),
    ).toEqual(
      [
        "inspect_world",
        "inspect_constraints",
        "inspect_branch",
        "compare_branches",
      ].sort(),
    );
  });

  it("returns structured success and records only real tool calls in timeline", async () => {
    const mock = installMockModelContext();
    await registerStaticTools();
    const result = await mock.tools.get("inspect_world")!.execute({});
    expect(result).toMatchObject({ ok: true, revision: 1 });
    expect(result.entities).toHaveLength(10);
    expect(typeof result).toBe("object");
    const timeline = useAppStore.getState().timeline;
    expect(timeline.map((event) => event.status)).toEqual(["start", "success"]);
    expect(timeline.every((event) => event.tool === "inspect_world")).toBe(true);
  });

  it("returns a structured error and never mutates MAIN for invalid input", async () => {
    const mock = installMockModelContext();
    await registerStaticTools();
    const before = structuredClone(useAppStore.getState().main);
    const result = await mock.tools.get("move_entity")!.execute({
      branchId: "missing",
      entityId: "barrier-north",
      position: { x: 11, z: 11.3 },
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: expect.any(String), message: expect.any(String) },
    });
    expect(useAppStore.getState().main).toEqual(before);
  });

  it("compacts thrown exceptions into structured errors without a stack", async () => {
    const result = await runTool("throwing_tool", "throw", () => {
      throw new Error("first line\nsecond line");
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "TOOL_EXCEPTION", message: "first line second line" },
    });
    expect(JSON.stringify(result)).not.toContain("stack");
  });

  it("keeps QA actions out of the real WebMCP timeline", () => {
    runQaAction("qa_demo", "QA only", () => ({ ok: true }));
    expect(useAppStore.getState().timeline).toEqual([]);
    expect(useAppStore.getState().qaLog.map((event) => event.status)).toEqual([
      "start",
      "success",
    ]);
  });

  it("adds merge only after human approval and removes it after revocation", async () => {
    const mock = installMockModelContext({ removalDelayMs: 10 });
    await registerStaticTools();
    expect(getMergeCapabilityState().registeredForBranchId).toBeNull();
    const branchId = await createAndApproveLockedB();
    expect(mock.tools.get(MERGE_TOOL_NAME)?.title).toBe(
      "Merge approved future",
    );
    expect(getMergeCapabilityState().registeredForBranchId).toBe(branchId);
    expect(useAppStore.getState().capabilityBanner).toBe(true);

    expect(useAppStore.getState().revokeApproval().ok).toBe(true);
    await syncMergeCapability();
    expect(mock.tools.has(MERGE_TOOL_NAME)).toBe(false);
    expect(useAppStore.getState().capabilityBanner).toBe(false);
  });

  it("invalidates approval and removes merge after an approved branch mutates", async () => {
    const mock = installMockModelContext();
    await registerStaticTools();
    const branchId = await createAndApproveLockedB();
    expect(mock.tools.has(MERGE_TOOL_NAME)).toBe(true);

    const moved = useAppStore.getState().moveEntity({
      branchId,
      entityId: "barrier-north",
      position: { x: 12, z: 11.3 },
    });
    expect(moved.ok).toBe(true);
    await syncMergeCapability();
    expect(useAppStore.getState().approval.branchId).toBeNull();
    expect(mock.tools.has(MERGE_TOOL_NAME)).toBe(false);
  });

  it("merges approved B, increments MAIN, stales peers, and removes merge", async () => {
    const mock = installMockModelContext();
    await registerStaticTools();
    const branchId = await createAndApproveLockedB();
    const result = await mock.tools.get(MERGE_TOOL_NAME)!.execute({ branchId });
    expect(result).toEqual({
      ok: true,
      revision: 2,
      mergedBranchId: branchId,
      status: "merged",
    });
    await syncMergeCapability();
    const state = useAppStore.getState();
    expect(state.main.revision).toBe(2);
    expect(state.branches.find((branch) => branch.id === branchId)?.status).toBe(
      "merged",
    );
    expect(
      state.branches
        .filter((branch) => branch.id !== branchId)
        .map((branch) => branch.status),
    ).toEqual(["stale", "stale"]);
    expect(mock.tools.has(MERGE_TOOL_NAME)).toBe(false);
  });

  it("waits for delayed static removal before re-registering without duplicates", async () => {
    const mock = installMockModelContext({ removalDelayMs: 15 });
    await registerStaticTools();
    unregisterStaticTools();
    expect(await registerStaticTools({ timeoutMs: 100, pollMs: 2 })).toBe(true);
    expect(mock.tools).toHaveLength(9);
    expect(mock.attempts).toHaveLength(18);
  });

  it("fails explicitly when static tools do not disappear before timeout", async () => {
    const mock = installMockModelContext({
      keepOnAbortNames: STATIC_TOOL_NAMES,
    });
    await registerStaticTools();
    unregisterStaticTools();
    await expect(
      registerStaticTools({ timeoutMs: 20, pollMs: 2 }),
    ).rejects.toMatchObject({ code: "WEBMCP_TOOL_REMOVAL_TIMEOUT" });
    expect(mock.attempts).toHaveLength(9);
  });

  it("fails explicitly instead of duplicating a merge tool that did not disappear", async () => {
    const mock = installMockModelContext({
      keepOnAbortNames: [MERGE_TOOL_NAME],
    });
    await registerStaticTools();
    await createAndApproveLockedB();
    abortMergeCapability();
    await expect(
      syncMergeCapability({ timeoutMs: 20, pollMs: 2 }),
    ).rejects.toMatchObject({ code: "WEBMCP_TOOL_REMOVAL_TIMEOUT" });
    expect(
      mock.attempts.filter((name) => name === MERGE_TOOL_NAME),
    ).toHaveLength(1);
  });
});
