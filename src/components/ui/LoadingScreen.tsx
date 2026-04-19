'use client';

interface LoadingScreenProps {
  message?: string;
  variant?: 'dark' | 'light';
}

export default function LoadingScreen({ message = 'Loading...', variant = 'dark' }: LoadingScreenProps) {
  const isDark = variant === 'dark';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8fafc]'}`}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute w-[200%] h-[200%] -top-1/2 -left-1/2 animate-spin-slow ${
            isDark ? 'bg-[radial-gradient(circle_at_center,#00d9ff08,#0a0a0f_50%)]' : 'bg-[radial-gradient(circle_at_center,#3b82f608,#f8fafc_50%)]'
          }`}
          style={{ animationDuration: '20s' }}
        />
        {/* Floating particles */}
        <div className={`absolute w-2 h-2 rounded-full animate-float ${isDark ? 'bg-[#00d9ff]/20' : 'bg-[#3b82f6]/20'}`}
          style={{ top: '20%', left: '30%', animationDelay: '0s' }}
        />
        <div className={`absolute w-1 h-1 rounded-full animate-float ${isDark ? 'bg-[#a855f7]/20' : 'bg-[#8b5cf6]/20'}`}
          style={{ top: '60%', left: '70%', animationDelay: '0.5s' }}
        />
        <div className={`absolute w-3 h-3 rounded-full animate-float ${isDark ? 'bg-[#00d9ff]/10' : 'bg-[#3b82f6]/10'}`}
          style={{ top: '80%', left: '20%', animationDelay: '1s' }}
        />
        <div className={`absolute w-1.5 h-1.5 rounded-full animate-float ${isDark ? 'bg-[#a855f7]/15' : 'bg-[#8b5cf6]/15'}`}
          style={{ top: '30%', left: '80%', animationDelay: '1.5s' }}
        />
      </div>

      {/* Loading content */}
      <div className="relative flex flex-col items-center gap-8 animate-fadeInUp">
        {/* Animated logo/spinner */}
        <div className="relative">
          {/* Outer glow */}
          <div
            className={`absolute inset-0 blur-xl rounded-full ${isDark ? 'bg-[#00d9ff]/20' : 'bg-[#3b82f6]/20'}`}
          />

          {/* Outer ring */}
          <div
            className={`w-16 h-16 rounded-full border-2 animate-spin ${isDark ? 'border-[#00d9ff]/20' : 'border-[#3b82f6]/20'}`}
            style={{
              animationDuration: '2s',
              borderRightColor: isDark ? 'rgba(0, 217, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              borderBottomColor: isDark ? 'rgba(0, 217, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              borderLeftColor: isDark ? 'rgba(0, 217, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            }}
          />
          {/* Middle ring */}
          <div
            className={`absolute inset-1 w-14 h-14 rounded-full border-2 animate-spin ${isDark ? 'border-[#00d9ff]/30' : 'border-[#3b82f6]/30'}`}
            style={{
              animationDuration: '1.5s',
              animationDirection: 'reverse',
              borderTopColor: isDark ? 'rgba(0, 217, 255, 0.3)' : 'rgba(59, 130, 246, 0.3)',
              borderRightColor: isDark ? 'rgba(0, 217, 255, 0.3)' : 'rgba(59, 130, 246, 0.3)',
            }}
          />
          {/* Inner ring */}
          <div
            className={`absolute inset-2 w-12 h-12 rounded-full border-2 animate-spin ${isDark ? 'border-[#00d9ff]/50' : 'border-[#3b82f6]/50'}`}
            style={{
              animationDuration: '1s',
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
            className={`h-full rounded-full ${isDark ? 'bg-gradient-to-r from-[#00d9ff] to-[#a855f7]' : 'bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]'}`}
            style={{
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
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.5; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
