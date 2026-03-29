'use client';

import { useSceneStore } from '@/stores/sceneStore';

const materialTypes = ['standard', 'metal', 'glass', 'emissive'] as const;

export default function PropertiesPanel() {
  const { objects, selectedId, updateObject } = useSceneStore();
  const selectedObject = objects.find((o) => o.id === selectedId);

  if (!selectedObject) {
    return (
      <div className="w-full bg-[#16213e] border-t border-white/10">
        <div className="h-10 px-4 flex items-center border-b border-white/10">
          <span className="text-sm font-medium text-white">Properties</span>
        </div>
        <div className="p-4 text-center text-gray-500 text-sm">
          Select an object to view properties
        </div>
      </div>
    );
  }

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
    <div className="w-full bg-[#16213e] border-t border-white/10">
      <div className="h-10 px-4 flex items-center border-b border-white/10">
        <span className="text-sm font-medium text-white">Properties</span>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-96">
        {/* Name */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={selectedObject.name}
            onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
            className="w-full h-8 px-3 bg-black/20 border border-white/10 rounded text-sm text-white focus:border-[#00d9ff] outline-none"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={selectedObject.material.color}
              onChange={(e) => handleMaterialChange('color', e.target.value)}
              className="w-8 h-8 rounded border border-white/10 cursor-pointer"
            />
            <input
              type="text"
              value={selectedObject.material.color}
              onChange={(e) => handleMaterialChange('color', e.target.value)}
              className="flex-1 h-8 px-3 bg-black/20 border border-white/10 rounded text-sm text-white focus:border-[#00d9ff] outline-none"
            />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Transparency: {Math.round((1 - selectedObject.material.opacity) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={(1 - selectedObject.material.opacity) * 100}
            onChange={(e) => handleMaterialChange('opacity', 1 - parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Material Type */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Material</label>
          <select
            value={selectedObject.material.type}
            onChange={(e) => handleMaterialChange('type', e.target.value)}
            className="w-full h-8 px-2 bg-black/20 border border-white/10 rounded text-sm text-white focus:border-[#00d9ff] outline-none"
          >
            {materialTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Wireframe */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="wireframe"
            checked={selectedObject.material.wireframe}
            onChange={(e) => handleMaterialChange('wireframe', e.target.checked)}
            className="w-4 h-4 rounded border-white/10"
          />
          <label htmlFor="wireframe" className="text-sm text-white">Wireframe</label>
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Position</label>
          <div className="grid grid-cols-3 gap-2">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <div key={axis}>
                <span className="text-xs text-gray-500 mr-1">{axis}</span>
                <input
                  type="number"
                  value={selectedObject.transform.position[i]}
                  onChange={(e) => handleTransformChange('position', i, e.target.value)}
                  className="w-full h-7 px-2 bg-black/20 border border-white/10 rounded text-sm text-white focus:border-[#00d9ff] outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Rotation (deg)</label>
          <div className="grid grid-cols-3 gap-2">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <div key={axis}>
                <span className="text-xs text-gray-500 mr-1">{axis}</span>
                <input
                  type="number"
                  value={selectedObject.transform.rotation[i]}
                  onChange={(e) => handleTransformChange('rotation', i, e.target.value)}
                  className="w-full h-7 px-2 bg-black/20 border border-white/10 rounded text-sm text-white focus:border-[#00d9ff] outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Scale</label>
          <div className="grid grid-cols-3 gap-2">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <div key={axis}>
                <span className="text-xs text-gray-500 mr-1">{axis}</span>
                <input
                  type="number"
                  value={selectedObject.transform.scale[i]}
                  onChange={(e) => handleTransformChange('scale', i, e.target.value)}
                  step="0.1"
                  className="w-full h-7 px-2 bg-black/20 border border-white/10 rounded text-sm text-white focus:border-[#00d9ff] outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
