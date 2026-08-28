import { useAppStore } from "../state/appStore";
import { TOOL_SCHEMAS } from "./schemas";
import {
  waitUntilToolsGone,
  type ToolRemovalWaitOptions,
} from "./toolLifecycle";
import { runTool } from "./toolWrapper";

export const MERGE_TOOL_NAME = "merge_verified_branch";

export type MergeCapabilityState = {
  controller: AbortController | null;
  registeredForBranchId: string | null;
  registrationGeneration: number;
};

let mergeState: MergeCapabilityState = {
  controller: null,
  registeredForBranchId: null,
  registrationGeneration: 0,
};

let syncChain: Promise<void> = Promise.resolve();
let mergeRemovalPending = false;

export function isModelContextAvailable(): boolean {
  return (
    typeof document !== "undefined" &&
    "modelContext" in document &&
    document.modelContext != null
  );
}

export function getMergeCapabilityState(): MergeCapabilityState {
  return { ...mergeState };
}

export function abortMergeCapability(): void {
  if (mergeState.controller) {
    if (!mergeState.controller.signal.aborted) {
      mergeState.controller.abort("merge-capability-revoked");
    }
    mergeRemovalPending = true;
  }
  mergeState = {
    controller: null,
    registeredForBranchId: null,
    registrationGeneration: mergeState.registrationGeneration + 1,
  };
  useAppStore.getState().setCapabilityBanner(false);
}

function shouldExposeMerge(): { branchId: string } | null {
  const state = useAppStore.getState();
  if (state.policy.status !== "locked") return null;
  const branchId = state.mergeRegisteredFor;
  if (!branchId) return null;
  const branch = state.branches.find((item) => item.id === branchId);
  if (!branch) return null;
  if (state.approval.branchId !== branch.id) return null;
  if (branch.status !== "verified") return null;
  if (branch.baseRevision !== state.main.revision) return null;
  if (branch.validatedMutationVersion !== branch.mutationVersion) return null;
  if (branch.validationResult?.allPassed !== true) return null;
  return { branchId: branch.id };
}

async function registerMergeTool(
  branchId: string,
  options: ToolRemovalWaitOptions,
): Promise<void> {
  if (!isModelContextAvailable() || !document.modelContext) return;
  const modelContext = document.modelContext;
  if (
    mergeState.registeredForBranchId === branchId &&
    mergeState.controller &&
    !mergeState.controller.signal.aborted
  ) {
    return;
  }
  if (mergeState.controller) {
    abortMergeCapability();
  }
  if (mergeRemovalPending) {
    await waitUntilToolsGone(modelContext, [MERGE_TOOL_NAME], options);
    mergeRemovalPending = false;
  }
  const controller = new AbortController();
  const generation = mergeState.registrationGeneration + 1;
  mergeState = {
    controller,
    registeredForBranchId: null,
    registrationGeneration: generation,
  };
  try {
    await modelContext.registerTool(
      {
        name: MERGE_TOOL_NAME,
        title: "Merge approved future",
        description:
          "Replace MAIN with the human-approved verified branch. Requires a current verified branch, fresh validation, human approval, and this capability to be registered. Experiment tools cannot mutate MAIN. After a successful merge, MAIN revision increments, other candidates become stale, and this tool is removed.",
        inputSchema: TOOL_SCHEMAS.merge_verified_branch,
        annotations: { readOnlyHint: false },
        execute: async (input) => {
          const id = String((input as { branchId?: unknown }).branchId ?? "");
          return runTool(MERGE_TOOL_NAME, `merge ${id}`, () => {
            const result = useAppStore.getState().mergeVerifiedBranch(id);
            if (!result.ok) return result;
            return {
              revision: result.data.main.revision,
              mergedBranchId: result.data.branch.id,
              status: result.data.branch.status,
            };
          });
        },
      },
      { signal: controller.signal },
    );
    const exposed = shouldExposeMerge();
    if (
      controller.signal.aborted ||
      mergeState.controller !== controller ||
      mergeState.registrationGeneration !== generation ||
      exposed?.branchId !== branchId
    ) {
      if (!controller.signal.aborted) {
        controller.abort("merge-capability-became-stale");
      }
      mergeRemovalPending = true;
      if (mergeState.controller === controller) {
        mergeState = {
          controller: null,
          registeredForBranchId: null,
          registrationGeneration: generation + 1,
        };
      }
      useAppStore.getState().setCapabilityBanner(false);
      return;
    }
    mergeState = {
      controller,
      registeredForBranchId: branchId,
      registrationGeneration: generation,
    };
    useAppStore.getState().setCapabilityBanner(true);
  } catch (caught) {
    if (controller.signal.aborted) return;
    controller.abort("merge-registration-failed");
    mergeRemovalPending = true;
    mergeState = {
      controller: null,
      registeredForBranchId: null,
      registrationGeneration: generation,
    };
    useAppStore.getState().setCapabilityBanner(false);
    throw caught;
  }
}

async function syncInner(options: ToolRemovalWaitOptions): Promise<void> {
  const next = shouldExposeMerge();
  if (!next) {
    if (mergeState.controller) {
      abortMergeCapability();
    }
    if (
      mergeRemovalPending &&
      isModelContextAvailable() &&
      document.modelContext
    ) {
      await waitUntilToolsGone(
        document.modelContext,
        [MERGE_TOOL_NAME],
        options,
      );
      mergeRemovalPending = false;
    }
    return;
  }
  if (!isModelContextAvailable()) return;
  await registerMergeTool(next.branchId, options);
}

export function syncMergeCapability(
  options: ToolRemovalWaitOptions = {},
): Promise<void> {
  syncChain = syncChain.then(
    () => syncInner(options),
    () => syncInner(options),
  );
  return syncChain;
}
