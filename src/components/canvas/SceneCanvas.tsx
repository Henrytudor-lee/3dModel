'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore, SceneObject } from '@/stores/sceneStore';

// Create a sprite-based label
function AxisLabel({ text, color, position }: { text: string; color: string; position: [number, number, number] }) {
  const spriteRef = useRef<THREE.Sprite>(null);

  // Create canvas-based texture for the label
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text, color]);

  return (
    <sprite ref={spriteRef} position={position} scale={[0.5, 0.5, 0.5]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}

function AxesHelper({ size }: { size: number }) {
  // Label offset from axis end
  const labelOffset = 0.3;
  return (
    <group>
      {/* X axis (red) - extends from 0 to size */}
      <mesh position={[size / 2, 0, 0]}>
        <boxGeometry args={[size, 0.05, 0.05]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <AxisLabel text="X" color="#ef4444" position={[size + labelOffset, 0, 0]} />

      {/* Y axis (green) - extends from 0 to size */}
      <mesh position={[0, size / 2, 0]}>
        <boxGeometry args={[0.05, size, 0.05]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <AxisLabel text="Y" color="#22c55e" position={[0, size + labelOffset, 0]} />

      {/* Z axis (blue) - extends from 0 to size */}
      <mesh position={[0, 0, size / 2]}>
        <boxGeometry args={[0.05, 0.05, size]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <AxisLabel text="Z" color="#3b82f6" position={[0, 0, size + labelOffset]} />
    </group>
  );
}

// Render any scene object
function SceneObject3D({ object, isSelected, onClick }: {
  object: SceneObject;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
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
    const radius = (geometry.radius as number) || 0.5;
    return (
      <mesh position={position} rotation={transform.rotation} scale={transform.scale} onClick={onClick}>
        <cylinderGeometry args={[radius, radius, (geometry.height as number) || 1, sides]} />
        <meshStandardMaterial
          color={material.color}
          opacity={material.opacity}
          transparent={material.opacity < 1}
          wireframe={material.wireframe}
        />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.CylinderGeometry(radius, radius, (geometry.height as number) || 1, sides)]} />
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

    // Calculate centroid to center the shape
    const centroidX = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const centroidZ = points.reduce((sum, p) => sum + p[2], 0) / points.length;

    const shape = new THREE.Shape();
    shape.moveTo(points[0][0] - centroidX, points[0][2] - centroidZ);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0] - centroidX, points[i][2] - centroidZ);
    }
    shape.closePath();
    const extrudeSettings = { depth: 0.01, bevelEnabled: false };

    // Create geometry for edges
    const edgesGeometry = new THREE.EdgesGeometry(new THREE.ExtrudeGeometry(shape, extrudeSettings));

    // Position at centroid and rotate +90 degrees around X to lay flat (not mirrored)
    return (
      <group position={[centroidX, 0.005, centroidZ]} rotation={[Math.PI / 2, 0, 0]} scale={transform.scale}>
        <mesh onClick={onClick}>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial
            color={material.color}
            opacity={material.opacity}
            transparent={material.opacity < 1}
            wireframe={material.wireframe}
            side={THREE.DoubleSide}
          />
        </mesh>
        {isSelected && (
          <lineSegments>
            <primitive object={edgesGeometry} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </group>
    );
  }

  if (type === 'curve') {
    const rawPoints = geometry.points;
    if (!rawPoints || !Array.isArray(rawPoints) || rawPoints.length < 2) return null;
    const points = rawPoints as unknown as [number, number, number][];
    if (points.length < 2) return null;

    // Create a smooth curve through the points
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p[0], p[1], p[2])),
      false, // not closed
      'catmullrom', // type
      0.5 // tension
    );

    const curvePoints = curve.getPoints(50);
    const lineArr: [number, number, number][] = curvePoints.map(p => [p.x, p.y, p.z]);

    return (
      <Line
        points={lineArr}
        color={material.color}
        lineWidth={2}
        onClick={onClick}
      />
    );
  }

  if (type === 'csgresult') {
    const meshGeometry = object.meshGeometry;
    if (!meshGeometry) return null;

    return (
      <mesh position={position} rotation={transform.rotation} scale={transform.scale} onClick={onClick} geometry={meshGeometry}>
        <meshStandardMaterial
          color={material.color}
          opacity={material.opacity}
          transparent={material.opacity < 1}
          wireframe={material.wireframe}
        />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[meshGeometry]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
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
    height: number;
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

  // Curve preview - smooth bezier curve through control points
  if (activeTool === 'curve') {
    const controlPoints = drawingState.controlPoints || [];
    if (controlPoints.length > 0) {
      const allPoints = [...controlPoints, mousePos];
      if (allPoints.length >= 2) {
        // Create smooth curve through points
        const curve = new THREE.CatmullRomCurve3(
          allPoints.map(p => new THREE.Vector3(p[0], p[1], p[2])),
          false,
          'catmullrom',
          0.5
        );
        const curvePoints = curve.getPoints(50);

        // Also show control point lines
        return (
          <group>
            {/* Control point lines */}
            <Line
              points={allPoints}
              color="#ff9900"
              lineWidth={1}
              transparent
              opacity={0.5}
            />
            {/* Smooth curve */}
            <Line
              points={curvePoints}
              color="#00d9ff"
              lineWidth={2}
              transparent
              opacity={0.8}
            />
            {/* Control points markers */}
            {allPoints.map((p, i) => (
              <mesh key={i} position={p}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color={i === 0 ? "#00ff00" : "#ff9900"} />
              </mesh>
            ))}
          </group>
        );
      }
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

  // Cube preview with height - follows mouse movement via drawingState.height
  if (activeTool === 'cube' && drawingState.phase === 'drag') {
    const p1 = drawingState.point1;
    const p2 = drawingState.point2;
    if (p1 && p2) {
      const width = Math.abs(p2[0] - p1[0]) || 1;
      const depth = Math.abs(p2[2] - p1[2]) || 1;
      const height = Math.max(0.1, drawingState.height);
      const centerX = (p1[0] + p2[0]) / 2;
      const centerZ = (p1[2] + p2[2]) / 2;
      const centerY = height / 2;
      return (
        <mesh position={[centerX, centerY, centerZ]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color="#4a90d9" transparent opacity={0.5} wireframe />
        </mesh>
      );
    }
  }

  // Sphere preview - center at (x, 0, z) so it's on the grid plane
  if (activeTool === 'sphere' && drawingState.point1) {
    const radius = Math.sqrt(
      Math.pow(mousePos[0] - drawingState.point1[0], 2) +
      Math.pow(mousePos[2] - drawingState.point1[2], 2)
    );
    const spherePos: [number, number, number] = [drawingState.point1[0], 0, drawingState.point1[2]];
    return (
      <mesh position={spherePos}>
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

  // Cylinder preview with height - follows mouse movement via drawingState.height
  if (activeTool === 'cylinder' && drawingState.phase === 'drag') {
    const p1 = drawingState.point1;
    const p2 = drawingState.point2;
    if (p1 && p2) {
      const radius = Math.sqrt(
        Math.pow(p2[0] - p1[0], 2) +
        Math.pow(p2[2] - p1[2], 2)
      ) || 0.5;
      const height = Math.max(0.1, drawingState.height);
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

  // Prism preview with height - follows mouse movement via drawingState.height
  if (activeTool === 'prism' && drawingState.phase === 'drag') {
    const p1 = drawingState.point1;
    const p2 = drawingState.point2;
    const sides = 6;
    if (p1 && p2) {
      const radius = Math.sqrt(
        Math.pow(p2[0] - p1[0], 2) +
        Math.pow(p2[2] - p1[2], 2)
      ) || 0.5;
      const height = Math.max(0.1, drawingState.height);
      const centerY = height / 2;
      return (
        <mesh position={[p1[0], centerY, p1[2]]}>
          <cylinderGeometry args={[radius, radius, height, sides]} />
          <meshStandardMaterial color="#4a90d9" transparent opacity={0.5} wireframe />
        </mesh>
      );
    }
  }

  // Polygon preview with snap indication
  if (activeTool === 'polygon') {
    const polyPoints = drawingState.polygonPoints || [];
    if (polyPoints.length > 0) {
      const firstPoint = polyPoints[0];
      const distToFirst = Math.sqrt(
        Math.pow(mousePos[0] - firstPoint[0], 2) +
        Math.pow(mousePos[2] - firstPoint[2], 2)
      );
      const isSnapping = polyPoints.length >= 3 && distToFirst < 0.3;

      // Draw the polygon lines
      const allPoints = [...polyPoints, mousePos];
      if (allPoints.length >= 2) {
        return (
          <group>
            <Line
              points={allPoints}
              color={isSnapping ? "#00ff00" : "#00d9ff"}
              lineWidth={2}
              transparent
              opacity={0.7}
            />
            {/* Highlight first point when close */}
            {isSnapping && (
              <mesh position={firstPoint}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        );
      }
    }
  }

  // Point markers for first/second clicks (also show for curve control points)
  if (drawingState.point1 && !['line', 'polygon', 'curve'].includes(activeTool || '')) {
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

// Paste preview component - renders ghost of objects being pasted
function PastePreview({
  clipboard,
  position
}: {
  clipboard: SceneObject[];
  position: [number, number, number];
}) {
  // Calculate centroid offset for positioning
  const centroid: [number, number, number] = [0, 0, 0];
  clipboard.forEach((obj) => {
    centroid[0] += obj.transform.position[0];
    centroid[1] += obj.transform.position[1];
    centroid[2] += obj.transform.position[2];
  });
  centroid[0] /= clipboard.length;
  centroid[1] /= clipboard.length;
  centroid[2] /= clipboard.length;

  return (
    <>
      {clipboard.map((obj) => {
        // Calculate offset position
        const offsetPos: [number, number, number] = [
          position[0] + (obj.transform.position[0] - centroid[0]),
          position[1] + (obj.transform.position[1] - centroid[1]),
          position[2] + (obj.transform.position[2] - centroid[2]),
        ];

        if (obj.type === 'box') {
          return (
            <mesh key={obj.id} position={offsetPos} rotation={obj.transform.rotation} scale={obj.transform.scale}>
              <boxGeometry args={[
                (obj.geometry.width as number) || 1,
                (obj.geometry.height as number) || 1,
                (obj.geometry.depth as number) || 1
              ]} />
              <meshStandardMaterial
                color={obj.material.color}
                opacity={0.5}
                transparent
                wireframe={obj.material.wireframe}
              />
            </mesh>
          );
        }

        if (obj.type === 'sphere') {
          return (
            <mesh key={obj.id} position={offsetPos} scale={obj.transform.scale}>
              <sphereGeometry args={[(obj.geometry.radius as number) || 0.5, 16, 16]} />
              <meshStandardMaterial
                color={obj.material.color}
                opacity={0.5}
                transparent
                wireframe={obj.material.wireframe}
              />
            </mesh>
          );
        }

        if (obj.type === 'cylinder') {
          return (
            <mesh key={obj.id} position={offsetPos} rotation={obj.transform.rotation} scale={obj.transform.scale}>
              <cylinderGeometry args={[
                (obj.geometry.radiusTop as number) || 0.5,
                (obj.geometry.radiusBottom as number) || 0.5,
                (obj.geometry.height as number) || 1,
                32
              ]} />
              <meshStandardMaterial
                color={obj.material.color}
                opacity={0.5}
                transparent
                wireframe={obj.material.wireframe}
              />
            </mesh>
          );
        }

        if (obj.type === 'prism') {
          const radius = (obj.geometry.radius as number) || 0.5;
          const height = (obj.geometry.height as number) || 1;
          const sides = 6;
          return (
            <mesh key={obj.id} position={offsetPos} scale={obj.transform.scale}>
              <cylinderGeometry args={[radius, radius, height, sides]} />
              <meshStandardMaterial
                color={obj.material.color}
                opacity={0.5}
                transparent
                wireframe={obj.material.wireframe}
              />
            </mesh>
          );
        }

        return null;
      })}
    </>
  );
}

function SceneContent({
  onGroundClick,
  onGroundMove
}: {
  onGroundClick: (point: [number, number, number]) => void;
  onGroundMove: (point: [number, number, number]) => void;
}) {
  const { objects, selectedIds, setSelectedIds, showGrid, showAxes, activeTool, drawingState, theme,
    clipboard, isPasting, pastePosition, updatePastePosition } = useSceneStore();
  const [mousePos, setMousePos] = useState<[number, number, number]>([0, 0, 0]);
  const { scene } = useThree();

  // Update scene background when theme changes
  useEffect(() => {
    scene.background = new THREE.Color(theme === 'dark' ? '#0a0a0f' : '#f0f4f8');
  }, [theme, scene]);

  const handleMouseMove = useCallback((point: [number, number, number]) => {
    setMousePos(point);
    onGroundMove(point);
    // Update paste position when pasting
    if (isPasting) {
      updatePastePosition(point);
    }
  }, [onGroundMove, isPasting, updatePastePosition]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Camera Controls - disable when drawing or pasting */}
      <OrbitControls
        makeDefault
        enabled={!activeTool || activeTool === 'select'}
      />

      {/* Grid */}
      <Grid args={[20, 20]} cellSize={1} cellColor="#333" sectionSize={5} sectionColor="#555" fadeDistance={50} visible={showGrid} />

      {/* Axes */}
      <group visible={showAxes}>
        <AxesHelper size={5} />
      </group>

      {/* Ground plane for click detection */}
      <GroundPlane onClick={onGroundClick} onMove={handleMouseMove} />

      {/* Drawing preview */}
      <DrawingPreview
        drawingState={drawingState}
        mousePos={mousePos}
      />

      {/* Paste preview */}
      {isPasting && clipboard.length > 0 && pastePosition && (
        <PastePreview clipboard={clipboard} position={pastePosition} />
      )}

      {/* Objects */}
      {objects.map((obj) => (
        <SceneObject3D
          key={obj.id}
          object={obj}
          isSelected={selectedIds.includes(obj.id)}
          onClick={(e) => {
            e.stopPropagation(); // Always stop propagation to prevent ground click
            if (e.ctrlKey || e.metaKey) {
              // Multi-select with Ctrl/Cmd+click
              const { toggleSelectedId } = useSceneStore.getState();
              toggleSelectedId(obj.id);
            } else {
              setSelectedIds([obj.id]);
            }
          }}
        />
      ))}
    </>
  );
}

export default function SceneCanvas() {
  const {
    activeTool, drawingState, addObject, setSelectedIds, setDrawingState, resetDrawing, objects, theme,
    clipboard, isPasting, pastePosition, copySelected, startPaste, updatePastePosition, confirmPaste, cancelPaste,
    undo, redo, setActiveTool, clearSelection,
  } = useSceneStore();
  const isDark = theme === 'dark';

  // Refs for height tracking during drag
  const initialDragYRef = useRef<number>(0);
  const lastClientYRef = useRef<number>(0);

  // Track current clientY on pointer move
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      lastClientYRef.current = e.clientY;

      if (drawingState.phase === 'drag' && ['cube', 'cylinder', 'prism'].includes(activeTool || '')) {
        // Calculate height from mouse movement relative to initial drag position
        const deltaY = e.clientY - initialDragYRef.current;
        const newHeight = Math.max(0.1, Math.abs(deltaY) * 0.01);
        setDrawingState({ height: newHeight });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [drawingState.phase, activeTool, setDrawingState]);

  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isPasting) {
        e.preventDefault();
        copySelected();
        return;
      }

      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (clipboard.length > 0 && !isPasting) {
          startPaste([0, 0, 0]);
        } else if (isPasting) {
          confirmPaste();
        }
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Cancel paste or drawing with Escape - switch to select mode
      if (e.key === 'Escape') {
        if (isPasting) {
          cancelPaste();
        } else if (drawingState.phase !== 'idle') {
          resetDrawing();
        }
        setActiveTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingState.phase, resetDrawing, copySelected, clipboard, isPasting, startPaste, confirmPaste, undo, redo, cancelPaste, setActiveTool]);

  // Handle pointer down to record initial Y when entering drag phase
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // When in placing phase and user clicks, we're about to enter drag phase
    // Store the clientY that will be used as reference for height
    if (drawingState.phase === 'placing' && ['cube', 'cylinder', 'prism'].includes(activeTool || '')) {
      initialDragYRef.current = e.clientY;
    }
  }, [isPasting, confirmPaste, drawingState.phase, activeTool]);

  const handleGroundClick = useCallback((point: [number, number, number]) => {
    // Handle paste confirmation
    if (isPasting) {
      confirmPaste();
      return;
    }

    // When in select mode or no tool, clicking ground deselects all
    if (!activeTool || activeTool === 'select') {
      clearSelection();
      return;
    }

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
        setSelectedIds([id]);
        // Reset for next line segment
        setDrawingState({
          phase: 'placing',
          point1: point,
          polygonPoints: [point]
        });
      }
      return;
    }

    // CURVE TOOL - add control points, double-click or click near first point to finish
    if (tool === 'curve') {
      if (drawingState.phase === 'idle') {
        // Start curve - first control point
        setDrawingState({
          phase: 'placing',
          point1: point,
          controlPoints: [point]
        });
      } else if (drawingState.phase === 'placing') {
        const ctrlPoints = drawingState.controlPoints || [];
        // Check if clicking near first point to close curve
        if (ctrlPoints.length >= 2) {
          const firstPoint = ctrlPoints[0];
          const dist = Math.sqrt(
            Math.pow(point[0] - firstPoint[0], 2) +
            Math.pow(point[2] - firstPoint[2], 2)
          );
          if (dist < 0.3) {
            // Close and create curve
            const id = crypto.randomUUID();
            const curveObject: SceneObject = {
              id,
              name: `Curve_${String(objects.filter(o => o.type === 'curve').length + 1).padStart(2, '0')}`,
              type: 'curve',
              geometry: { points: ctrlPoints } as unknown as Record<string, number | number[]>,
              transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
              material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
              visible: true,
            };
            addObject(curveObject);
            setSelectedIds([id]);
            resetDrawing();
            return;
          }
        }
        // Add control point
        setDrawingState({
          controlPoints: [...ctrlPoints, point]
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
          if (dist < 0.3) {
            // Snap to first point and close polygon
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
            setSelectedIds([id]);
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
        // Third click - create cube with current height from drawingState
        const p1 = drawingState.point1!;
        const p2 = drawingState.point2!;
        const width = Math.abs(p2[0] - p1[0]) || 1;
        const depth = Math.abs(p2[2] - p1[2]) || 1;
        const height = Math.max(0.1, drawingState.height);

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
        setSelectedIds([id]);
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
        // Third click - create cylinder with current height from drawingState
        const p1 = drawingState.point1!;
        const p2 = drawingState.point2!;
        const radius = Math.sqrt(
          Math.pow(p2[0] - p1[0], 2) +
          Math.pow(p2[2] - p1[2], 2)
        ) || 0.5;
        const height = Math.max(0.1, drawingState.height);

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
        setSelectedIds([id]);
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
        // Third click - create prism with current height from drawingState
        const p1 = drawingState.point1!;
        const p2 = drawingState.point2!;
        const radius = Math.sqrt(
          Math.pow(p2[0] - p1[0], 2) +
          Math.pow(p2[2] - p1[2], 2)
        ) || 0.5;
        const height = Math.max(0.1, drawingState.height);

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
        setSelectedIds([id]);
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
            position: [p1[0], 0, p1[2]],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          },
          material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
          visible: true,
        };
        addObject(sphereObject);
        setSelectedIds([id]);
        resetDrawing();
      }
      return;
    }
  }, [activeTool, drawingState, addObject, setSelectedIds, setDrawingState, resetDrawing, objects]);

  const handleGroundMove = useCallback((_point: [number, number, number]) => {
    // Could be used for real-time preview updates
  }, []);

  // Confirm drawing with right-click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeTool || activeTool === 'select' || drawingState.phase === 'idle') return;

    // Confirm CURVE drawing
    if (activeTool === 'curve' && drawingState.phase === 'placing') {
      const ctrlPoints = drawingState.controlPoints || [];
      if (ctrlPoints.length >= 2) {
        const id = crypto.randomUUID();
        const curveObject: SceneObject = {
          id,
          name: `Curve_${String(objects.filter(o => o.type === 'curve').length + 1).padStart(2, '0')}`,
          type: 'curve',
          geometry: { points: ctrlPoints } as unknown as Record<string, number | number[]>,
          transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
          material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
          visible: true,
        };
        addObject(curveObject);
        setSelectedIds([id]);
        resetDrawing();
      }
      return;
    }

    // Confirm POLYGON drawing
    if (activeTool === 'polygon' && drawingState.phase === 'placing') {
      const polyPoints = drawingState.polygonPoints || [];
      if (polyPoints.length >= 3) {
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
        setSelectedIds([id]);
        resetDrawing();
      }
      return;
    }

    // Confirm LINE drawing - need at least 2 points, otherwise cancel
    if (activeTool === 'line' && drawingState.phase === 'placing') {
      const linePoints = drawingState.polygonPoints || [];
      if (linePoints.length >= 2) {
        const id = crypto.randomUUID();
        const lineObject: SceneObject = {
          id,
          name: `Line_${String(objects.filter(o => o.type === 'line').length + 1).padStart(2, '0')}`,
          type: 'line',
          geometry: { points: linePoints } as unknown as Record<string, number | number[]>,
          transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
          material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
          visible: true,
        };
        addObject(lineObject);
        setSelectedIds([id]);
        resetDrawing();
      } else {
        // Less than 2 points - cancel drawing
        resetDrawing();
      }
      return;
    }

    // Confirm CUBE drawing (finish at current height)
    if (activeTool === 'cube' && drawingState.phase === 'drag') {
      const p1 = drawingState.point1!;
      const p2 = drawingState.point2!;
      const width = Math.abs(p2[0] - p1[0]) || 1;
      const depth = Math.abs(p2[2] - p1[2]) || 1;
      // Use a default height when confirming with right-click
      const height = 1;

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
        transform: { position: [posX, posY, posZ], rotation: [0, 0, 0], scale: [1, 1, 1] },
        material: { color: '#4a90d9', opacity: 1, type: 'standard', wireframe: false },
        visible: true,
      };
      addObject(cubeObject);
      setSelectedIds([id]);
      resetDrawing();
      return;
    }
  }, [activeTool, drawingState, addObject, setSelectedIds, resetDrawing, objects]);

  return (
    <div className={`w-full h-full ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f4f8]'}`} onContextMenu={handleContextMenu} onPointerDown={handlePointerDown}>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(theme === 'dark' ? '#0a0a0f' : '#f0f4f8');
        }}
      >
        <SceneContent onGroundClick={handleGroundClick} onGroundMove={handleGroundMove} />
      </Canvas>
    </div>
  );
}
