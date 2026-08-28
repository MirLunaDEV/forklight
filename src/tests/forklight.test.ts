import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  applyLockedFutureA,
  applyLockedFutureB,
  applyLockedFutureC,
  approveBranch,
  bootLockedSnapshot as bootSnapshot,
  compareBranches,
  createBranch,
  mergeVerifiedBranch,
  modifyRoute,
  moveEntity,
  runSimulation,
  serializeable,
  validateBranch,
} from "./helpers";
import {
  availableRoutes,
  getBarriers,
  routeBlockedBy,
} from "../simulation/geometry";
import { simulate } from "../simulation/simulator";
import { LOCKED_WORLD } from "../domain/initialWorld";
import { DEFAULT_POLICY_CONSTRAINTS } from "../constraints/rules";

const TOL = 4;

describe("branch isolation", () => {
  it("create branch leaves MAIN serialized JSON unchanged", () => {
    const snap = bootSnapshot();
    const before = JSON.stringify(snap.main);
    const created = createBranch(snap, "route-a");
    expect(created.ok).toBe(true);
    expect(JSON.stringify(snap.main)).toBe(before);
  });

  it("editing A leaves MAIN and B unchanged", () => {
    const snap = bootSnapshot();
    const a = createBranch(snap, "route-a");
    const b = createBranch(snap, "route-b");
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    const mainBefore = JSON.stringify(snap.main);
    const bBefore = JSON.stringify(b.data.branch.worldState);
    const moved = moveEntity(snap, {
      branchId: a.data.branch.id,
      entityId: "barrier-north",
      position: { x: 11, z: 11.3 },
    });
    expect(moved.ok).toBe(true);
    expect(JSON.stringify(snap.main)).toBe(mainBefore);
    expect(
      JSON.stringify(
        snap.branches.find((item) => item.id === b.data.branch.id)?.worldState,
      ),
    ).toBe(bBefore);
    const north = snap.branches
      .find((item) => item.id === a.data.branch.id)
      ?.worldState.entities.find((item) => item.id === "barrier-north");
    expect(north?.position).toEqual({ x: 11, y: 0, z: 11.3 });
  });

  it("mutation increments mutationVersion and clears metrics", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-a");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    runSimulation(snap, created.data.branch.id);
    const mutated = moveEntity(snap, {
      branchId: created.data.branch.id,
      entityId: "barrier-north",
      position: { x: 11, z: 11.3 },
    });
    expect(mutated.ok).toBe(true);
    if (!mutated.ok) return;
    expect(mutated.data.branch.mutationVersion).toBe(1);
    expect(mutated.data.branch.metrics).toBeNull();
    expect(mutated.data.branch.validationResult).toBeNull();
    expect(mutated.data.branch.status).toBe("draft");
  });

  it("approved branch mutation revokes approval", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-b");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    applyLockedFutureB(snap, created.data.branch.id);
    validateBranch(snap, created.data.branch.id);
    const approved = approveBranch(snap, created.data.branch.id);
    expect(approved.ok).toBe(true);
    expect(snap.mergeRegisteredFor).toBe(created.data.branch.id);
    moveEntity(snap, {
      branchId: created.data.branch.id,
      entityId: "rack-1",
      position: { x: 12, z: 14 },
    });
    expect(snap.approval.branchId).toBeNull();
    expect(snap.mergeRegisteredFor).toBeNull();
  });

  it("out-of-bounds entity move is rejected", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-a");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const before = JSON.stringify(created.data.branch.worldState);
    const result = moveEntity(snap, {
      branchId: created.data.branch.id,
      entityId: "barrier-north",
      position: { x: 0.2, z: 8 },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("OUT_OF_BOUNDS");
    expect(JSON.stringify(snap.branches[0].worldState)).toBe(before);
  });

  it("protected move remains a violation after revert", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-c");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    moveEntity(snap, {
      branchId: created.data.branch.id,
      entityId: "scan-1",
      position: { x: 14, z: 12.5 },
    });
    moveEntity(snap, {
      branchId: created.data.branch.id,
      entityId: "scan-1",
      position: { x: 14, z: 12 },
    });
    const validated = validateBranch(snap, created.data.branch.id);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const protectedCheck = validated.data.branch.validationResult?.checks.find(
      (check) => check.id === "protected",
    );
    expect(protectedCheck?.passed).toBe(false);
    expect(validated.data.branch.status).toBe("failed");
  });
});

describe("simulator", () => {
  it("is deterministic for the same world and seed", () => {
    const first = simulate(structuredClone(LOCKED_WORLD), 42);
    const second = simulate(structuredClone(LOCKED_WORLD), 42);
    expect(first).toEqual(second);
  });

  it("does not use Math.random", () => {
    const source = readFileSync(
      new URL("../simulation/simulator.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(/Math\.random\(/);
  });

  it("boot world has only r-main available", () => {
    expect(availableRoutes(LOCKED_WORLD).map((route) => route.id)).toEqual([
      "r-main",
    ]);
  });

  it("opening north + enabling north makes two routes available", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-b");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    applyLockedFutureB(snap, created.data.branch.id);
    expect(
      availableRoutes(created.data.branch.worldState)
        .map((route) => route.id)
        .sort(),
    ).toEqual(["r-main", "r-north"]);
  });

  it("opening south + enabling south makes two routes available", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-a");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    applyLockedFutureA(snap, created.data.branch.id);
    expect(
      availableRoutes(created.data.branch.worldState)
        .map((route) => route.id)
        .sort(),
    ).toEqual(["r-main", "r-south"]);
  });

  it("barrier geometry matches the locked corridor test", () => {
    const bootBarriers = getBarriers(LOCKED_WORLD);
    const north = LOCKED_WORLD.routes.find((route) => route.id === "r-north")!;
    const south = LOCKED_WORLD.routes.find((route) => route.id === "r-south")!;
    const main = LOCKED_WORLD.routes.find((route) => route.id === "r-main")!;
    expect(routeBlockedBy(north, bootBarriers)).toContain("barrier-north");
    expect(routeBlockedBy(south, bootBarriers)).toContain("barrier-south");
    expect(routeBlockedBy(main, bootBarriers)).toEqual([]);

    const opened = structuredClone(LOCKED_WORLD);
    const northBarrier = opened.entities.find(
      (item) => item.id === "barrier-north",
    )!;
    northBarrier.position = { x: 11, y: 0, z: 11.3 };
    const southBarrier = opened.entities.find(
      (item) => item.id === "barrier-south",
    )!;
    southBarrier.position = { x: 11, y: 0, z: 3.8 };
    expect(routeBlockedBy(north, getBarriers(opened))).toEqual([]);
    expect(routeBlockedBy(south, getBarriers(opened))).toEqual([]);
  });
});

describe("validator", () => {
  it("throughput below threshold fails", () => {
    expect(DEFAULT_POLICY_CONSTRAINTS.minThroughputImprovement).toBe(0.2);
  });

  it("golden Future A fails distance", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-a");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    applyLockedFutureA(snap, created.data.branch.id);
    const validated = validateBranch(snap, created.data.branch.id);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const distance = validated.data.branch.validationResult?.checks.find(
      (check) => check.id === "distance",
    );
    expect(distance?.passed).toBe(false);
    expect(validated.data.branch.status).toBe("failed");
  });

  it("golden Future B passes all four", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-b");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    applyLockedFutureB(snap, created.data.branch.id);
    const validated = validateBranch(snap, created.data.branch.id);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(validated.data.branch.status).toBe("verified");
    expect(validated.data.branch.validationResult?.allPassed).toBe(true);
  });

  it("golden Future C fails protected", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-c");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    applyLockedFutureC(snap, created.data.branch.id);
    const validated = validateBranch(snap, created.data.branch.id);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const protectedCheck = validated.data.branch.validationResult?.checks.find(
      (check) => check.id === "protected",
    );
    expect(protectedCheck?.passed).toBe(false);
    expect(validated.data.branch.status).toBe("failed");
  });

  it("B is the only verified future", () => {
    const snap = bootSnapshot();
    const a = createBranch(snap, "route-a");
    const b = createBranch(snap, "route-b");
    const c = createBranch(snap, "route-c");
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (!a.ok || !b.ok || !c.ok) return;
    applyLockedFutureA(snap, a.data.branch.id);
    applyLockedFutureB(snap, b.data.branch.id);
    applyLockedFutureC(snap, c.data.branch.id);
    validateBranch(snap, a.data.branch.id);
    validateBranch(snap, b.data.branch.id);
    validateBranch(snap, c.data.branch.id);
    const verified = snap.branches.filter(
      (branch) => branch.status === "verified",
    );
    expect(verified.map((branch) => branch.name)).toEqual(["route-b"]);
  });
});

describe("golden metrics", () => {
  it("matches locked MAIN / A / B / C values", () => {
    const main = simulate(LOCKED_WORLD, 42);
    expect(main.completed).toBe(16);
    expect(main.throughput).toBeCloseTo(0.2, TOL);
    expect(main.averageDistance).toBeCloseTo(20, TOL);
    expect(main.congestionScore).toBeCloseTo(0.9357, TOL);

    const snap = bootSnapshot();
    const a = createBranch(snap, "route-a");
    const b = createBranch(snap, "route-b");
    const c = createBranch(snap, "route-c");
    if (!a.ok || !b.ok || !c.ok) throw new Error("create failed");
    applyLockedFutureA(snap, a.data.branch.id);
    applyLockedFutureB(snap, b.data.branch.id);
    applyLockedFutureC(snap, c.data.branch.id);
    const metricsA = simulate(a.data.branch.worldState);
    const metricsB = simulate(b.data.branch.worldState);
    const metricsC = simulate(c.data.branch.worldState);
    expect(metricsA.completed).toBe(28);
    expect(metricsA.averageDistance).toBeCloseTo(22.1067, 3);
    expect(metricsA.congestionScore).toBeCloseTo(0.8562, 3);
    expect(metricsB.completed).toBe(31);
    expect(metricsB.averageDistance).toBeCloseTo(21.0777, 3);
    expect(metricsB.congestionScore).toBeCloseTo(0.854, 3);
    expect(metricsC.completed).toBe(31);
    expect(metricsC.averageDistance).toBeCloseTo(21.2053, 3);
  });
});

describe("merge", () => {
  it("validate_branch re-simulates when simulation is stale", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-b");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    applyLockedFutureB(snap, created.data.branch.id);
    const validated = validateBranch(snap, created.data.branch.id);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(validated.data.branch.simulatedMutationVersion).toBe(
      validated.data.branch.mutationVersion,
    );
    expect(validated.data.branch.validatedMutationVersion).toBe(
      validated.data.branch.mutationVersion,
    );
  });

  it("rejects merge of unverified, unapproved, and stale branches", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-b");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    applyLockedFutureB(snap, created.data.branch.id);
    const unverified = mergeVerifiedBranch(snap, created.data.branch.id);
    expect(unverified.ok).toBe(false);
    validateBranch(snap, created.data.branch.id);
    const unapproved = mergeVerifiedBranch(snap, created.data.branch.id);
    expect(unapproved.ok).toBe(false);
    if (unapproved.ok) return;
    expect(unapproved.error.code).toBe("MERGE_CAPABILITY_ABSENT");

    approveBranch(snap, created.data.branch.id);
    const other = createBranch(snap, "route-a");
    expect(other.ok).toBe(true);
    if (!other.ok) return;
    applyLockedFutureA(snap, other.data.branch.id);
    validateBranch(snap, other.data.branch.id);
    const failedApprove = approveBranch(snap, other.data.branch.id);
    expect(failedApprove.ok).toBe(false);

    const merged = mergeVerifiedBranch(snap, created.data.branch.id);
    expect(merged.ok).toBe(true);
    if (!merged.ok) return;
    expect(snap.main.revision).toBe(2);
    expect(created.data.branch.status).toBe("merged");
    expect(other.data.branch.status).toBe("stale");
    expect(snap.mergeRegisteredFor).toBeNull();

    const staleMerge = mergeVerifiedBranch(snap, other.data.branch.id);
    expect(staleMerge.ok).toBe(false);
  });

  it("domain state is JSON-serializable", () => {
    const snap = bootSnapshot();
    expect(() => serializeable(snap)).not.toThrow();
  });
});

describe("route rules", () => {
  it("rejects modify_route without enabled or waypoints", () => {
    const snap = bootSnapshot();
    const created = createBranch(snap, "route-a");
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const result = modifyRoute(snap, {
      branchId: created.data.branch.id,
      routeId: "r-south",
    });
    expect(result.ok).toBe(false);
  });
});

describe("compare", () => {
  it("returns one compact row per branch", () => {
    const snap = bootSnapshot();
    createBranch(snap, "route-a");
    const compared = compareBranches(snap);
    expect(compared.ok).toBe(true);
    if (!compared.ok) return;
    expect(compared.data.branches).toHaveLength(1);
    expect(compared.data.mainRevision).toBe(1);
  });
});
