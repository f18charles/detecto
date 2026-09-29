import { create } from 'zustand';

export const CONFIDENCE_THRESHOLDS = [0, 0.5, 0.7, 0.85];

export const useHistoryFilterStore = create((set, get) => ({
  thresholdIndex: 0,
  minConfidence: 0,

  cycleFilter: () => {
    const nextIdx = (get().thresholdIndex + 1) % CONFIDENCE_THRESHOLDS.length;
    set({
      thresholdIndex: nextIdx,
      minConfidence: CONFIDENCE_THRESHOLDS[nextIdx],
    });
  },

  resetFilter: () => set({ thresholdIndex: 0, minConfidence: 0 }),
}));
