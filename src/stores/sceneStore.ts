import { create } from 'zustand';
import * as THREE from 'three';
import { performCSGOperationAsync, getDefaultMaterial } from '@/utils/csg';
import { useLogStore } from './logStore';

export interface SceneObject {
  id: string;
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'prism' | 'line' | 'curve' | 'polygon' | 'circle' | 'group' | 'csgresult';
  geometry: Record<string, number | number[]>;
  meshGeometry?: THREE.BufferGeometry; // For storing generated CSG geometry
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  material: {
    color: string;
    opacity: number;
    type: 'standard' | 'metal' | 'glass' | 'emissive';
    wireframe: boolean;
  };
  visible: boolean;
  children?: string[]; // Child object IDs for grouping
}

// Helper to format geometry details
function formatGeometry(obj: SceneObject): string {
  const { geometry, type } = obj;
  switch (type) {
    case 'box':
      return `W${(geometry.width as number)?.toFixed(1) || '?'} × H${(geometry.height as number)?.toFixed(1) || '?'} × D${(geometry.depth as number)?.toFixed(1) || '?'}`;
    case 'sphere':
      return `r${(geometry.radius as number)?.toFixed(1) || '?'}`;
    case 'cylinder':
    case 'prism':
      const sides = geometry.sides as number;
      return `r${(geometry.radius as number)?.toFixed(1) || '?'}, ${sides}-sided`;
    default:
      return '';
  }
}

// Helper to format position
function formatPosition(pos: [number, number, number]): string {
  return `(${pos[0].toFixed(2)}, ${pos[1].toFixed(2)}, ${pos[2].toFixed(2)})`;
}

// Helper to format material
function formatMaterial(mat: SceneObject['material']): string {
  const typeStr = mat.type !== 'standard' ? `, ${mat.type}` : '';
  const opacityStr = mat.opacity < 1 ? `, ${(mat.opacity * 100).toFixed(0)}% opacity` : '';
  const wireStr = mat.wireframe ? ', wireframe' : '';
  return `${mat.color}${typeStr}${opacityStr}${wireStr}`;
}

// Generate detailed creation log message
function getCreationMessage(obj: SceneObject): string {
  const geomInfo = formatGeometry(obj);
  const posInfo = formatPosition(obj.transform.position);
  const matInfo = formatMaterial(obj.material);

  let msg = `Created ${obj.name} [${obj.type}]`;
  if (geomInfo) msg += ` - ${geomInfo}`;
  msg += ` at ${posInfo}`;
  msg += ` | ${matInfo}`;
  return msg;
}

// Get detailed change message for updates
function getUpdateMessage(obj: SceneObject, updates: Partial<SceneObject>, beforeObj: SceneObject): string {
  const parts: string[] = [];

  // Check transform changes
  if (updates.transform) {
    const before = beforeObj.transform;
    const after = updates.transform;
    if (before.position !== after.position) {
      parts.push(`pos: ${formatPosition(before.position)} → ${formatPosition(after.position)}`);
    }
    if (before.rotation !== after.rotation) {
      parts.push(`rot: (${before.rotation.map(r => (r * 180 / Math.PI).toFixed(0)).join(', ')}°) → (${after.rotation.map(r => (r * 180 / Math.PI).toFixed(0)).join(', ')}°)`);
    }
    if (before.scale !== after.scale) {
      parts.push(`scale: (${before.scale.join(', ')}) → (${after.scale.join(', ')})`);
    }
  }

  // Check material changes
  if (updates.material) {
    const before = beforeObj.material;
    const after = updates.material;
    if (before.color !== after.color) {
      parts.push(`color: ${before.color} → ${after.color}`);
    }
    if (before.type !== after.type) {
      parts.push(`material: ${before.type} → ${after.type}`);
    }
    if (before.opacity !== after.opacity) {
      parts.push(`opacity: ${(before.opacity * 100).toFixed(0)}% → ${(after.opacity * 100).toFixed(0)}%`);
    }
    if (before.wireframe !== after.wireframe) {
      parts.push(`wireframe: ${before.wireframe} → ${after.wireframe}`);
    }
  }

  // Check geometry changes
  if (updates.geometry) {
    const before = beforeObj.geometry;
    const after = updates.geometry;
    for (const key of Object.keys(after)) {
      if (before[key] !== after[key]) {
        parts.push(`${key}: ${before[key]} → ${after[key]}`);
      }
    }
  }

  if (parts.length === 0) {
    return `Updated ${obj.name}`;
  }

  return `${obj.name}: ${parts.join(' | ')}`;
}

export type DrawingPhase = 'idle' | 'placing' | 'drag' | 'height';

export interface DrawingState {
  phase: DrawingPhase;
  point1: [number, number, number] | null;
  point2: [number, number, number] | null;
  height: number;
  polygonPoints: [number, number, number][];
  controlPoints: [number, number, number][];
}

// Operation types
export type OperationType =
  | 'CREATE'
  | 'DELETE'
  | 'UPDATE'
  | 'COPY'
  | 'PASTE'
  | 'GROUP'
  | 'UNGROUP'
  | 'MOVE'
  | 'CSG';

// Operation record
export interface Operation {
  id: string;
  type: OperationType;
  timestamp: number;
  description: string; // Human-readable description
  objectIds: string[]; // IDs of affected objects
  beforeState: SceneObject[] | null; // State before operation (null for CREATE)
  afterState: SceneObject[] | null;   // State after operation (null for DELETE)
}

interface SceneState {
  objects: SceneObject[];
  selectedIds: string[];
  activeTool: string | null;
  showGrid: boolean;
  showAxes: boolean;
  theme: 'dark' | 'light';

  // Drawing state
  drawingState: DrawingState;
  previewObject: SceneObject | null;

  // History state
  history: Operation[];
  historyIndex: number;
  clipboard: SceneObject[];
  isPasting: boolean;
  pastePosition: [number, number, number] | null;

  // Actions
  addObject: (obj: SceneObject, description?: string) => void;
  removeObject: (id: string, description?: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>, description?: string) => void;
  setSelectedId: (id: string | null) => void;
  toggleSelectedId: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  groupSelected: (name?: string) => void;
  ungroupObject: (id: string) => void;
  setActiveTool: (tool: string | null) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  toggleTheme: () => void;
  clearScene: () => void;

  // Drawing actions
  setDrawingState: (state: Partial<DrawingState>) => void;
  resetDrawing: () => void;
  setPreviewObject: (obj: SceneObject | null) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Clipboard actions
  copySelected: () => void;
  startPaste: (position: [number, number, number]) => void;
  updatePastePosition: (position: [number, number, number]) => void;
  confirmPaste: () => void;
  cancelPaste: () => void;

  // Helper
  executeWithHistory: <T>(fn: () => T, description: string, operationType: OperationType) => T;

  // Boolean operations
  booleanOperation: (operation: 'union' | 'intersect' | 'subtract') => void;
}

const initialDrawingState: DrawingState = {
  phase: 'idle',
  point1: null,
  point2: null,
  height: 1,
  polygonPoints: [],
  controlPoints: [],
};

// Deep clone an object
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Create a new operation record
function createOperation(
  type: OperationType,
  description: string,
  objectIds: string[],
  beforeState: SceneObject[] | null,
  afterState: SceneObject[] | null
): Operation {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    description,
    objectIds,
    beforeState: beforeState ? deepClone(beforeState) : null,
    afterState: afterState ? deepClone(afterState) : null,
  };
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  selectedIds: [],
  activeTool: null,
  showGrid: true,
  showAxes: true,
  theme: 'dark',
  drawingState: initialDrawingState,
  previewObject: null,

  // History
  history: [],
  historyIndex: -1,
  clipboard: [],
  isPasting: false,
  pastePosition: null,

  addObject: (obj, description) => {
    const state = get();
    const op = createOperation(
      'CREATE',
      description || `Create ${obj.type}`,
      [obj.id],
      null,
      [deepClone(obj)]
    );

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(op);

    set({
      objects: [...state.objects, obj],
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    // Log the creation with details
    useLogStore.getState().addLog(getCreationMessage(obj), 'create');
  },

  removeObject: (id, description) => {
    const state = get();
    const obj = state.objects.find((o) => o.id === id);
    if (!obj) return;

    const op = createOperation(
      'DELETE',
      description || `Delete ${obj.name}`,
      [id],
      [deepClone(obj)],
      null
    );

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(op);

    set({
      objects: state.objects.filter((o) => o.id !== id).map((o) => ({
        ...o,
        children: o.children?.filter((c) => c !== id),
      })),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    // Log the deletion
    useLogStore.getState().addLog(`Deleted ${obj.name}`, 'delete');
  },

  updateObject: (id, updates, description) => {
    const state = get();
    const obj = state.objects.find((o) => o.id === id);
    if (!obj) return;

    const beforeObj = deepClone(obj);
    const afterObj = deepClone({ ...obj, ...updates });

    const op = createOperation(
      'UPDATE',
      description || `Update ${obj.name}`,
      [id],
      [beforeObj],
      [afterObj]
    );

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(op);

    set({
      objects: state.objects.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    // Log the update with detailed message
    const logMsg = description || getUpdateMessage(obj, updates, beforeObj);
    let logType: 'update' | 'material' | 'transform' = 'update';
    if (updates.material) logType = 'material';
    else if (updates.transform) logType = 'transform';
    useLogStore.getState().addLog(logMsg, logType);
  },

  setSelectedId: (id) => {
    const state = get();
    const prevId = state.selectedIds[0];
    set({ selectedIds: id ? [id] : [] });

    // Log selection changes
    if (id && id !== prevId) {
      const obj = get().objects.find((o) => o.id === id);
      if (obj) {
        useLogStore.getState().addLog(`Selected ${obj.name}`, 'select');
      }
    }
  },

  toggleSelectedId: (id) => set((state) => {
    const isSelected = state.selectedIds.includes(id);
    return {
      selectedIds: isSelected
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    };
  }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  clearSelection: () => set({ selectedIds: [] }),

  groupSelected: (name) => {
    const state = get();
    if (state.selectedIds.length < 2) return;

    const selectedObjects = state.selectedIds
      .map((id) => state.objects.find((o) => o.id === id))
      .filter((o): o is SceneObject => o !== undefined);

    const groupId = crypto.randomUUID();
    const groupName = name || `Group_${String(state.objects.filter((o) => o.type === 'group').length + 1).padStart(2, '0')}`;

    const group: SceneObject = {
      id: groupId,
      name: groupName,
      type: 'group',
      geometry: {},
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      material: { color: '#94a3b8', opacity: 1, type: 'standard', wireframe: false },
      visible: true,
      children: [...state.selectedIds],
    };

    const op = createOperation(
      'GROUP',
      `Group ${state.selectedIds.length} objects`,
      [groupId, ...state.selectedIds],
      null,
      [deepClone(group), ...selectedObjects.map(deepClone)]
    );

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(op);

    set({
      objects: [...state.objects, group],
      selectedIds: [groupId],
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    // Log the grouping
    useLogStore.getState().addLog(`Grouped ${state.selectedIds.length} objects as ${groupName}`, 'operation');
  },

  ungroupObject: (id) => {
    const state = get();
    const group = state.objects.find((o) => o.id === id && o.type === 'group');
    if (!group || !group.children?.length) return;

    const childObjects = group.children
      .map((cid) => state.objects.find((o) => o.id === cid))
      .filter((o): o is SceneObject => o !== undefined);

    const op = createOperation(
      'UNGROUP',
      `Ungroup ${group.name}`,
      [id, ...group.children],
      [deepClone(group), ...childObjects.map(deepClone)],
      null
    );

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(op);

    set({
      objects: state.objects.filter((o) => o.id !== id),
      selectedIds: group.children,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });

    // Log the ungrouping
    useLogStore.getState().addLog(`Ungrouped ${group.name}`, 'operation');
  },

  setActiveTool: (tool) => set({ activeTool: tool, drawingState: initialDrawingState, previewObject: null }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),

  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  clearScene: () => set({
    objects: [],
    selectedIds: [],
    history: [],
    historyIndex: -1,
    clipboard: [],
    isPasting: false,
    pastePosition: null,
  }),

  setDrawingState: (state) => set((prev) => ({
    drawingState: { ...prev.drawingState, ...state },
  })),

  resetDrawing: () => set({ drawingState: initialDrawingState, previewObject: null }),

  setPreviewObject: (obj) => set({ previewObject: obj }),

  // Undo
  undo: () => {
    const state = get();
    if (state.historyIndex < 0) return;

    const operation = state.history[state.historyIndex];
    let newObjects = [...state.objects];

    switch (operation.type) {
      case 'CREATE': {
        // Undo create = delete the created objects
        for (const objId of operation.objectIds) {
          newObjects = newObjects.filter((o) => o.id !== objId);
        }
        break;
      }
      case 'DELETE': {
        // Undo delete = restore the deleted objects
        if (operation.beforeState) {
          newObjects = [...newObjects, ...operation.beforeState];
        }
        break;
      }
      case 'UPDATE': {
        // Undo update = restore previous state
        if (operation.beforeState) {
          for (const obj of operation.beforeState) {
            const idx = newObjects.findIndex((o) => o.id === obj.id);
            if (idx !== -1) {
              newObjects[idx] = obj;
            }
          }
        }
        break;
      }
      case 'GROUP': {
        // Undo group = remove group, keep children
        const groupId = operation.objectIds[0];
        newObjects = newObjects.filter((o) => o.id !== groupId);
        break;
      }
      case 'UNGROUP': {
        // Undo ungroup = restore group
        if (operation.beforeState && operation.beforeState[0]) {
          newObjects = [...newObjects, operation.beforeState[0]];
        }
        break;
      }
      case 'PASTE': {
        // Undo paste = remove pasted objects
        for (const objId of operation.objectIds) {
          newObjects = newObjects.filter((o) => o.id !== objId);
        }
        break;
      }
      case 'CSG': {
        // Undo CSG = remove result, restore original objects
        // objectIds = [obj1.id, obj2.id, result.id]
        // Remove the result object (last id)
        const resultId = operation.objectIds[operation.objectIds.length - 1];
        newObjects = newObjects.filter((o) => o.id !== resultId);
        // Restore original objects
        if (operation.beforeState) {
          newObjects = [...newObjects, ...operation.beforeState];
        }
        break;
      }
    }

    set({
      objects: newObjects,
      historyIndex: state.historyIndex - 1,
      selectedIds: operation.objectIds,
    });
  },

  // Redo
  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const operation = state.history[state.historyIndex + 1];
    let newObjects = [...state.objects];

    switch (operation.type) {
      case 'CREATE': {
        // Redo create = add the created objects back
        if (operation.afterState) {
          newObjects = [...newObjects, ...operation.afterState];
        }
        break;
      }
      case 'DELETE': {
        // Redo delete = delete again
        for (const objId of operation.objectIds) {
          newObjects = newObjects.filter((o) => o.id !== objId);
        }
        break;
      }
      case 'UPDATE': {
        // Redo update = apply the new state
        if (operation.afterState) {
          for (const obj of operation.afterState) {
            const idx = newObjects.findIndex((o) => o.id === obj.id);
            if (idx !== -1) {
              newObjects[idx] = obj;
            }
          }
        }
        break;
      }
      case 'GROUP': {
        // Redo group = group again
        if (operation.afterState && operation.afterState[0]) {
          newObjects = [...newObjects, operation.afterState[0]];
        }
        break;
      }
      case 'UNGROUP': {
        // Redo ungroup = ungroup again
        const groupId = operation.objectIds[0];
        newObjects = newObjects.filter((o) => o.id !== groupId);
        break;
      }
      case 'PASTE': {
        // Redo paste = paste again
        if (operation.afterState) {
          newObjects = [...newObjects, ...operation.afterState];
        }
        break;
      }
      case 'CSG': {
        // Redo CSG = remove originals, add result
        // objectIds = [obj1.id, obj2.id, result.id]
        // Remove original objects
        newObjects = newObjects.filter((o) => o.id !== operation.objectIds[0] && o.id !== operation.objectIds[1]);
        // Add result
        if (operation.afterState) {
          newObjects = [...newObjects, ...operation.afterState];
        }
        break;
      }
    }

    set({
      objects: newObjects,
      historyIndex: state.historyIndex + 1,
      selectedIds: operation.objectIds,
    });
  },

  canUndo: () => {
    const state = get();
    return state.historyIndex >= 0;
  },

  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },

  // Copy selected objects
  copySelected: () => {
    const state = get();
    if (state.selectedIds.length === 0) return;

    const selectedObjects = state.selectedIds
      .map((id) => state.objects.find((o) => o.id === id))
      .filter((o): o is SceneObject => o !== undefined);

    set({
      clipboard: deepClone(selectedObjects),
    });
  },

  // Start paste operation
  startPaste: (position) => {
    const state = get();
    if (state.clipboard.length === 0) return;

    set({
      isPasting: true,
      pastePosition: position,
    });
  },

  // Update paste position
  updatePastePosition: (position) => {
    set({ pastePosition: position });
  },

  // Confirm paste
  confirmPaste: () => {
    const state = get();
    if (!state.isPasting || state.clipboard.length === 0 || !state.pastePosition) return;

    const newObjects: SceneObject[] = [];
    const newIds: string[] = [];

    // Calculate centroid offset for positioning
    const centroid: [number, number, number] = [0, 0, 0];
    state.clipboard.forEach((obj) => {
      centroid[0] += obj.transform.position[0];
      centroid[1] += obj.transform.position[1];
      centroid[2] += obj.transform.position[2];
    });
    centroid[0] /= state.clipboard.length;
    centroid[1] /= state.clipboard.length;
    centroid[2] /= state.clipboard.length;

    state.clipboard.forEach((obj) => {
      const newId = crypto.randomUUID();
      newIds.push(newId);

      const newObj: SceneObject = deepClone(obj);
      newObj.id = newId;

      // Offset position from centroid to new paste position
      newObj.transform.position = [
        state.pastePosition![0] + (obj.transform.position[0] - centroid[0]),
        state.pastePosition![1] + (obj.transform.position[1] - centroid[1]),
        state.pastePosition![2] + (obj.transform.position[2] - centroid[2]),
      ];

      // Clear children IDs as these are now independent copies
      if (obj.type === 'group') {
        newObj.children = [];
      }

      newObjects.push(newObj);
    });

    const op = createOperation(
      'PASTE',
      `Paste ${state.clipboard.length} object(s)`,
      newIds,
      null,
      deepClone(newObjects)
    );

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(op);

    set({
      objects: [...state.objects, ...newObjects],
      selectedIds: newIds,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isPasting: false,
      pastePosition: null,
    });
  },

  // Cancel paste operation
  cancelPaste: () => {
    set({
      isPasting: false,
      pastePosition: null,
    });
  },

  executeWithHistory: <T>(fn: () => T, description: string, operationType: OperationType): T => {
    fn(); // Currently just executes - history tracking done in individual methods
    return fn();
  },

  booleanOperation: async (operation) => {
    const state = get();
    if (state.selectedIds.length !== 2) {
      console.warn('Boolean operation requires exactly 2 selected objects');
      return;
    }

    const obj1 = state.objects.find((o) => o.id === state.selectedIds[0]);
    const obj2 = state.objects.find((o) => o.id === state.selectedIds[1]);

    if (!obj1 || !obj2) return;

    // Check if objects support CSG
    const csgTypes = ['box', 'sphere', 'cylinder', 'prism'];
    if (!csgTypes.includes(obj1.type) || !csgTypes.includes(obj2.type)) {
      console.warn('CSG operations only supported for box, sphere, cylinder, and prism');
      return;
    }

    try {
      const csgResult = await performCSGOperationAsync(obj1, obj2, operation);
      const resultMaterial = getDefaultMaterial(obj1);

      // The CSG result geometry from three-bvh-csg is already in world space
      // (transforms are baked into vertex positions)
      // We just need to use the bounding box center as the result position
      const resultGeometry = csgResult.geometry;

      // The result geometry is already in world space (transforms baked in)
      // So we use identity transform - the geometry position IS the position
      const resultObj: SceneObject = {
        id: crypto.randomUUID(),
        name: `CSG_${operation}_${Date.now()}`,
        type: 'csgresult',
        geometry: {},
        meshGeometry: resultGeometry,
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        material: resultMaterial,
        visible: true,
      };

      // Store original objects for undo
      const obj1Clone = deepClone(obj1);
      const obj2Clone = deepClone(obj2);
      const resultObjClone = deepClone(resultObj);

      const op = createOperation(
        'CSG',
        `CSG ${operation} of ${obj1.name} and ${obj2.name}`,
        [obj1.id, obj2.id, resultObj.id],
        [obj1Clone, obj2Clone],
        [resultObjClone]
      );

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(op);

      // Remove original objects and add result
      set({
        objects: [
          ...state.objects.filter(o => o.id !== obj1.id && o.id !== obj2.id),
          resultObj
        ],
        selectedIds: [resultObj.id],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });

      // Log the boolean operation
      useLogStore.getState().addLog(
        `Boolean ${operation}: ${obj1.name} + ${obj2.name}`,
        'boolean'
      );
    } catch (error) {
      console.error('CSG operation failed:', error);
    }
  },
}));

// Expose store to window for testing
if (typeof window !== 'undefined') {
  (window as any).__ZUSTAND_STORE__ = useSceneStore;
}
