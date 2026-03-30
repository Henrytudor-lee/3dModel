'use client';

import { useSceneStore } from '@/stores/sceneStore';

const tools = [
  { id: 'select', label: 'Select', icon: '⬚', color: '#94a3b8' },
  { id: 'line', label: 'Line', icon: '/', color: '#22c55e' },
  { id: 'curve', label: 'Curve', icon: '~', color: '#a855f7' },
  { id: 'sphere', label: 'Sphere', icon: '○', color: '#3b82f6' },
  { id: 'cylinder', label: 'Cylinder', icon: '⬭', color: '#f97316' },
  { id: 'cube', label: 'Cube', icon: '□', color: '#ef4444' },
  { id: 'prism', label: 'Prism', icon: '⬡', color: '#eab308' },
  { id: 'polygon', label: 'Polygon', icon: '⯁', color: '#06b6d4' },
];

const operations = [
  { id: 'union', label: 'Union', icon: '⊕' },
  { id: 'subtract', label: 'Subtract', icon: '⊖' },
];

export default function Toolbar() {
  const { activeTool, setActiveTool, showGrid, showAxes, toggleGrid, toggleAxes } = useSceneStore();

  const activeToolColor = tools.find(t => t.id === activeTool)?.color || '#00d9ff';

  return (
    <div className="h-14 bg-gradient-to-r from-[#1e293b] to-[#16213e] border-b border-white/10 flex items-center px-4 gap-2 shadow-lg shadow-black/20">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-2 font-medium">Tools</span>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
              activeTool === tool.id
                ? 'text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            style={activeTool === tool.id ? { backgroundColor: tool.color + '30', color: tool.color, boxShadow: `0 0 20px ${tool.color}40` } : {}}
            title={tool.label}
          >
            <span className="text-lg" style={activeTool === tool.id ? { color: tool.color } : {}}>{tool.icon}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2" />

      {/* Operations */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-2 font-medium">Ops</span>
        {operations.map((op) => (
          <button
            key={op.id}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            title={op.label}
          >
            <span className="text-lg">{op.icon}</span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2" />

      {/* View Controls */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-2 font-medium">View</span>
        <button
          onClick={toggleGrid}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
            showGrid ? 'text-[#00d9ff]' : 'text-gray-500'
          }`}
          style={showGrid ? { textShadow: '0 0 10px #00d9ff80' } : {}}
          title="Toggle Grid"
        >
          <span className="text-sm font-medium">Grid</span>
        </button>
        <button
          onClick={toggleAxes}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
            showAxes ? 'text-[#00d9ff]' : 'text-gray-500'
          }`}
          style={showAxes ? { textShadow: '0 0 10px #00d9ff80' } : {}}
          title="Toggle Axes"
        >
          <span className="text-sm font-medium">Axes</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Active Tool Indicator */}
      {activeTool && (
        <div
          className="px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: activeToolColor + '30', color: activeToolColor, border: `1px solid ${activeToolColor}50` }}
        >
          {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
        </div>
      )}

      {/* Logo */}
      <div className="text-white font-bold tracking-tight">
        3D<span style={{ color: activeToolColor }}>Modeler</span>
      </div>
    </div>
  );
}
