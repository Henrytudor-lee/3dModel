import { create } from 'zustand';

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'create' | 'delete' | 'update' | 'operation' | 'select' | 'transform' | 'boolean' | 'material';
}

interface LogState {
  entries: LogEntry[];
  maxEntries: number;
  isVisible: boolean;
  addLog: (message: string, type: LogEntry['type']) => void;
  clearLogs: () => void;
  toggleVisibility: () => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  entries: [],
  maxEntries: 50,
  isVisible: true,

  addLog: (message, type) => {
    const newEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message,
      type,
    };

    set((state) => {
      const newEntries = [newEntry, ...state.entries];
      // Keep only the most recent maxEntries
      if (newEntries.length > state.maxEntries) {
        newEntries.pop();
      }
      return { entries: newEntries };
    });
  },

  clearLogs: () => set({ entries: [] }),

  toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
}));
