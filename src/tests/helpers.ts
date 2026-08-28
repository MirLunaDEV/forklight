export {
  applyLockedFutureA,
  applyLockedFutureB,
  applyLockedFutureC,
  approveBranch,
  bootSnapshot,
  compareBranches,
  createBranch,
  mergeVerifiedBranch,
  modifyRoute,
  moveEntity,
  runSimulation,
  validateBranch,
} from "../domain/commands";

import {
  bootSnapshot as bootDraftSnapshot,
  lockPolicy,
} from "../domain/commands";

export function bootLockedSnapshot() {
  const snapshot = bootDraftSnapshot();
  const locked = lockPolicy(snapshot);
  if (!locked.ok) throw new Error("Could not lock test policy.");
  return snapshot;
}

export function serializeable(value: unknown): string {
  return JSON.stringify(value);
}
