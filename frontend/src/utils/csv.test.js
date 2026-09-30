import { describe, expect, it } from 'vitest';
import { buildCsvText } from './csv';

describe('buildCsvText', () => {
  it('heads the columns and writes one line per row', () => {
    const rows = [
      {
        id: 1,
        timestamp: '2026-09-30T10:00:00',
        person_count: 3,
        average_confidence: 0.87,
        inference_time_ms: 102.4,
        media_type: 'image',
        media_name: 'small_group_columbia.jpg',
        frame_count: null,
      },
    ];

    const csv = buildCsvText(rows);
    const [header, row] = csv.split('\n');

    expect(header).toBe(
      'id,timestamp,person_count,average_confidence,inference_time_ms,media_type,media_name,frame_count'
    );
    expect(row).toBe('1,2026-09-30T10:00:00,3,0.87,102.4,image,small_group_columbia.jpg,');
  });

  it('quotes fields that contain a comma and escapes embedded quotes', () => {
    const rows = [{ id: 1, media_name: 'clip, "final".mp4' }];

    const csv = buildCsvText(rows);
    const row = csv.split('\n')[1];

    expect(row).toContain('"clip, ""final"".mp4"');
  });

  it('writes nothing but the header for an empty list', () => {
    expect(buildCsvText([])).toBe(
      'id,timestamp,person_count,average_confidence,inference_time_ms,media_type,media_name,frame_count'
    );
  });
});
