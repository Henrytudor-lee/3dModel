import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  isGuest: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  isGuest: false,
  error: null,

  initialize: async () => {
    if (get().initialized) return;

    set({ loading: true });

    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.user) {
        set({
          user: data.user,
          loading: false,
          initialized: true,
          isGuest: false,
        });
      } else {
        set({ loading: false, initialized: true });
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      set({ loading: false, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ loading: false, error: data.error });
        return { error: data.error };
      }

      set({
        user: data.user,
        loading: false,
        isGuest: false,
      });

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      set({ loading: false, error: 'Network error' });
      return { error: 'Network error' };
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ loading: false, error: data.error });
        return { error: data.error };
      }

      set({
        user: data.user,
        loading: false,
        isGuest: false,
      });

      return { error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      set({ loading: false, error: 'Network error' });
      return { error: 'Network error' };
    }
  },

  signOut: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Sign out error:', err);
    }
    set({ user: null, isGuest: false });
  },

  continueAsGuest: () => {
    set({
      user: null,
      loading: false,
      initialized: true,
      isGuest: true,
    });
  },

  clearError: () => set({ error: null }),
}));
