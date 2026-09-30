import { useEffect, useRef } from 'react';
import { MODES, useNavigationStore } from '../../../stores/NavigationStore';
import { formatConfidence } from '../../../utils/format';
import { useHistory } from '../../../hooks/UseHistory';
import {
  useHistoryFilterStore,
  DATE_FILTERS,
  TIME_FILTERS,
} from '../../../stores/HistoryFilterStore';

const SEP36 = '-'.repeat(36);
const SEP45 = '-'.repeat(45);
const SEP69 = '-'.repeat(69);

// Each screen is described as three fixed zones: `header` sticks to the top of
// the screen, `footer` sticks to the bottom, and only `body` scrolls in between.
// `selectedIndex` (when set) marks the body row that should follow keyboard
// selection and be scrolled into view.
const IDLE_TEXT = [
  {
    header: `> DETECT\n${SEP36}`,
    body: [
      'INPUT      : awaiting mode selection',
      'STATUS     : idle',
      '',
      '[ Press ENTER to choose an input ]',
    ],
    footer: '',
  },
  {
    header: `> HISTORY\n${SEP36}`,
    body: ['', '[ Press ENTER to browse ]'],
    footer: '',
  },
  {
    header: `> STATS\n${SEP36}`,
    body: ['', '[ Press ENTER to view average crowd size per hour ]'],
    footer: '',
  },
];

// Uses the browser's local timezone so displayed timestamps agree with the
// date/time-of-day filters in HistoryFilterStore, which parse in local time.
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const fourDecimals = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function pad(str, len, alignLeft = true) {
  const s = String(str ?? '');
  if (s.length >= len) return s.slice(0, len);
  return alignLeft ? s.padEnd(len, ' ') : s.padStart(len, ' ');
}

// History table layout. The header row, every data row and the horizontal rule
// are all generated from this list, so columns stay aligned when one changes.
// Order is deliberate: name, type, people, avg conf, inference time, timestamp.
const HISTORY_COLUMNS = [
  { label: 'NAME', width: 28, align: 'left' },
  { label: 'TYPE', width: 6, align: 'left' },
  { label: 'PEOPLE', width: 6, align: 'right' },
  { label: 'AVG CONF', width: 8, align: 'right' },
  { label: 'INFERENCE TIME', width: 14, align: 'right' },
  { label: 'TIMESTAMP', width: 20, align: 'left' },
];

const HISTORY_TABLE_WIDTH =
  HISTORY_COLUMNS.reduce((w, col) => w + col.width, 0) + (HISTORY_COLUMNS.length - 1) * 3;
const HISTORY_SEP = '-'.repeat(HISTORY_TABLE_WIDTH + 2);
const HISTORY_HEADER_ROW = `  ${HISTORY_COLUMNS.map((col) =>
  col.align === 'right' ? pad(col.label, col.width, false) : pad(col.label, col.width)
).join(' | ')}`;

function historyRow(values) {
  return values
    .map((value, i) => {
      const col = HISTORY_COLUMNS[i];
      return col.align === 'right' ? pad(value, col.width, false) : pad(value, col.width);
    })
    .join(' | ');
}

const STATS_BAR_WIDTH = 24;

function statsBar(fraction) {
  const clamped = Math.min(1, Math.max(0, fraction || 0));
  const filled = Math.round(clamped * STATS_BAR_WIDTH);
  return `${'#'.repeat(filled)}${'-'.repeat(STATS_BAR_WIDTH - filled)}`;
}

// Buckets every history row by hour-of-day (same local-time convention as
// HistoryFilterStore's time-of-day filter) and averages person_count per hour,
// over the full, unfiltered history — a standalone overview, not tied to
// whatever filters happen to be active on the History page.
function buildHourlyStats(rawRows) {
  const buckets = Array.from({ length: 24 }, () => ({ count: 0, people: 0 }));
  for (const row of rawRows) {
    const hour = new Date(row.timestamp).getHours();
    if (Number.isNaN(hour)) continue;
    buckets[hour].count += 1;
    buckets[hour].people += row.person_count ?? 0;
  }

  const averages = buckets.map((b) => (b.count > 0 ? b.people / b.count : 0));
  const maxAvg = Math.max(0, ...averages);

  return buckets.map((b, hour) => {
    const avg = averages[hour];
    const label = `${String(hour).padStart(2, '0')}:00`;
    const avgLabel = b.count > 0 ? avg.toFixed(2) : '—';
    return `${label} | ${statsBar(maxAvg > 0 ? avg / maxAvg : 0)} | ${pad(avgLabel, 5, false)} (n=${b.count})`;
  });
}

function buildListText(page, selectedItem, historyState, filterStore) {
  if (page === 0) {
    return {
      header: `> DETECT SYSTEM INPUT\n${SEP45}`,
      body: [
        `${selectedItem === 0 ? '> ' : '  '}1. Upload image file (JPG / PNG)`,
        `${selectedItem === 1 ? '> ' : '  '}2. Upload video file (MP4 / WEBM / MOV)`,
        `${selectedItem === 2 ? '> ' : '  '}3. Live webcam video stream...`,
      ],
      footer: `${SEP45}\n↑/↓ select input · ENTER confirm · ESC back`,
      selectedIndex: selectedItem,
    };
  }

  if (page === 2) {
    const { data: statsRows, isLoading: statsLoading, isError: statsError } = historyState;
    const header = `> AVERAGE CROWD SIZE PER HOUR\n${SEP45}`;

    if (statsLoading) {
      return { header, body: ['AWAITING BACKEND CONNECTION...'], footer: `${SEP45}\nESC  back` };
    }
    const allStatsRows = Array.isArray(statsRows) ? statsRows : [];
    if (statsError || allStatsRows.length === 0) {
      return { header, body: ['No records found in database.'], footer: `${SEP45}\nESC  back` };
    }

    return {
      header,
      body: buildHourlyStats(allStatsRows),
      footer: `${SEP45}\nHour of day (local time) · avg PEOPLE per detection · n = detections that hour\nESC  back`,
    };
  }

  const { data: rawRows, isLoading, isError } = historyState;
  const { minConfidence, dateFilter, timeFilter, filterRows } = filterStore;

  const confLabel = minConfidence > 0 ? `≥${(minConfidence * 100).toFixed(0)}%` : 'ALL';
  const dateObj = DATE_FILTERS.find((f) => f.id === dateFilter);
  const dateLabel = dateObj ? dateObj.label : 'ALL';
  const timeObj = TIME_FILTERS.find((f) => f.id === timeFilter);
  const timeLabel = timeObj ? timeObj.label : 'ALL';

  const filterHeader = `FILTERS: CONF [${confLabel}] (C) · DATE [${dateLabel}] (D) · TIME [${timeLabel}] (T)`;
  const header = `> HISTORY LOG DATABASE\n  ${filterHeader}\n${HISTORY_SEP}`;

  if (isLoading) {
    return {
      header,
      body: ['AWAITING BACKEND CONNECTION...'],
      footer: `${HISTORY_SEP}\nESC  back`,
    };
  }

  const allRows = Array.isArray(rawRows) ? rawRows : [];
  const rows = filterRows(allRows);

  if (isError || allRows.length === 0) {
    return {
      header,
      body: ['No records found in database.'],
      footer: `${HISTORY_SEP}\nESC  back`,
    };
  }

  if (rows.length === 0) {
    return {
      header,
      body: [`No records match current filter parameters (Total: ${allRows.length}).`],
      footer: `${HISTORY_SEP}\nF conf filter · D date filter · T time filter · X clear filters · E export CSV · C CLEAR HISTORY · ESC back`,
    };
  }

  // Summary Metrics
  const filteredCount = rows.length;
  const totalPeople = rows.reduce((acc, r) => acc + (r.person_count ?? 0), 0);
  const sumConf = rows.reduce((acc, r) => acc + (r.average_confidence ?? 0), 0);
  const meanConf = filteredCount > 0 ? sumConf / filteredCount : 0;

  const body = rows.map((row, i) => {
    const prefix = i === selectedItem ? '> ' : '  ';
    let timeStr = '—';
    try {
      timeStr = dateTimeFormatter.format(new Date(row.timestamp));
    } catch {
      timeStr = String(row.timestamp).slice(0, 19);
    }

    const cells = [
      row.media_name ?? '—',
      row.media_type ?? '—',
      String(row.person_count ?? '—'),
      formatConfidence(row.average_confidence),
      `${fourDecimals.format(row.inference_time_ms ?? 0)} ms`,
      timeStr,
    ];

    return `${prefix}${historyRow(cells)}`;
  });

  return {
    header: `${header}\n${HISTORY_HEADER_ROW}\n${HISTORY_SEP}`,
    body,
    footer: `${HISTORY_SEP}\nSUMMARY: ${filteredCount} OF ${allRows.length} MATCHING LOGS · ${totalPeople} PEOPLE · ${formatConfidence(meanConf)} MEAN CONF\n${HISTORY_SEP}\n↑/↓ select · ENTER detail · F conf · D date · T time · X clear filters · E export CSV · C CLEAR HISTORY`,
    selectedIndex: selectedItem,
  };
}

function buildHistoryDetailText(row) {
  let timeStr = '—';
  try {
    timeStr = dateTimeFormatter.format(new Date(row.timestamp));
  } catch {
    timeStr = String(row.timestamp);
  }

  return {
    header: `> HISTORY RECORD DETAIL\n${SEP69}`,
    body: [
      `MEDIA NAME         : ${row.media_name ?? '—'}`,
      `MEDIA TYPE         : ${row.media_type ?? '—'}`,
      `TIMESTAMP          : ${timeStr}`,
      `PEOPLE DETECTED    : ${row.person_count ?? '—'}`,
      `AVERAGE CONFIDENCE : ${formatConfidence(row.average_confidence ?? 0)}`,
      `INFERENCE TIME     : ${fourDecimals.format(row.inference_time_ms ?? 0)} ms`,
    ],
    footer: `${SEP69}\n\nESC  back to table`,
  };
}

function TerminalText({ mode, page, results }) {
  const selectedItem = useNavigationStore((s) => s.selectedItem);
  const filterStore = useHistoryFilterStore();
  const historyQuery = useHistory();
  const selectedRowRef = useRef(null);

  let content;
  if (mode === MODES.RESULT && results?.type === 'history') {
    content = buildHistoryDetailText(results.data);
  } else if (mode === MODES.LIST) {
    content = buildListText(page, selectedItem, historyQuery, filterStore);
  } else {
    content = IDLE_TEXT[page];
  }

  const { header, body, footer, selectedIndex } = content;
  const bodyLength = body.length;

  // Keep the selected row visible as the user arrows through a long list.
  useEffect(() => {
    if (selectedIndex == null) return;
    selectedRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, bodyLength]);

  // The text block shrinks to its content and centers as a unit, so the
  // monospace columns stay aligned instead of each line centering on its own.
  return (
    <div className="flex-1 min-h-0 flex flex-col w-fit max-w-full h-full mx-auto z-10 select-none">
      {header && (
        <pre className="term text-left text-xs leading-tight font-mono flex-none">{header}</pre>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar">
        <div className="term cursor text-left text-xs leading-tight font-mono">
          {body.map((line, i) => (
            <div key={i} ref={i === selectedIndex ? selectedRowRef : undefined}>
              {line === '' ? '\u00A0' : line}
            </div>
          ))}
        </div>
      </div>
      {footer && (
        <pre className="term text-left text-xs leading-tight font-mono flex-none">{footer}</pre>
      )}
    </div>
  );
}

export default TerminalText;
