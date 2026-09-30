import { beforeEach, describe, expect, it } from 'vitest';
import { useHistoryFilterStore } from './HistoryFilterStore';

const row = (overrides = {}) => ({
  id: 1,
  timestamp: new Date().toISOString(),
  person_count: 2,
  average_confidence: 0.8,
  inference_time_ms: 100,
  ...overrides,
});

beforeEach(() => {
  useHistoryFilterStore.getState().resetAllFilters();
  useHistoryFilterStore.setState({ showClearConfirm: false });
});

describe('HistoryFilterStore', () => {
  it('filters rows by the cycling confidence threshold', () => {
    const high = row({ average_confidence: 0.9 });
    const low = row({ id: 2, average_confidence: 0.3 });

    expect(useHistoryFilterStore.getState().filterRows([high, low])).toHaveLength(2);

    useHistoryFilterStore.getState().cycleConfidence();
    expect(useHistoryFilterStore.getState().minConfidence).toBe(0.5);

    const filtered = useHistoryFilterStore.getState().filterRows([high, low]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].average_confidence).toBe(0.9);
  });

  it('cycles date and time filters and resets them', () => {
    useHistoryFilterStore.getState().cycleDate();
    useHistoryFilterStore.getState().cycleTime();

    expect(useHistoryFilterStore.getState().dateFilter).toBe('today');
    expect(useHistoryFilterStore.getState().timeFilter).toBe('morning');

    useHistoryFilterStore.getState().resetAllFilters();

    expect(useHistoryFilterStore.getState().dateFilter).toBe('all');
    expect(useHistoryFilterStore.getState().timeFilter).toBe('all');
    expect(useHistoryFilterStore.getState().minConfidence).toBe(0);
  });

  it('gates the clear-history confirmation', () => {
    expect(useHistoryFilterStore.getState().showClearConfirm).toBe(false);

    useHistoryFilterStore.getState().requestClearHistory();
    expect(useHistoryFilterStore.getState().showClearConfirm).toBe(true);

    useHistoryFilterStore.getState().cancelClearHistory();
    expect(useHistoryFilterStore.getState().showClearConfirm).toBe(false);
  });
});
