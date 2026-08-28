import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY_CONSTRAINTS } from "../constraints/rules";
import {
  applyLockedFutureA,
  applyLockedFutureB,
  applyLockedFutureC,
  approveBranch,
  bootSnapshot,
  compareBranches,
  createBranch,
  lockPolicy,
  updatePolicyConstraints,
  validateBranch,
} from "../domain/commands";
import type { AppSnapshot } from "../domain/commands";
import type { Branch, ConstraintSet } from "../domain/world";
import { STATIC_TOOL_NAMES } from "../webmcp/registerTools";

function createValidatedB(snapshot: AppSnapshot): Branch {
  expect(lockPolicy(snapshot).ok).toBe(true);
  const created = createBranch(snapshot, "route-b");
  if (!created.ok) throw new Error("Could not create route-b.");
  expect(applyLockedFutureB(snapshot, created.data.branch.id).ok).toBe(true);
  const validated = validateBranch(snapshot, created.data.branch.id);
  if (!validated.ok) throw new Error("Could not validate route-b.");
  return validated.data.branch;
}

function createApprovedBInDraftMutationWindow(): {
  snapshot: AppSnapshot;
  branch: Branch;
} {
  const snapshot = bootSnapshot();
  const branch = createValidatedB(snapshot);
  expect(approveBranch(snapshot, branch.id).ok).toBe(true);
  snapshot.policy = { ...snapshot.policy, status: "draft" };
  return { snapshot, branch };
}

function createGoldenSet(snapshot: AppSnapshot) {
  const a = createBranch(snapshot, "route-a");
  const b = createBranch(snapshot, "route-b");
  const c = createBranch(snapshot, "route-c");
  if (!a.ok || !b.ok || !c.ok) throw new Error("Could not create futures.");
  expect(applyLockedFutureA(snapshot, a.data.branch.id).ok).toBe(true);
  expect(applyLockedFutureB(snapshot, b.data.branch.id).ok).toBe(true);
  expect(applyLockedFutureC(snapshot, c.data.branch.id).ok).toBe(true);
  expect(validateBranch(snapshot, a.data.branch.id).ok).toBe(true);
  expect(validateBranch(snapshot, b.data.branch.id).ok).toBe(true);
  expect(validateBranch(snapshot, c.data.branch.id).ok).toBe(true);
  return { a: a.data.branch, b: b.data.branch, c: c.data.branch };
}

describe("human-editable policy constraints", () => {
  it("keeps the default human policy at 20%, 10%, 0, and 1.0", () => {
    expect(DEFAULT_POLICY_CONSTRAINTS).toEqual({
      minThroughputImprovement: 0.2,
      maxDistanceIncrease: 0.1,
      maxProtectedMoved: 0,
      maxCongestionRatio: 1,
    });
    expect(bootSnapshot().policy).toMatchObject(DEFAULT_POLICY_CONSTRAINTS);
  });

  it("updates policy constraints through the domain while draft", () => {
    const snapshot = bootSnapshot();
    const result = updatePolicyConstraints(snapshot, {
      minThroughputImprovement: 0.25,
      maxDistanceIncrease: 0.06,
      maxProtectedMoved: 1,
      maxCongestionRatio: 1.15,
    });
    expect(result).toMatchObject({ ok: true, data: { changed: true } });
    expect(snapshot.policy).toMatchObject({
      minThroughputImprovement: 0.25,
      maxDistanceIncrease: 0.06,
      maxProtectedMoved: 1,
      maxCongestionRatio: 1.15,
    });
  });

  it("rejects policy updates while locked", () => {
    const snapshot = bootSnapshot();
    lockPolicy(snapshot);
    expect(updatePolicyConstraints(snapshot, { maxDistanceIncrease: 0.06 })).toEqual({
      ok: false,
      error: {
        code: "POLICY_LOCKED",
        message: "The human must choose Edit policy before changing policy constraints.",
      },
    });
    expect(snapshot.policy.maxDistanceIncrease).toBe(0.1);
  });

  it("invalidates validation proof when a policy value changes", () => {
    const { snapshot, branch } = createApprovedBInDraftMutationWindow();
    expect(branch.validationResult).not.toBeNull();
    expect(updatePolicyConstraints(snapshot, { maxDistanceIncrease: 0.06 }).ok).toBe(true);
    expect(branch.validationResult).toBeNull();
    expect(branch.validatedMutationVersion).toBeNull();
    expect(branch.status).toBe("simulated");
  });

  it("revokes human approval when a policy value changes", () => {
    const { snapshot } = createApprovedBInDraftMutationWindow();
    expect(snapshot.approval.branchId).not.toBeNull();
    updatePolicyConstraints(snapshot, { maxDistanceIncrease: 0.06 });
    expect(snapshot.approval).toEqual({ branchId: null, approvedAt: null });
  });

  it("removes merge eligibility when a policy value changes", () => {
    const { snapshot } = createApprovedBInDraftMutationWindow();
    expect(snapshot.mergeRegisteredFor).not.toBeNull();
    updatePolicyConstraints(snapshot, { maxDistanceIncrease: 0.06 });
    expect(snapshot.mergeRegisteredFor).toBeNull();
  });

  it("preserves fresh simulation metrics across policy changes", () => {
    const { snapshot, branch } = createApprovedBInDraftMutationWindow();
    const metrics = structuredClone(branch.metrics);
    const simulatedMutationVersion = branch.simulatedMutationVersion;
    updatePolicyConstraints(snapshot, { maxDistanceIncrease: 0.06 });
    expect(branch.metrics).toEqual(metrics);
    expect(branch.simulatedMutationVersion).toBe(simulatedMutationVersion);
    expect(branch.status).toBe("simulated");
  });

  it("exposes no WebMCP policy-writing tool", () => {
    expect(STATIC_TOOL_NAMES).toContain("inspect_constraints");
    expect(
      STATIC_TOOL_NAMES.filter((name) =>
        /(?:update|set|edit|lock).*(?:policy|constraint)|(?:policy|constraint).*(?:update|set|edit|lock)/i.test(
          name,
        ),
      ),
    ).toEqual([]);
  });

  it("keeps the initial static WebMCP tool count at exactly nine", () => {
    expect(STATIC_TOOL_NAMES).toHaveLength(9);
    expect(new Set(STATIC_TOOL_NAMES).size).toBe(9);
    expect(STATIC_TOOL_NAMES).not.toContain("merge_verified_branch");
  });

  it("keeps A failed, B verified, and C protected-failed at 6% distance", () => {
    const snapshot = bootSnapshot();
    expect(updatePolicyConstraints(snapshot, { maxDistanceIncrease: 0.06 }).ok).toBe(true);
    lockPolicy(snapshot);
    const { a, b, c } = createGoldenSet(snapshot);
    expect([a.status, b.status, c.status]).toEqual(["failed", "verified", "failed"]);
    expect(a.validationResult?.checks.find((check) => check.id === "distance")?.passed).toBe(false);
    expect(b.validationResult?.allPassed).toBe(true);
    expect(c.validationResult?.checks.find((check) => check.id === "protected")?.passed).toBe(
      false,
    );
  });

  it("makes B fail distance after revalidation at 5%", () => {
    const snapshot = bootSnapshot();
    expect(updatePolicyConstraints(snapshot, { maxDistanceIncrease: 0.05 }).ok).toBe(true);
    lockPolicy(snapshot);
    const created = createBranch(snapshot, "route-b");
    if (!created.ok) throw new Error("Could not create route-b.");
    applyLockedFutureB(snapshot, created.data.branch.id);
    const validated = validateBranch(snapshot, created.data.branch.id);
    if (!validated.ok) throw new Error("Could not validate route-b.");
    expect(validated.data.branch.status).toBe("failed");
    expect(
      validated.data.branch.validationResult?.checks.find((check) => check.id === "distance")
        ?.passed,
    ).toBe(false);
  });

  it("keeps the default A/B/C golden scenario unchanged", () => {
    const snapshot = bootSnapshot();
    lockPolicy(snapshot);
    const { a, b, c } = createGoldenSet(snapshot);
    expect([a.status, b.status, c.status]).toEqual(["failed", "verified", "failed"]);
    const compared = compareBranches(snapshot);
    if (!compared.ok) throw new Error("Could not compare futures.");
    const rows = Object.fromEntries(compared.data.branches.map((branch) => [branch.name, branch]));
    expect(rows["route-a"].distanceIncrease).toBeCloseTo(0.1053, 3);
    expect(rows["route-b"].distanceIncrease).toBeCloseTo(0.0539, 3);
    expect(rows["route-c"].protectedMoved).toBe(1);
  });

  it("rejects every out-of-range or non-integer policy value atomically", () => {
    const invalid: Array<Partial<ConstraintSet>> = [
      { minThroughputImprovement: -0.01 },
      { minThroughputImprovement: 1.01 },
      { maxDistanceIncrease: -0.01 },
      { maxDistanceIncrease: 0.51 },
      { maxProtectedMoved: -1 },
      { maxProtectedMoved: 1.5 },
      { maxProtectedMoved: 6 },
      { maxCongestionRatio: 0.99 },
      { maxCongestionRatio: 1.51 },
    ];
    for (const update of invalid) {
      const snapshot = bootSnapshot();
      const before = structuredClone(snapshot.policy);
      expect(updatePolicyConstraints(snapshot, update)).toMatchObject({
        ok: false,
        error: { code: "INVALID_POLICY_CONSTRAINT" },
      });
      expect(snapshot.policy).toEqual(before);
    }
  });

  it("explains how to enable WebMCP when a normal browser lacks it", () => {
    const source = readFileSync(new URL("../ui/TopBar.tsx", import.meta.url), "utf8");
    expect(source).toContain("WebMCP unavailable — open in ChatGPT or enable WebMCP testing in");
    expect(source).toContain("chrome://flags/#enable-webmcp-testing");
  });

  it("frames the warehouse as a demonstration without claiming integrations", () => {
    const source = readFileSync(new URL("../ui/ConstraintPanel.tsx", import.meta.url), "utf8");
    expect(source).toContain("Warehouse demonstration");
    expect(source).toMatch(/those integrations\s+are not part of this/);
  });
});
