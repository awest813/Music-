import { create } from 'zustand';

export type LogEntry = {
  timestamp: Date;
  level: string;
  scope: string;
  message: string;
};

const MAX_LOGS = 1000;

type LogStoreState = {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'timestamp'>) => void;
  clearLogs: () => void;
};

export const useLogStore = create<LogStoreState>((set) => ({
  logs: [],
  addLog: (entry) =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-(MAX_LOGS - 1)),
        { ...entry, timestamp: new Date() },
      ],
    })),
  clearLogs: () => set({ logs: [] }),
}));
