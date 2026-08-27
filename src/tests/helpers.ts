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

export function serializeable(value: unknown): string {
  return JSON.stringify(value);
}
