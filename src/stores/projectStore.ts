import { create } from 'zustand';
import { supabase, ModelProject, SceneData, SerializedObject } from '@/lib/supabase';
import { useAuthStore } from './authStore';
import { SceneObject } from './sceneStore';

interface ProjectState {
  projects: ModelProject[];
  currentProject: ModelProject | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<ModelProject | null>;
  updateProject: (id: string, updates: Partial<ModelProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: ModelProject | null) => void;
  saveSceneData: (sceneData: SceneData, settings?: { showGrid?: boolean; showAxes?: boolean; theme?: 'dark' | 'light' }) => Promise<void>;
  loadSceneData: (projectId: string) => Promise<SceneData | null>;
}

// Serialize SceneObject for storage (removes non-serializable fields)
export function serializeSceneObject(obj: SceneObject): SerializedObject {
  return {
    id: obj.id,
    name: obj.name,
    type: obj.type,
    geometry: obj.geometry,
    transform: obj.transform,
    material: obj.material,
    visible: obj.visible,
    children: obj.children,
  };
}

// Serialize entire scene to SceneData
export function serializeScene(objects: SceneObject[]): SceneData {
  return {
    version: '1.0',
    objects: objects.map(serializeSceneObject),
  };
}

// Deserialize SceneData back to SceneObjects
export function deserializeScene(data: SceneData): SceneObject[] {
  return data.objects.map((obj) => ({
    ...obj,
    meshGeometry: undefined,
  }));
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  saving: false,
  error: null,

  fetchProjects: async () => {
    if (!supabase) return;

    const { user, isGuest } = useAuthStore.getState();
    if (!user || isGuest) {
      set({ projects: [] });
      return;
    }

    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('ModelProjects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      set({ loading: false, error: error.message });
      return;
    }

    set({ projects: data || [], loading: false });
  },

  createProject: async (name: string) => {
    if (!supabase) return null;

    const { user, isGuest } = useAuthStore.getState();
    if (!user || isGuest) {
      console.error('Cannot create project: not logged in');
      return null;
    }

    set({ loading: true, error: null });

    const initialScene: SceneData = {
      version: '1.0',
      objects: [],
    };

    const { data, error } = await supabase
      .from('ModelProjects')
      .insert({
        user_id: user.id,
        name,
        scene_data: initialScene,
        settings: { showGrid: true, showAxes: true, theme: 'dark' },
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      set({ loading: false, error: error.message });
      return null;
    }

    set((state) => ({
      projects: [data, ...state.projects],
      currentProject: data,
      loading: false,
    }));

    return data;
  },

  updateProject: async (id, updates) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('ModelProjects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      set({ error: error.message });
      return;
    }

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates, updated_at: new Date().toISOString() }
          : state.currentProject,
    }));
  },

  deleteProject: async (id) => {
    if (!supabase) return;

    const { error } = await supabase.from('ModelProjects').delete().eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      set({ error: error.message });
      return;
    }

    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  saveSceneData: async (sceneData, settings) => {
    if (!supabase) return;

    const { currentProject } = get();
    if (!currentProject) {
      console.error('No current project to save to');
      return;
    }

    set({ saving: true });

    // Capture screenshot
    const thumbnail = (window as any).__captureCanvasScreenshot?.() || null;

    // Merge settings with existing project settings
    const currentSettings = currentProject.settings || {};
    const newSettings = { ...currentSettings, ...settings };

    const { error } = await supabase
      .from('ModelProjects')
      .update({
        scene_data: sceneData,
        settings: newSettings,
        thumbnail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentProject.id);

    if (error) {
      console.error('Error saving scene data:', error);
      set({ saving: false, error: error.message });
      return;
    }

    set((state) => ({
      saving: false,
      projects: state.projects.map((p) =>
        p.id === currentProject.id
          ? { ...p, scene_data: sceneData, settings: newSettings, thumbnail, updated_at: new Date().toISOString() }
          : p
      ),
      currentProject: state.currentProject
        ? { ...state.currentProject, scene_data: sceneData, settings: newSettings, thumbnail, updated_at: new Date().toISOString() }
        : null,
    }));
  },

  loadSceneData: async (projectId) => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('ModelProjects')
      .select('scene_data')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error loading scene data:', error);
      return null;
    }

    return data?.scene_data || null;
  },
}));
