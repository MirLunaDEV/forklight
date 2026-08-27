import type { SimulationMetrics, WorldState } from "../domain/world";
import { availableRoutes } from "./geometry";

export const TICKS = 240;
export const PACKAGES = 80;
export const SPAWN_EVERY = 2;

interface SimPackage {
  spawnTick: number;
  progress: number;
}

interface RouteLane {
  id: string;
  speed: number;
  capacity: number;
  length: number;
  queue: SimPackage[];
  moving: SimPackage[];
}

/**
 * Deterministic discrete-flow simulator.
 * Forbidden: Math.random, Date, DOM, stores, React, Three.js.
 *
 * Occupancy for congestion is counted after admission and before movement,
 * so a package that completes this tick still occupied a slot.
 */
export function simulate(
  world: WorldState,
  seed = world.seed,
): SimulationMetrics {
  const prepared = availableRoutes(world);
  const lanes: RouteLane[] = prepared.map((route) => ({
    id: route.id,
    speed: route.speed,
    capacity: route.capacity,
    length: route.length,
    queue: [],
    moving: [],
  }));

  let spawned = 0;
  let completed = 0;
  let totalWaitingPackageTicks = 0;
  let totalMovingPackageTicks = 0;
  let totalPlannedDistance = 0;
  let totalTravelTime = 0;

  for (let tick = 0; tick < TICKS; tick++) {
    if (spawned < PACKAGES && tick % SPAWN_EVERY === 0 && lanes.length > 0) {
      const lane = lanes[spawned % lanes.length];
      lane.queue.push({ spawnTick: tick, progress: 0 });
      totalPlannedDistance += lane.length;
      spawned += 1;
    }

    for (const lane of lanes) {
      while (lane.moving.length < lane.capacity && lane.queue.length > 0) {
        const next = lane.queue.shift();
        if (next) lane.moving.push(next);
      }

      totalWaitingPackageTicks += lane.queue.length;
      totalMovingPackageTicks += lane.moving.length;

      const stillMoving: SimPackage[] = [];
      for (const pkg of lane.moving) {
        pkg.progress += lane.speed;
        if (pkg.progress >= lane.length) {
          completed += 1;
          totalTravelTime += tick - pkg.spawnTick;
        } else {
          stillMoving.push(pkg);
        }
      }
      lane.moving = stillMoving;
    }
  }

  const averageDistance = spawned === 0 ? 0 : totalPlannedDistance / spawned;
  const averageTravelTime = completed === 0 ? 0 : totalTravelTime / completed;
  const denom = Math.max(1, totalWaitingPackageTicks + totalMovingPackageTicks);
  const congestionScore = totalWaitingPackageTicks / denom;

  return {
    seed,
    ticks: TICKS,
    packages: PACKAGES,
    spawned,
    completed,
    throughput: completed / PACKAGES,
    averageDistance,
    averageTravelTime,
    congestionScore,
  };
}
