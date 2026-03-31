'use client';

import { useSceneStore } from '@/stores/sceneStore';
import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSceneStore();

  useEffect(() => {
    document.body.className = `h-full overflow-hidden ${
      theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-[#f8fafc]'
    }`;
  }, [theme]);

  return (
    <div
      className={`h-full ${
        theme === 'dark'
          ? 'bg-[#0a0a0f] text-gray-100'
          : 'bg-[#f8fafc] text-gray-900'
      }`}
    >
      {children}
    </div>
  );
}
