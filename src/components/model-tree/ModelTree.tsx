'use client';

import React, { useState } from 'react';
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3L3 8v8l9 5 9-5V8l-9-5z" />
      <path d="M12 3v13" />
      <path d="M3 8l9 5 9-5" />
    </svg>
  ),
  sphere: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="9" ry="3" />
    </svg>
  ),
  cylinder: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <ellipse cx="12" cy="18" rx="7" ry="3" />
      <line x1="5" y1="6" x2="5" y2="18" />
      <line x1="19" y1="6" x2="19" y2="18" />
    </svg>
  ),
  prism: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3L3 8v8l9 5 9-5V8l-9-5z" />
      <path d="M12 3l-5 2.5" />
      <path d="M12 3l5 2.5" />
      <path d="M7 5.5v8" />
      <path d="M17 5.5v8" />
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
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
};

function ModelNode({ object, level = 0 }: { object: SceneObject; level?: number }) {
  const { selectedId, setSelectedId, removeObject, updateObject } = useSceneStore();
  const isSelected = selectedId === object.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(object.name);
  const typeColor = typeColors[object.type] || '#94a3b8';
  const Icon = TypeIcons[object.type] || (() => <span>?</span>);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(object.name);
  };

  const handleNameSubmit = () => {
    updateObject(object.id, { name: editName });
    setIsEditing(false);
  };

  return (
    <div
      className="group flex items-center gap-2 h-9 px-2 cursor-pointer transition-all duration-100"
      style={{
        paddingLeft: `${level * 12 + 8}px`,
        backgroundColor: isSelected ? `${typeColor}15` : 'transparent',
        borderLeft: isSelected ? `2px solid ${typeColor}` : '2px solid transparent',
      }}
      onClick={() => setSelectedId(object.id)}
      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
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
          className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-0.5 text-xs text-white outline-none"
          style={{ borderColor: typeColor + '60' }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-xs text-gray-300 truncate"
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
            ? 'text-gray-500 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10'
            : 'text-gray-600'
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
        className="w-5 h-5 flex items-center justify-center rounded text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all duration-100"
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
  const { objects } = useSceneStore();

  return (
    <div className="w-full h-full flex flex-col bg-[#12121a]">
      {/* Header */}
      <div className="h-9 px-3 flex items-center border-b border-white/5 bg-[#1a1a24]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="mr-2">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        </svg>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Scene</span>
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: objects.length > 0 ? `${typeColors.box}20` : 'rgba(255,255,255,0.05)', color: objects.length > 0 ? typeColors.box : '#64748b' }}
        >
          {objects.length}
        </span>
      </div>

      {/* Object list */}
      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              </svg>
            </div>
            <div className="text-gray-500 text-xs mb-1">Empty Scene</div>
            <div className="text-gray-600 text-[10px]">Select a tool to begin</div>
          </div>
        ) : (
          objects.map((obj) => (
            <ModelNode key={obj.id} object={obj} />
          ))
        )}
      </div>
    </div>
  );
}
