'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useSceneStore, SceneObject } from '@/stores/sceneStore';
import * as THREE from 'three';

function AxesHelper({ size }: { size: number }) {
  return (
    <group>
      <mesh position={[size / 2, 0, 0]}>
        <boxGeometry args={[size, 0.05, 0.05]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <mesh position={[0, size / 2, 0]}>
        <boxGeometry args={[0.05, size, 0.05]} />
        <meshBasicMaterial color="green" />
      </mesh>
      <mesh position={[0, 0, size / 2]}>
        <boxGeometry args={[0.05, 0.05, size]} />
        <meshBasicMaterial color="blue" />
      </mesh>
    </group>
  );
}

function Box({ object, isSelected, onClick }: { object: SceneObject; isSelected: boolean; onClick: () => void }) {
  const { geometry, material, transform } = object;

  return (
    <mesh
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <boxGeometry args={[geometry.width as number, geometry.height as number, geometry.depth as number]} />
      <meshStandardMaterial
        color={material.color}
        opacity={material.opacity}
        transparent={material.opacity < 1}
        wireframe={material.wireframe}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(geometry.width as number, geometry.height as number, geometry.depth as number)]} />
          <lineBasicMaterial color="#00d9ff" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}

function SceneContent() {
  const { objects, selectedId, setSelectedId, showGrid, showAxes } = useSceneStore();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Camera Controls */}
      <OrbitControls makeDefault />

      {/* Grid */}
      {showGrid && <Grid args={[20, 20]} cellSize={1} cellColor="#333" sectionSize={5} sectionColor="#555" fadeDistance={50} />}

      {/* Axes */}
      {showAxes && <AxesHelper size={5} />}

      {/* Objects */}
      {objects.map((obj) => (
        <Box
          key={obj.id}
          object={obj}
          isSelected={selectedId === obj.id}
          onClick={() => setSelectedId(obj.id)}
        />
      ))}
    </>
  );
}

export default function SceneCanvas() {
  return (
    <div className="w-full h-full bg-[#0a0a0f]">
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <SceneContent />
      </Canvas>
    </div>
  );
}
