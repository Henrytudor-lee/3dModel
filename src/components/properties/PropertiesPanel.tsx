'use client';

import { useSceneStore } from '@/stores/sceneStore';

const materialTypes = ['standard', 'metal', 'glass', 'emissive'] as const;

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

const axisColors = {
  X: '#ef4444',
  Y: '#22c55e',
  Z: '#3b82f6',
};

export default function PropertiesPanel() {
  const { objects, selectedId, updateObject } = useSceneStore();
  const selectedObject = objects.find((o) => o.id === selectedId);

  if (!selectedObject) {
    return (
      <div className="w-full bg-[#12121a] border-t border-white/5">
        <div className="h-9 px-3 flex items-center border-b border-white/5 bg-[#1a1a24]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="mr-2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Properties</span>
        </div>
        <div className="flex flex-col items-center justify-center h-32 text-center px-4">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.5">
              <path d="M15 15L21 21M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
          </div>
          <div className="text-gray-500 text-xs">Select an object</div>
        </div>
      </div>
    );
  }

  const typeColor = typeColors[selectedObject.type] || '#00d9ff';

  const handleTransformChange = (key: 'position' | 'rotation' | 'scale', axis: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newTransform = { ...selectedObject.transform };
    const current = [...newTransform[key]] as [number, number, number];
    current[axis] = numValue;
    newTransform[key] = current;
    updateObject(selectedObject.id, { transform: newTransform });
  };

  const handleMaterialChange = (key: string, value: string | number | boolean) => {
    const newMaterial = { ...selectedObject.material };
    if (key === 'opacity') {
      newMaterial.opacity = value as number;
    } else if (key === 'wireframe') {
      newMaterial.wireframe = value as boolean;
    } else if (key === 'color') {
      newMaterial.color = value as string;
    } else if (key === 'type') {
      newMaterial.type = value as 'standard' | 'metal' | 'glass' | 'emissive';
    }
    updateObject(selectedObject.id, { material: newMaterial });
  };

  return (
    <div className="w-full bg-[#12121a] border-t border-white/5">
      {/* Header */}
      <div className="h-9 px-3 flex items-center border-b border-white/5 bg-[#1a1a24]" style={{ borderTop: `2px solid ${typeColor}` }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="mr-2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Properties</span>
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
        >
          {selectedObject.type}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-4 overflow-y-auto max-h-80">
        {/* Name */}
        <div>
          <label className="block text-[10px] mb-1.5 font-medium text-gray-500 uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={selectedObject.name}
            onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
            className="w-full h-8 px-3 bg-black/40 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none transition-colors"
            onFocus={(e) => e.target.style.borderColor = typeColor + '50'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-[10px] mb-1.5 font-medium text-gray-500 uppercase tracking-wider">Color</label>
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="color"
                value={selectedObject.material.color}
                onChange={(e) => handleMaterialChange('color', e.target.value)}
                className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer transition-all hover:border-white/20"
                style={{ backgroundColor: selectedObject.material.color }}
              />
            </div>
            <input
              type="text"
              value={selectedObject.material.color}
              onChange={(e) => handleMaterialChange('color', e.target.value)}
              className="flex-1 h-9 px-3 bg-black/40 border border-white/10 rounded-lg text-xs text-gray-200 font-mono focus:outline-none transition-colors"
              onFocus={(e) => e.target.style.borderColor = typeColor + '50'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
        </div>

        {/* Material & Wireframe row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[10px] mb-1.5 font-medium text-gray-500 uppercase tracking-wider">Material</label>
            <select
              value={selectedObject.material.type}
              onChange={(e) => handleMaterialChange('type', e.target.value)}
              className="w-full h-8 px-2 bg-black/40 border border-white/10 rounded-lg text-xs text-gray-200 focus:outline-none transition-colors"
              onFocus={(e) => e.target.style.borderColor = typeColor + '50'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              {materialTypes.map((type) => (
                <option key={type} value={type} style={{ backgroundColor: '#12121a' }}>{type}</option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label className="block text-[10px] mb-1.5 font-medium text-gray-500 uppercase tracking-wider">Wireframe</label>
            <div className="flex items-center justify-center h-8 bg-black/40 border border-white/10 rounded-lg">
              <input
                type="checkbox"
                id="wireframe"
                checked={selectedObject.material.wireframe}
                onChange={(e) => handleMaterialChange('wireframe', e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: typeColor }}
              />
            </div>
          </div>
        </div>

        {/* Transform Section */}
        <div className="pt-2 border-t border-white/5">
          <label className="block text-[10px] mb-2 font-medium text-gray-500 uppercase tracking-wider">Transform</label>

          {/* Position */}
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1.5">
              {['X', 'Y', 'Z'].map((axis) => (
                <span key={axis} className="text-[10px] font-bold w-8 text-center" style={{ color: axisColors[axis as keyof typeof axisColors] }}>
                  {axis}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <input
                  key={axis}
                  type="number"
                  value={selectedObject.transform.position[i]}
                  onChange={(e) => handleTransformChange('position', i, e.target.value)}
                  className="h-7 px-2 bg-black/40 border border-white/10 rounded text-xs text-gray-200 text-center font-mono focus:outline-none transition-colors"
                  style={{ borderColor: `${axisColors[axis as keyof typeof axisColors]}30` }}
                  onFocus={(e) => e.target.style.borderColor = `${axisColors[axis as keyof typeof axisColors]}70`}
                  onBlur={(e) => e.target.style.borderColor = `${axisColors[axis as keyof typeof axisColors]}30`}
                />
              ))}
            </div>
          </div>

          {/* Rotation */}
          <div className="mb-3">
            <div className="text-[10px] text-gray-600 mb-1.5">Rotation</div>
            <div className="grid grid-cols-3 gap-1.5">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <input
                  key={axis}
                  type="number"
                  value={selectedObject.transform.rotation[i]}
                  onChange={(e) => handleTransformChange('rotation', i, e.target.value)}
                  className="h-7 px-2 bg-black/40 border border-white/10 rounded text-xs text-gray-200 text-center font-mono focus:outline-none transition-colors"
                  style={{ borderColor: `${axisColors[axis as keyof typeof axisColors]}30` }}
                  onFocus={(e) => e.target.style.borderColor = `${axisColors[axis as keyof typeof axisColors]}70`}
                  onBlur={(e) => e.target.style.borderColor = `${axisColors[axis as keyof typeof axisColors]}30`}
                />
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <div className="text-[10px] text-gray-600 mb-1.5">Scale</div>
            <div className="grid grid-cols-3 gap-1.5">
              {['X', 'Y', 'Z'].map((axis, i) => (
                <input
                  key={axis}
                  type="number"
                  value={selectedObject.transform.scale[i]}
                  onChange={(e) => handleTransformChange('scale', i, e.target.value)}
                  step="0.1"
                  className="h-7 px-2 bg-black/40 border border-white/10 rounded text-xs text-gray-200 text-center font-mono focus:outline-none transition-colors"
                  style={{ borderColor: `${axisColors[axis as keyof typeof axisColors]}30` }}
                  onFocus={(e) => e.target.style.borderColor = `${axisColors[axis as keyof typeof axisColors]}70`}
                  onBlur={(e) => e.target.style.borderColor = `${axisColors[axis as keyof typeof axisColors]}30`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
