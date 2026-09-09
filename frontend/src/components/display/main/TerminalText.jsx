import { MODES, useNavigationStore } from '../../../stores/NavigationStore';
import { SAMPLE_IMAGES } from '../../../data/mockData';
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
    SAMPLE_IMAGES.forEach((img, i) => {
      lines += `${i === selectedItem ? '▸ ' : '  '}${img.label}\n`;
    });
    lines += `${selectedItem === SAMPLE_IMAGES.length ? '▸ ' : '  '}+ upload your own image...\n`;
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

  return <pre className="term cursor">{text}</pre>;
}

export default TerminalText;

