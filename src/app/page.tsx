'use client';

import dynamic from 'next/dynamic';
import Toolbar from '@/components/toolbar/Toolbar';
import ModelTree from '@/components/model-tree/ModelTree';
import PropertiesPanel from '@/components/properties/PropertiesPanel';
import { useSceneStore } from '@/stores/sceneStore';

// Dynamic import for Three.js canvas (client-side only)
const SceneCanvas = dynamic(() => import('@/components/canvas/SceneCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-[#00d9ff] text-lg">Loading 3D Engine...</div>
    </div>
  ),
});

function getDrawingHint(activeTool: string | null, phase: string): string | null {
  if (!activeTool || activeTool === 'select') return null;

  switch (activeTool) {
    case 'line':
      if (phase === 'idle') return 'Click to set line start point';
      return 'Click to add more points, or ESC to finish';
    case 'polygon':
      if (phase === 'idle') return 'Click to start polygon';
      return 'Click to add points, click first point to close, or ESC to finish';
    case 'cube':
      if (phase === 'idle') return 'Step 1: Click to set first corner';
      if (phase === 'placing') return 'Step 2: Click to set opposite corner';
      if (phase === 'drag') return 'Step 3: Click to set height';
      return 'Click to place cube';
    case 'cylinder':
      if (phase === 'idle') return 'Step 1: Click to set center';
      if (phase === 'placing') return 'Step 2: Click to set radius';
      if (phase === 'drag') return 'Step 3: Click to set height';
      return 'Click to place cylinder';
    case 'prism':
      if (phase === 'idle') return 'Step 1: Click to set center';
      if (phase === 'placing') return 'Step 2: Click to set radius';
      if (phase === 'drag') return 'Step 3: Click to set height';
      return 'Click to place prism';
    case 'sphere':
      if (phase === 'idle') return 'Step 1: Click to set center';
      if (phase === 'placing') return 'Step 2: Click to set radius';
      return 'Click to place sphere';
    default:
      return `Drawing ${activeTool}...`;
  }
}

export default function Home() {
  const { activeTool, drawingState } = useSceneStore();
  const hint = getDrawingHint(activeTool, drawingState.phase);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Model Tree + Properties */}
        <div className="w-72 flex flex-col border-r border-white/10">
          <div className="flex-1 overflow-hidden">
            <ModelTree />
          </div>
          <PropertiesPanel />
        </div>

        {/* Right Panel - 3D Canvas */}
        <div className="flex-1 relative">
          <SceneCanvas />

          {/* Tool hint */}
          {hint && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#1e293b] to-[#16213e] text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg border border-white/10" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              💡 {hint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
