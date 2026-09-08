import { MODES, useNavigationStore } from '../../../stores/NavigationStore';
import { SAMPLE_IMAGES, MOCK_HISTORY_ROWS } from '../../../data/mockData'
import { formatConfidence } from '../../../utils/format';

const IDLE_TEXT = [
  `> DETECT
------------------------------------
INPUT      : awaiting image upload
STATUS     : idle

[ Press ENTER to choose an input ]`,
  `> HISTORY.LOG
------------------------------------
${MOCK_HISTORY_ROWS.length} records logged

[ Press ENTER to browse ]`,
];

function buildListText(page, selectedItem) {
  if (page === 0) {
    let lines = '> DETECT.SYS — select input\n' + '-'.repeat(36) + '\n';
    SAMPLE_IMAGES.forEach((img, i) => {
      lines += `${i === selectedItem ? '▸ ' : '  '}${img.label}\n`;
    });
    lines += `${selectedItem === SAMPLE_IMAGES.length ? '▸ ' : '  '}+ upload your own image...\n`;
    lines += '-'.repeat(36) + '\n↑/↓ select · ENTER confirm · ESC back';
    return lines;
  }

  let lines = '> HISTORY.LOG — select a record\n' + '-'.repeat(48) + '\n';
  MOCK_HISTORY_ROWS.forEach((row, i) => {
    const marker = i === selectedItem ? '▸ ' : '  ';
    lines += `${marker}${row.timestamp}  ${row.count} people  ${formatConfidence(row.avgConfidence)}\n`;
  });
  lines += '-'.repeat(48) + '\n↑/↓ select · ENTER confirm · ESC back';
  return lines;
}

function buildHistoryDetailText(row) {
  return `> HISTORY.LOG — record detail
------------------------------------
TIMESTAMP  : ${row.timestamp}
COUNT      : ${row.count}
CONFIDENCE : ${formatConfidence(row.avgConfidence)}
SOURCE     : ${row.sourceType}
------------------------------------
ESC  back to list`;
}

function TerminalText({ mode, page, results }) {
  const selectedItem = useNavigationStore((s) => s.selectedItem);

  let text;
  if (mode === MODES.RESULT && results?.type === 'history') {
    text = buildHistoryDetailText(results.data);
  } else if (mode === MODES.LIST) {
    text = buildListText(page, selectedItem);
  } else {
    text = IDLE_TEXT[page];
  }

  return <pre className="term cursor">{text}</pre>;
}

export default TerminalText;
