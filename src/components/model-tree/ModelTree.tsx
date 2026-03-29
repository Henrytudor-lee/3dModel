'use client';

import { useState } from 'react';
import { useSceneStore, SceneObject } from '@/stores/sceneStore';

function ModelNode({ object, level = 0 }: { object: SceneObject; level?: number }) {
  const { selectedId, setSelectedId, removeObject, updateObject } = useSceneStore();
  const isSelected = selectedId === object.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(object.name);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(object.name);
  };

  const handleNameSubmit = () => {
    updateObject(object.id, { name: editName });
    setIsEditing(false);
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

  return (
    <div
      className={`flex items-center gap-2 h-8 px-2 cursor-pointer rounded ${
        isSelected ? 'bg-[#0f4c75]' : 'hover:bg-white/5'
      }`}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onClick={() => setSelectedId(object.id)}
    >
      <span className="text-sm w-5">{typeIcons[object.type] || '?'}</span>

      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
          className="flex-1 bg-transparent border border-[#00d9ff] rounded px-1 text-sm text-white outline-none"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-sm text-white truncate"
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
        className={`w-6 h-6 flex items-center justify-center text-xs rounded hover:bg-white/10 ${
          object.visible ? 'text-gray-300' : 'text-gray-600'
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
        className="w-6 h-6 flex items-center justify-center text-xs rounded hover:bg-red-500/20 text-red-400"
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
    <div className="w-full h-full bg-[#16213e] flex flex-col">
      <div className="h-10 px-4 flex items-center border-b border-white/10">
        <span className="text-sm font-medium text-white">Model Tree</span>
        <span className="ml-auto text-xs text-gray-400">{objects.length} objects</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {objects.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No models yet.<br />
            Use toolbar to add shapes.
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
