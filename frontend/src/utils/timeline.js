// Pure helpers that turn a list of per-sample detections into a smooth,
// time-indexed timeline that can be replayed in sync with a video.

// Greedy nearest-centre matching between consecutive samples, giving each
// detection a stable pseudo track id. This is what allows boxes to be
// interpolated between samples instead of snapping to each sample.
export function assignTrackIds(samples, maxDistance = 0.25) {
  let nextId = 1;
  let previous = [];

  return samples.map((sample) => {
    const used = new Set();

    const detections = sample.detections.map((det) => {
      const cx = (det.x1 + det.x2) / 2;
      const cy = (det.y1 + det.y2) / 2;

      let match = null;
      let best = maxDistance;
      for (const prev of previous) {
        if (used.has(prev.id)) continue;
        const dist = Math.hypot(cx - (prev.x1 + prev.x2) / 2, cy - (prev.y1 + prev.y2) / 2);
        if (dist < best) {
          best = dist;
          match = prev;
        }
      }

      const id = match ? match.id : nextId++;
      used.add(id);
      return { ...det, id };
    });

    previous = detections;
    return { ...sample, detections };
  });
}

// Interpolated boxes at a given playback time (milliseconds).
export function boxesAt(timeline, tMs) {
  if (!timeline || timeline.length === 0) return [];
  if (timeline.length === 1 || tMs <= timeline[0].tMs) return timeline[0].detections;

  const last = timeline[timeline.length - 1];
  if (tMs >= last.tMs) return last.detections;

  // Find the last sample at or before tMs.
  let lo = 0;
  let hi = timeline.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid].tMs <= tMs) lo = mid;
    else hi = mid;
  }

  const a = timeline[lo];
  const b = timeline[hi];
  const span = b.tMs - a.tMs;
  const alpha = span > 0 ? (tMs - a.tMs) / span : 0;

  const bById = new Map(b.detections.map((det) => [det.id, det]));
  const out = [];

  for (const da of a.detections) {
    const db = bById.get(da.id);
    if (db) {
      out.push({
        id: da.id,
        x1: da.x1 + (db.x1 - da.x1) * alpha,
        y1: da.y1 + (db.y1 - da.y1) * alpha,
        x2: da.x2 + (db.x2 - da.x2) * alpha,
        y2: da.y2 + (db.y2 - da.y2) * alpha,
        confidence: da.confidence + (db.confidence - da.confidence) * alpha,
      });
      bById.delete(da.id);
    } else if (alpha < 0.5) {
      // Left the frame: hold briefly then drop, rather than lingering the
      // whole span until the next sample.
      out.push(da);
    }
  }

  // Entered the frame in the next sample: reveal on the second half.
  for (const db of bById.values()) {
    if (alpha >= 0.5) out.push(db);
  }

  return out;
}
