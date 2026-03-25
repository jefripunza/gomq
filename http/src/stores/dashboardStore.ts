import { create } from "zustand";
import {
  dashboardService,
  type DashboardStats,
} from "@/services/dashboard.service";

interface DashboardQueue {
  key: string;
  name: string;
  color: string;
  completedCount: number;
}

interface DashboardState {
  stats: DashboardStats;
  queues: DashboardQueue[];
  isLoading: boolean;
  fetchStats: () => Promise<void>;
  setStats: (stats: DashboardStats) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  stats: {
    total_queues: 0,
    total_messages: 0,
    total_completed: 0,
    total_failed: 0,
    total_timing: 0,
    total_pending: 0,
  },
  queues: [],
  isLoading: false,
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      set({});
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      set({ isLoading: false });
    }
  },
  setStats: (stats) => set({ stats }),
}));
