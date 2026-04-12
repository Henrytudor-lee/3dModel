'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function Home() {
  const router = useRouter();
  const { initialized, loading, user, isGuest } = useAuthStore();

  useEffect(() => {
    if (!initialized || loading) return;

    if (user || isGuest) {
      // Logged in or guest - go to projects (for user) or app (for guest)
      if (isGuest) {
        router.push('/app');
      } else {
        router.push('/projects');
      }
    } else {
      // Not logged in - go to login
      router.push('/login');
    }
  }, [initialized, loading, user, isGuest, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#0b1326]">
      <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
