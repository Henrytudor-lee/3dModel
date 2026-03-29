'use client';

import { useSceneStore } from '@/stores/sceneStore';

const tools = [
  { id: 'select', label: 'Select', icon: '⬚' },
  { id: 'line', label: 'Line', icon: '/' },
  { id: 'curve', label: 'Curve', icon: '~' },
  { id: 'sphere', label: 'Sphere', icon: '○' },
  { id: 'cylinder', label: 'Cylinder', icon: '⬭' },
  { id: 'cube', label: 'Cube', icon: '□' },
  { id: 'prism', label: 'Prism', icon: '⬡' },
  { id: 'polygon', label: 'Polygon', icon: '⯁' },
];

const operations = [
  { id: 'union', label: 'Union', icon: '⊕' },
  { id: 'subtract', label: 'Subtract', icon: '⊖' },
];

export default function Toolbar() {
  const { activeTool, setActiveTool, showGrid, showAxes, toggleGrid, toggleAxes } = useSceneStore();

  return (
    <div className="h-14 bg-[#16213e] border-b border-white/10 flex items-center px-4 gap-2">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-2">Tools</span>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
            className={`w-10 h-10 flex items-center justify-center rounded hover:bg-white/10 transition-colors ${
              activeTool === tool.id ? 'bg-[#0f4c75] text-[#00d9ff]' : 'text-white'
            }`}
            title={tool.label}
          >
            <span className="text-lg">{tool.icon}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 mx-2" />

      {/* Operations */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-2">Ops</span>
        {operations.map((op) => (
          <button
            key={op.id}
            className="w-10 h-10 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-white"
            title={op.label}
          >
            <span className="text-lg">{op.icon}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10 mx-2" />

      {/* View Controls */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-2">View</span>
        <button
          onClick={toggleGrid}
          className={`w-10 h-10 flex items-center justify-center rounded hover:bg-white/10 transition-colors ${
            showGrid ? 'text-[#00d9ff]' : 'text-white/50'
          }`}
          title="Toggle Grid"
        >
          <span className="text-sm">Grid</span>
        </button>
        <button
          onClick={toggleAxes}
          className={`w-10 h-10 flex items-center justify-center rounded hover:bg-white/10 transition-colors ${
            showAxes ? 'text-[#00d9ff]' : 'text-white/50'
          }`}
          title="Toggle Axes"
        >
          <span className="text-sm">Axes</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Logo */}
      <div className="text-white font-semibold">
        3D Modeler
      </div>
    </div>
  );
}
