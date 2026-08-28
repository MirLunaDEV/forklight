import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { useAppStore } from "../state/appStore";
import { EntityMesh } from "./EntityMesh";
import { PackageFlow } from "./PackageFlow";
import { RouteLines } from "./RouteLines";
import { WorldDiffOverlay } from "./WorldDiffOverlay";

function Floor() {
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[12, 0, 8]}
        receiveShadow
      >
        <planeGeometry args={[24, 16]} />
        <meshStandardMaterial
          color="#2a303c"
          roughness={0.92}
          metalness={0.08}
        />
      </mesh>
      <gridHelper
        args={[24, 24, "#5a6474", "#3a4250"]}
        position={[12, 0.03, 8]}
        scale={[1, 1, 16 / 24]}
      />
      <mesh position={[12, 1.2, -0.18]} receiveShadow>
        <boxGeometry args={[24.4, 2.4, 0.36]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.9} />
      </mesh>
      <mesh position={[12, 1.2, 16.18]} receiveShadow>
        <boxGeometry args={[24.4, 2.4, 0.36]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.9} />
      </mesh>
      <mesh position={[-0.18, 1.2, 8]} receiveShadow>
        <boxGeometry args={[0.36, 2.4, 16.4]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.9} />
      </mesh>
      <mesh position={[24.18, 1.2, 8]} receiveShadow>
        <boxGeometry args={[0.36, 2.4, 16.4]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.9} />
      </mesh>
      <Html position={[12, 0.05, 15.5]} center style={{ pointerEvents: "none" }}>
        <span className="compass-label">N</span>
      </Html>
      <Html position={[12, 0.05, 0.5]} center style={{ pointerEvents: "none" }}>
        <span className="compass-label">S</span>
      </Html>
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#d5dde8", "#2a241c", 0.7]} />
      <directionalLight
        position={[16, 22, 12]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <directionalLight position={[-8, 12, -6]} intensity={0.35} />
    </>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(18, 16, 28);
    camera.lookAt(12, 0, 8);
    camera.updateProjectionMatrix();
  }, [camera]);
  return (
    <OrbitControls
      makeDefault
      target={[12, 0.2, 8]}
      enablePan
      enableDamping
      dampingFactor={0.08}
      minDistance={10}
      maxDistance={42}
      maxPolarAngle={Math.PI / 2.15}
      minPolarAngle={0.35}
    />
  );
}

function WorldContent() {
  const selectedView = useAppStore((state) => state.selectedView);
  const main = useAppStore((state) => state.main);
  const branches = useAppStore((state) => state.branches);
  const world = useMemo(() => {
    if (selectedView === "main") return main;
    return (
      branches.find(
        (branch) => branch.id === selectedView || branch.name === selectedView,
      )?.worldState ?? main
    );
  }, [selectedView, main, branches]);
  const stale = useMemo(() => {
    if (selectedView === "main") return false;
    return (
      branches.find(
        (branch) => branch.id === selectedView || branch.name === selectedView,
      )?.status === "stale"
    );
  }, [selectedView, branches]);

  return (
    <group>
      <Floor />
      <RouteLines world={world} />
      {selectedView !== "main" ? (
        <WorldDiffOverlay current={world} main={main} />
      ) : null}
      {world.entities.map((entity) => (
        <EntityMesh key={entity.id} entity={entity} dimmed={stale} />
      ))}
      {!stale ? <PackageFlow world={world} /> : null}
    </group>
  );
}

export default function Warehouse() {
  return (
    <Canvas
      className="warehouse-canvas"
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [18, 16, 28], fov: 40, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor("#0c0d10");
        camera.lookAt(12, 0, 8);
      }}
    >
      <color attach="background" args={["#141820"]} />
      <fog attach="fog" args={["#141820", 40, 80]} />
      <Lights />
      <WorldContent />
      <CameraRig />
    </Canvas>
  );
}
