import type { ConstraintSet } from "../domain/world";

export const HARD_CONSTRAINTS: ConstraintSet = {
  minThroughputImprovement: 0.2,
  maxDistanceIncrease: 0.1,
  maxProtectedMoved: 0,
  maxCongestionRatio: 1,
};

export const CONSTRAINT_COPY = [
  {
    id: "throughput" as const,
    label: "Throughput",
    required: "≥ +20% vs baseline",
  },
  {
    id: "distance" as const,
    label: "Travel distance",
    required: "≤ +10% vs baseline",
  },
  {
    id: "protected" as const,
    label: "Protected equipment",
    required: "0 protected moves",
  },
  {
    id: "congestion" as const,
    label: "Congestion",
    required: "≤ baseline",
  },
];
