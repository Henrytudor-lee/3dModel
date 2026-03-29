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

interface SceneState {
  objects: SceneObject[];
  selectedId: string | null;
  activeTool: string | null;
  showGrid: boolean;
  showAxes: boolean;

  // Actions
  addObject: (obj: SceneObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  setSelectedId: (id: string | null) => void;
  setActiveTool: (tool: string | null) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  clearScene: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  objects: [],
  selectedId: null,
  activeTool: null,
  showGrid: true,
  showAxes: true,

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

  setActiveTool: (tool) => set({ activeTool: tool }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),

  clearScene: () => set({ objects: [], selectedId: null }),
}));
