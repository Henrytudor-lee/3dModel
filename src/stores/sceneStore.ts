import { create } from 'zustand';

export interface SceneObject {
  id: string;
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'prism' | 'line' | 'curve' | 'polygon' | 'group';
  geometry: Record<string, number | number[]>;
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
  | 'MOVE';

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
  },

  setSelectedId: (id) => set({ selectedIds: id ? [id] : [] }),

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
}));
