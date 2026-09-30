import { describe, expect, it } from 'vitest';
import { countInRegion, ALERT_REGION } from './regionAlert';

describe('countInRegion', () => {
  it('counts a detection whose center falls inside the region', () => {
    const detections = [{ x1: 0.4, y1: 0.4, x2: 0.6, y2: 0.6 }]; // center 0.5,0.5

    expect(countInRegion(detections)).toBe(1);
  });

  it('ignores a detection whose center falls outside the region', () => {
    const detections = [{ x1: 0.0, y1: 0.0, x2: 0.1, y2: 0.1 }]; // center 0.05,0.05

    expect(countInRegion(detections)).toBe(0);
  });

  it('counts a center exactly on the region boundary as inside', () => {
    const detections = [{ x1: ALERT_REGION.x1, y1: ALERT_REGION.y1, x2: ALERT_REGION.x1, y2: ALERT_REGION.y1 }];

    expect(countInRegion(detections)).toBe(1);
  });

  it('returns 0 for a non-array input', () => {
    expect(countInRegion(undefined)).toBe(0);
    expect(countInRegion(null)).toBe(0);
  });

  it('counts only the detections inside a custom region', () => {
    const detections = [
      { x1: 0.05, y1: 0.05, x2: 0.15, y2: 0.15 }, // center 0.1,0.1
      { x1: 0.85, y1: 0.85, x2: 0.95, y2: 0.95 }, // center 0.9,0.9
    ];

    expect(countInRegion(detections, { x1: 0, y1: 0, x2: 0.5, y2: 0.5 })).toBe(1);
  });
});
