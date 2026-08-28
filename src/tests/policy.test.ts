import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY_CONSTRAINTS } from "../constraints/rules";
import {
  applyLockedFutureB,
  approveBranch,
  bootSnapshot,
  createBranch,
  editPolicy,
  lockPolicy,
  modifyRoute,
  moveEntity,
  runSimulation,
  validateBranch,
} from "../domain/commands";

describe("human goal policy", () => {
  it("starts as a human-owned draft with the challenge golden values", () => {
    const snapshot = bootSnapshot();
    expect(snapshot.policy).toEqual({
      status: "draft",
      definedBy: "human",
      ...DEFAULT_POLICY_CONSTRAINTS,
    });
    expect(snapshot.policy).toMatchObject({
      minThroughputImprovement: 0.2,
      maxDistanceIncrease: 0.1,
      maxProtectedMoved: 0,
      maxCongestionRatio: 1,
    });
  });

  it("blocks future exploration until the human locks policy", () => {
    const snapshot = bootSnapshot();
    const created = createBranch(snapshot, "route-a");
    expect(created).toEqual({
      ok: false,
      error: {
        code: "POLICY_NOT_LOCKED",
        message:
          "The human must lock the goal policy before future exploration begins.",
      },
    });
    expect(snapshot.branches).toEqual([]);
    expect(snapshot.main.revision).toBe(1);
  });

  it("allows the normal golden workflow after policy lock", () => {
    const snapshot = bootSnapshot();
    expect(lockPolicy(snapshot).ok).toBe(true);
    const created = createBranch(snapshot, "route-b");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(applyLockedFutureB(snapshot, created.data.branch.id).ok).toBe(true);
    const validated = validateBranch(snapshot, created.data.branch.id);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(validated.data.branch.status).toBe("verified");
    expect(validated.data.branch.validationResult?.allPassed).toBe(true);
  });

  it("gates every experiment command while policy is draft", () => {
    const snapshot = bootSnapshot();
    lockPolicy(snapshot);
    const created = createBranch(snapshot, "route-a");
    if (!created.ok) throw new Error("create failed");
    editPolicy(snapshot);

    const results = [
      moveEntity(snapshot, {
        branchId: created.data.branch.id,
        entityId: "barrier-south",
        position: { x: 11, z: 3.8 },
      }),
      modifyRoute(snapshot, {
        branchId: created.data.branch.id,
        routeId: "r-south",
        enabled: true,
      }),
      runSimulation(snapshot, created.data.branch.id),
      validateBranch(snapshot, created.data.branch.id),
    ];
    for (const result of results) {
      expect(result).toMatchObject({
        ok: false,
        error: { code: "POLICY_NOT_LOCKED" },
      });
    }
  });

  it("editing policy invalidates prior validation but preserves measured metrics", () => {
    const snapshot = bootSnapshot();
    lockPolicy(snapshot);
    const created = createBranch(snapshot, "route-b");
    if (!created.ok) throw new Error("create failed");
    applyLockedFutureB(snapshot, created.data.branch.id);
    validateBranch(snapshot, created.data.branch.id);
    const metricsBefore = structuredClone(created.data.branch.metrics);

    const edited = editPolicy(snapshot);
    expect(edited).toMatchObject({
      ok: true,
      data: { invalidatedBranches: 1, policy: { status: "draft" } },
    });
    expect(created.data.branch.metrics).toEqual(metricsBefore);
    expect(created.data.branch.validationResult).toBeNull();
    expect(created.data.branch.validatedMutationVersion).toBeNull();
    expect(created.data.branch.status).toBe("simulated");
  });

  it("editing policy revokes human approval and merge eligibility", () => {
    const snapshot = bootSnapshot();
    lockPolicy(snapshot);
    const created = createBranch(snapshot, "route-b");
    if (!created.ok) throw new Error("create failed");
    applyLockedFutureB(snapshot, created.data.branch.id);
    validateBranch(snapshot, created.data.branch.id);
    expect(approveBranch(snapshot, created.data.branch.id).ok).toBe(true);
    expect(snapshot.approval.branchId).toBe(created.data.branch.id);
    expect(snapshot.mergeRegisteredFor).toBe(created.data.branch.id);

    editPolicy(snapshot);
    expect(snapshot.approval.branchId).toBeNull();
    expect(snapshot.mergeRegisteredFor).toBeNull();
  });
});
