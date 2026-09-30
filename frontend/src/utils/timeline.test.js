import { describe, expect, it } from 'vitest';
import { assignTrackIds, boxesAt } from './timeline';

const box = (x1, y1, x2, y2, confidence) => ({ x1, y1, x2, y2, confidence });

describe('assignTrackIds', () => {
  it('keeps the same id for a detection that moves only slightly', () => {
    const samples = [
      { tMs: 0, detections: [box(0, 0, 0.2, 0.2, 0.9)] },
      { tMs: 100, detections: [box(0.02, 0.02, 0.22, 0.22, 0.9)] },
    ];

    const out = assignTrackIds(samples);

    expect(out[0].detections[0].id).toBe(out[1].detections[0].id);
  });

  it('assigns a new id when the detection jumps across the frame', () => {
    const samples = [
      { tMs: 0, detections: [box(0, 0, 0.1, 0.1, 0.9)] },
      { tMs: 100, detections: [box(0.8, 0.8, 0.9, 0.9, 0.9)] },
    ];

    const out = assignTrackIds(samples);

    expect(out[0].detections[0].id).not.toBe(out[1].detections[0].id);
  });
});

describe('boxesAt', () => {
  const timeline = assignTrackIds([
    { tMs: 0, detections: [box(0, 0, 0.2, 0.2, 0.4)] },
    { tMs: 100, detections: [box(0.1, 0.1, 0.3, 0.3, 0.8)] },
  ]);

  it('returns an empty list when there is no timeline', () => {
    expect(boxesAt([], 0)).toEqual([]);
    expect(boxesAt(null, 0)).toEqual([]);
  });

  it('holds the first sample before the timeline starts', () => {
    expect(boxesAt(timeline, -10)).toEqual(timeline[0].detections);
  });

  it('interpolates position and confidence between samples', () => {
    const mid = boxesAt(timeline, 50);
    expect(mid).toHaveLength(1);
    expect(mid[0].x1).toBeCloseTo(0.05);
    expect(mid[0].confidence).toBeCloseTo(0.6);
  });
});
