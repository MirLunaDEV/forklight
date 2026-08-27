import { ratioDelta } from "../domain/metrics";
import type {
  Branch,
  SimulationMetrics,
  ValidationCheck,
  ValidationResult,
} from "../domain/world";
import { HARD_CONSTRAINTS } from "./rules";

function formatPct(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function countProtectedMoves(branch: Branch): number {
  return branch.changes.filter((change) => change.touchedProtectedEntity).length;
}

export function derivedDeltas(
  candidate: SimulationMetrics,
  baseline: SimulationMetrics,
): {
  throughputImprovement: number;
  distanceIncrease: number;
  congestionRatio: number;
} {
  return {
    throughputImprovement: ratioDelta(candidate.throughput, baseline.throughput),
    distanceIncrease: ratioDelta(
      candidate.averageDistance,
      baseline.averageDistance,
    ),
    congestionRatio:
      baseline.congestionScore === 0
        ? candidate.congestionScore === 0
          ? 0
          : Number.POSITIVE_INFINITY
        : candidate.congestionScore / baseline.congestionScore,
  };
}

export function validateMetrics(
  branch: Branch,
  candidate: SimulationMetrics,
  baseline: SimulationMetrics | null,
): ValidationResult {
  const protectedMoved = countProtectedMoves(branch);

  if (
    !baseline ||
    baseline.throughput <= 0 ||
    baseline.averageDistance <= 0 ||
    (baseline.congestionScore <= 0 && candidate.congestionScore > 0)
  ) {
    return {
      allPassed: false,
      checks: [
        {
          id: "throughput",
          passed: false,
          actual: candidate.throughput,
          required: "baseline present and positive",
          message: "Fail closed: baseline is missing or not positive.",
        },
        {
          id: "distance",
          passed: false,
          actual: candidate.averageDistance,
          required: "baseline present and positive",
          message: "Fail closed: baseline is missing or not positive.",
        },
        {
          id: "protected",
          passed: protectedMoved === HARD_CONSTRAINTS.maxProtectedMoved,
          actual: protectedMoved,
          required: "0",
          message: `Protected: ${protectedMoved} (need 0)`,
        },
        {
          id: "congestion",
          passed: false,
          actual: candidate.congestionScore,
          required: "≤ baseline",
          message: "Fail closed: baseline congestion is not usable.",
        },
      ],
    };
  }

  const deltas = derivedDeltas(candidate, baseline);

  const throughputPass =
    deltas.throughputImprovement >= HARD_CONSTRAINTS.minThroughputImprovement;
  const distancePass =
    deltas.distanceIncrease <= HARD_CONSTRAINTS.maxDistanceIncrease;
  const protectedPass = protectedMoved === HARD_CONSTRAINTS.maxProtectedMoved;
  const congestionPass =
    candidate.congestionScore <= baseline.congestionScore;

  const checks: ValidationCheck[] = [
    {
      id: "throughput",
      passed: throughputPass,
      actual: deltas.throughputImprovement,
      required: "≥ +20%",
      message: `Throughput: ${formatPct(deltas.throughputImprovement)}  (need ≥ +20%) ${throughputPass ? "✓" : "✗"}`,
    },
    {
      id: "distance",
      passed: distancePass,
      actual: deltas.distanceIncrease,
      required: "≤ +10%",
      message: `Distance: ${formatPct(deltas.distanceIncrease)}  (need ≤ +10%) ${distancePass ? "✓" : "✗"}`,
    },
    {
      id: "protected",
      passed: protectedPass,
      actual: protectedMoved,
      required: "0",
      message: `Protected: ${protectedMoved}  (need 0) ${protectedPass ? "✓" : "✗"}`,
    },
    {
      id: "congestion",
      passed: congestionPass,
      actual: deltas.congestionRatio,
      required: "≤ baseline",
      message: `Congestion: ${candidate.congestionScore.toFixed(2)}  (baseline ${baseline.congestionScore.toFixed(2)}) ${congestionPass ? "✓" : "✗"}`,
    },
  ];

  return {
    allPassed: checks.every((check) => check.passed),
    checks,
  };
}
