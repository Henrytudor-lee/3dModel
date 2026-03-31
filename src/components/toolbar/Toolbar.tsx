'use client';

import { useSceneStore } from '@/stores/sceneStore';

// SVG Icons for a more professional look
const Icons = {
  select: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  ),
  line: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  curve: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20 Q 12 4, 20 12" />
    </svg>
  ),
  sphere: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="9" ry="3" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  cylinder: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <ellipse cx="12" cy="18" rx="7" ry="3" />
      <line x1="5" y1="6" x2="5" y2="18" />
      <line x1="19" y1="6" x2="19" y2="18" />
    </svg>
  ),
  cube: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3L3 8v8l9 5 9-5V8l-9-5z" />
      <path d="M12 3v13" />
      <path d="M3 8l9 5 9-5" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  ),
  prism: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3L3 8v8l9 5 9-5V8l-9-5z" />
      <path d="M12 3l-5 2.5" />
      <path d="M12 3l5 2.5" />
      <path d="M7 5.5v8" />
      <path d="M17 5.5v8" />
    </svg>
  ),
  polygon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 20,8 17,18 7,18 4,8" />
    </svg>
  ),
  union: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="9" r="6" opacity="0.7" />
      <circle cx="15" cy="15" r="6" opacity="0.7" />
    </svg>
  ),
  subtract: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="9" r="6" opacity="0.7" />
      <circle cx="15" cy="15" r="6" opacity="0.3" />
    </svg>
  ),
};

const tools = [
  { id: 'select', label: 'Select', color: '#94a3b8' },
  { id: 'line', label: 'Line', color: '#22c55e' },
  { id: 'curve', label: 'Curve', color: '#a855f7' },
  { id: 'sphere', label: 'Sphere', color: '#3b82f6' },
  { id: 'cylinder', label: 'Cylinder', color: '#f97316' },
  { id: 'cube', label: 'Cube', color: '#ef4444' },
  { id: 'prism', label: 'Prism', color: '#eab308' },
  { id: 'polygon', label: 'Polygon', color: '#06b6d4' },
];

export default function Toolbar() {
  const { activeTool, setActiveTool, showGrid, showAxes, toggleGrid, toggleAxes } = useSceneStore();

  const activeToolColor = tools.find(t => t.id === activeTool)?.color || '#00d9ff';
  const activeToolData = tools.find(t => t.id === activeTool);

  return (
    <div className="h-12 bg-[#1a1a24] border-b border-white/5 flex items-center px-3 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3 pr-3 border-r border-white/10">
        <div className="w-7 h-7 rounded bg-gradient-to-br from-[#00d9ff] to-[#0099cc] flex items-center justify-center shadow-lg shadow-[#00d9ff]/20">
          <span className="text-white text-xs font-bold">3D</span>
        </div>
        <span className="text-white font-semibold tracking-tight text-sm">Studio</span>
      </div>

      {/* Tool Groups */}
      <div className="flex items-center gap-0.5">
        {tools.map((tool) => {
          const Icon = Icons[tool.id as keyof typeof Icons];
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(isActive ? null : tool.id)}
              className={`relative w-9 h-9 flex items-center justify-center rounded-md transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
              title={tool.label}
            >
              {isActive && (
                <div
                  className="absolute inset-0 rounded-md opacity-20"
                  style={{ backgroundColor: tool.color }}
                />
              )}
              <Icon />
              {isActive && (
                <div
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                  style={{ backgroundColor: tool.color, boxShadow: `0 0 8px ${tool.color}` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10 mx-2" />

      {/* View Controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={toggleGrid}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 text-xs font-medium tracking-wide ${
            showGrid ? 'text-[#00d9ff]' : 'text-gray-600 hover:text-gray-400'
          }`}
          title="Toggle Grid (G)"
        >
          GRID
        </button>
        <button
          onClick={toggleAxes}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 text-xs font-medium tracking-wide ${
            showAxes ? 'text-[#00d9ff]' : 'text-gray-600 hover:text-gray-400'
          }`}
          title="Toggle Axes (A)"
        >
          AXES
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status */}
      <div className="flex items-center gap-3">
        {activeToolData && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeToolData.color, boxShadow: `0 0 6px ${activeToolData.color}` }}
            />
            <span className="text-gray-300 text-xs font-medium">{activeToolData.label}</span>
          </div>
        )}

        {/* Help hint */}
        <div className="text-gray-600 text-xs">
          <span className="text-gray-500">RMB</span> Confirm
          <span className="mx-1.5 text-white/20">|</span>
          <span className="text-gray-500">ESC</span> Cancel
        </div>
      </div>
    </div>
  );
}
