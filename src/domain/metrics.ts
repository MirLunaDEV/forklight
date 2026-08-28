import type { SimulationMetrics } from "./world";

export function cloneMetrics(
  metrics: SimulationMetrics | null,
): SimulationMetrics | null {
  return metrics === null ? null : structuredClone(metrics);
}

export function ratioDelta(candidate: number, baseline: number): number {
  if (baseline === 0) return candidate === 0 ? 0 : Number.POSITIVE_INFINITY;
  return (candidate - baseline) / baseline;
}
