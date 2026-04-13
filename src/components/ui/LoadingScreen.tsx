'use client';

interface LoadingScreenProps {
  message?: string;
  variant?: 'dark' | 'light';
}

export default function LoadingScreen({ message = 'Loading...', variant = 'dark' }: LoadingScreenProps) {
  const isDark = variant === 'dark';

  return (
    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8fafc]'}`}>
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo/spinner */}
        <div className="relative">
          {/* Outer ring */}
          <div
            className={`w-16 h-16 rounded-full border-2 animate-spin ${isDark ? 'border-[#00d9ff]/20' : 'border-[#3b82f6]/20'}`}
            style={{
              animationDuration: '1.5s',
              borderRightColor: isDark ? 'rgba(0, 217, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              borderBottomColor: isDark ? 'rgba(0, 217, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              borderLeftColor: isDark ? 'rgba(0, 217, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            }}
          />
          {/* Middle ring */}
          <div
            className={`absolute inset-1 w-14 h-14 rounded-full border-2 animate-spin ${isDark ? 'border-[#00d9ff]/30' : 'border-[#3b82f6]/30'}`}
            style={{
              animationDuration: '1.2s',
              animationDirection: 'reverse',
              borderTopColor: isDark ? 'rgba(0, 217, 255, 0.3)' : 'rgba(59, 130, 246, 0.3)',
              borderRightColor: isDark ? 'rgba(0, 217, 255, 0.3)' : 'rgba(59, 130, 246, 0.3)',
            }}
          />
          {/* Inner ring */}
          <div
            className={`absolute inset-2 w-12 h-12 rounded-full border-2 animate-spin ${isDark ? 'border-[#00d9ff]/50' : 'border-[#3b82f6]/50'}`}
            style={{
              animationDuration: '0.9s',
              borderTopColor: isDark ? 'rgba(0, 217, 255, 0.5)' : 'rgba(59, 130, 246, 0.5)',
            }}
          />
          {/* Center dot */}
          <div
            className={`absolute inset-[22px] w-3 h-3 rounded-full animate-pulse ${isDark ? 'bg-[#00d9ff]' : 'bg-[#3b82f6]'}`}
          />
        </div>

        {/* Loading text with dots animation */}
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium ${isDark ? 'text-[#00d9ff]' : 'text-[#3b82f6]'}`}>
            {message}
          </span>
          <span className="flex gap-0.5">
            <span
              className={`w-1 h-1 rounded-full animate-bounce ${isDark ? 'bg-[#00d9ff]' : 'bg-[#3b82f6]'}`}
              style={{ animationDelay: '0ms' }}
            />
            <span
              className={`w-1 h-1 rounded-full animate-bounce ${isDark ? 'bg-[#00d9ff]' : 'bg-[#3b82f6]'}`}
              style={{ animationDelay: '150ms' }}
            />
            <span
              className={`w-1 h-1 rounded-full animate-bounce ${isDark ? 'bg-[#00d9ff]' : 'bg-[#3b82f6]'}`}
              style={{ animationDelay: '300ms' }}
            />
          </span>
        </div>

        {/* Progress bar */}
        <div className={`w-32 h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
          <div
            className={`h-full rounded-full animate-pulse ${isDark ? 'bg-gradient-to-r from-[#00d9ff] to-[#00d9ff]/50' : 'bg-gradient-to-r from-[#3b82f6] to-[#3b82f6]/50'}`}
            style={{
              width: '60%',
              animation: 'loading-progress 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
