import * as THREE from 'three';
import { Brush, Evaluator, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';
import { SceneObject } from '@/stores/sceneStore';

/**
 * Convert SceneObject to Three.js BufferGeometry
 */
function sceneObjectToGeometry(obj: SceneObject): THREE.BufferGeometry {
  const { geometry, type } = obj;
  const [sx, sy, sz] = obj.transform.scale;

  let baseGeom: THREE.BufferGeometry;

  switch (type) {
    case 'box': {
      const w = ((geometry.width as number) || 1) * sx;
      const h = ((geometry.height as number) || 1) * sy;
      const d = ((geometry.depth as number) || 1) * sz;
      baseGeom = new THREE.BoxGeometry(w, h, d);
      break;
    }
    case 'sphere': {
      const r = ((geometry.radius as number) || 0.5) * Math.max(sx, sy, sz);
      baseGeom = new THREE.SphereGeometry(r, 32, 32);
      break;
    }
    case 'cylinder': {
      const r = ((geometry.radius as number) || 0.5) * sx;
      const h = ((geometry.height as number) || 1) * sy;
      const segments = (geometry.sides as number) || 32;
      baseGeom = new THREE.CylinderGeometry(r, r, h, segments);
      break;
    }
    case 'prism': {
      const sides = (geometry.sides as number) || 6;
      const baseR = (geometry.radius as number) || 0.5;
      const r = baseR * Math.max(sx, sy);
      const h = ((geometry.height as number) || 1) * sz;
      baseGeom = new THREE.CylinderGeometry(r, r, h, sides);
      break;
    }
    default:
      throw new Error('Unsupported type: ' + type);
  }

  return baseGeom;
}

/**
 * Apply transform to geometry using Brush position/rotation/scale
 */
function createBrushWithTransform(geom: THREE.BufferGeometry, obj: SceneObject): Brush {
  const brush = new Brush(geom);

  // Set position from transform
  brush.position.set(
    obj.transform.position[0],
    obj.transform.position[1],
    obj.transform.position[2]
  );

  // Set rotation from transform
  brush.rotation.set(
    obj.transform.rotation[0],
    obj.transform.rotation[1],
    obj.transform.rotation[2]
  );

  // Set scale from transform
  brush.scale.set(
    obj.transform.scale[0],
    obj.transform.scale[1],
    obj.transform.scale[2]
  );

  brush.updateMatrixWorld();

  return brush;
}

/**
 * Result of a CSG operation including geometry and position
 */
export interface CSGResult {
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
}

/**
 * Perform CSG operation using three-bvh-csg
 */
export async function performCSGOperationAsync(
  obj1: SceneObject,
  obj2: SceneObject,
  operation: 'union' | 'intersect' | 'subtract'
): Promise<CSGResult> {
  console.log('[CSG] performCSGOperationAsync called');

  try {
    // Convert scene objects to Three.js geometries (local space)
    const geom1 = sceneObjectToGeometry(obj1);
    const geom2 = sceneObjectToGeometry(obj2);

    // Create brushes with transforms (Brush handles the transformation)
    const brush1 = createBrushWithTransform(geom1, obj1);
    const brush2 = createBrushWithTransform(geom2, obj2);

    console.log('[CSG] Brushes created with transforms, performing', operation);
    console.log('[CSG] Brush1 position:', brush1.position.toArray());
    console.log('[CSG] Brush2 position:', brush2.position.toArray());

    // Map operation string to constant
    let operationType;
    switch (operation) {
      case 'union':
        operationType = ADDITION;
        break;
      case 'intersect':
        operationType = INTERSECTION;
        break;
      case 'subtract':
        operationType = SUBTRACTION;
        break;
      default:
        throw new Error('Unknown operation: ' + operation);
    }

    // Evaluate CSG
    const evaluator = new Evaluator();

    const resultBrush = evaluator.evaluate(brush1, brush2, operationType);

    // Extract result geometry and apply the brush's world transform
    // The resultBrush has position/rotation/scale set, we need to bake this into geometry
    resultBrush.updateMatrixWorld(true); // ensure matrix is up to date
    const resultGeometry = resultBrush.geometry.clone();
    resultGeometry.applyMatrix4(resultBrush.matrixWorld);

    // Calculate the center of the result bounding box
    // This represents where the result geometry is in world space
    resultGeometry.computeBoundingBox();
    const bbox = resultGeometry.boundingBox!;
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    console.log('[CSG] Operation completed successfully');
    console.log('[CSG] Result bounding box center:', center.x, center.y, center.z);

    return {
      geometry: resultGeometry,
      position: [center.x, center.y, center.z],
    };
  } catch (err) {
    console.error('[CSG] Operation failed:', err);
    throw err;
  }
}

export function performCSGOperation(
  obj1: SceneObject,
  obj2: SceneObject,
  operation: 'union' | 'intersect' | 'subtract'
): THREE.BufferGeometry {
  throw new Error('Use performCSGOperationAsync for three-bvh-csg CSG');
}

export function getDefaultMaterial(obj: SceneObject) {
  return {
    color: obj.material.color,
    opacity: obj.material.opacity,
    type: obj.material.type,
    wireframe: obj.material.wireframe,
  };
}

// Debug test function - test all CSG operations
export function testCSGDebug() {
  // 两个重叠的cube用于测试
  const testObj1 = {
    id: 'test-1',
    name: 'TestCube1',
    type: 'box' as const,
    geometry: { width: 1, height: 1, depth: 1 },
    transform: {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number]
    },
    material: { color: '#ff0000', opacity: 1, type: 'standard' as const, wireframe: false },
    visible: true
  };

  const testObj2 = {
    id: 'test-2',
    name: 'TestCube2',
    type: 'box' as const,
    geometry: { width: 1, height: 1, depth: 1 },
    transform: {
      position: [0.5, 0.5, 0.5] as [number, number, number], // 与cube1重叠一半
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number]
    },
    material: { color: '#00ff00', opacity: 1, type: 'standard' as const, wireframe: false },
    visible: true
  };

  console.log('[CSG Debug] Test objects:');
  console.log('[CSG Debug] Cube1: position=(0,0,0), size=1x1x1');
  console.log('[CSG Debug] Cube2: position=(0.5,0.5,0.5), size=1x1x1 (overlapping half)');

  // Test all operations
  const operations: Array<'union' | 'subtract' | 'intersect'> = ['union', 'subtract', 'intersect'];

  async function runTests() {
    for (const op of operations) {
      console.log(`\n[CSG Debug] Testing ${op.toUpperCase()} operation...`);

      try {
        const csgResult = await performCSGOperationAsync(testObj1, testObj2, op);
        const result = csgResult.geometry;

        // Get bounding box of result to verify position
        result.computeBoundingBox();
        const bbox = result.boundingBox;
        if (!bbox) {
          console.log('[CSG Debug]   No bounding box');
          return;
        }
        const min = bbox.min;
        const max = bbox.max;

        console.log(`[CSG Debug] ${op.toUpperCase()} Result:`);
        console.log(`[CSG Debug]   Vertices: ${result.attributes.position?.array?.length || 0}`);
        console.log(`[CSG Debug]   Indices: ${result.index?.array?.length || 0}`);
        console.log(`[CSG Debug]   Bounding Box:`);
        console.log(`[CSG Debug]     Min: (${min.x.toFixed(3)}, ${min.y.toFixed(3)}, ${min.z.toFixed(3)})`);
        console.log(`[CSG Debug]     Max: (${max.x.toFixed(3)}, ${max.y.toFixed(3)}, ${max.z.toFixed(3)})`);

        // For subtract: result should be at origin (0,0,0)
        if (op === 'subtract') {
          const isAtOrigin = min.x > -0.01 && min.y > -0.01 && min.z > -0.01 &&
                            max.x < 0.51 && max.y < 0.51 && max.z < 0.51;
          console.log(`[CSG Debug]   Position check: ${isAtOrigin ? '✓ CORRECT (at origin)' : '✗ WRONG (not at origin)'}`);
        }

      } catch (err) {
        console.error(`[CSG Debug] ${op.toUpperCase()} FAILED:`, err);
      }
    }
  }

  runTests();
}

// Expose to window for console testing
if (typeof window !== 'undefined') {
  (window as any).testCSG = testCSGDebug;
}

// Test function that adds cubes to scene store and performs boolean operation
export function testCSGWithSceneStore() {
  console.log('[CSG Scene Test] Starting scene store CSG test...');

  // Access the zustand store via window - use getState() to access methods
  const store = (window as any).__ZUSTAND_STORE__;
  if (!store) {
    console.error('[CSG Scene Test] Cannot find Zustand store');
    return;
  }

  // Get the store state/methods via getState() - Zustand pattern
  const state = store.getState();
  if (!state) {
    console.error('[CSG Scene Test] Cannot get store state');
    return;
  }

  // Create two test cubes
  const cube1 = {
    id: 'test-cube-1',
    name: 'TestCube1',
    type: 'box' as const,
    geometry: { width: 1, height: 1, depth: 1 },
    transform: {
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number]
    },
    material: { color: '#ff0000', opacity: 1, type: 'standard' as const, wireframe: false },
    visible: true
  };

  const cube2 = {
    id: 'test-cube-2',
    name: 'TestCube2',
    type: 'box' as const,
    geometry: { width: 1, height: 1, depth: 1 },
    transform: {
      position: [0.5, 0.5, 0.5] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number]
    },
    material: { color: '#00ff00', opacity: 1, type: 'standard' as const, wireframe: false },
    visible: true
  };

  // Add cubes to store
  state.addObject(cube1);
  state.addObject(cube2);
  console.log('[CSG Scene Test] Added two cubes to scene');

  // Select both cubes
  state.setSelectedIds([cube1.id, cube2.id]);
  console.log('[CSG Scene Test] Selected both cubes');

  // Perform union operation
  console.log('[CSG Scene Test] Performing UNION operation...');
  state.booleanOperation('union');

  // Wait and check result
  setTimeout(() => {
    // Re-fetch state to get updated objects
    const currentState = store.getState();
    const objects = currentState.objects;
    const csgresult = objects.find((o: any) => o.type === 'csgresult');

    if (csgresult) {
      console.log('[CSG Scene Test] ✓ CSG Result created!');
      console.log('[CSG Scene Test] Result name:', csgresult.name);
      console.log('[CSG Scene Test] Result transform:', csgresult.transform);
      console.log('[CSG Scene Test] Result scale:', csgresult.transform.scale);

      if (csgresult.meshGeometry) {
        csgresult.meshGeometry.computeBoundingBox();
        const bbox = csgresult.meshGeometry.boundingBox;
        console.log('[CSG Scene Test] Result mesh BBox min:', bbox.min.toArray());
        console.log('[CSG Scene Test] Result mesh BBox max:', bbox.max.toArray());
      }
    } else {
      console.error('[CSG Scene Test] ✗ No CSG result found in scene');
      console.log('[CSG Scene Test] Current objects:', objects.map((o: any) => ({ name: o.name, type: o.type })));
    }
  }, 2000);
}

// Expose to window
if (typeof window !== 'undefined') {
  (window as any).testCSGWithScene = testCSGWithSceneStore;
}
