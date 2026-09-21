import { MODES, useNavigationStore } from '../../../stores/NavigationStore';
import { formatConfidence } from '../../../utils/format';
import { useHistory } from '../../../hooks/UseHistory';

const IDLE_TEXT = [
  `> DETECT
------------------------------------
INPUT      : awaiting image upload
STATUS     : idle

[ Press ENTER to choose an input ]`,
  `> HISTORY.LOG
------------------------------------
AWAITING BACKEND CONNECTION...

[ Press ENTER to browse ]`,
];

function buildListText(page, selectedItem, historyState) {
  if (page === 0) {
    let lines = '> DETECT.SYS — select input\n' + '-'.repeat(36) + '\n';
    lines += `${selectedItem === 0 ? '▸ ' : '  '}+ upload an image...\n`;
    lines += '-'.repeat(36) + '\n↑/↓ select · ENTER confirm · ESC back';
    return lines;
  }

  const { data: rows, isLoading, isError } = historyState;

  if (isLoading) {
    return `> HISTORY.LOG — awaiting backend
------------------------------------
AWAITING BACKEND CONNECTION...
------------------------------------
ESC  back to nav`;
  }

  if (isError || !rows || rows.length === 0) {
    return `> HISTORY.LOG — awaiting backend
------------------------------------
AWAITING BACKEND CONNECTION / 0 RECORDS
------------------------------------
ESC  back to nav`;
  }

  let lines = '> HISTORY.LOG — select record\n' + '-'.repeat(36) + '\n';
  rows.forEach((row, i) => {
    lines += `${i === selectedItem ? '▸ ' : '  '}${row.timestamp ?? `RECORD #${i + 1}`} (count: ${row.count ?? '—'})\n`;
  });
  lines += '-'.repeat(36) + '\n↑/↓ select · ENTER confirm · ESC back';
  return lines;
}

function buildHistoryDetailText(row) {
  return `> HISTORY.LOG — record detail
------------------------------------
TIMESTAMP  : ${row.timestamp ?? '—'}
COUNT      : ${row.count ?? '—'}
CONFIDENCE : ${formatConfidence(row.avgConfidence ?? row.avg_confidence)}
SOURCE     : ${row.sourceType ?? row.source_type ?? 'image'}
------------------------------------
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

