import type { ConstraintSet, GoalPolicy, PolicyStatus } from "../domain/world";

export const DEFAULT_POLICY_CONSTRAINTS: ConstraintSet = {
  minThroughputImprovement: 0.2,
  maxDistanceIncrease: 0.1,
  maxProtectedMoved: 0,
  maxCongestionRatio: 1,
};

export const POLICY_CONSTRAINT_LIMITS = {
  minThroughputImprovement: { min: 0, max: 1, step: 0.05 },
  maxDistanceIncrease: { min: 0, max: 0.5, step: 0.01 },
  maxProtectedMoved: { min: 0, max: 5, step: 1 },
  maxCongestionRatio: { min: 1, max: 1.5, step: 0.05 },
} as const satisfies Record<keyof ConstraintSet, { min: number; max: number; step: number }>;

export function createGoalPolicy(status: PolicyStatus = "draft"): GoalPolicy {
  return {
    status,
    definedBy: "human",
    ...DEFAULT_POLICY_CONSTRAINTS,
  };
}
