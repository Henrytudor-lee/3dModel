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
  children?: SceneObject[];
}

// Drawing state for each tool
export type DrawingPhase = 'idle' | 'placing' | 'drag' | 'height';

export interface DrawingState {
  phase: DrawingPhase;
  point1: [number, number, number] | null;  // First clicked point
  point2: [number, number, number] | null;  // Second point (for cube base)
  height: number;                            // Height for 3D extrusions
  polygonPoints: [number, number, number][]; // Points for polygon/line
  controlPoints: [number, number, number][];  // Control points for curve
}

interface SceneState {
  objects: SceneObject[];
  selectedId: string | null;
  activeTool: string | null;
  showGrid: boolean;
  showAxes: boolean;

  // Drawing state
  drawingState: DrawingState;
  previewObject: SceneObject | null;

  // Actions
  addObject: (obj: SceneObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  setSelectedId: (id: string | null) => void;
  setActiveTool: (tool: string | null) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
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

export const useSceneStore = create<SceneState>((set) => ({
  objects: [],
  selectedId: null,
  activeTool: null,
  showGrid: true,
  showAxes: true,
  drawingState: initialDrawingState,
  previewObject: null,

  addObject: (obj) => set((state) => ({
    objects: [...state.objects, obj]
  })),

  removeObject: (id) => set((state) => ({
    objects: state.objects.filter((o) => o.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId
  })),

  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map((o) =>
      o.id === id ? { ...o, ...updates } : o
    )
  })),

  setSelectedId: (id) => set({ selectedId: id }),

  setActiveTool: (tool) => set({ activeTool: tool, drawingState: initialDrawingState, previewObject: null }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),

  clearScene: () => set({ objects: [], selectedId: null }),

  setDrawingState: (state) => set((prev) => ({
    drawingState: { ...prev.drawingState, ...state }
  })),

  resetDrawing: () => set({ drawingState: initialDrawingState, previewObject: null }),

  setPreviewObject: (obj) => set({ previewObject: obj }),
}));
