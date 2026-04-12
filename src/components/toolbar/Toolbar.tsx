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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  curve: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 20 Q 12 4, 20 12" />
    </svg>
  ),
  sphere: () => (
    <svg width="18" height="18" viewBox="0 0 1024 1024" fill="currentColor">
      <path d="M890.24 578.72C824.48 633.76 679.84 672 512 672s-312.48-38.24-378.24-93.28C165.344 758.976 322.688 896 512 896s346.656-137.024 378.24-317.28zM128 512c0 62.336 170.72 128 384 128s384-65.664 384-128c0-8.352-0.256-16.672-0.8-24.896l-6.112 3.904c-13.312-20.928-44.48-42.464-89.92-60.512l11.808-29.76c32.544 12.928 59.456 28 79.264 44.544C858.656 265.024 701.312 128 512 128S165.344 265.024 133.76 445.28a250.624 250.624 0 0 1 49.92-31.52l14.144 28.672c-43.2 21.312-66.56 44.96-69.504 65.088H128V512z m560-145.024l-5.664 31.488a935.872 935.872 0 0 0-123.008-13.408l1.408-31.968c45.024 2.016 87.808 6.816 127.264 13.888z m-255.968-12.032l2.4 31.904c-43.264 3.264-84.48 9.184-122.24 17.504l-6.88-31.232a905.472 905.472 0 0 1 126.72-18.176zM512 928C282.24 928 96 741.76 96 512S282.24 96 512 96s416 186.24 416 416-186.24 416-416 416z"/>
    </svg>
  ),
  cylinder: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <ellipse cx="12" cy="18" rx="7" ry="3" />
      <line x1="5" y1="6" x2="5" y2="18" />
      <line x1="19" y1="6" x2="19" y2="18" />
    </svg>
  ),
  cube: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  prism: () => (
    <svg width="18" height="18" viewBox="0 0 1024 1024" fill="currentColor">
      <path d="M788.6336 0l7.68 9.216 144.4352 173.312-250.1632 207.2064-7.0656 5.9392H199.1168l-7.5264-12.2368-115.6096-188.6208L378.9824 3.9424 385.2288 0h403.456zM146.0736 211.0976l81.7152 133.376h437.248l203.4688-168.6016L764.672 51.2H400.0256l-253.952 159.8976z"/>
      <path d="M939.4176 179.2l-0.512 612.2496-8.3456 7.5776-239.104 218.2656-7.3216 6.7072h-484.352L76.8 840.3456V194.56h51.2v630.272L227.072 972.8h437.248l223.3856-203.9296 0.512-589.6704h51.2z"/>
      <path d="M239.0016 358.4v640h-51.2V358.4h51.2z"/>
      <path d="M699.8016 358.4v640h-51.2V358.4h51.2z"/>
    </svg>
  ),
  polygon: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12,2 20,8 17,18 7,18 4,8" />
    </svg>
  ),
  circle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  union: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="9" r="6" opacity="0.7" />
      <circle cx="15" cy="15" r="6" opacity="0.7" />
    </svg>
  ),
  intersect: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="9" r="6" opacity="0.3" />
      <circle cx="15" cy="15" r="6" opacity="0.3" />
      <path d="M9 5.5a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3.5 5.5L9 14.5z" opacity="0.9" fill="currentColor" />
      <path d="M15 9.5a6 6 0 0 1-6 6c-2.5 0-4.5-1.5-5.5-3.5L6 9.5z" opacity="0.9" fill="currentColor" />
    </svg>
  ),
  subtract: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="9" r="6" opacity="0.7" />
      <circle cx="15" cy="15" r="6" opacity="0.3" />
    </svg>
  ),
  grid: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  axes: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2l2 3h-4l2-3z" fill="currentColor" />
    </svg>
  ),
  sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

const tools = [
  { id: 'select', label: 'Select', color: '#94a3b8' },
  { id: 'line', label: 'Line', color: '#22c55e' },
  { id: 'curve', label: 'Curve', color: '#a855f7' },
  { id: 'circle', label: 'Circle', color: '#ec4899' },
  { id: 'sphere', label: 'Sphere', color: '#3b82f6' },
  { id: 'cylinder', label: 'Cylinder', color: '#f97316' },
  { id: 'cube', label: 'Cube', color: '#ef4444' },
  { id: 'prism', label: 'Prism', color: '#eab308' },
  { id: 'polygon', label: 'Polygon', color: '#06b6d4' },
];

export default function Toolbar() {
  const { activeTool, setActiveTool, showGrid, showAxes, toggleGrid, toggleAxes, theme, toggleTheme, selectedIds, booleanOperation } = useSceneStore();

  const activeToolColor = tools.find(t => t.id === activeTool)?.color || '#00d9ff';
  const activeToolData = tools.find(t => t.id === activeTool);
  const isDark = theme === 'dark';
  const canPerformCSG = selectedIds.length === 2;

  return (
    <div className={`h-12 border-b flex items-center px-3 gap-1 ${
      isDark ? 'bg-[#1a1a24] border-white/5' : 'bg-[#ffffff] border-gray-200'
    }`}>
      {/* Logo */}
      <div className={`flex items-center gap-2 mr-3 pr-3 border-r ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="w-7 h-7 rounded bg-gradient-to-br from-[#00d9ff] to-[#0099cc] flex items-center justify-center shadow-lg shadow-[#00d9ff]/20">
          <span className="text-white text-xs font-bold">3D</span>
        </div>
        <span className={`font-semibold tracking-tight text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Studio</span>
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
                  ? isDark ? 'text-white' : 'text-gray-900'
                  : isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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

      {/* CSG Operations */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => booleanOperation('union')}
          disabled={!canPerformCSG}
          className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 ${
            canPerformCSG
              ? isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              : 'text-gray-700/30 cursor-not-allowed'
          }`}
          title="Union (select 2 objects)"
        >
          <Icons.union />
        </button>
        <button
          onClick={() => booleanOperation('subtract')}
          disabled={!canPerformCSG}
          className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 ${
            canPerformCSG
              ? isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              : 'text-gray-700/30 cursor-not-allowed'
          }`}
          title="Subtract (select 2 objects)"
        >
          <Icons.subtract />
        </button>
        <button
          onClick={() => booleanOperation('intersect')}
          disabled={!canPerformCSG}
          className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 ${
            canPerformCSG
              ? isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              : 'text-gray-700/30 cursor-not-allowed'
          }`}
          title="Intersect (select 2 objects)"
        >
          <Icons.intersect />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10 mx-2" />

      {/* View Controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={toggleGrid}
          className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 ${
            showGrid
              ? 'text-[#00d9ff]'
              : isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Toggle Grid (G)"
        >
          {showGrid && (
            <div
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: 'rgba(0, 217, 255, 0.15)' }}
            />
          )}
          <Icons.grid />
          {showGrid && (
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
              style={{ backgroundColor: '#00d9ff', boxShadow: '0 0 6px #00d9ff' }}
            />
          )}
        </button>
        <button
          onClick={toggleAxes}
          className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 ${
            showAxes
              ? 'text-[#22c55e]'
              : isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Toggle Axes (A)"
        >
          {showAxes && (
            <div
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}
            />
          )}
          <Icons.axes />
          {showAxes && (
            <div
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full"
              style={{ backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
            />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150 ${
            isDark
              ? 'text-[#f59e0b]'
              : 'text-[#3b82f6]'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          <div
            className="absolute inset-0 rounded-md transition-colors duration-300"
            style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)' }}
          />
          {isDark ? <Icons.moon /> : <Icons.sun />}
          <div
            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: isDark ? '#f59e0b' : '#3b82f6', boxShadow: `0 0 6px ${isDark ? '#f59e0b' : '#3b82f6'}` }}
          />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status */}
      <div className="flex items-center gap-3">
        {activeToolData && (
          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
          }`}>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeToolData.color, boxShadow: `0 0 6px ${activeToolData.color}` }}
            />
            <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-xs font-medium`}>{activeToolData.label}</span>
          </div>
        )}

        {/* Help hint */}
        <div className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
          <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>RMB</span> Confirm
          <span className={`mx-1.5 ${isDark ? 'text-white/20' : 'text-black/10'}`}>|</span>
          <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>ESC</span> Cancel
        </div>
      </div>
    </div>
  );
}
