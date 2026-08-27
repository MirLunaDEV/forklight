import type { ConstraintSet, GoalPolicy, PolicyStatus } from "../domain/world";

export const HARD_CONSTRAINTS: ConstraintSet = {
  minThroughputImprovement: 0.2,
  maxDistanceIncrease: 0.1,
  maxProtectedMoved: 0,
  maxCongestionRatio: 1,
};

export function createGoalPolicy(status: PolicyStatus = "draft"): GoalPolicy {
  return {
    status,
    definedBy: "human",
    ...HARD_CONSTRAINTS,
  };
}
