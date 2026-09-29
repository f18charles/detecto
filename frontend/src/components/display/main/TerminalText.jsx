import { MODES, useNavigationStore } from '../../../stores/NavigationStore';
import { formatConfidence } from '../../../utils/format';
import { useHistory } from '../../../hooks/UseHistory';
import { useHistoryFilterStore } from '../../../stores/HistoryFilterStore';

const IDLE_TEXT = [
  `> DETECT
------------------------------------
INPUT      : awaiting image upload
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

function buildListText(page, selectedItem, historyState, minConfidence) {
  if (page === 0) {
    let lines = '> DETECT\n' + '-'.repeat(36) + '\n';
    lines += `${selectedItem === 0 ? '> ' : '  '}+ upload an image...\n`;
    lines += '-'.repeat(36) + '\n ENTER confirm · ESC back';
    return lines;
  }

  const { data: rows, isLoading, isError } = historyState;
  const filterLabel = minConfidence > 0 ? `≥ ${(minConfidence * 100).toFixed(0)}% CONF` : 'ALL LOGS';

  if (isLoading) {
    return `> HISTORY LOG DATABASE                    [FILTER: ${filterLabel}]
---------------------------------------------------------------------
AWAITING BACKEND CONNECTION...
---------------------------------------------------------------------
ESC  back`;
  }

  if (isError || !rows || rows.length === 0) {
    return `> HISTORY LOG DATABASE                    [FILTER: ${filterLabel}]
---------------------------------------------------------------------
No records found matching filter.
---------------------------------------------------------------------
F cycle filter · ESC back`;
  }

  // Summary Metrics
  const totalCount = rows.length;
  const totalPeople = rows.reduce((acc, r) => acc + (r.person_count ?? 0), 0);
  const sumConf = rows.reduce((acc, r) => acc + (r.average_confidence ?? 0), 0);
  const meanConf = totalCount > 0 ? sumConf / totalCount : 0;

  let lines = `> HISTORY LOG DATABASE                    [FILTER: ${filterLabel}]\n`;
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
  lines += `SUMMARY: ${totalCount} RECORD(S) · ${totalPeople} TOTAL PEOPLE · ${formatConfidence(meanConf)} MEAN CONF\n`;
  lines += '-'.repeat(69) + '\n';
  lines += `↑/↓ select · ENTER detail · F filter · ESC back · SHIFT+R reset`;

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
  const minConfidence = useHistoryFilterStore((s) => s.minConfidence);

  const historyParams = minConfidence > 0 ? { min_confidence: minConfidence } : undefined;
  const historyQuery = useHistory(historyParams);

  let text;
  if (mode === MODES.RESULT && results?.type === 'history') {
    text = buildHistoryDetailText(results.data);
  } else if (mode === MODES.LIST) {
    text = buildListText(page, selectedItem, historyQuery, minConfidence);
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
