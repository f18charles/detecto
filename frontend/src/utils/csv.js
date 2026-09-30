const HEADERS = [
  'id',
  'timestamp',
  'person_count',
  'average_confidence',
  'inference_time_ms',
  'media_type',
  'media_name',
  'frame_count',
];

function csvField(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// buildCsvText → the pure part: turns history rows into a CSV string.
export function buildCsvText(rows) {
  const lines = [HEADERS.join(',')];
  for (const row of rows) {
    lines.push(HEADERS.map((key) => csvField(row[key])).join(','));
  }
  return lines.join('\n');
}

// downloadHistoryCsv → builds a CSV of the given history rows and triggers a
// browser download. Exports whatever rows it's given, so the caller decides
// whether that's the full history or the currently filtered subset.
export function downloadHistoryCsv(rows) {
  const blob = new Blob([buildCsvText(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `detecto-history-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
