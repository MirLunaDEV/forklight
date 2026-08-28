import { Line } from "@react-three/drei";
import { useMemo } from "react";
import type { WorldState } from "../domain/world";
import { getBarriers, routeBlockedBy } from "../simulation/geometry";

const ROUTE_COLOR: Record<string, string> = {
  "r-main": "#d5dae3",
  "r-north": "#6db3c4",
  "r-south": "#b6a48a",
};

export function RouteLines({ world }: { world: WorldState }) {
  const barriers = useMemo(() => getBarriers(world), [world]);
  return (
    <group>
      {world.routes.map((route) => {
        const blocked = routeBlockedBy(route, barriers).length > 0;
        const active = route.enabled && !blocked;
        const points = route.waypoints.map(
          (point) => [point.x, 0.12, point.z] as [number, number, number],
        );
        return (
          <Line
            key={route.id}
            points={points}
            color={ROUTE_COLOR[route.id] ?? "#9aa3b0"}
            lineWidth={active ? 2.4 : 1.2}
            dashed={!active}
            dashSize={0.45}
            gapSize={0.32}
            transparent
            opacity={active ? 0.95 : 0.28}
          />
        );
      })}
    </group>
  );
}
