'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
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

// Render any scene object
function SceneObject3D({ object, isSelected, onClick }: {
  object: SceneObject;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { geometry, material, transform, type } = object;

  const position: [number, number, number] = [
    typeof transform.position[0] === 'number' ? transform.position[0] : 0,
    typeof transform.position[1] === 'number' ? transform.position[1] : 0,
    typeof transform.position[2] === 'number' ? transform.position[2] : 0,
  ];

  if (type === 'box') {
    return (
      <mesh position={position} rotation={transform.rotation} scale={transform.scale} onClick={onClick}>
        <boxGeometry args={[
          (geometry.width as number) || 1,
          (geometry.height as number) || 1,
          (geometry.depth as number) || 1
        ]} />
        <meshStandardMaterial
          color={material.color}
          opacity={material.opacity}
          transparent={material.opacity < 1}
          wireframe={material.wireframe}
        />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(
              (geometry.width as number) || 1,
              (geometry.height as number) || 1,
              (geometry.depth as number) || 1
            )]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </mesh>
    );
  }

  if (type === 'sphere') {
    return (
      <mesh position={position} rotation={transform.rotation} scale={transform.scale} onClick={onClick}>
        <sphereGeometry args={[(geometry.radius as number) || 0.5, 32, 32]} />
        <meshStandardMaterial
          color={material.color}
          opacity={material.opacity}
          transparent={material.opacity < 1}
          wireframe={material.wireframe}
        />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.SphereGeometry((geometry.radius as number) || 0.5, 16, 16)]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </mesh>
    );
  }

  if (type === 'cylinder') {
    return (
      <mesh position={position} rotation={transform.rotation} scale={transform.scale} onClick={onClick}>
        <cylinderGeometry args={[
          (geometry.radius as number) || 0.5,
          (geometry.radius as number) || 0.5,
          (geometry.height as number) || 1,
          32
        ]} />
        <meshStandardMaterial
          color={material.color}
          opacity={material.opacity}
          transparent={material.opacity < 1}
          wireframe={material.wireframe}
        />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.CylinderGeometry(
              (geometry.radius as number) || 0.5,
              (geometry.radius as number) || 0.5,
              (geometry.height as number) || 1,
              16
            )]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </mesh>
    );
  }

  if (type === 'prism') {
    const sides = (geometry.sides as number) || 6;
    return (
      <mesh position={position} rotation={transform.rotation} scale={transform.scale} onClick={onClick}>
        <cylinderGeometry args={[0.5, 0.5, (geometry.height as number) || 1, sides]} />
        <meshStandardMaterial
          color={material.color}
          opacity={material.opacity}
          transparent={material.opacity < 1}
          wireframe={material.wireframe}
        />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.CylinderGeometry(0.5, 0.5, (geometry.height as number) || 1, sides)]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </mesh>
    );
  }

  if (type === 'line') {
    const rawPoints = geometry.points;
    if (!rawPoints || !Array.isArray(rawPoints) || rawPoints.length < 2) return null;
    const points = rawPoints as unknown as [number, number, number][];
    if (points.length < 2) return null;
    return (
      <Line
        points={points}
        color={material.color}
        lineWidth={2}
        onClick={onClick}
      />
    );
  }

  if (type === 'polygon') {
    const rawPoints = geometry.points;
    if (!rawPoints || !Array.isArray(rawPoints) || rawPoints.length < 3) return null;
    const points = rawPoints as unknown as [number, number, number][];
    if (points.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][2]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][2]);
    }
    shape.closePath();
    const extrudeSettings = { depth: 0.01, bevelEnabled: false };
    return (
      <mesh position={position} rotation={transform.rotation} scale={transform.scale} onClick={onClick}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={material.color}
          opacity={material.opacity}
          transparent={material.opacity < 1}
          wireframe={material.wireframe}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  }

  return null;
}

// Ground plane for raycasting
function GroundPlane({ onClick, onMove }: {
  onClick: (point: [number, number, number]) => void;
  onMove: (point: [number, number, number]) => void;
}) {
  const planeRef = useRef<THREE.Mesh>(null);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const point = event.point;
    onMove([point.x, 0, point.z]);
  }, [onMove]);

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const point = event.point;
    onClick([point.x, 0, point.z]);
  }, [onClick]);

  return (
    <mesh
      ref={planeRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// Drawing preview for specific tools
function DrawingPreview({
  drawingState,
  mousePos
}: {
  drawingState: {
    phase: string;
    point1: [number, number, number] | null;
    point2: [number, number, number] | null;
    polygonPoints: [number, number, number][];
    controlPoints: [number, number, number][];
  };
  mousePos: [number, number, number];
}) {
  const { activeTool } = useSceneStore();

  // Line preview
  if (activeTool === 'line') {
    const linePoints: [number, number, number][] = [];
    if (drawingState.point1) {
      linePoints.push(drawingState.point1);
      linePoints.push(mousePos);
    }
    if (linePoints.length === 2) {
      return (
        <Line
          points={linePoints}
          color="#00d9ff"
          lineWidth={2}
          transparent
          opacity={0.7}
        />
      );
    }
  }

  // Cube preview - show rectangle on ground
  if (activeTool === 'cube' && drawingState.phase === 'placing') {
    const p1 = drawingState.point1;
    if (p1) {
      const width = Math.abs(mousePos[0] - p1[0]);
      const depth = Math.abs(mousePos[2] - p1[2]);
      const centerX = (p1[0] + mousePos[0]) / 2;
      const centerZ = (p1[2] + mousePos[2]) / 2;
      return (
        <mesh position={[centerX, 0.01, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, depth]} />
          <meshBasicMaterial color="#00d9ff" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      );
    }
  }

  // Cube preview with height
  if (activeTool === 'cube' && drawingState.phase === 'drag') {
    const p1 = drawingState.point1;
    if (p1) {
      const width = Math.abs((drawingState.point2?.[0] || 0) - p1[0]) || 1;
      const depth = Math.abs((drawingState.point2?.[2] || 0) - p1[2]) || 1;
      const height = Math.max(0.1, Math.abs(mousePos[1] - p1[1])) || 1;
      const centerX = (p1[0] + (drawingState.point2?.[0] || p1[0])) / 2;
      const centerZ = (p1[2] + (drawingState.point2?.[2] || p1[2])) / 2;
      const centerY = height / 2;
      return (
        <mesh position={[centerX, centerY, centerZ]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color="#4a90d9" transparent opacity={0.5} wireframe />
        </mesh>
      );
    }
  }

  // Sphere preview
  if (activeTool === 'sphere' && drawingState.point1) {
    const radius = Math.sqrt(
      Math.pow(mousePos[0] - drawingState.point1[0], 2) +
      Math.pow(mousePos[2] - drawingState.point1[2], 2)
    );
    return (
      <mesh position={drawingState.point1}>
        <sphereGeometry args={[Math.max(0.1, radius), 16, 16]} />
        <meshStandardMaterial color="#4a90d9" transparent opacity={0.5} wireframe />
      </mesh>
    );
  }

  // Cylinder preview - base
  if (activeTool === 'cylinder' && drawingState.phase === 'placing') {
    const p1 = drawingState.point1;
    if (p1) {
      const radius = Math.sqrt(
        Math.pow(mousePos[0] - p1[0], 2) +
        Math.pow(mousePos[2] - p1[2], 2)
      );
      return (
        <mesh position={[p1[0], 0.01, p1[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[Math.max(0.1, radius), 32]} />
          <meshBasicMaterial color="#4a90d9" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      );
    }
  }

  // Cylinder preview with height
  if (activeTool === 'cylinder' && drawingState.phase === 'drag') {
    const p1 = drawingState.point1;
    if (p1) {
      const radius = Math.sqrt(
        Math.pow((drawingState.point2?.[0] || p1[0]) - p1[0], 2) +
        Math.pow((drawingState.point2?.[2] || p1[2]) - p1[2], 2)
      ) || 0.5;
      const height = Math.max(0.1, Math.abs(mousePos[1] - p1[1])) || 1;
      const centerY = height / 2;
      return (
        <mesh position={[p1[0], centerY, p1[2]]}>
          <cylinderGeometry args={[radius, radius, height, 32]} />
          <meshStandardMaterial color="#4a90d9" transparent opacity={0.5} wireframe />
        </mesh>
      );
    }
  }

  // Prism preview - base
  if (activeTool === 'prism' && drawingState.phase === 'placing') {
    const p1 = drawingState.point1;
    if (p1) {
      const radius = Math.sqrt(
        Math.pow(mousePos[0] - p1[0], 2) +
        Math.pow(mousePos[2] - p1[2], 2)
      );
      return (
        <mesh position={[p1[0], 0.01, p1[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[Math.max(0.1, radius), 6]} />
          <meshBasicMaterial color="#4a90d9" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      );
    }
  }

  // Prism preview with height
  if (activeTool === 'prism' && drawingState.phase === 'drag') {
    const p1 = drawingState.point1;
    const sides = 6;
    if (p1) {
      const radius = Math.sqrt(
        Math.pow((drawingState.point2?.[0] || p1[0]) - p1[0], 2) +
        Math.pow((drawingState.point2?.[2] || p1[2]) - p1[2], 2)
      ) || 0.5;
      const height = Math.max(0.1, Math.abs(mousePos[1] - p1[1])) || 1;
      const centerY = height / 2;
      return (
        <mesh position={[p1[0], centerY, p1[2]]}>
          <cylinderGeometry args={[radius, radius, height, sides]} />
          <meshStandardMaterial color="#4a90d9" transparent opacity={0.5} wireframe />
        </mesh>
      );
    }
  }

  // Polygon preview
  if (activeTool === 'polygon') {
    const polyPoints = drawingState.polygonPoints || [];
    if (polyPoints.length > 0) {
      const allPoints = [...polyPoints, mousePos];
      if (allPoints.length >= 2) {
        return (
          <Line
            points={allPoints}
            color="#00d9ff"
            lineWidth={2}
            transparent
            opacity={0.7}
          />
        );
      }
    }
  }

  // Point markers for first/second clicks
  if (drawingState.point1) {
    return (
      <group>
        <mesh position={drawingState.point1}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
        {drawingState.point2 && (
          <mesh position={drawingState.point2}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        )}
      </group>
    );
  }

  return null;
}

function SceneContent({
  onGroundClick,
  onGroundMove
}: {
  onGroundClick: (point: [number, number, number]) => void;
  onGroundMove: (point: [number, number, number]) => void;
}) {
  const { objects, selectedId, setSelectedId, showGrid, showAxes, activeTool, drawingState } = useSceneStore();
  const [mousePos, setMousePos] = useState<[number, number, number]>([0, 0, 0]);

  const handleMouseMove = useCallback((point: [number, number, number]) => {
    setMousePos(point);
    onGroundMove(point);
  }, [onGroundMove]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Camera Controls - disable when drawing */}
      <OrbitControls
        makeDefault
        enabled={!activeTool || activeTool === 'select'}
      />

      {/* Grid */}
      {showGrid && <Grid args={[20, 20]} cellSize={1} cellColor="#333" sectionSize={5} sectionColor="#555" fadeDistance={50} />}

      {/* Axes */}
      {showAxes && <AxesHelper size={5} />}

      {/* Ground plane for click detection */}
      <GroundPlane onClick={onGroundClick} onMove={handleMouseMove} />

      {/* Drawing preview */}
      <DrawingPreview
        drawingState={drawingState}
        mousePos={mousePos}
      />

      {/* Objects */}
      {objects.map((obj) => (
        <SceneObject3D
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
  const { activeTool, drawingState, addObject, setSelectedId, setDrawingState, resetDrawing, objects } = useSceneStore();

  const handleGroundClick = useCallback((point: [number, number, number]) => {
    if (!activeTool || activeTool === 'select') return;

    const tool = activeTool;

    // LINE TOOL
    if (tool === 'line') {
      if (drawingState.phase === 'idle') {
        // Start line - first point
        setDrawingState({
          phase: 'placing',
          point1: point,
          polygonPoints: [point]
        });
      } else if (drawingState.phase === 'placing') {
        // Continue line - add point
        const newPoints = [...(drawingState.polygonPoints || []), point];
        const id = crypto.randomUUID();
        const lineObject: SceneObject = {
          id,
          name: `Line_${String(objects.filter(o => o.type === 'line').length + 1).padStart(2, '0')}`,
          type: 'line',
          geometry: { points: newPoints } as unknown as Record<string, number | number[]>,
          transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
          material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
          visible: true,
        };
        addObject(lineObject);
        setSelectedId(id);
        // Reset for next line segment
        setDrawingState({
          phase: 'placing',
          point1: point,
          polygonPoints: [point]
        });
      }
      return;
    }

    // POLYGON TOOL
    if (tool === 'polygon') {
      if (drawingState.phase === 'idle') {
        // Start polygon
        setDrawingState({
          phase: 'placing',
          point1: point,
          polygonPoints: [point]
        });
      } else if (drawingState.phase === 'placing') {
        const polyPoints = drawingState.polygonPoints || [];
        // Check if clicking near first point to close polygon
        if (polyPoints.length >= 3) {
          const firstPoint = polyPoints[0];
          const dist = Math.sqrt(
            Math.pow(point[0] - firstPoint[0], 2) +
            Math.pow(point[2] - firstPoint[2], 2)
          );
          if (dist < 0.2) {
            // Close polygon and create it
            const id = crypto.randomUUID();
            const polygonObject: SceneObject = {
              id,
              name: `Polygon_${String(objects.filter(o => o.type === 'polygon').length + 1).padStart(2, '0')}`,
              type: 'polygon',
              geometry: { points: polyPoints } as unknown as Record<string, number | number[]>,
              transform: { position: [0, 0.005, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
              material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
              visible: true,
            };
            addObject(polygonObject);
            setSelectedId(id);
            resetDrawing();
            return;
          }
        }
        // Add point to polygon
        setDrawingState({
          polygonPoints: [...polyPoints, point]
        });
      }
      return;
    }

    // CUBE TOOL
    if (tool === 'cube') {
      if (drawingState.phase === 'idle') {
        // First click - set base corner 1
        setDrawingState({
          phase: 'placing',
          point1: point
        });
      } else if (drawingState.phase === 'placing') {
        // Second click - set base corner 2, now drag for height
        setDrawingState({
          phase: 'drag',
          point2: point
        });
      } else if (drawingState.phase === 'drag') {
        // Third click - set height and create cube
        const p1 = drawingState.point1!;
        const p2 = drawingState.point2!;
        const width = Math.abs(p2[0] - p1[0]) || 1;
        const depth = Math.abs(p2[2] - p1[2]) || 1;
        const height = Math.abs(point[1] - p1[1]) || 1;

        const minX = Math.min(p1[0], p2[0]);
        const minZ = Math.min(p1[2], p2[2]);
        const posX = minX + width / 2;
        const posZ = minZ + depth / 2;
        const posY = height / 2;

        const id = crypto.randomUUID();
        const cubeObject: SceneObject = {
          id,
          name: `Cube_${String(objects.filter(o => o.type === 'box').length + 1).padStart(2, '0')}`,
          type: 'box',
          geometry: { width, height, depth },
          transform: {
            position: [posX, posY, posZ],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          },
          material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
          visible: true,
        };
        addObject(cubeObject);
        setSelectedId(id);
        resetDrawing();
      }
      return;
    }

    // CYLINDER TOOL
    if (tool === 'cylinder') {
      if (drawingState.phase === 'idle') {
        // First click - set center
        setDrawingState({
          phase: 'placing',
          point1: point
        });
      } else if (drawingState.phase === 'placing') {
        // Second click - set radius, now drag for height
        setDrawingState({
          phase: 'drag',
          point2: point
        });
      } else if (drawingState.phase === 'drag') {
        // Third click - set height and create cylinder
        const p1 = drawingState.point1!;
        const p2 = drawingState.point2!;
        const radius = Math.sqrt(
          Math.pow(p2[0] - p1[0], 2) +
          Math.pow(p2[2] - p1[2], 2)
        ) || 0.5;
        const height = Math.abs(point[1] - p1[1]) || 1;

        const id = crypto.randomUUID();
        const cylinderObject: SceneObject = {
          id,
          name: `Cylinder_${String(objects.filter(o => o.type === 'cylinder').length + 1).padStart(2, '0')}`,
          type: 'cylinder',
          geometry: { radius, height },
          transform: {
            position: [p1[0], height / 2, p1[2]],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          },
          material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
          visible: true,
        };
        addObject(cylinderObject);
        setSelectedId(id);
        resetDrawing();
      }
      return;
    }

    // PRISM TOOL
    if (tool === 'prism') {
      if (drawingState.phase === 'idle') {
        // First click - set center
        setDrawingState({
          phase: 'placing',
          point1: point
        });
      } else if (drawingState.phase === 'placing') {
        // Second click - set radius, now drag for height
        setDrawingState({
          phase: 'drag',
          point2: point
        });
      } else if (drawingState.phase === 'drag') {
        // Third click - set height and create prism
        const p1 = drawingState.point1!;
        const p2 = drawingState.point2!;
        const radius = Math.sqrt(
          Math.pow(p2[0] - p1[0], 2) +
          Math.pow(p2[2] - p1[2], 2)
        ) || 0.5;
        const height = Math.abs(point[1] - p1[1]) || 1;

        const id = crypto.randomUUID();
        const prismObject: SceneObject = {
          id,
          name: `Prism_${String(objects.filter(o => o.type === 'prism').length + 1).padStart(2, '0')}`,
          type: 'prism',
          geometry: { sides: 6, height, radius },
          transform: {
            position: [p1[0], height / 2, p1[2]],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          },
          material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
          visible: true,
        };
        addObject(prismObject);
        setSelectedId(id);
        resetDrawing();
      }
      return;
    }

    // SPHERE TOOL
    if (tool === 'sphere') {
      if (drawingState.phase === 'idle') {
        // First click - set center
        setDrawingState({
          phase: 'placing',
          point1: point
        });
      } else if (drawingState.phase === 'placing') {
        // Second click - set radius and create sphere
        const p1 = drawingState.point1!;
        const radius = Math.sqrt(
          Math.pow(point[0] - p1[0], 2) +
          Math.pow(point[2] - p1[2], 2)
        ) || 0.5;

        const id = crypto.randomUUID();
        const sphereObject: SceneObject = {
          id,
          name: `Sphere_${String(objects.filter(o => o.type === 'sphere').length + 1).padStart(2, '0')}`,
          type: 'sphere',
          geometry: { radius },
          transform: {
            position: [p1[0], radius, p1[2]],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          },
          material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
          visible: true,
        };
        addObject(sphereObject);
        setSelectedId(id);
        resetDrawing();
      }
      return;
    }
  }, [activeTool, drawingState, addObject, setSelectedId, setDrawingState, resetDrawing, objects]);

  const handleGroundMove = useCallback((_point: [number, number, number]) => {
    // Could be used for real-time preview updates
  }, []);

  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetDrawing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetDrawing]);

  return (
    <div className="w-full h-full bg-[#0a0a0f]">
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <SceneContent onGroundClick={handleGroundClick} onGroundMove={handleGroundMove} />
      </Canvas>
    </div>
  );
}
