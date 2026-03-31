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

  // Actions
  addObject: (obj: SceneObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
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
}

const initialDrawingState: DrawingState = {
  phase: 'idle',
  point1: null,
  point2: null,
  height: 1,
  polygonPoints: [],
  controlPoints: [],
};

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  selectedIds: [],
  activeTool: null,
  showGrid: true,
  showAxes: true,
  theme: 'dark',
  drawingState: initialDrawingState,
  previewObject: null,

  addObject: (obj) => set((state) => ({
    objects: [...state.objects, obj]
  })),

  removeObject: (id) => set((state) => ({
    objects: state.objects.filter((o) => o.id !== id).map((o) => ({
      ...o,
      children: o.children?.filter((c) => c !== id)
    })),
    selectedIds: state.selectedIds.filter((sid) => sid !== id)
  })),

  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map((o) =>
      o.id === id ? { ...o, ...updates } : o
    )
  })),

  setSelectedId: (id) => set({ selectedIds: id ? [id] : [] }),

  toggleSelectedId: (id) => set((state) => {
    const isSelected = state.selectedIds.includes(id);
    return {
      selectedIds: isSelected
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id]
    };
  }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  clearSelection: () => set({ selectedIds: [] }),

  groupSelected: (name) => set((state) => {
    if (state.selectedIds.length < 2) return state;

    const groupId = crypto.randomUUID();
    const groupName = name || `Group_${String(state.objects.filter((o) => o.type === 'group').length + 1).padStart(2, '0')}`;

    // Create group object - stores references to children but keeps them in top-level
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

    // Add group to top-level objects (children stay in array for rendering)
    const newObjects = [...state.objects, group];

    return {
      objects: newObjects,
      selectedIds: [groupId],
    };
  }),

  ungroupObject: (id) => set((state) => {
    const group = state.objects.find((o) => o.id === id && o.type === 'group');
    if (!group || !group.children?.length) return state;

    // Just remove the group, children remain in top-level
    const childIds = group.children;
    const newObjects = state.objects.filter((o) => o.id !== id);

    return {
      objects: newObjects,
      selectedIds: childIds,
    };
  }),

  setActiveTool: (tool) => set({ activeTool: tool, drawingState: initialDrawingState, previewObject: null }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),

  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  clearScene: () => set({ objects: [], selectedIds: [] }),

  setDrawingState: (state) => set((prev) => ({
    drawingState: { ...prev.drawingState, ...state }
  })),

  resetDrawing: () => set({ drawingState: initialDrawingState, previewObject: null }),

  setPreviewObject: (obj) => set({ previewObject: obj }),
}));
