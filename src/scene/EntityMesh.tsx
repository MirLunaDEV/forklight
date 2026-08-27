import { Edges, Html } from "@react-three/drei";
import type { Entity } from "../domain/world";

const TYPE_COLOR: Record<Entity["type"], string> = {
  spawn: "#4d7a72",
  destination: "#5a6e86",
  machine: "#6a6558",
  junction: "#7a7468",
  barrier: "#5c4038",
};

export function EntityMesh({
  entity,
  dimmed = false,
}: {
  entity: Entity;
  dimmed?: boolean;
}) {
  const color = TYPE_COLOR[entity.type];
  const y = entity.size.h / 2;
  const isJunction = entity.type === "junction";

  return (
    <group position={[entity.position.x, 0, entity.position.z]}>
      <mesh
        position={[0, y, 0]}
        castShadow
        receiveShadow
        renderOrder={dimmed ? 0 : 1}
      >
        {isJunction ? (
          <cylinderGeometry
            args={[entity.size.w / 2, entity.size.w / 2, entity.size.h, 16]}
          />
        ) : (
          <boxGeometry args={[entity.size.w, entity.size.h, entity.size.d]} />
        )}
        <meshStandardMaterial
          color={color}
          roughness={0.72}
          metalness={0.12}
          transparent={dimmed}
          opacity={dimmed ? 0.28 : 1}
          emissive={entity.protected ? "#6db3c4" : "#000000"}
          emissiveIntensity={entity.protected && !dimmed ? 0.12 : 0}
          depthWrite={!dimmed}
        />
        {!dimmed ? (
          <Edges
            color={entity.protected ? "#6db3c4" : "#1a1c22"}
            threshold={22}
          />
        ) : null}
      </mesh>
      {entity.protected && !dimmed ? (
        <mesh position={[0, entity.size.h + 0.22, 0]}>
          <torusGeometry args={[0.11, 0.03, 8, 14]} />
          <meshStandardMaterial
            color="#6db3c4"
            emissive="#6db3c4"
            emissiveIntensity={0.35}
            roughness={0.4}
          />
        </mesh>
      ) : null}
      {!dimmed ? (
        <Html
          position={[0, entity.size.h + 0.55, 0]}
          center
          distanceFactor={14}
          style={{ pointerEvents: "none" }}
        >
          <div className="entity-label">{entity.name}</div>
        </Html>
      ) : null}
    </group>
  );
}
