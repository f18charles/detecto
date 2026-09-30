import { useCallback, useRef } from 'react';

const TRAIL_MAX_AGE_MS = 24000;
const TRAIL_MAX_POINTS = 60;

// Plots a fading trail of recent detection box-centers over a live stream —
// a rolling window, not persisted anywhere and not tied across frames to a
// specific person (there's no track-id concept here, unlike the precomputed
// video-file timeline). An honest "movement visualization" MVP rather than
// full tracking or a persisted heatmap.
export function useMovementTrail() {
  const pointsRef = useRef([]);

  const addSample = useCallback((detections) => {
    const now = performance.now();
    const fresh = (detections || []).map((d) => ({
      cx: (d.x1 + d.x2) / 2,
      cy: (d.y1 + d.y2) / 2,
      t: now,
    }));
    pointsRef.current = [...pointsRef.current, ...fresh]
      .filter((p) => now - p.t <= TRAIL_MAX_AGE_MS)
      .slice(-TRAIL_MAX_POINTS);
    return pointsRef.current;
  }, []);

  const clear = useCallback(() => {
    pointsRef.current = [];
  }, []);

  return { addSample, clear, pointsRef };
}
