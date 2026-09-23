import { MODES, useNavigationStore } from '../../../stores/NavigationStore';
import { formatConfidence } from '../../../utils/format';
import { useHistory } from '../../../hooks/UseHistory';

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
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Africa/Nairobi'
})

function buildListText(page, selectedItem, historyState) {
  if (page === 0) {
    let lines = '> DETECT\n' + '-'.repeat(36) + '\n';
    lines += `${selectedItem === 0 ? '> ' : '  '}+ upload an image...\n`;
    lines += '-'.repeat(36) + '\n ENTER confirm · ESC back';
    return lines;
  }

  const { data: rows, isLoading, isError } = historyState;

  if (isLoading) {
    return `> HISTORY.LOG — awaiting backend
------------------------------------
AWAITING BACKEND CONNECTION...
------------------------------------
ESC  back`;
  }

  if (isError || !rows || rows.length === 0) {
    return `> HISTORY
------------------------------------
No records found
------------------------------------
ESC  back`;
  }

  let lines = '> HISTORY\n' + '-'.repeat(36) + '\n';
  rows.forEach((row, i) => {
    lines += `${i === selectedItem ? '> ' : '  '}${dateTimeFormatter.format(new Date(row.timestamp)) ?? `RECORD #${i + 1}`} (count: ${row.person_count ?? '—'})\n`;
  });
  lines += '-'.repeat(36) + '\n↑/↓ select · ENTER confirm · ESC back \nSHIFT + R reset history';
  return lines;
}

const fourDecimals = new Intl.NumberFormat('en-US', {maximumFractionDigits: 4})

function buildHistoryDetailText(row) {
  return `> HISTORY
----------------------------------------------------------------------------
TIMESTAMP          : ${dateTimeFormatter.format(new Date(row.timestamp)) ?? '—'}
COUNT              : ${row.person_count ?? '—'}
CONFIDENCE         : ${formatConfidence(row.average_confidence ?? '-')}
Inference time(ms) : ${fourDecimals.format(row.inference_time_ms) ?? '-'}
----------------------------------------------------------------------------

ESC  back to list`;
}

function TerminalText({ mode, page, results }) {
  const selectedItem = useNavigationStore((s) => s.selectedItem);
  const historyQuery = useHistory();

  let text;
  if (mode === MODES.RESULT && results?.type === 'history') {
    text = buildHistoryDetailText(results.data);
  } else if (mode === MODES.LIST) {
    text = buildListText(page, selectedItem, historyQuery);
  } else {
    text = IDLE_TEXT[page];
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full h-full my-auto mx-auto z-10 pointer-events-none select-none">
      <pre className="term cursor text-left">{text}</pre>
    </div>
  );
}

export default TerminalText;

