import type { Entity, Route, RouteWaypoint, WorldState } from "../domain/world";
import { FLOOR } from "../domain/world";

export function polylineLength(waypoints: RouteWaypoint[]): number {
  let length = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].x - waypoints[i - 1].x;
    const dz = waypoints[i].z - waypoints[i - 1].z;
    length += Math.hypot(dx, dz);
  }
  return length;
}

export function distance2(a: RouteWaypoint, b: RouteWaypoint): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function isInsideFloor(x: number, z: number): boolean {
  return x >= 0 && x <= FLOOR.width && z >= 0 && z <= FLOOR.depth;
}

export interface Aabb2 {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function barrierAabb(entity: Entity): Aabb2 {
  return {
    minX: entity.position.x - entity.size.w / 2,
    maxX: entity.position.x + entity.size.w / 2,
    minZ: entity.position.z - entity.size.d / 2,
    maxZ: entity.position.z + entity.size.d / 2,
  };
}

/**
 * Liang–Barsky segment vs AABB on x/z, inclusive of the boundary.
 * A degenerate point-segment still counts if it lies inside the box.
 */
export function segmentIntersectsAabb(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  box: Aabb2,
): boolean {
  const dx = x1 - x0;
  const dz = z1 - z0;
  let t0 = 0;
  let t1 = 1;

  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };

  if (!clip(-dx, x0 - box.minX)) return false;
  if (!clip(dx, box.maxX - x0)) return false;
  if (!clip(-dz, z0 - box.minZ)) return false;
  if (!clip(dz, box.maxZ - z0)) return false;
  return t0 <= t1;
}

export function routeBlockedBy(
  route: Route,
  barriers: Entity[],
): string[] {
  const blockers: string[] = [];
  const pts = route.waypoints;
  if (pts.length < 2) return blockers;
  for (const barrier of barriers) {
    const box = barrierAabb(barrier);
    for (let i = 1; i < pts.length; i++) {
      if (
        segmentIntersectsAabb(
          pts[i - 1].x,
          pts[i - 1].z,
          pts[i].x,
          pts[i].z,
          box,
        )
      ) {
        blockers.push(barrier.id);
        break;
      }
    }
  }
  return blockers;
}

export interface PreparedRoute {
  id: string;
  name: string;
  speed: number;
  capacity: number;
  length: number;
  waypoints: RouteWaypoint[];
}

export function getBarriers(world: WorldState): Entity[] {
  return world.entities.filter((entity) => entity.type === "barrier");
}

export function inspectRoutes(world: WorldState): Array<{
  id: string;
  name: string;
  enabled: boolean;
  capacity: number;
  length: number;
  blockedBy: string[];
}> {
  const barriers = getBarriers(world);
  return world.routes.map((route) => ({
    id: route.id,
    name: route.name,
    enabled: route.enabled,
    capacity: route.capacity,
    length: polylineLength(route.waypoints),
    blockedBy: routeBlockedBy(route, barriers),
  }));
}

export function availableRoutes(world: WorldState): PreparedRoute[] {
  const barriers = getBarriers(world);
  const candidates: PreparedRoute[] = [];
  for (const route of world.routes) {
    if (!route.enabled) continue;
    if (routeBlockedBy(route, barriers).length > 0) continue;
    candidates.push({
      id: route.id,
      name: route.name,
      speed: route.speed,
      capacity: route.capacity,
      length: polylineLength(route.waypoints),
      waypoints: route.waypoints,
    });
  }
  candidates.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return candidates;
}

export function pointOnPolyline(
  waypoints: RouteWaypoint[],
  distance: number,
): { x: number; z: number } {
  if (waypoints.length === 0) return { x: 0, z: 0 };
  if (waypoints.length === 1) return { x: waypoints[0].x, z: waypoints[0].z };
  const total = polylineLength(waypoints);
  let remaining = Math.max(0, Math.min(distance, total));
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].x - waypoints[i - 1].x;
    const dz = waypoints[i].z - waypoints[i - 1].z;
    const seg = Math.hypot(dx, dz);
    if (seg === 0) continue;
    if (remaining <= seg) {
      const t = remaining / seg;
      return {
        x: waypoints[i - 1].x + dx * t,
        z: waypoints[i - 1].z + dz * t,
      };
    }
    remaining -= seg;
  }
  const last = waypoints[waypoints.length - 1];
  return { x: last.x, z: last.z };
}
