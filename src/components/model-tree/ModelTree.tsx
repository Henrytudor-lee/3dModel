'use client';

import { useState } from 'react';
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

const typeIcons: Record<string, string> = {
  box: '□',
  sphere: '○',
  cylinder: '⬭',
  prism: '⬡',
  line: '/',
  curve: '~',
  polygon: '⯁',
  group: '⊞',
};

function ModelNode({ object, level = 0 }: { object: SceneObject; level?: number }) {
  const { selectedId, setSelectedId, removeObject, updateObject } = useSceneStore();
  const isSelected = selectedId === object.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(object.name);
  const typeColor = typeColors[object.type] || '#94a3b8';

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
      className={`flex items-center gap-2 h-8 px-2 cursor-pointer rounded-lg transition-all duration-150 ${
        isSelected ? 'shadow-md' : 'hover:bg-white/5'
      }`}
      style={{
        paddingLeft: `${level * 16 + 8}px`,
        backgroundColor: isSelected ? `${typeColor}20` : undefined,
        borderLeft: isSelected ? `2px solid ${typeColor}` : '2px solid transparent',
      }}
      onClick={() => setSelectedId(object.id)}
    >
      <span
        className="text-sm w-5 font-medium"
        style={{ color: typeColor }}
      >
        {typeIcons[object.type] || '?'}
      </span>

      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
          className="flex-1 bg-transparent border rounded px-1 text-sm text-white outline-none"
          style={{ borderColor: typeColor + '80' }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-sm text-white truncate font-medium"
          onDoubleClick={handleDoubleClick}
        >
          {object.name}
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          updateObject(object.id, { visible: !object.visible });
        }}
        className={`w-6 h-6 flex items-center justify-center text-xs rounded-lg transition-colors ${
          object.visible ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600'
        }`}
        title={object.visible ? 'Hide' : 'Show'}
      >
        👁
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          removeObject(object.id);
        }}
        className="w-6 h-6 flex items-center justify-center text-xs rounded-lg transition-all text-red-400/50 hover:text-red-400 hover:bg-red-500/20"
        title="Delete"
      >
        ✕
      </button>
    </div>
  );
}

export default function ModelTree() {
  const { objects } = useSceneStore();

  return (
    <div className="w-full h-full bg-[#1e293b] flex flex-col">
      <div className="h-10 px-4 flex items-center border-b border-white/10 bg-gradient-to-r from-[#1e293b] to-[#16213e]">
        <span className="text-sm font-semibold text-white">Model Tree</span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: objects.length > 0 ? '#22c55e20' : '#ffffff10', color: objects.length > 0 ? '#22c55e' : '#94a3b8' }}
        >
          {objects.length} {objects.length === 1 ? 'object' : 'objects'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {objects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3 opacity-30">📦</div>
            <div className="text-gray-400 text-sm">
              No models yet.
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Use toolbar to add shapes
            </div>
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
