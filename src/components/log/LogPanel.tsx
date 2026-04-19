'use client';

import { useLogStore, LogEntry } from '@/stores/logStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useState, useEffect, useCallback, useRef } from 'react';

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getTypeColor(type: LogEntry['type']): string {
  switch (type) {
    case 'create': return 'text-green-400';
    case 'delete': return 'text-red-400';
    case 'update': return 'text-blue-400';
    case 'operation': return 'text-purple-400';
    case 'select': return 'text-yellow-400';
    case 'transform': return 'text-cyan-400';
    case 'boolean': return 'text-orange-400';
    case 'material': return 'text-pink-400';
    default: return 'text-gray-400';
  }
}

function getTypeIcon(type: LogEntry['type']): string {
  switch (type) {
    case 'create': return '+';
    case 'delete': return '×';
    case 'update': return '~';
    case 'operation': return '○';
    case 'select': return '◇';
    case 'transform': return '↔';
    case 'boolean': return '◉';
    case 'material': return '◆';
    default: return '•';
  }
}

export default function LogPanel() {
  const { entries, isVisible, toggleVisibility, clearLogs } = useLogStore();
  const { theme } = useSceneStore();
  const isDark = theme === 'dark';

  const [autoScroll, setAutoScroll] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 320, h: 192 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - (panelRef.current?.offsetLeft || 0),
      y: e.clientY - (panelRef.current?.offsetTop || 0),
    };
  }, []);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: panelRef.current?.offsetWidth || 320,
      h: panelRef.current?.offsetHeight || 192,
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current && panelRef.current) {
        // Calculate boundaries - keep panel within the canvas area
        const canvas = document.getElementById('canvas-container');
        const panel = panelRef.current;
        const panelWidth = panel.offsetWidth;
        const panelHeight = panel.offsetHeight;

        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        // Get canvas boundaries
        let maxX = window.innerWidth;
        let maxY = window.innerHeight;

        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          maxX = rect.right;
          maxY = rect.bottom;
        }

        // Clamp position within canvas area
        newX = Math.max(0, Math.min(newX, maxX - panelWidth));
        newY = Math.max(0, Math.min(newY, maxY - panelHeight));

        panel.style.left = `${newX}px`;
        panel.style.top = `${newY}px`;
        panel.style.bottom = 'auto';
      }
      if (isResizing.current && panelRef.current) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        const newW = Math.max(200, resizeStart.current.w + deltaX);
        const newH = Math.max(100, resizeStart.current.h + deltaY);
        panelRef.current.style.width = `${newW}px`;
        panelRef.current.style.height = `${newH}px`;
      }
    };
    const onMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const resetPosition = useCallback(() => {
    if (panelRef.current) {
      panelRef.current.style.left = '24px';
      panelRef.current.style.top = 'auto';
      panelRef.current.style.bottom = '24px';
      panelRef.current.style.width = '340px';
      panelRef.current.style.height = '240px';
    }
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className={`absolute bottom-6 left-6 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white/70'
            : 'bg-black/10 hover:bg-black/20 text-black/50'
        }`}
      >
        Show Log ({entries.length})
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`absolute select-none rounded-lg border ${
        isDark
          ? 'bg-black/80 border-white/10'
          : 'bg-white/90 border-gray-200'
      } ${isDragging.current ? 'opacity-90' : ''}`}
      style={{
        left: 24,
        bottom: 24,
        width: 340,
        height: 240,
        cursor: isDragging.current ? 'grabbing' : 'default',
      }}
    >
      {/* Header - Draggable */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b cursor-grab active:cursor-grabbing rounded-t-lg ${
          isDark ? 'border-white/5' : 'border-gray-200'
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
            Log
          </span>
          <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            {entries.length} entries
          </span>
        </div>
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`w-5 h-5 flex items-center justify-center rounded text-[10px] ${
              autoScroll
                ? 'text-[#00d9ff]'
                : isDark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Auto-scroll"
          >
            ↓
          </button>
          <button
            onClick={clearLogs}
            className={`w-5 h-5 flex items-center justify-center rounded text-[10px] ${
              isDark ? 'text-white/30 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Clear"
          >
            ×
          </button>
          <button
            onClick={toggleVisibility}
            className={`w-5 h-5 flex items-center justify-center rounded text-[10px] ${
              isDark ? 'text-white/30 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Hide"
          >
            −
          </button>
          <button
            onClick={resetPosition}
            className={`w-5 h-5 flex items-center justify-center rounded text-[10px] ${
              isDark ? 'text-white/30 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Reset position"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Log entries - scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ height: 'calc(100% - 41px)' }}>
        {entries.length === 0 ? (
          <div className={`px-3 py-4 text-center text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            No operations yet
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`px-3 py-1.5 flex items-start gap-2 text-xs hover:${
                isDark ? 'bg-white/5' : 'bg-gray-100'
              } ${index > 0 ? 'border-t ' + (isDark ? 'border-white/5' : 'border-gray-100') : ''}`}
            >
              <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 ${
                isDark ? 'bg-white/10' : 'bg-gray-200'
              }`}>
                {getTypeIcon(entry.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`${getTypeColor(entry.type)} whitespace-pre-wrap text-[11px] leading-4`} style={{ wordBreak: 'break-word' }}>
                  {entry.message}
                </div>
                <div className={`text-[10px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                  {formatTime(entry.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resize handle - bottom right corner */}
      <div
        className={`absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-0.5 ${
          isDark ? 'text-white/20 hover:text-white/40' : 'text-gray-300 hover:text-gray-500'
        }`}
        onMouseDown={handleResizeMouseDown}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 7L7 1M4 7L7 4" strokeLinecap="round"/>
        </svg>
      </div>
      {/* Bottom edge resize - height only */}
      <div
        className={`absolute bottom-0 left-0 right-5 h-2 cursor-s-resize ${
          isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
        }`}
        onMouseDown={handleResizeMouseDown}
      />
      {/* Right edge resize - width only */}
      <div
        className={`absolute top-0 right-0 bottom-5 w-2 cursor-e-resize ${
          isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'
        }`}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}
