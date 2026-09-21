const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Maps the backend /detect response onto what the UI uses.
//
// Backend: { count, boxes: [{ x, y, width, height, confidence }], average_confidence,
//            inference_time_ms, processed_image }   (box values are pixels of the original image)
// UI:      boxes as 0–1 fractions { x1, y1, x2, y2 } so they can be placed with percentages.
export function normalizeDetection(data, { width, height }) {
  const boxes = Array.isArray(data?.boxes) ? data.boxes : [];

  return {
    people: data?.count ?? boxes.length,
    avgConfidence: data?.average_confidence ?? null,
    inferenceTimeMs: data?.inference_time_ms ?? null,
    processedImage: data?.processed_image ?? null,
    detections: boxes.map((b) => ({
      x1: clamp01(b.x / width),
      y1: clamp01(b.y / height),
      x2: clamp01((b.x + b.width) / width),
      y2: clamp01((b.y + b.height) / height),
      confidence: b.confidence,
    })),
  };
}
