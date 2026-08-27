import { create } from "zustand";
import {
  approveBranch as commandApprove,
  applyLockedFutureA,
  applyLockedFutureB,
  applyLockedFutureC,
  bootSnapshot,
  compareBranches as commandCompare,
  createBranch as commandCreate,
  ensureNamedBranch,
  inspectBranchPayload,
  inspectWorldPayload,
  mergeVerifiedBranch as commandMerge,
  modifyRoute as commandModifyRoute,
  moveEntity as commandMoveEntity,
  revokeApproval as commandRevoke,
  runSimulation as commandSimulate,
  type AppSnapshot,
  validateBranch as commandValidate,
} from "../domain/commands";
import type {
  Branch,
  CommandResult,
  TimelineEvent,
  WorldState,
} from "../domain/world";

export type ViewId = "main" | string;

export interface AppStore extends AppSnapshot {
  selectedView: ViewId;
  timeline: TimelineEvent[];
  qaLog: TimelineEvent[];
  webmcpAvailable: boolean;
  capabilityBanner: boolean;
  timelineSeq: number;
  switchView: (view: ViewId) => void;
  setWebmcpAvailable: (value: boolean) => void;
  setCapabilityBanner: (value: boolean) => void;
  createBranch: (name: string) => CommandResult<{ branch: Branch }>;
  moveEntity: (input: {
    branchId: string;
    entityId: string;
    position: { x: number; z: number };
  }) => CommandResult<{ branch: Branch; changeId: string }>;
  modifyRoute: (input: {
    branchId: string;
    routeId: string;
    enabled?: boolean;
    waypoints?: { x: number; z: number }[];
  }) => CommandResult<{ branch: Branch; changeId: string }>;
  runSimulation: (branchId: string) => CommandResult<{ branch: Branch }>;
  validateBranch: (branchId: string) => CommandResult<{ branch: Branch }>;
  compareBranches: () => ReturnType<typeof commandCompare>;
  approveBranch: (branchId: string) => CommandResult<{ branch: Branch }>;
  revokeApproval: () => CommandResult<{ revoked: boolean }>;
  mergeVerifiedBranch: (
    branchId: string,
  ) => CommandResult<{ main: WorldState; branch: Branch }>;
  inspectWorld: () => ReturnType<typeof inspectWorldPayload>;
  inspectBranch: (branchId: string) => ReturnType<typeof inspectBranchPayload>;
  recordTimeline: (
    event: Omit<TimelineEvent, "id" | "ts"> & { ts?: number },
  ) => void;
  applyFuturePreset: (
    which: "a" | "b" | "c",
    branchId: string,
  ) => CommandResult<{ branch: Branch; changeId: string }>;
  runLockedDemo: () => CommandResult<{ created: string[] }>;
  resetSession: () => void;
  selectedWorld: () => WorldState;
}

function cloneSnap(state: AppSnapshot): AppSnapshot {
  return {
    main: structuredClone(state.main),
    branches: structuredClone(state.branches),
    nextBranchSeq: state.nextBranchSeq,
    approval: { ...state.approval },
    mergeRegisteredFor: state.mergeRegisteredFor,
  };
}

function requestCapabilitySync() {
  void import("../webmcp/capabilityManager")
    .then((mod) => mod.syncMergeCapability())
    .catch((caught: unknown) => {
      const message =
        caught instanceof Error ? caught.message : "Unknown registration error";
      console.error(`[WebMCP] capability sync failed: ${message}`);
      useAppStore.getState().setCapabilityBanner(false);
    });
}

function commit(set: (partial: Partial<AppStore>) => void, snap: AppSnapshot) {
  set({
    main: snap.main,
    branches: snap.branches,
    nextBranchSeq: snap.nextBranchSeq,
    approval: snap.approval,
    mergeRegisteredFor: snap.mergeRegisteredFor,
  });
  requestCapabilitySync();
}

const booted = bootSnapshot();

export const useAppStore = create<AppStore>((set, get) => ({
  ...booted,
  selectedView: "main",
  timeline: [],
  qaLog: [],
  webmcpAvailable: false,
  capabilityBanner: false,
  timelineSeq: 1,
  switchView: (view) => set({ selectedView: view }),
  setWebmcpAvailable: (value) => set({ webmcpAvailable: value }),
  setCapabilityBanner: (value) => set({ capabilityBanner: value }),
  createBranch: (name) => {
    const snap = cloneSnap(get());
    const result = commandCreate(snap, name);
    if (result.ok) commit(set, snap);
    return result;
  },
  moveEntity: (input) => {
    const snap = cloneSnap(get());
    const result = commandMoveEntity(snap, input);
    if (result.ok) {
      commit(set, snap);
      if (snap.mergeRegisteredFor === null) set({ capabilityBanner: false });
    }
    return result;
  },
  modifyRoute: (input) => {
    const snap = cloneSnap(get());
    const result = commandModifyRoute(snap, input);
    if (result.ok) {
      commit(set, snap);
      if (snap.mergeRegisteredFor === null) set({ capabilityBanner: false });
    }
    return result;
  },
  runSimulation: (branchId) => {
    const snap = cloneSnap(get());
    const result = commandSimulate(snap, branchId);
    if (result.ok) commit(set, snap);
    return result;
  },
  validateBranch: (branchId) => {
    const snap = cloneSnap(get());
    const result = commandValidate(snap, branchId);
    if (result.ok) commit(set, snap);
    return result;
  },
  compareBranches: () => commandCompare(get()),
  approveBranch: (branchId) => {
    const snap = cloneSnap(get());
    const result = commandApprove(snap, branchId);
    if (result.ok) {
      commit(set, snap);
      set({ capabilityBanner: false });
    }
    return result;
  },
  revokeApproval: () => {
    const snap = cloneSnap(get());
    const result = commandRevoke(snap);
    if (result.ok) {
      commit(set, snap);
      set({ capabilityBanner: false });
    }
    return result;
  },
  mergeVerifiedBranch: (branchId) => {
    const snap = cloneSnap(get());
    const result = commandMerge(snap, branchId);
    if (result.ok) {
      commit(set, snap);
      set({ selectedView: "main", capabilityBanner: false });
    }
    return result;
  },
  inspectWorld: () => inspectWorldPayload(get()),
  inspectBranch: (branchId) => inspectBranchPayload(get(), branchId),
  recordTimeline: (event) => {
    const id = `tl-${get().timelineSeq}`;
    set((state) => ({
      timelineSeq: state.timelineSeq + 1,
      timeline:
        event.source === "webmcp"
          ? [
              ...state.timeline,
              {
                id,
                ts: event.ts ?? Date.now(),
                tool: event.tool,
                status: event.status,
                durationMs: event.durationMs,
                summary: event.summary,
                source: event.source,
              },
            ].slice(-80)
          : state.timeline,
      qaLog:
        event.source !== "webmcp"
          ? [
              ...state.qaLog,
              {
                id,
                ts: event.ts ?? Date.now(),
                tool: event.tool,
                status: event.status,
                durationMs: event.durationMs,
                summary: event.summary,
                source: event.source,
              },
            ].slice(-80)
          : state.qaLog,
    }));
  },
  applyFuturePreset: (which, branchId) => {
    const snap = cloneSnap(get());
    const result =
      which === "a"
        ? applyLockedFutureA(snap, branchId)
        : which === "b"
          ? applyLockedFutureB(snap, branchId)
          : applyLockedFutureC(snap, branchId);
    if (result.ok) {
      commit(set, snap);
      if (snap.mergeRegisteredFor === null) set({ capabilityBanner: false });
    }
    return result;
  },
  runLockedDemo: () => {
    const snap = cloneSnap(get());
    const created: string[] = [];
    const names = ["route-a", "route-b", "route-c"] as const;
    const presets = [
      applyLockedFutureA,
      applyLockedFutureB,
      applyLockedFutureC,
    ] as const;
    for (let i = 0; i < names.length; i++) {
      const ensured = ensureNamedBranch(snap, names[i]);
      if (!ensured.ok) return ensured;
      created.push(ensured.data.branch.id);
      const applied = presets[i](snap, ensured.data.branch.id);
      if (!applied.ok) return applied;
      const validated = commandValidate(snap, ensured.data.branch.id);
      if (!validated.ok) return validated;
    }
    commit(set, snap);
    return { ok: true, data: { created } };
  },
  resetSession: () => {
    const next = bootSnapshot();
    set({
      ...next,
      selectedView: "main",
      timeline: [],
      qaLog: [],
      capabilityBanner: false,
      timelineSeq: 1,
    });
    requestCapabilitySync();
  },
  selectedWorld: () => {
    const state = get();
    if (state.selectedView === "main") return state.main;
    const branch = state.branches.find(
      (item) =>
        item.id === state.selectedView || item.name === state.selectedView,
    );
    return branch?.worldState ?? state.main;
  },
}));

export function getSnapshot(): AppSnapshot {
  const { main, branches, nextBranchSeq, approval, mergeRegisteredFor } =
    useAppStore.getState();
  return { main, branches, nextBranchSeq, approval, mergeRegisteredFor };
}
