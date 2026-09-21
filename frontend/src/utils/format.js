export function formatConfidence(value) {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value * 100)}%`;
}

export function formatTime(ms) {
  if (ms === null || ms === undefined) return '— ms';
  return `${Math.round(ms)} ms`;
}

export function padCount(n) {
  return String(n ?? 0).padStart(2, '0');
}
