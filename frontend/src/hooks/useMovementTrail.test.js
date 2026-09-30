import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMovementTrail } from './useMovementTrail';

describe('useMovementTrail', () => {
  it('converts detection boxes to centers and accumulates across samples', () => {
    const { result } = renderHook(() => useMovementTrail());

    act(() => {
      result.current.addSample([{ x1: 0, y1: 0, x2: 0.2, y2: 0.2 }]);
    });
    let points;
    act(() => {
      points = result.current.addSample([{ x1: 0.8, y1: 0.8, x2: 1, y2: 1 }]);
    });

    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ cx: 0.1, cy: 0.1 });
    expect(points[1]).toMatchObject({ cx: 0.9, cy: 0.9 });
  });

  it('drops points older than the max age', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useMovementTrail());

    act(() => {
      result.current.addSample([{ x1: 0, y1: 0, x2: 0.2, y2: 0.2 }]);
    });
    vi.advanceTimersByTime(30000); // past the 24s max age

    let points;
    act(() => {
      points = result.current.addSample([]);
    });

    expect(points).toHaveLength(0);
    vi.useRealTimers();
  });

  it('clear() empties the trail', () => {
    const { result } = renderHook(() => useMovementTrail());

    act(() => {
      result.current.addSample([{ x1: 0, y1: 0, x2: 0.2, y2: 0.2 }]);
      result.current.clear();
    });

    expect(result.current.pointsRef.current).toHaveLength(0);
  });
});
