import type { WorldState } from "../domain/world";
import { EntityMesh } from "./EntityMesh";

export function WorldDiffOverlay({
  current,
  main,
}: {
  current: WorldState;
  main: WorldState;
}) {
  const ghosts = main.entities.filter((mainEntity) => {
    const live = current.entities.find((item) => item.id === mainEntity.id);
    if (!live) return false;
    return (
      live.position.x !== mainEntity.position.x ||
      live.position.z !== mainEntity.position.z
    );
  });

  if (ghosts.length === 0) return null;

  return (
    <group>
      {ghosts.map((entity) => (
        <EntityMesh key={`ghost-${entity.id}`} entity={entity} dimmed />
      ))}
    </group>
  );
}
