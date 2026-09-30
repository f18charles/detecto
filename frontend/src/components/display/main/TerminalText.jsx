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

  const { data: rawRows, isLoading, isError } = historyState;
  const { minConfidence, dateFilter, timeFilter, filterRows } = filterStore;

  const confLabel = minConfidence > 0 ? `≥${(minConfidence * 100).toFixed(0)}%` : 'ALL';
  const dateObj = DATE_FILTERS.find((f) => f.id === dateFilter);
  const dateLabel = dateObj ? dateObj.label : 'ALL';
  const timeObj = TIME_FILTERS.find((f) => f.id === timeFilter);
  const timeLabel = timeObj ? timeObj.label : 'ALL';

  const filterHeader = `FILTERS: CONF [${confLabel}] (C) · DATE [${dateLabel}] (D) · TIME [${timeLabel}] (T)`;
  const header = `> HISTORY LOG DATABASE\n  ${filterHeader}\n${SEP69}`;

  if (isLoading) {
    return {
      header,
      body: ['AWAITING BACKEND CONNECTION...'],
      footer: `${SEP69}\nESC  back`,
    };
  }

  const allRows = Array.isArray(rawRows) ? rawRows : [];
  const rows = filterRows(allRows);

  if (isError || allRows.length === 0) {
    return {
      header,
      body: ['No records found in database.'],
      footer: `${SEP69}\nESC  back`,
    };
  }

  if (rows.length === 0) {
    return {
      header,
      body: [`No records match current filter parameters (Total: ${allRows.length}).`],
      footer: `${SEP69}\nC conf filter · D date filter · T time filter · X clear filters · ESC back`,
    };
  }

  // Summary Metrics
  const filteredCount = rows.length;
  const totalPeople = rows.reduce((acc, r) => acc + (r.person_count ?? 0), 0);
  const sumConf = rows.reduce((acc, r) => acc + (r.average_confidence ?? 0), 0);
  const meanConf = filteredCount > 0 ? sumConf / filteredCount : 0;

  const body = rows.map((row, i) => {
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

    return `${prefix}${num} | ${ts} | ${count} | ${conf} | ${infTime}`;
  });

  return {
    header: `${header}\n  #  | TIMESTAMP            | PEOPLE | AVG CONF | INFERENCE TIME\n${SEP69}`,
    body,
    footer: `${SEP69}\nSUMMARY: ${filteredCount} OF ${allRows.length} MATCHING LOGS · ${totalPeople} PEOPLE · ${formatConfidence(meanConf)} MEAN CONF\n${SEP69}\n↑/↓ select · ENTER detail · C conf · D date · T time · X clear filters`,
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

  return (
    <div className="flex-1 min-h-0 flex flex-col items-stretch w-full h-full mx-auto z-10 select-none">
      {header && (
        <pre className="term text-left text-xs leading-tight font-mono flex-none">{header}</pre>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
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
