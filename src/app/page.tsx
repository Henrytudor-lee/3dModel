'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Toolbar from '@/components/toolbar/Toolbar';
import ModelTree from '@/components/model-tree/ModelTree';
import PropertiesPanel from '@/components/properties/PropertiesPanel';
import { useSceneStore, SceneObject } from '@/stores/sceneStore';

// Dynamic import for Three.js canvas (client-side only)
const SceneCanvas = dynamic(() => import('@/components/canvas/SceneCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-[#00d9ff] text-lg">Loading 3D Engine...</div>
    </div>
  ),
});

export default function Home() {
  const { addObject, activeTool, objects, selectedId, setSelectedId } = useSceneStore();

  // Handle canvas click to add primitives
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!activeTool || activeTool === 'select') return;

    const toolToType: Record<string, SceneObject['type']> = {
      cube: 'box',
      sphere: 'sphere',
      cylinder: 'cylinder',
      prism: 'prism',
    };

    const type = toolToType[activeTool];
    if (!type) return;

    const id = crypto.randomUUID();
    const count = objects.filter((o) => o.type === type).length + 1;

    const defaultGeometry: Record<string, Record<string, number>> = {
      box: { width: 1, height: 1, depth: 1 },
      sphere: { radius: 0.5 },
      cylinder: { radius: 0.5, height: 1 },
      prism: { sides: 6, height: 1 },
    };

    const newObject: SceneObject = {
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)}_${String(count).padStart(2, '0')}`,
      type,
      geometry: defaultGeometry[type] || {},
      transform: {
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      material: {
        color: '#4a90d9',
        opacity: 1,
        type: 'standard',
        wireframe: false,
      },
      visible: true,
    };

    addObject(newObject);
    setSelectedId(id);
  };

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
        <div
          className="flex-1 relative"
          onClick={handleCanvasClick}
        >
          <SceneCanvas />

          {/* Tool hint */}
          {activeTool && activeTool !== 'select' && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
              Click on canvas to place {activeTool}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
