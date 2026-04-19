'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Toolbar from '@/components/toolbar/Toolbar';
import ModelTree from '@/components/model-tree/ModelTree';
import PropertiesPanel from '@/components/properties/PropertiesPanel';
import LogPanel from '@/components/log/LogPanel';
import LoadingScreen from '@/components/ui/LoadingScreen';
import AiChatPanel from '@/components/ai-chat/AiChatPanel';
import { useSceneStore } from '@/stores/sceneStore';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore, deserializeScene } from '@/stores/projectStore';
import { useState, useCallback, useRef } from 'react';

// Dynamic import for Three.js canvas (client-side only)
const SceneCanvas = dynamic(() => import('@/components/canvas/SceneCanvas'), {
  ssr: false,
  loading: () => <LoadingScreen message="Loading Engine..." />,
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

export default function AppPage() {
  const router = useRouter();
  const { initialized, loading, isGuest } = useAuthStore();
  const { currentProject, loadSceneData, saveSceneData, saving } = useProjectStore();
  const { objects, setObjects, clearScene, showGrid, showAxes, theme, setTheme } = useSceneStore();
  const [saveCount, setSaveCount] = useState(0);
  const [saveToast, setSaveToast] = useState(false);
  const { activeTool, drawingState } = useSceneStore();
  const hint = getDrawingHint(activeTool, drawingState.phase);
  const isDark = theme === 'dark';

  const [modelTreeHeight, setModelTreeHeight] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const resizingRef = useRef(false);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const lastSavedObjects = useRef<string>('');
  const isSavingRef = useRef(false);

  // Load project data when currentProject changes
  useEffect(() => {
    if (!initialized || loading) return;

    if (currentProject?.scene_data) {
      // Load scene data from project
      const deserializedObjects = deserializeScene(currentProject.scene_data);
      setObjects(deserializedObjects);
      lastSavedObjects.current = JSON.stringify(deserializedObjects);

      // Load theme from project settings
      if (currentProject.settings?.theme) {
        setTheme(currentProject.settings.theme);
      }
    } else if (!isGuest && !currentProject) {
      // Logged in but no project selected - go to projects
      router.push('/projects');
    }
  }, [initialized, loading, currentProject, isGuest, setObjects, setTheme, router]);

  // Manual save when saveCount changes
  useEffect(() => {
    if (!currentProject || saveCount === 0 || isSavingRef.current) return;

    const saveScene = async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      const objectsToSave = objects;
      await saveSceneData(
        {
          version: '1.0',
          objects: objectsToSave.map((obj) => ({
            id: obj.id,
            name: obj.name,
            type: obj.type,
            geometry: obj.geometry,
            transform: obj.transform,
            material: obj.material,
            visible: obj.visible,
            children: obj.children,
          })),
        },
        { showGrid, showAxes, theme }
      );
      lastSavedObjects.current = JSON.stringify(objectsToSave);
      isSavingRef.current = false;
    };

    saveScene();
  }, [saveCount, currentProject, saveSceneData]);

  // Expose save function globally for toolbar
  useEffect(() => {
    (window as any).__triggerSave = () => {
      if (currentProject) {
        setSaveCount(prev => prev + 1);
      }
    };
  }, [currentProject]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentProject) {
          setSaveCount(prev => prev + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject]);

  // Show toast when save completes
  useEffect(() => {
    if (!saving && saveCount > 0) {
      setSaveToast(true);
      const timer = setTimeout(() => setSaveToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saving, saveCount]);

  // Initialize ModelTree height to 50% on mount
  useEffect(() => {
    if (leftPanelRef.current) {
      setModelTreeHeight(leftPanelRef.current.clientHeight / 2);
    }
  }, []);

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

  // Auth guard - no action needed, auth is handled above
  useEffect(() => {
    // Auth state is already handled by the loading check above
  }, [initialized]);

  if (!initialized || loading) {
    return <LoadingScreen message="Loading Studio..." />;
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8fafc]'}`}>
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Model Tree + Properties */}
        <div
          ref={leftPanelRef}
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
        <div id="canvas-container" className="flex-1 relative">
          <SceneCanvas />

          {/* Log Panel - floating at bottom left */}
          <LogPanel />

          {/* AI Chat Panel */}
          <AiChatPanel />

          {/* Save Toast */}
          {saveToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeInOut">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-sm ${
                isDark ? 'bg-green-500/90 border-green-400/30 text-white' : 'bg-green-100/90 border-green-300 text-green-900'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-medium">Project saved</span>
              </div>
            </div>
          )}

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
