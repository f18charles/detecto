import { create } from 'zustand';

export const CONFIDENCE_THRESHOLDS = [0, 0.5, 0.6, 0.7, 0.8, 0.9];
export const DATE_FILTERS = [
  { id: 'all', label: 'ALL DATES' },
  { id: 'today', label: 'TODAY' },
  { id: '24h', label: 'PAST 24H' },
  { id: '7d', label: 'PAST 7D' },
];
export const TIME_FILTERS = [
  { id: 'all', label: 'ALL DAY' },
  { id: 'morning', label: 'MORNING (06-12)' },
  { id: 'afternoon', label: 'AFTERNOON (12-18)' },
  { id: 'evening', label: 'EVENING (18-24)' },
  { id: 'night', label: 'NIGHT (00-06)' },
];

export const useHistoryFilterStore = create((set, get) => ({
  confIndex: 0,
  minConfidence: 0,

  dateIndex: 0,
  dateFilter: 'all',

  timeIndex: 0,
  timeFilter: 'all',

  cycleConfidence: () => {
    const next = (get().confIndex + 1) % CONFIDENCE_THRESHOLDS.length;
    set({ confIndex: next, minConfidence: CONFIDENCE_THRESHOLDS[next] });
  },

  cycleDate: () => {
    const next = (get().dateIndex + 1) % DATE_FILTERS.length;
    set({ dateIndex: next, dateFilter: DATE_FILTERS[next].id });
  },

  cycleTime: () => {
    const next = (get().timeIndex + 1) % TIME_FILTERS.length;
    set({ timeIndex: next, timeFilter: TIME_FILTERS[next].id });
  },

  resetAllFilters: () => {
    set({
      confIndex: 0,
      minConfidence: 0,
      dateIndex: 0,
      dateFilter: 'all',
      timeIndex: 0,
      timeFilter: 'all',
    });
  },

  filterRows: (rows) => {
    if (!Array.isArray(rows)) return [];
    const { minConfidence, dateFilter, timeFilter } = get();
    const now = new Date();

    return rows.filter((row) => {
      // 1. Min Confidence filter
      if (minConfidence > 0 && (row.average_confidence ?? 0) < minConfidence) {
        return false;
      }

      const rowDate = new Date(row.timestamp);
      if (isNaN(rowDate.getTime())) return true;

      // 2. Date Filter
      if (dateFilter === 'today') {
        const isToday =
          rowDate.getFullYear() === now.getFullYear() &&
          rowDate.getMonth() === now.getMonth() &&
          rowDate.getDate() === now.getDate();
        if (!isToday) return false;
      } else if (dateFilter === '24h') {
        const diffMs = now - rowDate;
        if (diffMs > 24 * 60 * 60 * 1000 || diffMs < 0) return false;
      } else if (dateFilter === '7d') {
        const diffMs = now - rowDate;
        if (diffMs > 7 * 24 * 60 * 60 * 1000 || diffMs < 0) return false;
      }

      // 3. Time of Day Filter
      const hour = rowDate.getHours();
      if (timeFilter === 'morning' && (hour < 6 || hour >= 12)) return false;
      if (timeFilter === 'afternoon' && (hour < 12 || hour >= 18)) return false;
      if (timeFilter === 'evening' && (hour < 18 || hour >= 24)) return false;
      if (timeFilter === 'night' && hour >= 6) return false;

      return true;
    });
  },
}));
