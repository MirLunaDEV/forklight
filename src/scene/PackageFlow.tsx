import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import type { WorldState } from "../domain/world";
import { availableRoutes, pointOnPolyline } from "../simulation/geometry";

export function PackageFlow({ world }: { world: WorldState }) {
  const routes = useMemo(() => availableRoutes(world), [world]);
  const group = useRef<Group>(null);
  const packages = useMemo(() => {
    const items: Array<{
      routeIndex: number;
      offset: number;
      phase: number;
    }> = [];
    routes.forEach((_route, routeIndex) => {
      const count = 5;
      for (let i = 0; i < count; i++) {
        items.push({
          routeIndex,
          offset: i / count,
          phase: i * 0.37,
        });
      }
    });
    return items;
  }, [routes]);

  useFrame((state) => {
    const groupNode = group.current;
    if (!groupNode) return;
    const elapsed = state.clock.elapsedTime;
    packages.forEach((item, index) => {
      const child = groupNode.children[index];
      const route = routes[item.routeIndex];
      if (!child || !route || route.length <= 0) return;
      const t = (item.offset + elapsed * 0.045) % 1;
      const point = pointOnPolyline(route.waypoints, t * route.length);
      child.position.set(point.x, 0.28, point.z);
      child.rotation.y = elapsed * 0.4 + item.phase;
    });
  });

  if (packages.length === 0) return null;

  return (
    <group ref={group}>
      {packages.map((item, index) => (
        <mesh key={`${item.routeIndex}-${index}`} castShadow>
          <boxGeometry args={[0.38, 0.28, 0.32]} />
          <meshStandardMaterial
            color="#8a7048"
            roughness={0.85}
            metalness={0.04}
          />
        </mesh>
      ))}
    </group>
  );
}
