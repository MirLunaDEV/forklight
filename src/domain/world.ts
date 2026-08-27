export type EntityType =
  "machine" | "barrier" | "spawn" | "destination" | "junction";

export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  position: Vec3;
  size: { w: number; h: number; d: number };
  protected: boolean;
  capacity: number;
}

export interface RouteWaypoint {
  x: number;
  z: number;
}

export interface Route {
  id: string;
  name: string;
  sourceId: string;
  targetId: string;
  waypoints: RouteWaypoint[];
  speed: number;
  capacity: number;
  enabled: boolean;
}

export interface SimulationMetrics {
  seed: number;
  ticks: number;
  packages: number;
  spawned: number;
  completed: number;
  throughput: number;
  averageDistance: number;
  averageTravelTime: number;
  congestionScore: number;
}

export interface WorldState {
  revision: number;
  seed: number;
  name: string;
  entities: Entity[];
  routes: Route[];
  baselineMetrics: SimulationMetrics | null;
}

export interface ConstraintSet {
  minThroughputImprovement: number;
  maxDistanceIncrease: number;
  maxProtectedMoved: number;
  maxCongestionRatio: number;
}

export type PolicyStatus = "draft" | "locked";

export interface GoalPolicy extends ConstraintSet {
  status: PolicyStatus;
  definedBy: "human";
}

export interface Change {
  id: string;
  at: number;
  tool: "move_entity" | "modify_route";
  summary: string;
  payload: unknown;
  touchedProtectedEntity: boolean;
}

export type BranchStatus =
  "draft" | "simulated" | "verified" | "failed" | "stale" | "merged";

export interface ValidationCheck {
  id: "throughput" | "distance" | "protected" | "congestion";
  passed: boolean;
  actual: number;
  required: string;
  message: string;
}

export interface ValidationResult {
  allPassed: boolean;
  checks: ValidationCheck[];
}

export interface Branch {
  id: string;
  name: string;
  baseRevision: number;
  worldState: WorldState;
  changes: Change[];
  mutationVersion: number;
  simulatedMutationVersion: number | null;
  validatedMutationVersion: number | null;
  metrics: SimulationMetrics | null;
  validationResult: ValidationResult | null;
  status: BranchStatus;
}

export interface TimelineEvent {
  id: string;
  ts: number;
  tool: string;
  status: "start" | "success" | "error";
  durationMs?: number;
  summary: string;
  source: "webmcp" | "qa" | "human";
}

export interface ApprovalState {
  branchId: string | null;
  approvedAt: number | null;
}

export interface CommandError {
  code: string;
  message: string;
}

export type CommandResult<T> =
  { ok: true; data: T } | { ok: false; error: CommandError };

export const FLOOR = { width: 24, depth: 16 } as const;
export const MOVABLE_BOUNDS = { minX: 1, maxX: 23, minZ: 1, maxZ: 15 } as const;
export const WAYPOINT_SNAP_M = 1.5;
