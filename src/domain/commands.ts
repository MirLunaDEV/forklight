import { derivedDeltas, validateMetrics } from "../constraints/validator";
import {
  createGoalPolicy,
  POLICY_CONSTRAINT_LIMITS,
} from "../constraints/rules";
import { inspectRoutes } from "../simulation/geometry";
import { simulate } from "../simulation/simulator";
import { makeBranch, isSimulationFresh } from "./branch";
import { LOCKED_MUTATIONS, LOCKED_WORLD } from "./initialWorld";
import { cloneMetrics } from "./metrics";
import type {
  ApprovalState,
  Branch,
  CommandResult,
  ConstraintSet,
  GoalPolicy,
  RouteWaypoint,
  WorldState,
} from "./world";
import { FLOOR, MOVABLE_BOUNDS, WAYPOINT_SNAP_M } from "./world";
import { distance2, isInsideFloor } from "../simulation/geometry";

export interface AppSnapshot {
  main: WorldState;
  branches: Branch[];
  nextBranchSeq: number;
  policy: GoalPolicy;
  approval: ApprovalState;
  mergeRegisteredFor: string | null;
}

export function bootSnapshot(): AppSnapshot {
  const main = structuredClone(LOCKED_WORLD);
  main.baselineMetrics = simulate(main, main.seed);
  return {
    main,
    branches: [],
    nextBranchSeq: 1,
    policy: createGoalPolicy(),
    approval: { branchId: null, approvedAt: null },
    mergeRegisteredFor: null,
  };
}

export function findBranch(
  snapshot: AppSnapshot,
  branchId: string,
): Branch | undefined {
  return snapshot.branches.find(
    (branch) => branch.id === branchId || branch.name === branchId,
  );
}

function err<T>(code: string, message: string): CommandResult<T> {
  return { ok: false, error: { code, message } };
}

function requireLockedPolicy(
  snapshot: AppSnapshot,
): CommandResult<{ locked: true }> {
  if (snapshot.policy.status !== "locked") {
    return err(
      "POLICY_NOT_LOCKED",
      "The human must lock the goal policy before future exploration begins.",
    );
  }
  return { ok: true, data: { locked: true } };
}

export function lockPolicy(
  snapshot: AppSnapshot,
): CommandResult<{ policy: GoalPolicy }> {
  snapshot.policy = { ...snapshot.policy, status: "locked" };
  return { ok: true, data: { policy: snapshot.policy } };
}

function invalidatePolicyDependentEvidence(snapshot: AppSnapshot): number {
  let invalidatedBranches = 0;
  for (const branch of snapshot.branches) {
    if (branch.status === "stale" || branch.status === "merged") continue;
    if (branch.validationResult || branch.validatedMutationVersion !== null) {
      invalidatedBranches += 1;
    }
    branch.validationResult = null;
    branch.validatedMutationVersion = null;
    branch.status = isSimulationFresh(branch) ? "simulated" : "draft";
  }
  snapshot.approval = { branchId: null, approvedAt: null };
  snapshot.mergeRegisteredFor = null;
  return invalidatedBranches;
}

export function updatePolicyConstraints(
  snapshot: AppSnapshot,
  updates: Partial<ConstraintSet>,
): CommandResult<{
  policy: GoalPolicy;
  invalidatedBranches: number;
  changed: boolean;
}> {
  if (snapshot.policy.status !== "draft") {
    return err(
      "POLICY_LOCKED",
      "The human must choose Edit policy before changing policy constraints.",
    );
  }

  const keys = Object.keys(POLICY_CONSTRAINT_LIMITS) as Array<
    keyof ConstraintSet
  >;
  const supplied = keys.filter((key) => updates[key] !== undefined);
  if (supplied.length === 0) {
    return err(
      "INVALID_POLICY_UPDATE",
      "Provide at least one policy constraint to update.",
    );
  }

  for (const key of supplied) {
    const value = updates[key];
    const limits = POLICY_CONSTRAINT_LIMITS[key];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < limits.min ||
      value > limits.max ||
      (key === "maxProtectedMoved" && !Number.isInteger(value))
    ) {
      return err(
        "INVALID_POLICY_CONSTRAINT",
        `${key} must be ${limits.min}–${limits.max}${
          key === "maxProtectedMoved" ? " and an integer" : ""
        }.`,
      );
    }
  }

  const changed = supplied.some(
    (key) => snapshot.policy[key] !== updates[key],
  );
  if (!changed) {
    return {
      ok: true,
      data: { policy: snapshot.policy, invalidatedBranches: 0, changed: false },
    };
  }

  snapshot.policy = { ...snapshot.policy, ...updates };
  const invalidatedBranches = invalidatePolicyDependentEvidence(snapshot);
  return {
    ok: true,
    data: { policy: snapshot.policy, invalidatedBranches, changed: true },
  };
}

export function editPolicy(
  snapshot: AppSnapshot,
): CommandResult<{ policy: GoalPolicy; invalidatedBranches: number }> {
  const invalidatedBranches = invalidatePolicyDependentEvidence(snapshot);
  snapshot.policy = { ...snapshot.policy, status: "draft" };
  return {
    ok: true,
    data: { policy: snapshot.policy, invalidatedBranches },
  };
}

function requireMutableBranch(
  snapshot: AppSnapshot,
  branchId: string,
): CommandResult<Branch> {
  const branch = findBranch(snapshot, branchId);
  if (!branch) {
    return err("BRANCH_NOT_FOUND", `No branch with id "${branchId}".`);
  }
  if (branch.status === "stale") {
    return err(
      "BRANCH_STALE",
      `Branch ${branch.name} was created from revision ${branch.baseRevision} but MAIN is revision ${snapshot.main.revision}.`,
    );
  }
  if (branch.status === "merged") {
    return err(
      "BRANCH_MERGED",
      `Branch ${branch.name} has already been merged.`,
    );
  }
  return { ok: true, data: branch };
}

function revokeIfApproved(snapshot: AppSnapshot, branchId: string): void {
  if (snapshot.approval.branchId === branchId) {
    snapshot.approval = { branchId: null, approvedAt: null };
    snapshot.mergeRegisteredFor = null;
  }
}

function bumpMutation(branch: Branch): void {
  branch.mutationVersion += 1;
  branch.metrics = null;
  branch.validationResult = null;
  branch.simulatedMutationVersion = null;
  branch.validatedMutationVersion = null;
  branch.status = "draft";
}

export function createBranch(
  snapshot: AppSnapshot,
  name: string,
): CommandResult<{ branch: Branch }> {
  const policy = requireLockedPolicy(snapshot);
  if (!policy.ok) return policy;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) {
    return err("INVALID_NAME", "Branch name must be 1–40 characters.");
  }
  const id = `branch-${snapshot.nextBranchSeq}`;
  snapshot.nextBranchSeq += 1;
  const branch = makeBranch(id, trimmed, snapshot.main);
  snapshot.branches = [...snapshot.branches, branch];
  return { ok: true, data: { branch } };
}

export function moveEntity(
  snapshot: AppSnapshot,
  input: {
    branchId: string;
    entityId: string;
    position: { x: number; z: number };
  },
): CommandResult<{ branch: Branch; changeId: string }> {
  const policy = requireLockedPolicy(snapshot);
  if (!policy.ok) return policy;
  const found = requireMutableBranch(snapshot, input.branchId);
  if (!found.ok) return found;
  const branch = found.data;

  const { x, z } = input.position;
  if (
    x < MOVABLE_BOUNDS.minX ||
    x > MOVABLE_BOUNDS.maxX ||
    z < MOVABLE_BOUNDS.minZ ||
    z > MOVABLE_BOUNDS.maxZ
  ) {
    return err(
      "OUT_OF_BOUNDS",
      `Position (${x}, ${z}) is outside movable bounds [${MOVABLE_BOUNDS.minX},${MOVABLE_BOUNDS.maxX}] × [${MOVABLE_BOUNDS.minZ},${MOVABLE_BOUNDS.maxZ}].`,
    );
  }

  const entity = branch.worldState.entities.find(
    (item) => item.id === input.entityId,
  );
  if (!entity) {
    return err(
      "ENTITY_NOT_FOUND",
      `No entity "${input.entityId}" in this branch.`,
    );
  }

  const touchedProtectedEntity = entity.protected;
  entity.position = { x, y: 0, z };
  bumpMutation(branch);
  const changeId = `change-${branch.id}-${branch.mutationVersion}`;
  branch.changes = [
    ...branch.changes,
    {
      id: changeId,
      at: Date.now(),
      tool: "move_entity",
      summary: `${entity.id} → (${x}, ${z})`,
      payload: { entityId: entity.id, position: { x, z } },
      touchedProtectedEntity,
    },
  ];
  revokeIfApproved(snapshot, branch.id);
  return { ok: true, data: { branch, changeId } };
}

export function modifyRoute(
  snapshot: AppSnapshot,
  input: {
    branchId: string;
    routeId: string;
    enabled?: boolean;
    waypoints?: RouteWaypoint[];
  },
): CommandResult<{ branch: Branch; changeId: string }> {
  const policy = requireLockedPolicy(snapshot);
  if (!policy.ok) return policy;
  const found = requireMutableBranch(snapshot, input.branchId);
  if (!found.ok) return found;
  const branch = found.data;

  if (input.enabled === undefined && input.waypoints === undefined) {
    return err(
      "MISSING_MUTATION",
      "modify_route requires enabled and/or waypoints.",
    );
  }

  const route = branch.worldState.routes.find(
    (item) => item.id === input.routeId,
  );
  if (!route) {
    return err(
      "ROUTE_NOT_FOUND",
      `No route "${input.routeId}" in this branch.`,
    );
  }

  if (input.waypoints) {
    if (input.waypoints.length < 2) {
      return err("INVALID_WAYPOINTS", "A route needs at least two waypoints.");
    }
    for (const point of input.waypoints) {
      if (!isInsideFloor(point.x, point.z)) {
        return err(
          "OUT_OF_BOUNDS",
          `Waypoint (${point.x}, ${point.z}) is outside the ${FLOOR.width}×${FLOOR.depth} floor.`,
        );
      }
    }
    const source = branch.worldState.entities.find(
      (item) => item.id === route.sourceId,
    );
    const target = branch.worldState.entities.find(
      (item) => item.id === route.targetId,
    );
    if (!source || !target) {
      return err(
        "ROUTE_ENDPOINTS",
        "Route source or target entity is missing.",
      );
    }
    const first = input.waypoints[0];
    const last = input.waypoints[input.waypoints.length - 1];
    if (
      distance2(first, { x: source.position.x, z: source.position.z }) >
      WAYPOINT_SNAP_M
    ) {
      return err(
        "WAYPOINT_SOURCE",
        "First waypoint must be within 1.5m of the source entity.",
      );
    }
    if (
      distance2(last, { x: target.position.x, z: target.position.z }) >
      WAYPOINT_SNAP_M
    ) {
      return err(
        "WAYPOINT_TARGET",
        "Last waypoint must be within 1.5m of the target entity.",
      );
    }
    route.waypoints = input.waypoints.map((point) => ({
      x: point.x,
      z: point.z,
    }));
  }

  if (input.enabled !== undefined) {
    route.enabled = input.enabled;
  }

  bumpMutation(branch);
  const bits: string[] = [];
  if (input.enabled !== undefined) {
    bits.push(`${route.id} ${input.enabled ? "enabled" : "disabled"}`);
  }
  if (input.waypoints) bits.push(`${route.id} waypoints updated`);
  const changeId = `change-${branch.id}-${branch.mutationVersion}`;
  branch.changes = [
    ...branch.changes,
    {
      id: changeId,
      at: Date.now(),
      tool: "modify_route",
      summary: bits.join("; "),
      payload: {
        routeId: route.id,
        enabled: input.enabled,
        waypoints: input.waypoints,
      },
      touchedProtectedEntity: false,
    },
  ];
  revokeIfApproved(snapshot, branch.id);
  return { ok: true, data: { branch, changeId } };
}

export function runSimulation(
  snapshot: AppSnapshot,
  branchId: string,
): CommandResult<{ branch: Branch }> {
  const policy = requireLockedPolicy(snapshot);
  if (!policy.ok) return policy;
  const found = requireMutableBranch(snapshot, branchId);
  if (!found.ok) return found;
  const branch = found.data;
  const metrics = simulate(branch.worldState, branch.worldState.seed);
  branch.metrics = metrics;
  branch.simulatedMutationVersion = branch.mutationVersion;
  if (branch.status === "draft") branch.status = "simulated";
  return { ok: true, data: { branch } };
}

export function validateBranch(
  snapshot: AppSnapshot,
  branchId: string,
): CommandResult<{ branch: Branch }> {
  const policy = requireLockedPolicy(snapshot);
  if (!policy.ok) return policy;
  const found = requireMutableBranch(snapshot, branchId);
  if (!found.ok) return found;
  const branch = found.data;

  if (!isSimulationFresh(branch)) {
    const sim = runSimulation(snapshot, branch.id);
    if (!sim.ok) return sim;
  }

  const result = validateMetrics(
    branch,
    branch.metrics!,
    snapshot.main.baselineMetrics,
    snapshot.policy,
  );
  branch.validationResult = result;
  branch.validatedMutationVersion = branch.mutationVersion;
  branch.status = result.allPassed ? "verified" : "failed";
  return { ok: true, data: { branch } };
}

export function compareBranches(snapshot: AppSnapshot): CommandResult<{
  mainRevision: number;
  branches: Array<{
    id: string;
    name: string;
    status: Branch["status"];
    throughputImprovement: number | null;
    distanceIncrease: number | null;
    protectedMoved: number;
    congestionRatio: number | null;
    allPassed: boolean | null;
  }>;
}> {
  const baseline = snapshot.main.baselineMetrics;
  const rows = snapshot.branches.map((branch) => {
    const protectedMoved = branch.changes.filter(
      (change) => change.touchedProtectedEntity,
    ).length;
    if (!branch.metrics || !baseline) {
      return {
        id: branch.id,
        name: branch.name,
        status: branch.status,
        throughputImprovement: null,
        distanceIncrease: null,
        protectedMoved,
        congestionRatio: null,
        allPassed: branch.validationResult?.allPassed ?? null,
      };
    }
    const deltas = derivedDeltas(branch.metrics, baseline);
    return {
      id: branch.id,
      name: branch.name,
      status: branch.status,
      throughputImprovement: deltas.throughputImprovement,
      distanceIncrease: deltas.distanceIncrease,
      protectedMoved,
      congestionRatio: deltas.congestionRatio,
      allPassed: branch.validationResult?.allPassed ?? null,
    };
  });
  return {
    ok: true,
    data: { mainRevision: snapshot.main.revision, branches: rows },
  };
}

export function approveBranch(
  snapshot: AppSnapshot,
  branchId: string,
  at = Date.now(),
): CommandResult<{ branch: Branch }> {
  const policy = requireLockedPolicy(snapshot);
  if (!policy.ok) return policy;
  const branch = findBranch(snapshot, branchId);
  if (!branch)
    return err("BRANCH_NOT_FOUND", `No branch with id "${branchId}".`);
  if (
    branch.status === "stale" ||
    branch.baseRevision !== snapshot.main.revision
  ) {
    return err(
      "APPROVE_STALE",
      `Branch ${branch.name} is not based on the current MAIN revision.`,
    );
  }
  if (
    branch.status !== "verified" ||
    branch.validationResult?.allPassed !== true
  ) {
    return err(
      "APPROVE_NOT_VERIFIED",
      `Only a verified branch can be approved. ${branch.name} is ${branch.status}.`,
    );
  }
  if (branch.validatedMutationVersion !== branch.mutationVersion) {
    return err(
      "APPROVE_STALE_VALIDATION",
      "Validation is stale; re-validate first.",
    );
  }
  snapshot.approval = { branchId: branch.id, approvedAt: at };
  snapshot.mergeRegisteredFor = branch.id;
  return { ok: true, data: { branch } };
}

export function revokeApproval(
  snapshot: AppSnapshot,
): CommandResult<{ revoked: boolean }> {
  const had = snapshot.approval.branchId !== null;
  snapshot.approval = { branchId: null, approvedAt: null };
  snapshot.mergeRegisteredFor = null;
  return { ok: true, data: { revoked: had } };
}

export function mergeVerifiedBranch(
  snapshot: AppSnapshot,
  branchId: string,
): CommandResult<{ main: WorldState; branch: Branch }> {
  const policy = requireLockedPolicy(snapshot);
  if (!policy.ok) return policy;
  const branch = findBranch(snapshot, branchId);
  if (!branch)
    return err("BRANCH_NOT_FOUND", `No branch with id "${branchId}".`);

  if (snapshot.mergeRegisteredFor !== branch.id) {
    return err(
      "MERGE_CAPABILITY_ABSENT",
      "merge_verified_branch is not currently available for this branch.",
    );
  }
  if (
    branch.status === "stale" ||
    branch.baseRevision !== snapshot.main.revision
  ) {
    snapshot.approval = { branchId: null, approvedAt: null };
    snapshot.mergeRegisteredFor = null;
    return err(
      "BRANCH_STALE",
      `Branch ${branch.name} was created from revision ${branch.baseRevision} but MAIN is revision ${snapshot.main.revision}.`,
    );
  }
  if (
    branch.status !== "verified" ||
    branch.validationResult?.allPassed !== true ||
    branch.validatedMutationVersion !== branch.mutationVersion
  ) {
    return err(
      "MERGE_NOT_VERIFIED",
      `Branch ${branch.name} is not a fresh verified future.`,
    );
  }
  if (snapshot.approval.branchId !== branch.id) {
    return err(
      "MERGE_NOT_APPROVED",
      "A human must approve this verified future before it can merge.",
    );
  }

  const previousRevision = snapshot.main.revision;
  const nextMain = structuredClone(branch.worldState);
  nextMain.revision = previousRevision + 1;
  nextMain.baselineMetrics = cloneMetrics(branch.metrics);
  snapshot.main = nextMain;
  branch.status = "merged";
  for (const other of snapshot.branches) {
    if (other.id !== branch.id && other.status !== "merged") {
      other.status = "stale";
    }
  }
  snapshot.approval = { branchId: null, approvedAt: null };
  snapshot.mergeRegisteredFor = null;
  return { ok: true, data: { main: nextMain, branch } };
}

export function inspectWorldPayload(snapshot: AppSnapshot) {
  return {
    revision: snapshot.main.revision,
    seed: snapshot.main.seed,
    name: snapshot.main.name,
    entities: snapshot.main.entities.map((entity) => ({
      id: entity.id,
      type: entity.type,
      name: entity.name,
      position: entity.position,
      protected: entity.protected,
      capacity: entity.capacity,
    })),
    routes: inspectRoutes(snapshot.main),
    baselineMetrics: snapshot.main.baselineMetrics,
    branches: snapshot.branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      status: branch.status,
    })),
  };
}

export function inspectBranchPayload(
  snapshot: AppSnapshot,
  branchId: string,
): CommandResult<{
  id: string;
  name: string;
  status: Branch["status"];
  baseRevision: number;
  mutationVersion: number;
  changes: Branch["changes"];
  metrics: Branch["metrics"];
  validationResult: Branch["validationResult"];
}> {
  const branch = findBranch(snapshot, branchId);
  if (!branch) {
    return err("BRANCH_NOT_FOUND", `No branch with id "${branchId}".`);
  }
  return {
    ok: true,
    data: {
      id: branch.id,
      name: branch.name,
      status: branch.status,
      baseRevision: branch.baseRevision,
      mutationVersion: branch.mutationVersion,
      changes: branch.changes,
      metrics: branch.metrics,
      validationResult: branch.validationResult,
    },
  };
}

export function applyLockedFutureA(
  snapshot: AppSnapshot,
  branchId: string,
): CommandResult<{ branch: Branch; changeId: string }> {
  const moved = moveEntity(snapshot, {
    branchId,
    entityId: LOCKED_MUTATIONS.openSouth.entityId,
    position: { ...LOCKED_MUTATIONS.openSouth.position },
  });
  if (!moved.ok) return moved;
  return modifyRoute(snapshot, {
    branchId,
    routeId: "r-south",
    enabled: true,
  });
}

export function applyLockedFutureB(
  snapshot: AppSnapshot,
  branchId: string,
): CommandResult<{ branch: Branch; changeId: string }> {
  const moved = moveEntity(snapshot, {
    branchId,
    entityId: LOCKED_MUTATIONS.openNorth.entityId,
    position: { ...LOCKED_MUTATIONS.openNorth.position },
  });
  if (!moved.ok) return moved;
  return modifyRoute(snapshot, {
    branchId,
    routeId: "r-north",
    enabled: true,
  });
}

export function applyLockedFutureC(
  snapshot: AppSnapshot,
  branchId: string,
): CommandResult<{ branch: Branch; changeId: string }> {
  const opened = applyLockedFutureB(snapshot, branchId);
  if (!opened.ok) return opened;
  const moved = moveEntity(snapshot, {
    branchId,
    entityId: LOCKED_MUTATIONS.moveProtectedScanner.entityId,
    position: { ...LOCKED_MUTATIONS.moveProtectedScanner.position },
  });
  if (!moved.ok) return moved;
  const branch = findBranch(snapshot, branchId);
  if (!branch) return err("BRANCH_NOT_FOUND", "Branch disappeared.");
  const north = branch.worldState.routes.find(
    (route) => route.id === "r-north",
  );
  if (!north) return err("ROUTE_NOT_FOUND", "r-north missing.");
  const waypoints = north.waypoints.map((point, index) =>
    index === 2
      ? { ...LOCKED_MUTATIONS.followScannerWaypoint }
      : { x: point.x, z: point.z },
  );
  return modifyRoute(snapshot, {
    branchId,
    routeId: "r-north",
    waypoints,
  });
}

export function ensureNamedBranch(snapshot: AppSnapshot, name: string) {
  const existing = snapshot.branches.find((branch) => branch.name === name);
  if (existing) return { ok: true as const, data: { branch: existing } };
  return createBranch(snapshot, name);
}
