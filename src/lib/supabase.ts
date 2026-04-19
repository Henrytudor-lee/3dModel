// Types for database tables
export type ModelUser = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ModelProject = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  scene_data: SceneData;
  settings: ProjectSettings;
  is_public: boolean;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectSettings = {
  showGrid?: boolean;
  showAxes?: boolean;
  theme?: 'dark' | 'light';
};

export type SceneData = {
  version: string;
  objects: SerializedObject[];
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
};

export type SerializedObject = {
  id: string;
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'prism' | 'line' | 'curve' | 'polygon' | 'circle' | 'group' | 'csgresult' | 'custom';
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
  children?: string[];
};

// Supabase client for database operations (without auth)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
