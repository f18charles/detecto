// A fixed demo "restricted area" covering the center half of the frame, and a
// fixed headcount threshold. This is a keyboard-only CRT console, so a
// drawable/configurable region editor doesn't fit the interaction model — this
// demonstrates the mechanism (count people in a region, alert over a limit)
// rather than a fully configurable region.
export const ALERT_REGION = { x1: 0.25, y1: 0.25, x2: 0.75, y2: 0.75 };
export const ALERT_THRESHOLD = 3;

// detections use the fractional 0-1 x1/y1/x2/y2 shape from utils/detection.js.
function centerOf(det) {
  return { cx: (det.x1 + det.x2) / 2, cy: (det.y1 + det.y2) / 2 };
}

export function countInRegion(detections, region = ALERT_REGION) {
  if (!Array.isArray(detections)) return 0;
  return detections.filter((det) => {
    const { cx, cy } = centerOf(det);
    return cx >= region.x1 && cx <= region.x2 && cy >= region.y1 && cy <= region.y2;
  }).length;
}
