'use client';

import React, { useState, useCallback } from 'react';
import { useSceneStore, SceneObject } from '@/stores/sceneStore';

const typeColors: Record<string, string> = {
  box: '#ef4444',
  sphere: '#3b82f6',
  cylinder: '#f97316',
  prism: '#eab308',
  line: '#22c55e',
  curve: '#a855f7',
  polygon: '#06b6d4',
  group: '#94a3b8',
};

// SVG Icons for object types
const TypeIcons: Record<string, () => React.ReactNode> = {
  box: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  sphere: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  ),
  cylinder: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  prism: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l-8 4.5v9l8 4.5 8-4.5v-9L12 2z" />
      <path d="M12 22V12" />
      <path d="M20 6.5l-8 4.5" />
      <path d="M4 6.5l8 4.5" />
      <ellipse cx="12" cy="12" rx="8" ry="4.5" />
    </svg>
  ),
  line: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  curve: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 20 Q 12 4, 20 12" />
    </svg>
  ),
  polygon: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12,2 20,8 17,18 7,18 4,8" />
    </svg>
  ),
  group: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
};

interface ContextMenuState {
  x: number;
  y: number;
  objectId: string | null;
}

function ModelNode({ object, level = 0 }: { object: SceneObject; level?: number }) {
  const { selectedIds, setSelectedId, toggleSelectedId, removeObject, updateObject, ungroupObject, theme } = useSceneStore();
  const isSelected = selectedIds.includes(object.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(object.name);
  const typeColor = typeColors[object.type] || '#94a3b8';
  const Icon = TypeIcons[object.type] || (() => <span>?</span>);
  const isDark = theme === 'dark';

  const handleDoubleClick = () => {
    if (object.type === 'group') {
      setIsEditing(true);
      setEditName(object.name);
    }
  };

  const handleNameSubmit = () => {
    updateObject(object.id, { name: editName });
    setIsEditing(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      toggleSelectedId(object.id);
    } else {
      setSelectedId(object.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSelected) {
      setSelectedId(object.id);
    }
  };

  return (
    <div
      className="group flex items-center gap-2 h-9 px-2 cursor-pointer transition-all duration-100"
      style={{
        paddingLeft: `${level * 12 + 8}px`,
        backgroundColor: isSelected ? `${typeColor}20` : 'transparent',
        borderLeft: isSelected ? `2px solid ${typeColor}` : '2px solid transparent',
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')}
      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span style={{ color: typeColor }}>
        <Icon />
      </span>

      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
          className={`flex-1 border rounded px-2 py-0.5 text-xs outline-none ${isDark ? 'bg-black/40 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          style={{ borderColor: typeColor + '60' }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className={`flex-1 text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          onDoubleClick={handleDoubleClick}
        >
          {object.name}
        </span>
      )}

      {/* Visibility toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          updateObject(object.id, { visible: !object.visible });
        }}
        className={`w-5 h-5 flex items-center justify-center rounded transition-all duration-100 ${
          object.visible
            ? isDark ? 'text-gray-500 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-900 hover:bg-gray-100'
            : isDark ? 'text-gray-600' : 'text-gray-500'
        }`}
        title={object.visible ? 'Hide' : 'Show'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {object.visible ? (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : (
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          )}
        </svg>
      </button>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeObject(object.id);
        }}
        className={`w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-all duration-100 ${isDark ? 'text-gray-600 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
        title="Delete"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function ModelTree() {
  const { objects, selectedIds, setSelectedId, groupSelected, ungroupObject, theme } = useSceneStore();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const isDark = theme === 'dark';

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, objectId: null });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleGroup = () => {
    if (selectedIds.length >= 2) {
      groupSelected();
    }
    closeContextMenu();
  };

  const handleUngroup = () => {
    if (selectedIds.length === 1) {
      ungroupObject(selectedIds[0]);
    }
    closeContextMenu();
  };

  const selectedObject = objects.find((o) => o.id === selectedIds[0]);

  return (
    <div className="w-full h-full flex flex-col" onContextMenu={handleContextMenu}>
      {/* Header */}
      <div className={`h-9 px-3 flex items-center border-b ${isDark ? 'border-white/5 bg-[#1a1a24]' : 'border-gray-200 bg-[#ffffff]'}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="mr-2">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        </svg>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Scene</span>
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: objects.length > 0 ? `${typeColors.box}20` : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: objects.length > 0 ? typeColors.box : '#64748b' }}
        >
          {objects.length}
        </span>
      </div>

      {/* Object list */}
      <div className={`flex-1 overflow-y-auto ${isDark ? '' : 'bg-[#f8fafc]'}`} onClick={closeContextMenu}>
        {objects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#4a5568' : '#9ca3af'} strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            </div>
            <div className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Empty Scene</div>
            <div className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Select a tool to begin</div>
          </div>
        ) : (
          objects.map((obj) => (
            <ModelNode key={obj.id} object={obj} />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className={`fixed z-50 border rounded-lg shadow-xl py-1 min-w-[160px] ${isDark ? 'bg-[#1a1a24] border-white/10' : 'bg-white border-gray-200'}`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleGroup}
              disabled={selectedIds.length < 2}
              className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors ${
                selectedIds.length >= 2
                  ? isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
                  : isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              Group Selected ({selectedIds.length})
            </button>

            {selectedObject?.type === 'group' && (
              <button
                onClick={handleUngroup}
                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors ${isDark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Ungroup
              </button>
            )}

            <div className={`h-px my-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

            <div className={`px-3 py-1.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'No selection'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
