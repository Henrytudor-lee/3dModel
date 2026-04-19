"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Line } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore, SceneObject } from "@/stores/sceneStore";

// Create a sprite-based label
function AxisLabel({
  text,
  color,
  position,
}: {
  text: string;
  color: string;
  position: [number, number, number];
}) {
  const spriteRef = useRef<THREE.Sprite>(null);

  // Create canvas-based texture for the label
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 48px Arial, sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
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
      <AxisLabel
        text="X"
        color="#ef4444"
        position={[size + labelOffset, 0, 0]}
      />

      {/* Y axis (green) - extends from 0 to size */}
      <mesh position={[0, size / 2, 0]}>
        <boxGeometry args={[0.05, size, 0.05]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <AxisLabel
        text="Y"
        color="#22c55e"
        position={[0, size + labelOffset, 0]}
      />

      {/* Z axis (blue) - extends from 0 to size */}
      <mesh position={[0, 0, size / 2]}>
        <boxGeometry args={[0.05, 0.05, size]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <AxisLabel
        text="Z"
        color="#3b82f6"
        position={[0, 0, size + labelOffset]}
      />
    </group>
  );
}

// Get material JSX based on material type
function getMaterial(material: SceneObject["material"]) {
  const { color, opacity, type, wireframe } = material;
  const transparent = opacity < 1;

  switch (type) {
    case "metal":
      return (
        <meshStandardMaterial
          color={color}
          metalness={1}
          roughness={0.3}
          opacity={opacity}
          transparent={transparent}
          wireframe={wireframe}
        />
      );
    case "glass":
      return (
        <meshPhysicalMaterial
          color={color}
          metalness={0}
          roughness={0}
          transmission={0.9}
          thickness={0.5}
          opacity={opacity}
          transparent={true}
          wireframe={wireframe}
        />
      );
    case "emissive":
      return (
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          opacity={opacity}
          transparent={transparent}
          wireframe={wireframe}
        />
      );
    case "standard":
    default:
      return (
        <meshStandardMaterial
          color={color}
          opacity={opacity}
          transparent={transparent}
          wireframe={wireframe}
        />
      );
  }
}

// Render any scene object
function SceneObject3D({
  object,
  isSelected,
  onClick,
}: {
  object: SceneObject;
  isSelected: boolean;
  onClick: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const { geometry, material, transform, type } = object;

  const position: [number, number, number] = [
    typeof transform.position[0] === "number" ? transform.position[0] : 0,
    typeof transform.position[1] === "number" ? transform.position[1] : 0,
    typeof transform.position[2] === "number" ? transform.position[2] : 0,
  ];

  if (type === "box") {
    const w = (geometry.width as number) || 1;
    const h = (geometry.height as number) || 1;
    const d = (geometry.depth as number) || 1;
    return (
      <group onClick={onClick}>
        {/* Selection surface highlight - slightly larger mesh behind */}
        {isSelected && (
          <mesh position={position} rotation={transform.rotation} scale={transform.scale}>
            <boxGeometry args={[w * 1.01, h * 1.01, d * 1.01]} />
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        )}
        {/* Main mesh */}
        <mesh position={position} rotation={transform.rotation} scale={transform.scale}>
          <boxGeometry args={[w, h, d]} />
          {getMaterial(material)}
        </mesh>
        {/* Selection outline */}
        {isSelected && (
          <lineSegments position={position} rotation={transform.rotation} scale={transform.scale}>
            <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </group>
    );
  }

  if (type === "sphere") {
    return (
      <group onClick={onClick}>
        {/* Selection surface highlight - slightly larger sphere behind */}
        {isSelected && (
          <mesh position={position} rotation={transform.rotation} scale={transform.scale}>
            <sphereGeometry args={[(geometry.radius as number) * 1.01 || 0.505, 32, 32]} />
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        )}
        {/* Main mesh */}
        <mesh position={position} rotation={transform.rotation} scale={transform.scale}>
          <sphereGeometry args={[(geometry.radius as number) || 0.5, 32, 32]} />
          {getMaterial(material)}
        </mesh>
      </group>
    );
  }

  if (type === "cylinder") {
    const r = (geometry.radius as number) || 0.5;
    const h = (geometry.height as number) || 1;
    return (
      <group onClick={onClick}>
        {/* Selection surface highlight - slightly larger cylinder behind */}
        {isSelected && (
          <mesh position={position} rotation={transform.rotation} scale={transform.scale}>
            <cylinderGeometry args={[r * 1.01, r * 1.01, h * 1.01, 32]} />
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        )}
        {/* Main mesh */}
        <mesh position={position} rotation={transform.rotation} scale={transform.scale}>
          <cylinderGeometry args={[r, r, h, 32]} />
          {getMaterial(material)}
        </mesh>
        {/* Selection outline */}
        {isSelected && (
          <lineSegments position={position} rotation={transform.rotation} scale={transform.scale}>
            <edgesGeometry args={[new THREE.CylinderGeometry(r, r, h, 16)]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </group>
    );
  }

  if (type === "prism") {
    const sides = (geometry.sides as number) || 6;
    const radius = (geometry.radius as number) || 0.5;
    const h = (geometry.height as number) || 1;
    return (
      <group onClick={onClick}>
        {/* Selection surface highlight - slightly larger prism behind */}
        {isSelected && (
          <mesh position={position} rotation={transform.rotation} scale={transform.scale}>
            <cylinderGeometry args={[radius * 1.01, radius * 1.01, h * 1.01, sides]} />
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        )}
        {/* Main mesh */}
        <mesh position={position} rotation={transform.rotation} scale={transform.scale}>
          <cylinderGeometry args={[radius, radius, h, sides]} />
          {getMaterial(material)}
        </mesh>
        {/* Selection outline */}
        {isSelected && (
          <lineSegments position={position} rotation={transform.rotation} scale={transform.scale}>
            <edgesGeometry args={[new THREE.CylinderGeometry(radius, radius, h, sides)]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </group>
    );
  }

  if (type === "line") {
    const rawPoints = geometry.points;
    if (!rawPoints || !Array.isArray(rawPoints) || rawPoints.length < 2)
      return null;
    const points = rawPoints as unknown as [number, number, number][];
    if (points.length < 2) return null;
    // Offset points by transform.position
    const offsetPoints = points.map(p => [
      p[0] + transform.position[0],
      p[1] + transform.position[1],
      p[2] + transform.position[2],
    ] as [number, number, number]);

    // Create line segments as cylinder meshes for proper click detection
    const lineSegments = [];
    for (let i = 0; i < offsetPoints.length - 1; i++) {
      const start = new THREE.Vector3(...offsetPoints[i]);
      const end = new THREE.Vector3(...offsetPoints[i + 1]);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(end, start);
      const length = dir.length();
      dir.normalize();

      // Calculate rotation to align cylinder with line direction
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      lineSegments.push(
        <mesh
          key={i}
          position={mid.toArray()}
          quaternion={quaternion.toArray()}
          onClick={onClick}
        >
          <cylinderGeometry args={[0.02, 0.02, length, 8]} />
          <meshBasicMaterial
            color={isSelected ? "#00d9ff" : material.color}
            transparent={isSelected}
            opacity={isSelected ? 0.8 : 1}
          />
        </mesh>
      );

      // Add glow effect for selected lines
      if (isSelected) {
        lineSegments.push(
          <mesh
            key={`glow-${i}`}
            position={mid.toArray()}
            quaternion={quaternion.toArray()}
          >
            <cylinderGeometry args={[0.06, 0.06, length, 8]} />
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.2} />
          </mesh>
        );
      }
    }

    return <group onClick={onClick}>{lineSegments}</group>;
  }

  if (type === "polygon") {
    const rawPoints = geometry.points;
    if (!rawPoints || !Array.isArray(rawPoints) || rawPoints.length < 3)
      return null;
    const points = rawPoints as unknown as [number, number, number][];
    if (points.length < 3) return null;

    // Calculate centroid to center the shape, then offset by transform.position
    const centroidX = points.reduce((sum, p) => sum + p[0], 0) / points.length + transform.position[0];
    const centroidZ = points.reduce((sum, p) => sum + p[2], 0) / points.length + transform.position[2];

    const shape = new THREE.Shape();
    shape.moveTo(points[0][0] - centroidX + transform.position[0], points[0][2] - centroidZ + transform.position[2]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0] - centroidX + transform.position[0], points[i][2] - centroidZ + transform.position[2]);
    }
    shape.closePath();
    const extrudeSettings = { depth: 0.01, bevelEnabled: false };

    // Create geometry for edges
    const edgesGeometry = new THREE.EdgesGeometry(
      new THREE.ExtrudeGeometry(shape, extrudeSettings),
    );

    // Position at centroid and rotate +90 degrees around X to lay flat (not mirrored)
    return (
      <group
        position={[centroidX, 0.005, centroidZ]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={transform.scale}
      >
        {/* Selection surface highlight */}
        {isSelected && (
          <mesh>
            <extrudeGeometry args={[shape, { ...extrudeSettings, depth: 0.015 }]} />
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        )}
        <mesh onClick={onClick}>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          {material.type === "glass" ? (
            <meshPhysicalMaterial
              color={isSelected ? "#00d9ff" : material.color}
              metalness={0}
              roughness={0}
              transmission={0.9}
              thickness={0.5}
              opacity={material.opacity}
              transparent={true}
              wireframe={material.wireframe}
              side={THREE.DoubleSide}
            />
          ) : (
            <meshStandardMaterial
              color={isSelected ? "#00d9ff" : material.color}
              emissive={
                material.type === "emissive" ? material.color : "#000000"
              }
              emissiveIntensity={material.type === "emissive" ? 2 : 0}
              metalness={material.type === "metal" ? 1 : 0}
              roughness={material.type === "metal" ? 0.3 : 0.5}
              opacity={material.opacity}
              transparent={material.opacity < 1}
              wireframe={material.wireframe}
              side={THREE.DoubleSide}
            />
          )}
        </mesh>
        {/* Selection outline */}
        {isSelected && (
          <lineSegments>
            <primitive object={edgesGeometry} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </group>
    );
  }

  if (type === "circle") {
    const radius = (geometry.radius as number) || 0.5;
    return (
      <group onClick={onClick}>
        {/* Selection surface highlight */}
        {isSelected && (
          <mesh
            position={position}
            rotation={[Math.PI / 2, 0, 0]}
            scale={transform.scale}
          >
            <circleGeometry args={[radius + 0.03, 128]} />
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
        )}
        <mesh
          position={position}
          rotation={[Math.PI / 2, 0, 0]}
          scale={transform.scale}
        >
          <circleGeometry args={[radius, 128]} />
          <meshStandardMaterial
            color={isSelected ? "#00d9ff" : material.color}
            metalness={material.type === "metal" ? 1 : 0}
            roughness={material.type === "metal" ? 0.3 : 0.5}
            opacity={material.opacity}
            transparent={material.opacity < 1}
            wireframe={material.wireframe}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Selection outline */}
        {isSelected && (
          <lineSegments position={position} rotation={[Math.PI / 2, 0, 0]}>
            <edgesGeometry args={[new THREE.CircleGeometry(radius, 128)]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </group>
    );
  }

  if (type === "curve") {
    const rawPoints = geometry.points;
    if (!rawPoints || !Array.isArray(rawPoints) || rawPoints.length < 2)
      return null;
    const points = rawPoints as unknown as [number, number, number][];
    if (points.length < 2) return null;

    // Offset points by transform.position
    const offsetPoints = points.map(p => [
      p[0] + transform.position[0],
      p[1] + transform.position[1],
      p[2] + transform.position[2],
    ] as [number, number, number]);

    // Create a smooth curve through the points
    const curve = new THREE.CatmullRomCurve3(
      offsetPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      false, // not closed
      "catmullrom", // type
      0.5, // tension
    );

    // Create tube geometry for proper click detection
    const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.02, 8, false);
    const glowGeometry = new THREE.TubeGeometry(curve, 50, 0.06, 8, false);

    return (
      <group onClick={onClick}>
        {/* Selection glow */}
        {isSelected && (
          <mesh geometry={glowGeometry}>
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.2} />
          </mesh>
        )}
        {/* Main curve tube - clickable */}
        <mesh geometry={tubeGeometry} onClick={onClick}>
          <meshBasicMaterial
            color={isSelected ? "#00d9ff" : material.color}
            transparent={isSelected}
            opacity={isSelected ? 0.8 : 1}
          />
        </mesh>
      </group>
    );
  }

  if (type === "csgresult") {
    const meshGeometry = object.meshGeometry;
    if (!meshGeometry) return null;

    return (
      <group onClick={onClick}>
        {/* Selection surface highlight - slightly scaled mesh behind */}
        {isSelected && (
          <mesh
            position={position}
            rotation={transform.rotation}
            scale={transform.scale.map((s, i) => s * 1.02) as [number, number, number]}
            geometry={meshGeometry}
          >
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        )}
        {/* Main mesh */}
        <mesh
          position={position}
          rotation={transform.rotation}
          scale={transform.scale}
          geometry={meshGeometry}
        >
          {getMaterial(material)}
        </mesh>
        {/* Selection outline */}
        {isSelected && (
          <lineSegments position={position} rotation={transform.rotation} scale={transform.scale}>
            <edgesGeometry args={[meshGeometry]} />
            <lineBasicMaterial color="#00d9ff" linewidth={2} />
          </lineSegments>
        )}
      </group>
    );
  }

  return null;
}

// Ground plane for raycasting
function GroundPlane({
  onClick,
  onMove,
}: {
  onClick: (point: [number, number, number]) => void;
  onMove: (point: [number, number, number]) => void;
}) {
  const planeRef = useRef<THREE.Mesh>(null);

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      const point = event.point;
      onMove([point.x, 0, point.z]);
    },
    [onMove],
  );

  const handleClick = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      const point = event.point;
      onClick([point.x, 0, point.z]);
    },
    [onClick],
  );

  return (
    <mesh
      ref={planeRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1000, 0]}
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
  mousePos,
  snappedMousePos,
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
  snappedMousePos: [number, number, number];
}) {
  const { activeTool, snapToGrid, snapToVertices } =
    useSceneStore();
  const anySnapEnabled = snapToGrid || snapToVertices;
  // Show cursor indicator for drawing tools, including move idle phase
  // For move tool, show cursor during idle phase (to see where first point will be set)
  // But during moveBase, the Move preview has its own indicators
  const showCursor =
    activeTool &&
    activeTool !== "select" &&
    (activeTool === "move"
      ? drawingState.phase === "idle"
      : drawingState.phase === "idle" ||
        drawingState.phase === "placing" ||
        drawingState.phase === "drag");

  // Cursor indicator - always show when using any drawing tool
  const renderCursorIndicator = () => {
    if (!showCursor) return null;

    // When snap is active, only show snapped position indicator (hide raw position to avoid confusion)
    const showRawIndicator = !anySnapEnabled;

    return (
      <group>
        {/* Raw mouse position (small semi-transparent sphere) - only show when no snap */}
        {showRawIndicator && (
          <mesh name="cursor-sphere" position={[mousePos[0], mousePos[1] + 0.1, mousePos[2]]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
        )}
        {/* Snapped point (bright sphere with glow effect - single combined mesh) */}
        {anySnapEnabled && (
          <mesh
            name="cursor-sphere"
            position={[
              snappedMousePos[0],
              snappedMousePos[1] + 0.1,
              snappedMousePos[2],
            ]}
          >
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#00d9ff" transparent opacity={0.9} />
          </mesh>
        )}
        {/* Non-snapped bright sphere */}
        {!anySnapEnabled && (
          <mesh
            name="cursor-sphere"
            position={[
              snappedMousePos[0],
              snappedMousePos[1] + 0.1,
              snappedMousePos[2],
            ]}
          >
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
        )}
      </group>
    );
  };

  // Build preview elements and always include cursor
  const previews: React.ReactNode[] = [];
  const cursor = renderCursorIndicator();

  // Line preview
  if (activeTool === "line" && drawingState.phase === "placing") {
    const polyPoints = drawingState.polygonPoints || [];
    if (drawingState.point1 || polyPoints.length > 0) {
      // Build all points: point1 + polygonPoints + current mouse position
      const allPoints: [number, number, number][] = [];
      if (drawingState.point1) {
        allPoints.push(drawingState.point1);
      }
      allPoints.push(...polyPoints);
      allPoints.push(snappedMousePos);

      if (allPoints.length >= 2) {
        previews.push(
          <Line
            key="line"
            points={allPoints}
            color="#00d9ff"
            lineWidth={2}
            transparent
            opacity={0.7}
          />,
        );
      }
    }
  }

  // Curve preview - smooth bezier curve through control points
  if (activeTool === "curve") {
    const controlPoints = drawingState.controlPoints || [];
    if (controlPoints.length > 0) {
      const allPoints = [...controlPoints, snappedMousePos];
      if (allPoints.length >= 2) {
        // Create smooth curve through points
        const curve = new THREE.CatmullRomCurve3(
          allPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
          false,
          "catmullrom",
          0.5,
        );
        const curvePoints = curve.getPoints(50);

        previews.push(
          <group key="curve">
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
          </group>,
        );
      }
    }
  }

  // Cube preview - show rectangle on ground
  if (activeTool === "cube" && drawingState.phase === "placing") {
    const p1 = drawingState.point1;
    if (p1) {
      const width = Math.abs(snappedMousePos[0] - p1[0]);
      const depth = Math.abs(snappedMousePos[2] - p1[2]);
      const centerX = (p1[0] + snappedMousePos[0]) / 2;
      const centerZ = (p1[2] + snappedMousePos[2]) / 2;
      previews.push(
        <mesh
          key="cube-preview"
          position={[centerX, 0.01, centerZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[width, depth]} />
          <meshBasicMaterial
            color="#00d9ff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>,
      );
    }
  }

  // Cube preview with height - follows mouse movement via drawingState.height
  if (activeTool === "cube" && drawingState.phase === "drag") {
    const p1 = drawingState.point1;
    const p2 = drawingState.point2;
    if (p1 && p2) {
      const width = Math.abs(p2[0] - p1[0]) || 1;
      const depth = Math.abs(p2[2] - p1[2]) || 1;
      const height = Math.max(0.1, drawingState.height);
      const centerX = (p1[0] + p2[0]) / 2;
      const centerZ = (p1[2] + p2[2]) / 2;
      const centerY = height / 2;
      previews.push(
        <mesh key="cube-drag-preview" position={[centerX, centerY, centerZ]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            color="#4a90d9"
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>,
      );
    }
  }

  // Sphere preview - center at (x, 0, z) so it's on the grid plane
  if (activeTool === "sphere" && drawingState.point1) {
    const radius = Math.sqrt(
      Math.pow(mousePos[0] - drawingState.point1[0], 2) +
        Math.pow(mousePos[2] - drawingState.point1[2], 2),
    );
    const spherePos: [number, number, number] = [
      drawingState.point1[0],
      0,
      drawingState.point1[2],
    ];
    previews.push(
      <mesh key="sphere-preview" position={spherePos}>
        <sphereGeometry args={[Math.max(0.1, radius), 16, 16]} />
        <meshStandardMaterial
          color="#4a90d9"
          transparent
          opacity={0.5}
          wireframe
        />
      </mesh>,
    );
  }

  // Circle preview - flat filled circle on the ground
  if (
    activeTool === "circle" &&
    drawingState.phase === "placing" &&
    drawingState.point1
  ) {
    const p1 = drawingState.point1;
    const radius = Math.sqrt(
      Math.pow(mousePos[0] - p1[0], 2) + Math.pow(mousePos[2] - p1[2], 2),
    );
    previews.push(
      <mesh
        key="circle-preview"
        position={[p1[0], 0.005, p1[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[Math.max(0.1, radius), 128]} />
        <meshBasicMaterial
          color="#4a90d9"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>,
    );
  }

  // Cylinder preview - base
  if (activeTool === "cylinder" && drawingState.phase === "placing") {
    const p1 = drawingState.point1;
    if (p1) {
      const radius = Math.sqrt(
        Math.pow(mousePos[0] - p1[0], 2) + Math.pow(mousePos[2] - p1[2], 2),
      );
      previews.push(
        <mesh
          key="cylinder-base-preview"
          position={[p1[0], 0.01, p1[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[Math.max(0.1, radius), 32]} />
          <meshBasicMaterial
            color="#4a90d9"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>,
      );
    }
  }

  // Cylinder preview with height - follows mouse movement via drawingState.height
  if (activeTool === "cylinder" && drawingState.phase === "drag") {
    const p1 = drawingState.point1;
    const p2 = drawingState.point2;
    if (p1 && p2) {
      const radius =
        Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[2] - p1[2], 2)) ||
        0.5;
      const height = Math.max(0.1, drawingState.height);
      const centerY = height / 2;
      previews.push(
        <mesh key="cylinder-drag-preview" position={[p1[0], centerY, p1[2]]}>
          <cylinderGeometry args={[radius, radius, height, 32]} />
          <meshStandardMaterial
            color="#4a90d9"
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>,
      );
    }
  }

  // Prism preview - base
  if (activeTool === "prism" && drawingState.phase === "placing") {
    const p1 = drawingState.point1;
    if (p1) {
      const radius = Math.sqrt(
        Math.pow(mousePos[0] - p1[0], 2) + Math.pow(mousePos[2] - p1[2], 2),
      );
      previews.push(
        <mesh
          key="prism-base-preview"
          position={[p1[0], 0.01, p1[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[Math.max(0.1, radius), 6]} />
          <meshBasicMaterial
            color="#4a90d9"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>,
      );
    }
  }

  // Prism preview with height - follows mouse movement via drawingState.height
  if (activeTool === "prism" && drawingState.phase === "drag") {
    const p1 = drawingState.point1;
    const p2 = drawingState.point2;
    const sides = 6;
    if (p1 && p2) {
      const radius =
        Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[2] - p1[2], 2)) ||
        0.5;
      const height = Math.max(0.1, drawingState.height);
      const centerY = height / 2;
      previews.push(
        <mesh key="prism-drag-preview" position={[p1[0], centerY, p1[2]]}>
          <cylinderGeometry args={[radius, radius, height, sides]} />
          <meshStandardMaterial
            color="#4a90d9"
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>,
      );
    }
  }

  // Polygon preview with snap indication
  if (activeTool === "polygon") {
    const polyPoints = drawingState.polygonPoints || [];
    if (polyPoints.length > 0) {
      const firstPoint = polyPoints[0];
      const distToFirst = Math.sqrt(
        Math.pow(mousePos[0] - firstPoint[0], 2) +
          Math.pow(mousePos[2] - firstPoint[2], 2),
      );
      const isSnapping = polyPoints.length >= 3 && distToFirst < 0.3;

      // Draw the polygon lines
      const allPoints = [...polyPoints, mousePos];
      if (allPoints.length >= 2) {
        previews.push(
          <group key="polygon-preview">
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
          </group>,
        );
      }
    }
  }

  // Point markers for first/second clicks (also show for curve control points)
  if (
    drawingState.point1 &&
    !["line", "polygon", "curve"].includes(activeTool || "")
  ) {
    previews.push(
      <group key="point-markers">
        <mesh name="draw-point1" position={drawingState.point1}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
        {drawingState.point2 && (
          <mesh name="draw-point2" position={drawingState.point2}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        )}
      </group>,
    );
  }

  // Move preview - show base point marker and line to current mouse
  if (
    activeTool === "move" &&
    drawingState.phase === "moveBase" &&
    drawingState.point1
  ) {
    previews.push(
      <group key="move-preview">
        {/* Base point marker (fixed) */}
        <mesh name="move-base-point" position={drawingState.point1}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#00d9ff" />
        </mesh>
        {/* Line from base to snapped current mouse position */}
        <Line
          points={[drawingState.point1, snappedMousePos]}
          color="#00d9ff"
          lineWidth={2}
          transparent
          opacity={0.7}
        />
        {/* Target point marker (snapped mouse position) */}
        <mesh name="move-target-point" position={snappedMousePos}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ff00ff" />
        </mesh>
      </group>,
    );
  }

  // Return all previews combined with cursor indicator
  return (
    <group>
      {previews}
      {cursor}
    </group>
  );
}

// Paste preview component - renders ghost of objects being pasted
function PastePreview({
  clipboard,
  position,
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

        if (obj.type === "box") {
          return (
            <mesh
              key={obj.id}
              position={offsetPos}
              rotation={obj.transform.rotation}
              scale={obj.transform.scale}
            >
              <boxGeometry
                args={[
                  (obj.geometry.width as number) || 1,
                  (obj.geometry.height as number) || 1,
                  (obj.geometry.depth as number) || 1,
                ]}
              />
              <meshStandardMaterial
                color={obj.material.color}
                opacity={0.5}
                transparent
                wireframe={obj.material.wireframe}
              />
            </mesh>
          );
        }

        if (obj.type === "sphere") {
          return (
            <mesh key={obj.id} position={offsetPos} scale={obj.transform.scale}>
              <sphereGeometry
                args={[(obj.geometry.radius as number) || 0.5, 16, 16]}
              />
              <meshStandardMaterial
                color={obj.material.color}
                opacity={0.5}
                transparent
                wireframe={obj.material.wireframe}
              />
            </mesh>
          );
        }

        if (obj.type === "cylinder") {
          return (
            <mesh
              key={obj.id}
              position={offsetPos}
              rotation={obj.transform.rotation}
              scale={obj.transform.scale}
            >
              <cylinderGeometry
                args={[
                  (obj.geometry.radiusTop as number) || 0.5,
                  (obj.geometry.radiusBottom as number) || 0.5,
                  (obj.geometry.height as number) || 1,
                  32,
                ]}
              />
              <meshStandardMaterial
                color={obj.material.color}
                opacity={0.5}
                transparent
                wireframe={obj.material.wireframe}
              />
            </mesh>
          );
        }

        if (obj.type === "prism") {
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
  onGroundMove,
}: {
  onGroundClick: (point: [number, number, number]) => void;
  onGroundMove: (point: [number, number, number]) => void;
}) {
  const {
    objects,
    selectedIds,
    setSelectedIds,
    setDrawingState,
    resetDrawing,
    showGrid,
    showAxes,
    activeTool,
    drawingState,
    theme,
    clipboard,
    isPasting,
    pastePosition,
    updatePastePosition,
    getSnapPoint,
    moveSelected,
    setActiveTool,
    snapToGrid,
    snapToVertices,
  } = useSceneStore();
  const [mousePos, setMousePos] = useState<[number, number, number]>([0, 0, 0]);
  const [snappedMousePos, setSnappedMousePos] = useState<
    [number, number, number]
  >([0, 0, 0]);
  const { scene, camera, gl } = useThree();

  // Update scene background when theme changes
  useEffect(() => {
    scene.background = new THREE.Color(
      theme === "dark" ? "#0a0a0f" : "#f0f4f8",
    );
  }, [theme, scene]);

  // Helper to get vertices of a scene object
  const getMeshVerticesForSnap = (
    objData: SceneObject,
  ): [number, number, number][] => {
    const { geometry, transform } = objData;
    const [px, py, pz] = transform.position;
    const [sx, sy, sz] = transform.scale;
    const type = objData.type;

    if (type === "box") {
      const w = (geometry.width as number) || 1;
      const h = (geometry.height as number) || 1;
      const d = (geometry.depth as number) || 1;
      const hw = (w * sx) / 2,
        hh = (h * sy) / 2,
        hd = (d * sz) / 2;
      return [
        [px - hw, py - hh, pz - hd],
        [px + hw, py - hh, pz - hd],
        [px - hw, py + hh, pz - hd],
        [px + hw, py + hh, pz - hd],
        [px - hw, py - hh, pz + hd],
        [px + hw, py - hh, pz + hd],
        [px - hw, py + hh, pz + hd],
        [px + hw, py + hh, pz + hd],
      ];
    }

    if (type === "sphere") {
      const r = (geometry.radius as number) || 0.5;
      return [
        [px - r * sx, py, pz],
        [px + r * sx, py, pz],
        [px, py - r * sy, pz],
        [px, py + r * sy, pz],
        [px, py, pz - r * sz],
        [px, py, pz + r * sz],
      ];
    }

    if (type === "cylinder" || type === "prism") {
      const r = (geometry.radius as number) || 0.5;
      const h = (geometry.height as number) || 1;
      const sides = (geometry.sides as number) || 6;
      const hh = (h * sy) / 2;
      const vertices: [number, number, number][] = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const x = px + Math.cos(angle) * r * sx;
        const z = pz + Math.sin(angle) * r * sz;
        vertices.push([x, py - hh, z]);
        vertices.push([x, py + hh, z]);
      }
      return vertices;
    }

    return [[px, py, pz]];
  };

  // Helper to get vertices of a mesh object (for reference)
  const getMeshVertices = (
    mesh: THREE.Object3D,
    objData: SceneObject | null,
  ): [number, number, number][] => {
    if (!objData) return [];
    return getMeshVerticesForSnap(objData);
  };

  // Global pointer move to track mouse position for snap indicator
  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update camera matrix world before raycasting
      camera.updateMatrixWorld();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Find the first intersection that is a mesh (not Grid, AxesHelper, GroundPlane, LineSegments, or cursor/point spheres)
      // Also skip PlaneGeometry which is the invisible ground plane used for raycasting
      let closestIntersect: THREE.Intersection | null = null;
      let hitMesh: THREE.Object3D | null = null;
      for (const intersect of intersects) {
        const obj = intersect.object;
        const objName = obj.name || "";
        // Skip cursor sphere, move/draw point markers, and other helper objects
        // Also skip Plane and any mesh with "ground" or "plane" in the name
        if (
          obj.type === "Grid" ||
          obj.type === "AxesHelper" ||
          obj.type === "GroundPlane" ||
          obj.type === "LineSegments" ||
          obj.type === "Plane" ||
          objName === "cursor-sphere" ||
          objName === "move-base-point" ||
          objName === "move-target-point" ||
          objName === "draw-point1" ||
          objName === "draw-point2" ||
          objName === "ground" ||
          objName === "Ground"
        )
          continue;
        closestIntersect = intersect;
        hitMesh = obj;
        break;
      }

      // If no object hit found, use ground plane intersection (intersects[0] if it's the ground)
      // This ensures snappedMousePos is always updated when mouse moves over the scene
      let rawPoint: [number, number, number] | null = null;
      if (closestIntersect && closestIntersect.point) {
        rawPoint = [
          closestIntersect.point.x,
          closestIntersect.point.y,
          closestIntersect.point.z,
        ];
      } else {
        // Find ground plane intersection
        for (const intersect of intersects) {
          if (intersect.object.type === "Plane" || intersect.object.name === "Ground") {
            rawPoint = [
              intersect.point.x,
              intersect.point.y,
              intersect.point.z,
            ];
            break;
          }
        }
        // Fallback: use first intersection if available
        if (!rawPoint && intersects.length > 0 && intersects[0].point) {
          rawPoint = [
            intersects[0].point.x,
            intersects[0].point.y,
            intersects[0].point.z,
          ];
        }
      }

      if (rawPoint) {
        // Find the corresponding SceneObject by checking if rawPoint is close to any object's vertices
        // This is more reliable than position matching
        const hitObj = objects.find((o) => {
          const vertices = getMeshVerticesForSnap(o);
          return vertices.some((v) => {
            const dist = Math.sqrt(
              Math.pow(rawPoint![0] - v[0], 2) +
                Math.pow(rawPoint![1] - v[1], 2) +
                Math.pow(rawPoint![2] - v[2], 2),
            );
            return dist < 3; // Within 3 units of any vertex
          });
        });

        // Validate that hitObj corresponds to hitMesh by checking if hitMesh's world position
        // is close to hitObj's computed position. If not, don't use hitObj for vertex snapping.
        let validatedHitObj: SceneObject | null = null;
        if (hitObj && hitMesh) {
          const hitMeshWorldPos = new THREE.Vector3();
          hitMesh.getWorldPosition(hitMeshWorldPos);
          const objPos = hitObj.transform.position;
          const posDist = Math.sqrt(
            Math.pow(hitMeshWorldPos.x - objPos[0], 2) +
              Math.pow(hitMeshWorldPos.y - objPos[1], 2) +
              Math.pow(hitMeshWorldPos.z - objPos[2], 2),
          );
          // If positions are within 5 units, consider it a valid match
          if (posDist < 5) {
            validatedHitObj = hitObj;
          }
        }

        // Compute snapped position based on snap settings
        let finalPoint = rawPoint;
        if (validatedHitObj) {
          const vertices = getMeshVertices(hitMesh as THREE.Mesh, validatedHitObj);
          const threshold = 0.5;

          if (snapToVertices) {
            // Find nearest vertex
            let minDist = Infinity;
            let nearestVertex: [number, number, number] | null = null;
            for (const v of vertices) {
              const dist = Math.sqrt(
                Math.pow(rawPoint![0] - v[0], 2) +
                  Math.pow(rawPoint![1] - v[1], 2) +
                  Math.pow(rawPoint![2] - v[2], 2),
              );
              if (dist < minDist) {
                minDist = dist;
                nearestVertex = v;
              }
            }
            if (nearestVertex && minDist < threshold) {
              finalPoint = nearestVertex;
            }
          }
        }

        // Grid snap if no vertex snap
        if (finalPoint === rawPoint && snapToGrid) {
          finalPoint = [
            Math.round(rawPoint![0]),
            rawPoint![1],
            Math.round(rawPoint![2]),
          ];
        }

        setMousePos(rawPoint);
        setSnappedMousePos(finalPoint);
      }
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    return () => canvas.removeEventListener("pointermove", handlePointerMove);
  }, [scene, camera, gl, objects, snapToGrid, snapToVertices]);

  const handleMouseMove = useCallback(
    (point: [number, number, number]) => {
      setMousePos(point);
      onGroundMove(point);
      // Update paste position when pasting
      if (isPasting) {
        updatePastePosition(point);
      }
    },
    [onGroundMove, isPasting, updatePastePosition],
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={1} />
      <pointLight position={[5, 3, 5]} intensity={1} />

      {/* Camera Controls - disable when drawing or pasting */}
      <OrbitControls
        makeDefault
        enabled={!activeTool || activeTool === "select"}
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
      />

      {/* Grid */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellColor="#333"
        sectionSize={5}
        sectionColor="#555"
        fadeDistance={50}
        visible={showGrid}
      />

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
        snappedMousePos={snappedMousePos}
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
            e.stopPropagation();
            // LINE TOOL - add point when clicking on object surface
            if (activeTool === "line") {
              if (drawingState.phase === "idle") {
                setDrawingState({
                  phase: "placing",
                  point1: snappedMousePos,
                  polygonPoints: [],
                });
              } else if (drawingState.phase === "placing") {
                setDrawingState({
                  phase: "placing",
                  point1: drawingState.point1,
                  polygonPoints: [...(drawingState.polygonPoints || []), snappedMousePos],
                });
              }
              return;
            }
            // CURVE TOOL - add control point when clicking on object surface
            if (activeTool === "curve") {
              if (drawingState.phase === "idle") {
                setDrawingState({
                  phase: "placing",
                  point1: snappedMousePos,
                  controlPoints: [snappedMousePos],
                });
              } else if (drawingState.phase === "placing") {
                const ctrlPoints = drawingState.controlPoints || [];
                // Check if clicking near first point to close curve
                const firstPoint = ctrlPoints[0];
                const dist = Math.sqrt(
                  Math.pow(snappedMousePos[0] - firstPoint[0], 2) +
                    Math.pow(snappedMousePos[1] - firstPoint[1], 2) +
                    Math.pow(snappedMousePos[2] - firstPoint[2], 2),
                );
                if (dist < 0.3 && ctrlPoints.length >= 2) {
                  // Close and create curve
                  const store = useSceneStore.getState();
                  const id = crypto.randomUUID();
                  const curveObject: SceneObject = {
                    id,
                    name: `Curve_${String(store.objects.filter((o) => o.type === "curve").length + 1).padStart(2, "0")}`,
                    type: "curve",
                    geometry: { points: ctrlPoints } as unknown as Record<string, number | number[]>,
                    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
                    material: { color: "#4a90d9", opacity: 1, type: "standard", wireframe: false },
                    visible: true,
                  };
                  store.addObject(curveObject);
                  store.setSelectedIds([id]);
                  store.resetDrawing();
                  store.setActiveTool("select");
                } else {
                  setDrawingState({
                    phase: "placing",
                    point1: drawingState.point1,
                    controlPoints: [...ctrlPoints, snappedMousePos],
                  });
                }
              }
              return;
            }
            // POLYGON TOOL - add point when clicking on object surface
            if (activeTool === "polygon") {
              if (drawingState.phase === "idle") {
                setDrawingState({
                  phase: "placing",
                  point1: snappedMousePos,
                  polygonPoints: [],
                });
              } else if (drawingState.phase === "placing") {
                setDrawingState({
                  phase: "placing",
                  point1: drawingState.point1,
                  polygonPoints: [...(drawingState.polygonPoints || []), snappedMousePos],
                });
              }
              return;
            }
            // When in move idle phase and clicking on a selected object, set base point (use snapped mouse pos)
            if (
              activeTool === "move" &&
              drawingState.phase === "idle" &&
              selectedIds.includes(obj.id)
            ) {
              setDrawingState({
                phase: "moveBase",
                point1: snappedMousePos,
                point2: null,
                height: 0,
                polygonPoints: [],
                controlPoints: [],
              });
              return;
            }
            // When in moveBase phase and clicking on a selected object, execute move
            if (
              drawingState.phase === "moveBase" &&
              selectedIds.includes(obj.id)
            ) {
              const basePoint = drawingState.point1;
              if (basePoint) {
                moveSelected(basePoint, snappedMousePos);
              }
              resetDrawing();
              setActiveTool("select");
              return;
            }
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
    activeTool,
    drawingState,
    addObject,
    setSelectedIds,
    setDrawingState,
    resetDrawing,
    objects,
    theme,
    clipboard,
    isPasting,
    pastePosition,
    copySelected,
    startPaste,
    updatePastePosition,
    confirmPaste,
    cancelPaste,
    undo,
    redo,
    setActiveTool,
    clearSelection,
    selectedIds,
    moveSelected,
    getSnapPoint,
  } = useSceneStore();
  const isDark = theme === "dark";

  // Refs for height tracking during drag
  const initialDragYRef = useRef<number>(0);
  const lastClientYRef = useRef<number>(0);

  // Track current clientY on pointer move
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      lastClientYRef.current = e.clientY;

      if (
        drawingState.phase === "drag" &&
        ["cube", "cylinder", "prism"].includes(activeTool || "")
      ) {
        // Calculate height from mouse movement relative to initial drag position
        const deltaY = e.clientY - initialDragYRef.current;
        const newHeight = Math.max(0.1, Math.abs(deltaY) * 0.01);
        setDrawingState({ height: newHeight });
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [drawingState.phase, activeTool, setDrawingState]);

  // Handle escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && !isPasting) {
        e.preventDefault();
        copySelected();
        return;
      }

      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        if (clipboard.length > 0 && !isPasting) {
          startPaste([0, 0, 0]);
        } else if (isPasting) {
          confirmPaste();
        }
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Cancel paste or drawing with Escape - switch to select mode
      if (e.key === "Escape") {
        if (isPasting) {
          cancelPaste();
        } else if (drawingState.phase !== "idle") {
          resetDrawing();
        }
        setActiveTool("select");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    drawingState.phase,
    resetDrawing,
    copySelected,
    clipboard,
    isPasting,
    startPaste,
    confirmPaste,
    undo,
    redo,
    cancelPaste,
    setActiveTool,
  ]);

  // Handle pointer down to record initial Y when entering drag phase
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // When in placing phase and user clicks, we're about to enter drag phase
      // Store the clientY that will be used as reference for height
      if (
        drawingState.phase === "placing" &&
        ["cube", "cylinder", "prism"].includes(activeTool || "")
      ) {
        initialDragYRef.current = e.clientY;
      }
    },
    [isPasting, confirmPaste, drawingState.phase, activeTool],
  );

  const handleGroundClick = useCallback(
    (point: [number, number, number]) => {
      // Apply snap to the point if any snap option is enabled
      const snappedPoint = getSnapPoint(point);

      // In move idle phase with selected objects, clicking ground sets base point
      if (
        activeTool === "move" &&
        drawingState.phase === "idle" &&
        selectedIds.length > 0
      ) {
        setDrawingState({
          phase: "moveBase",
          point1: snappedPoint,
          point2: null,
          height: 0,
          polygonPoints: [],
          controlPoints: [],
        });
        return;
      }

      // In moveBase phase, clicking ground uses snappedPoint as target
      if (activeTool === "move" && drawingState.phase === "moveBase") {
        const basePoint = drawingState.point1;
        if (basePoint) {
          moveSelected(basePoint, snappedPoint);
        }
        resetDrawing();
        setActiveTool("select");
        return;
      }

      // Handle paste confirmation
      if (isPasting) {
        confirmPaste();
        return;
      }

      // When in select mode or no tool, clicking ground deselects all
      if (!activeTool || activeTool === "select") {
        clearSelection();
        return;
      }

      const tool = activeTool;

      // MOVE TOOL
      if (tool === "move") {
        if (drawingState.phase === "idle") {
          if (selectedIds.length === 0) {
            // No selected objects, just deselect and switch to select
            setActiveTool("select");
            return;
          }
          // First click on ground - just enter moveBase phase, point will be set when clicking on object
          setDrawingState({
            phase: "moveBase",
            point1: snappedPoint,
            point2: null,
            height: 0,
            polygonPoints: [],
            controlPoints: [],
          });
        } else if (drawingState.phase === "moveBase") {
          // Second click - calculate offset and move (snapped)
          const basePoint = drawingState.point1;
          if (basePoint) {
            moveSelected(basePoint, snappedPoint);
          }
          // Reset to idle
          resetDrawing();
          setActiveTool("select");
        }
        return;
      }

      // LINE TOOL
      if (tool === "line") {
        if (drawingState.phase === "idle") {
          // Start line - first point (snapped)
          setDrawingState({
            phase: "placing",
            point1: snappedPoint,
            polygonPoints: [],
          });
        } else if (drawingState.phase === "placing") {
          // Add point to polygonPoints (for preview rendering)
          // Don't create object yet - will create on right-click
          setDrawingState({
            phase: "placing",
            point1: drawingState.point1,
            polygonPoints: [...(drawingState.polygonPoints || []), snappedPoint],
          });
        }
        return;
      }

      // CURVE TOOL - add control points, double-click or click near first point to finish
      if (tool === "curve") {
        if (drawingState.phase === "idle") {
          // Start curve - first control point (snapped)
          setDrawingState({
            phase: "placing",
            point1: snappedPoint,
            controlPoints: [snappedPoint],
          });
        } else if (drawingState.phase === "placing") {
          const ctrlPoints = drawingState.controlPoints || [];
          // Check if clicking near first point to close curve
          if (ctrlPoints.length >= 2) {
            const firstPoint = ctrlPoints[0];
            const dist = Math.sqrt(
              Math.pow(snappedPoint[0] - firstPoint[0], 2) +
                Math.pow(snappedPoint[2] - firstPoint[2], 2),
            );
            if (dist < 0.3) {
              // Close and create curve
              const id = crypto.randomUUID();
              const curveObject: SceneObject = {
                id,
                name: `Curve_${String(objects.filter((o) => o.type === "curve").length + 1).padStart(2, "0")}`,
                type: "curve",
                geometry: { points: ctrlPoints } as unknown as Record<
                  string,
                  number | number[]
                >,
                transform: {
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
                material: {
                  color: "#4a90d9",
                  opacity: 1,
                  type: "standard",
                  wireframe: false,
                },
                visible: true,
              };
              addObject(curveObject);
              setSelectedIds([id]);
              resetDrawing();
              setActiveTool("select");
              return;
            }
          }
          // Add control point (snapped)
          setDrawingState({
            controlPoints: [...ctrlPoints, snappedPoint],
          });
        }
        return;
      }

      // POLYGON TOOL
      if (tool === "polygon") {
        if (drawingState.phase === "idle") {
          // Start polygon (snapped)
          setDrawingState({
            phase: "placing",
            point1: snappedPoint,
            polygonPoints: [snappedPoint],
          });
        } else if (drawingState.phase === "placing") {
          const polyPoints = drawingState.polygonPoints || [];
          // Check if clicking near first point to close polygon
          if (polyPoints.length >= 3) {
            const firstPoint = polyPoints[0];
            const dist = Math.sqrt(
              Math.pow(snappedPoint[0] - firstPoint[0], 2) +
                Math.pow(snappedPoint[2] - firstPoint[2], 2),
            );
            if (dist < 0.3) {
              // Snap to first point and close polygon
              const id = crypto.randomUUID();
              const polygonObject: SceneObject = {
                id,
                name: `Polygon_${String(objects.filter((o) => o.type === "polygon").length + 1).padStart(2, "0")}`,
                type: "polygon",
                geometry: { points: polyPoints } as unknown as Record<
                  string,
                  number | number[]
                >,
                transform: {
                  position: [0, 0.005, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
                material: {
                  color: "#4a90d9",
                  opacity: 1,
                  type: "standard",
                  wireframe: false,
                },
                visible: true,
              };
              addObject(polygonObject);
              setSelectedIds([id]);
              resetDrawing();
              setActiveTool("select");
              return;
            }
          }
          // Add point to polygon (snapped)
          setDrawingState({
            polygonPoints: [...polyPoints, snappedPoint],
          });
        }
        return;
      }

      // CIRCLE TOOL
      if (tool === "circle") {
        if (drawingState.phase === "idle") {
          // First click - set center (snapped)
          setDrawingState({
            phase: "placing",
            point1: snappedPoint,
          });
        } else if (drawingState.phase === "placing") {
          // Second click - set radius and create circle (snapped)
          const p1 = drawingState.point1!;
          const radius =
            Math.sqrt(
              Math.pow(snappedPoint[0] - p1[0], 2) +
                Math.pow(snappedPoint[2] - p1[2], 2),
            ) || 0.5;

          const id = crypto.randomUUID();
          const circleObject: SceneObject = {
            id,
            name: `Circle_${String(objects.filter((o) => o.type === "circle").length + 1).padStart(2, "0")}`,
            type: "circle",
            geometry: { radius },
            transform: {
              position: [p1[0], 0.005, p1[2]],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            material: {
              color: "#4a90d9",
              opacity: 1,
              type: "standard",
              wireframe: false,
            },
            visible: true,
          };
          addObject(circleObject);
          setSelectedIds([id]);
          resetDrawing();
          setActiveTool("select");
        }
        return;
      }

      // CUBE TOOL
      if (tool === "cube") {
        if (drawingState.phase === "idle") {
          // First click - set base corner 1 (snapped)
          setDrawingState({
            phase: "placing",
            point1: snappedPoint,
          });
        } else if (drawingState.phase === "placing") {
          // Second click - set base corner 2, now drag for height (snapped)
          setDrawingState({
            phase: "drag",
            point2: snappedPoint,
          });
        } else if (drawingState.phase === "drag") {
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
            name: `Cube_${String(objects.filter((o) => o.type === "box").length + 1).padStart(2, "0")}`,
            type: "box",
            geometry: { width, height, depth },
            transform: {
              position: [posX, posY, posZ],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            material: {
              color: "#4a90d9",
              opacity: 1,
              type: "standard",
              wireframe: false,
            },
            visible: true,
          };
          addObject(cubeObject);
          setSelectedIds([id]);
          resetDrawing();
          setActiveTool("select");
        }
        return;
      }

      // CYLINDER TOOL
      if (tool === "cylinder") {
        if (drawingState.phase === "idle") {
          // First click - set center (snapped)
          setDrawingState({
            phase: "placing",
            point1: snappedPoint,
          });
        } else if (drawingState.phase === "placing") {
          // Second click - set radius, now drag for height (snapped)
          setDrawingState({
            phase: "drag",
            point2: snappedPoint,
          });
        } else if (drawingState.phase === "drag") {
          // Third click - create cylinder with current height from drawingState
          const p1 = drawingState.point1!;
          const p2 = drawingState.point2!;
          const radius =
            Math.sqrt(
              Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[2] - p1[2], 2),
            ) || 0.5;
          const height = Math.max(0.1, drawingState.height);

          const id = crypto.randomUUID();
          const cylinderObject: SceneObject = {
            id,
            name: `Cylinder_${String(objects.filter((o) => o.type === "cylinder").length + 1).padStart(2, "0")}`,
            type: "cylinder",
            geometry: { radius, height },
            transform: {
              position: [p1[0], height / 2, p1[2]],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            material: {
              color: "#4a90d9",
              opacity: 1,
              type: "standard",
              wireframe: false,
            },
            visible: true,
          };
          addObject(cylinderObject);
          setSelectedIds([id]);
          resetDrawing();
          setActiveTool("select");
        }
        return;
      }

      // PRISM TOOL
      if (tool === "prism") {
        if (drawingState.phase === "idle") {
          // First click - set center (snapped)
          setDrawingState({
            phase: "placing",
            point1: snappedPoint,
          });
        } else if (drawingState.phase === "placing") {
          // Second click - set radius, now drag for height (snapped)
          setDrawingState({
            phase: "drag",
            point2: snappedPoint,
          });
        } else if (drawingState.phase === "drag") {
          // Third click - create prism with current height from drawingState
          const p1 = drawingState.point1!;
          const p2 = drawingState.point2!;
          const radius =
            Math.sqrt(
              Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[2] - p1[2], 2),
            ) || 0.5;
          const height = Math.max(0.1, drawingState.height);

          const id = crypto.randomUUID();
          const prismObject: SceneObject = {
            id,
            name: `Prism_${String(objects.filter((o) => o.type === "prism").length + 1).padStart(2, "0")}`,
            type: "prism",
            geometry: { sides: 6, height, radius },
            transform: {
              position: [p1[0], height / 2, p1[2]],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            material: {
              color: "#4a90d9",
              opacity: 1,
              type: "standard",
              wireframe: false,
            },
            visible: true,
          };
          addObject(prismObject);
          setSelectedIds([id]);
          resetDrawing();
          setActiveTool("select");
        }
        return;
      }

      // SPHERE TOOL
      if (tool === "sphere") {
        if (drawingState.phase === "idle") {
          // First click - set center (snapped)
          setDrawingState({
            phase: "placing",
            point1: snappedPoint,
          });
        } else if (drawingState.phase === "placing") {
          // Second click - set radius and create sphere (snapped)
          const p1 = drawingState.point1!;
          const radius =
            Math.sqrt(
              Math.pow(snappedPoint[0] - p1[0], 2) +
                Math.pow(snappedPoint[2] - p1[2], 2),
            ) || 0.5;

          const id = crypto.randomUUID();
          const sphereObject: SceneObject = {
            id,
            name: `Sphere_${String(objects.filter((o) => o.type === "sphere").length + 1).padStart(2, "0")}`,
            type: "sphere",
            geometry: { radius },
            transform: {
              position: [p1[0], 0, p1[2]],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            material: {
              color: "#4a90d9",
              opacity: 1,
              type: "standard",
              wireframe: false,
            },
            visible: true,
          };
          addObject(sphereObject);
          setSelectedIds([id]);
          resetDrawing();
          setActiveTool("select");
        }
        return;
      }
    },
    [
      activeTool,
      drawingState,
      addObject,
      setSelectedIds,
      setDrawingState,
      resetDrawing,
      setActiveTool,
      objects,
    ],
  );

  const handleGroundMove = useCallback((_point: [number, number, number]) => {
    // Could be used for real-time preview updates
  }, []);

  // Confirm drawing with right-click
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (
        !activeTool ||
        activeTool === "select" ||
        drawingState.phase === "idle"
      )
        return;

      // Confirm CURVE drawing
      if (activeTool === "curve" && drawingState.phase === "placing") {
        const ctrlPoints = drawingState.controlPoints || [];
        if (ctrlPoints.length >= 2) {
          const id = crypto.randomUUID();
          const curveObject: SceneObject = {
            id,
            name: `Curve_${String(objects.filter((o) => o.type === "curve").length + 1).padStart(2, "0")}`,
            type: "curve",
            geometry: { points: ctrlPoints } as unknown as Record<
              string,
              number | number[]
            >,
            transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            material: {
              color: "#4a90d9",
              opacity: 1,
              type: "standard",
              wireframe: false,
            },
            visible: true,
          };
          addObject(curveObject);
          setSelectedIds([id]);
          resetDrawing();
          setActiveTool("select");
        }
        return;
      }

      // Confirm POLYGON drawing
      if (activeTool === "polygon" && drawingState.phase === "placing") {
        const polyPoints = drawingState.polygonPoints || [];
        if (polyPoints.length >= 3) {
          const id = crypto.randomUUID();
          const polygonObject: SceneObject = {
            id,
            name: `Polygon_${String(objects.filter((o) => o.type === "polygon").length + 1).padStart(2, "0")}`,
            type: "polygon",
            geometry: { points: polyPoints } as unknown as Record<
              string,
              number | number[]
            >,
            transform: {
              position: [0, 0.005, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            material: {
              color: "#4a90d9",
              opacity: 1,
              type: "standard",
              wireframe: false,
            },
            visible: true,
          };
          addObject(polygonObject);
          setSelectedIds([id]);
          resetDrawing();
          setActiveTool("select");
        }
        return;
      }

      // Confirm LINE drawing - need at least 2 points total (point1 + polygonPoints), otherwise cancel
      if (activeTool === "line" && drawingState.phase === "placing") {
        const allPoints = drawingState.point1
          ? [drawingState.point1, ...(drawingState.polygonPoints || [])]
          : drawingState.polygonPoints || [];
        if (allPoints.length >= 2) {
          const id = crypto.randomUUID();
          const lineObject: SceneObject = {
            id,
            name: `Line_${String(objects.filter((o) => o.type === "line").length + 1).padStart(2, "0")}`,
            type: "line",
            geometry: { points: allPoints } as unknown as Record<
              string,
              number | number[]
            >,
            transform: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            material: {
              color: "#4a90d9",
              opacity: 1,
              type: "standard",
              wireframe: false,
            },
            visible: true,
          };
          addObject(lineObject);
          setSelectedIds([id]);
          resetDrawing();
          setActiveTool("select");
        } else {
          // Less than 2 points - cancel drawing
          resetDrawing();
        }
        return;
      }

      // Confirm CUBE drawing (finish at current height)
      if (activeTool === "cube" && drawingState.phase === "drag") {
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
          name: `Cube_${String(objects.filter((o) => o.type === "box").length + 1).padStart(2, "0")}`,
          type: "box",
          geometry: { width, height, depth },
          transform: {
            position: [posX, posY, posZ],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          material: {
            color: "#4a90d9",
            opacity: 1,
            type: "standard",
            wireframe: false,
          },
          visible: true,
        };
        addObject(cubeObject);
        setSelectedIds([id]);
        resetDrawing();
        setActiveTool("select");
        return;
      }
    },
    [
      activeTool,
      drawingState,
      addObject,
      setSelectedIds,
      resetDrawing,
      setActiveTool,
      objects,
    ],
  );

  // Ref for Three.js renderer and scene
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  // Expose screenshot function globally
  useEffect(() => {
    (window as any).__captureCanvasScreenshot = () => {
      if (!glRef.current || !sceneRef.current || !cameraRef.current)
        return null;
      try {
        const renderer = glRef.current;
        // Force render one frame to capture current state
        renderer.render(sceneRef.current, cameraRef.current);
        const canvas = renderer.domElement;
        return canvas.toDataURL("image/jpeg", 0.8);
      } catch (e) {
        console.error("Screenshot failed:", e);
        return null;
      }
    };
  }, []);

  return (
    <div
      className={`w-full h-full ${isDark ? "bg-[#0a0a0f]" : "bg-[#f0f4f8]"}`}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
    >
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        onCreated={({ gl, scene, camera }) => {
          glRef.current = gl;
          sceneRef.current = scene;
          cameraRef.current = camera;
          scene.background = new THREE.Color(
            theme === "dark" ? "#0a0a0f" : "#f0f4f8",
          );
        }}
      >
        <SceneContent
          onGroundClick={handleGroundClick}
          onGroundMove={handleGroundMove}
        />
      </Canvas>
    </div>
  );
}
