import { describe, expect, it } from 'vitest';
import { normalizeDetection } from './detection';

describe('normalizeDetection', () => {
  it('maps pixel boxes to 0–1 fractions and passes through metrics', () => {
    const data = {
      count: 1,
      boxes: [{ x: 100, y: 50, width: 200, height: 100, confidence: 0.9 }],
      average_confidence: 0.9,
      inference_time_ms: 120,
      processed_image: null,
    };

    const result = normalizeDetection(data, { width: 1000, height: 500 });

    expect(result.people).toBe(1);
    expect(result.avgConfidence).toBe(0.9);
    expect(result.inferenceTimeMs).toBe(120);
    expect(result.detections[0]).toEqual({
      x1: 0.1,
      y1: 0.1,
      x2: 0.3,
      y2: 0.3,
      confidence: 0.9,
    });
  });

  it('falls back to the box count and empty list for missing data', () => {
    const result = normalizeDetection(undefined, { width: 100, height: 100 });
    expect(result.people).toBe(0);
    expect(result.detections).toEqual([]);
  });

  it('clamps out-of-range coordinates into [0, 1]', () => {
    const data = {
      count: 1,
      boxes: [{ x: -50, y: 0, width: 200, height: 100, confidence: 0.5 }],
    };

    const { detections } = normalizeDetection(data, { width: 100, height: 100 });

    expect(detections[0].x1).toBe(0);
    expect(detections[0].x2).toBe(1);
  });
});
