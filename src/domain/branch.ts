import type { Branch, BranchStatus, WorldState } from "./world";

export function isTerminalStatus(status: BranchStatus): boolean {
  return status === "stale" || status === "merged";
}

export function isSimulationFresh(branch: Branch): boolean {
  return (
    branch.simulatedMutationVersion === branch.mutationVersion &&
    branch.metrics !== null
  );
}

export function isValidationFresh(branch: Branch): boolean {
  return (
    branch.validatedMutationVersion === branch.mutationVersion &&
    branch.validationResult !== null
  );
}

export function cloneWorld(world: WorldState): WorldState {
  return structuredClone(world);
}

export function serializeWorld(world: WorldState): string {
  return JSON.stringify(world);
}

export function makeBranch(
  id: string,
  name: string,
  main: WorldState,
): Branch {
  return {
    id,
    name,
    baseRevision: main.revision,
    worldState: cloneWorld(main),
    changes: [],
    mutationVersion: 0,
    simulatedMutationVersion: null,
    validatedMutationVersion: null,
    metrics: null,
    validationResult: null,
    status: "draft",
  };
}

export function invalidateBranchAfterMutation(branch: Branch): void {
  branch.mutationVersion += 1;
  branch.metrics = null;
  branch.validationResult = null;
  branch.simulatedMutationVersion = null;
  branch.validatedMutationVersion = null;
  if (branch.status !== "stale" && branch.status !== "merged") {
    branch.status = "draft";
  }
}
