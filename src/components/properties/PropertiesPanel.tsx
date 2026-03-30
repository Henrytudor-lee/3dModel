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

export default function PropertiesPanel() {
  const { objects, selectedId, updateObject } = useSceneStore();
  const selectedObject = objects.find((o) => o.id === selectedId);

  if (!selectedObject) {
    return (
      <div className="w-full bg-[#1e293b] border-t border-white/10">
        <div className="h-10 px-4 flex items-center border-b border-white/10 bg-gradient-to-r from-[#1e293b] to-[#16213e]">
          <span className="text-sm font-semibold text-white">Properties</span>
        </div>
        <div className="p-4 text-center">
          <div className="text-3xl mb-2 opacity-30">🎯</div>
          <div className="text-gray-500 text-sm">
            Select an object to view properties
          </div>
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
    <div className="w-full bg-[#1e293b] border-t border-white/10">
      <div className="h-10 px-4 flex items-center border-b border-white/10 bg-gradient-to-r from-[#1e293b] to-[#16213e]" style={{ borderTopColor: typeColor + '40', borderTopWidth: 2 }}>
        <span className="text-sm font-semibold text-white">Properties</span>
        <span
          className="ml-2 px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: typeColor + '20', color: typeColor }}
        >
          {selectedObject.type}
        </span>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-96">
        {/* Name */}
        <div>
          <label className="block text-xs mb-1 font-medium" style={{ color: '#94a3b8' }}>Name</label>
          <input
            type="text"
            value={selectedObject.name}
            onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
            className="w-full h-8 px-3 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none transition-colors"
            style={{ '--tw-border-opacity': '1', borderColor: selectedObject.material.color + '40' } as React.CSSProperties}
            onFocus={(e) => e.target.style.borderColor = typeColor + '80'}
            onBlur={(e) => e.target.style.borderColor = selectedObject.material.color + '40'}
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs mb-1 font-medium" style={{ color: '#94a3b8' }}>Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={selectedObject.material.color}
              onChange={(e) => handleMaterialChange('color', e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer transition-transform hover:scale-105"
              style={{ boxShadow: `0 0 10px ${selectedObject.material.color}40` }}
            />
            <input
              type="text"
              value={selectedObject.material.color}
              onChange={(e) => handleMaterialChange('color', e.target.value)}
              className="flex-1 h-10 px-3 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none transition-colors"
              style={{ borderColor: selectedObject.material.color + '40' }}
              onFocus={(e) => e.target.style.borderColor = typeColor + '80'}
              onBlur={(e) => e.target.style.borderColor = selectedObject.material.color + '40'}
            />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-xs mb-1 font-medium" style={{ color: '#94a3b8' }}>
            Transparency: {Math.round((1 - selectedObject.material.opacity) * 100)}%
          </label>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={(1 - selectedObject.material.opacity) * 100}
              onChange={(e) => handleMaterialChange('opacity', 1 - parseInt(e.target.value) / 100)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${typeColor} 0%, #374151 100%)` }}
            />
          </div>
        </div>

        {/* Material Type */}
        <div>
          <label className="block text-xs mb-1 font-medium" style={{ color: '#94a3b8' }}>Material</label>
          <select
            value={selectedObject.material.type}
            onChange={(e) => handleMaterialChange('type', e.target.value)}
            className="w-full h-10 px-3 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none transition-colors"
            style={{ borderColor: '#ffffff20' }}
            onFocus={(e) => e.target.style.borderColor = typeColor + '60'}
            onBlur={(e) => e.target.style.borderColor = '#ffffff20'}
          >
            {materialTypes.map((type) => (
              <option key={type} value={type} style={{ backgroundColor: '#1e293b' }}>{type}</option>
            ))}
          </select>
        </div>

        {/* Wireframe */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-black/20">
          <input
            type="checkbox"
            id="wireframe"
            checked={selectedObject.material.wireframe}
            onChange={(e) => handleMaterialChange('wireframe', e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: typeColor }}
          />
          <label htmlFor="wireframe" className="text-sm text-white">Wireframe</label>
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs mb-2 font-medium" style={{ color: '#94a3b8' }}>Position</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { axis: 'X', color: '#ef4444' },
              { axis: 'Y', color: '#22c55e' },
              { axis: 'Z', color: '#3b82f6' },
            ].map(({ axis, color }) => (
              <div key={axis} className="relative">
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold z-10"
                  style={{ color }}
                >
                  {axis}
                </span>
                <input
                  type="number"
                  value={selectedObject.transform.position[['X', 'Y', 'Z'].indexOf(axis)]}
                  onChange={(e) => handleTransformChange('position', ['X', 'Y', 'Z'].indexOf(axis), e.target.value)}
                  className="w-full h-8 pl-6 pr-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none transition-colors text-center"
                  style={{ borderColor: color + '30' }}
                  onFocus={(e) => e.target.style.borderColor = color + '80'}
                  onBlur={(e) => e.target.style.borderColor = color + '30'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-xs mb-2 font-medium" style={{ color: '#94a3b8' }}>Rotation (deg)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { axis: 'X', color: '#ef4444' },
              { axis: 'Y', color: '#22c55e' },
              { axis: 'Z', color: '#3b82f6' },
            ].map(({ axis, color }) => (
              <div key={axis} className="relative">
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold z-10"
                  style={{ color }}
                >
                  {axis}
                </span>
                <input
                  type="number"
                  value={selectedObject.transform.rotation[['X', 'Y', 'Z'].indexOf(axis)]}
                  onChange={(e) => handleTransformChange('rotation', ['X', 'Y', 'Z'].indexOf(axis), e.target.value)}
                  className="w-full h-8 pl-6 pr-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none transition-colors text-center"
                  style={{ borderColor: color + '30' }}
                  onFocus={(e) => e.target.style.borderColor = color + '80'}
                  onBlur={(e) => e.target.style.borderColor = color + '30'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div>
          <label className="block text-xs mb-2 font-medium" style={{ color: '#94a3b8' }}>Scale</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { axis: 'X', color: '#ef4444' },
              { axis: 'Y', color: '#22c55e' },
              { axis: 'Z', color: '#3b82f6' },
            ].map(({ axis, color }) => (
              <div key={axis} className="relative">
                <span
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold z-10"
                  style={{ color }}
                >
                  {axis}
                </span>
                <input
                  type="number"
                  value={selectedObject.transform.scale[['X', 'Y', 'Z'].indexOf(axis)]}
                  onChange={(e) => handleTransformChange('scale', ['X', 'Y', 'Z'].indexOf(axis), e.target.value)}
                  step="0.1"
                  className="w-full h-8 pl-6 pr-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none transition-colors text-center"
                  style={{ borderColor: color + '30' }}
                  onFocus={(e) => e.target.style.borderColor = color + '80'}
                  onBlur={(e) => e.target.style.borderColor = color + '30'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
