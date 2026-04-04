'use client';

import dynamic from 'next/dynamic';
import Toolbar from '@/components/toolbar/Toolbar';
import ModelTree from '@/components/model-tree/ModelTree';
import PropertiesPanel from '@/components/properties/PropertiesPanel';
import { useSceneStore } from '@/stores/sceneStore';
import { useState, useCallback, useEffect, useRef } from 'react';

// Dynamic import for Three.js canvas (client-side only)
const SceneCanvas = dynamic(() => import('@/components/canvas/SceneCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#00d9ff] border-t-transparent rounded-full animate-spin" />
        <div className="text-[#00d9ff] text-sm">Loading Engine...</div>
      </div>
    </div>
  ),
});

function getDrawingHint(activeTool: string | null, phase: string): string | null {
  if (!activeTool || activeTool === 'select') return null;

  switch (activeTool) {
    case 'line':
      if (phase === 'idle') return 'Click to set line start point';
      return 'Click to add more points, right-click to finish';
    case 'polygon':
      if (phase === 'idle') return 'Click to start polygon';
      return 'Click to add points, right-click to close';
    case 'cube':
      if (phase === 'idle') return 'Click to set first corner';
      if (phase === 'placing') return 'Click to set opposite corner';
      if (phase === 'drag') return 'Move mouse to adjust height, click to confirm';
      return 'Click to place cube';
    case 'cylinder':
      if (phase === 'idle') return 'Click to set center';
      if (phase === 'placing') return 'Click to set radius';
      if (phase === 'drag') return 'Move mouse to adjust height, click to confirm';
      return 'Click to place cylinder';
    case 'prism':
      if (phase === 'idle') return 'Click to set center';
      if (phase === 'placing') return 'Click to set radius';
      if (phase === 'drag') return 'Move mouse to adjust height, click to confirm';
      return 'Click to place prism';
    case 'sphere':
      if (phase === 'idle') return 'Click to set center';
      if (phase === 'placing') return 'Click to set radius';
      return 'Click to place sphere';
    default:
      return `Drawing ${activeTool}...`;
  }
}

export default function Home() {
  const { activeTool, drawingState, theme } = useSceneStore();
  const hint = getDrawingHint(activeTool, drawingState.phase);
  const isDark = theme === 'dark';

  // Vertical divider between ModelTree and PropertiesPanel
  const [modelTreeHeight, setModelTreeHeight] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const resizingRef = useRef(false);
  const panelTopRef = useRef(0);

  const handleVerticalMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizingRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleVerticalMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const containerRect = document.getElementById('left-panel')?.getBoundingClientRect();
    if (!containerRect) return;
    const relativeY = e.clientY - containerRect.top;
    const newHeight = Math.max(120, Math.min(containerRect.height - 100, relativeY));
    setModelTreeHeight(newHeight);
  }, []);

  const handleVerticalMouseUp = useCallback(() => {
    if (resizingRef.current) {
      setIsResizing(false);
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleVerticalMouseMove);
      window.addEventListener('mouseup', handleVerticalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleVerticalMouseMove);
        window.removeEventListener('mouseup', handleVerticalMouseUp);
      };
    }
  }, [isResizing, handleVerticalMouseMove, handleVerticalMouseUp]);

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8fafc]'}`}>
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Model Tree + Properties */}
        <div
          id="left-panel"
          className={`w-[280px] flex flex-col border-r flex-shrink-0 ${isDark ? 'border-white/5' : 'border-gray-200'}`}
        >
          {/* Model Tree with dynamic height */}
          <div
            className="overflow-hidden"
            style={{ height: modelTreeHeight }}
          >
            <ModelTree />
          </div>

          {/* Horizontal Resizable Divider */}
          <div
            className={`h-1 cursor-row-resize flex-shrink-0 transition-colors ${
              isResizing
                ? 'bg-[#00d9ff]'
                : isDark
                  ? 'bg-white/5 hover:bg-white/20'
                  : 'bg-gray-200 hover:bg-gray-400'
            }`}
            onMouseDown={handleVerticalMouseDown}
          />

          {/* Properties Panel */}
          <div className="flex-1 overflow-hidden">
            <PropertiesPanel />
          </div>
        </div>

        {/* Right Panel - 3D Canvas */}
        <div className="flex-1 relative">
          <SceneCanvas />

          {/* Tool hint */}
          {hint && (
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-lg text-xs font-medium border ${
              isDark ? 'bg-black/80 text-white/90 border-white/10' : 'bg-white/90 text-gray-900 border-gray-200'
            }`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#00d9ff]">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              {hint}
            </div>
          )}

          {/* Viewport controls hint */}
          <div className={`absolute bottom-6 right-6 flex items-center gap-2 text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
            <span>Orbit: LMB</span>
            <span className={isDark ? 'text-white/20' : 'text-black/20'}>|</span>
            <span>Pan: MMB</span>
            <span className={isDark ? 'text-white/20' : 'text-black/20'}>|</span>
            <span>Zoom: Scroll</span>
          </div>
        </div>
      </div>
    </div>
  );
}
