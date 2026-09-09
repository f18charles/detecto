// TEMPORARY demo data. Field names match the real /detect and /history
// response shapes on purpose, so swapping this out in Phase 8 doesn't
// require touching anything that reads it — only where the data comes from.

export const SAMPLE_IMAGES = [
  { id: 0, label: 'sample_01.jpg', people: 4, avgConfidence: 0.94, inferenceTimeMs: 320 },
  { id: 1, label: 'sample_02.jpg', people: 2, avgConfidence: 0.89, inferenceTimeMs: 280 },
  { id: 2, label: 'sample_03.jpg', people: 7, avgConfidence: 0.91, inferenceTimeMs: 410 },
  { id: 3, label: 'sample_04.jpg', people: 1, avgConfidence: 0.68, inferenceTimeMs: 190 },
];

export const MOCK_HISTORY_ROWS = [
  { timestamp: '2026-09-02 14:55:02', count: 4, avgConfidence: 0.87, sourceType: 'image' },
  { timestamp: '2026-09-02 14:40:18', count: 2, avgConfidence: 0.79, sourceType: 'image' },
  { timestamp: '2026-09-02 13:12:44', count: 7, avgConfidence: 0.91, sourceType: 'image' },
  { timestamp: '2026-09-02 11:05:37', count: 1, avgConfidence: 0.68, sourceType: 'image' },
  { timestamp: '2026-09-02 09:22:15', count: 3, avgConfidence: 0.82, sourceType: 'image' },
];
