import { MODES, useNavigationStore } from '../../../stores/NavigationStore';
import { formatConfidence } from '../../../utils/format';
import { useHistory } from '../../../hooks/UseHistory';
import {
  useHistoryFilterStore,
  DATE_FILTERS,
  TIME_FILTERS,
} from '../../../stores/HistoryFilterStore';

const IDLE_TEXT = [
  `> DETECT
------------------------------------
INPUT      : awaiting mode selection
STATUS     : idle

[ Press ENTER to choose an input ]`,

  `> HISTORY
------------------------------------

[ Press ENTER to browse ]`,
];

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Africa/Nairobi',
});

const fourDecimals = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function pad(str, len, alignLeft = true) {
  const s = String(str ?? '');
  if (s.length >= len) return s.slice(0, len);
  return alignLeft ? s.padEnd(len, ' ') : s.padStart(len, ' ');
}

function buildListText(page, selectedItem, historyState, filterStore) {
  if (page === 0) {
    let lines = '> DETECT SYSTEM INPUT\n' + '-'.repeat(45) + '\n';
    lines += `${selectedItem === 0 ? '> ' : '  '}1. Upload image file (JPG / PNG)\n`;
    lines += `${selectedItem === 1 ? '> ' : '  '}2. Upload video file (MP4 / WEBM / MOV)\n`;
    lines += `${selectedItem === 2 ? '> ' : '  '}3. Live webcam video stream...\n`;
    lines += '-'.repeat(45) + '\n↑/↓ select input · ENTER confirm · ESC back';
    return lines;
  }

  const { data: rawRows, isLoading, isError } = historyState;
  const { minConfidence, dateFilter, timeFilter, filterRows } = filterStore;

  const confLabel = minConfidence > 0 ? `≥${(minConfidence * 100).toFixed(0)}%` : 'ALL';
  const dateObj = DATE_FILTERS.find((f) => f.id === dateFilter);
  const dateLabel = dateObj ? dateObj.label : 'ALL';
  const timeObj = TIME_FILTERS.find((f) => f.id === timeFilter);
  const timeLabel = timeObj ? timeObj.label : 'ALL';

  const filterHeader = `FILTERS: CONF [${confLabel}] (C) · DATE [${dateLabel}] (D) · TIME [${timeLabel}] (T)`;

  if (isLoading) {
    return `> HISTORY LOG DATABASE
  ${filterHeader}
---------------------------------------------------------------------
AWAITING BACKEND CONNECTION...
---------------------------------------------------------------------
ESC  back`;
  }

  const allRows = Array.isArray(rawRows) ? rawRows : [];
  const rows = filterRows(allRows);

  if (isError || allRows.length === 0) {
    return `> HISTORY LOG DATABASE
  ${filterHeader}
---------------------------------------------------------------------
No records found in database.
---------------------------------------------------------------------
ESC  back`;
  }

  if (rows.length === 0) {
    return `> HISTORY LOG DATABASE
  ${filterHeader}
---------------------------------------------------------------------
No records match current filter parameters (Total: ${allRows.length}).
---------------------------------------------------------------------
C conf filter · D date filter · T time filter · X clear filters · ESC back`;
  }

  // Summary Metrics
  const filteredCount = rows.length;
  const totalPeople = rows.reduce((acc, r) => acc + (r.person_count ?? 0), 0);
  const sumConf = rows.reduce((acc, r) => acc + (r.average_confidence ?? 0), 0);
  const meanConf = filteredCount > 0 ? sumConf / filteredCount : 0;

  let lines = `> HISTORY LOG DATABASE\n`;
  lines += `  ${filterHeader}\n`;
  lines += '-'.repeat(69) + '\n';
  lines += `  #  | TIMESTAMP            | PEOPLE | AVG CONF | INFERENCE TIME\n`;
  lines += '-'.repeat(69) + '\n';

  rows.forEach((row, i) => {
    const isSelected = i === selectedItem;
    const prefix = isSelected ? '> ' : '  ';
    const num = pad(String(i + 1).padStart(2, '0'), 2);
    let timeStr = '—';
    try {
      timeStr = dateTimeFormatter.format(new Date(row.timestamp));
    } catch {
      timeStr = pad(String(row.timestamp).slice(0, 19), 20);
    }
    const ts = pad(timeStr, 20);
    const count = pad(String(row.person_count ?? '—'), 6, false);
    const conf = pad(formatConfidence(row.average_confidence), 8, false);
    const infTime = pad(`${fourDecimals.format(row.inference_time_ms ?? 0)} ms`, 14, false);

    lines += `${prefix}${num} | ${ts} | ${count} | ${conf} | ${infTime}\n`;
  });

  lines += '-'.repeat(69) + '\n';
  lines += `SUMMARY: ${filteredCount} OF ${allRows.length} MATCHING LOGS · ${totalPeople} PEOPLE · ${formatConfidence(meanConf)} MEAN CONF\n`;
  lines += '-'.repeat(69) + '\n';
  lines += `↑/↓ select · ENTER detail · C conf · D date · T time · X clear filters`;

  return lines;
}

function buildHistoryDetailText(row) {
  let timeStr = '—';
  try {
    timeStr = dateTimeFormatter.format(new Date(row.timestamp));
  } catch {
    timeStr = String(row.timestamp);
  }

  return `> HISTORY RECORD DETAIL
---------------------------------------------------------------------
TIMESTAMP          : ${timeStr}
PEOPLE DETECTED    : ${row.person_count ?? '—'}
AVERAGE CONFIDENCE : ${formatConfidence(row.average_confidence ?? 0)}
INFERENCE TIME     : ${fourDecimals.format(row.inference_time_ms ?? 0)} ms
---------------------------------------------------------------------

ESC  back to table`;
}

function TerminalText({ mode, page, results }) {
  const selectedItem = useNavigationStore((s) => s.selectedItem);
  const filterStore = useHistoryFilterStore();

  const historyQuery = useHistory();

  let text;
  if (mode === MODES.RESULT && results?.type === 'history') {
    text = buildHistoryDetailText(results.data);
  } else if (mode === MODES.LIST) {
    text = buildListText(page, selectedItem, historyQuery, filterStore);
  } else {
    text = IDLE_TEXT[page];
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full h-full my-auto mx-auto z-10 pointer-events-none select-none overflow-hidden">
      <pre className="term cursor text-left text-xs leading-tight font-mono">{text}</pre>
    </div>
  );
}

export default TerminalText;
