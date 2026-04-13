'use client';

import { useLanguage } from '@/i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
          language === 'en'
            ? 'bg-white/20 text-white'
            : 'text-white/60 hover:text-white/80'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('zh')}
        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
          language === 'zh'
            ? 'bg-white/20 text-white'
            : 'text-white/60 hover:text-white/80'
        }`}
      >
        中文
      </button>
    </div>
  );
}
