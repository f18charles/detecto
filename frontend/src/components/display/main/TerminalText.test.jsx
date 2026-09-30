import { cleanup, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MODES, useNavigationStore } from '../../../stores/NavigationStore';
import { useHistoryFilterStore } from '../../../stores/HistoryFilterStore';

// vi.hoisted so the mock factory can reference the rows (plain top-level consts
// are not available when vi.mock is hoisted above the imports).
const { rows } = vi.hoisted(() => ({
  rows: [
    {
      id: 1,
      media_name: 'crowd_essence.jpg',
      media_type: 'video',
      person_count: 17,
      average_confidence: 0.651,
      inference_time_ms: 142.2,
      frame_count: 96,
      timestamp: new Date(2026, 8, 30, 10, 0, 0).toISOString(),
    },
    {
      id: 2,
      media_name: 'small_group_columbia.jpg',
      media_type: 'image',
      person_count: 3,
      average_confidence: 0.87,
      inference_time_ms: 102.4,
      frame_count: null,
      timestamp: new Date(2026, 8, 30, 9, 30, 0).toISOString(),
    },
  ],
}));

vi.mock('../../../hooks/UseHistory', () => ({
  useHistory: () => ({ data: rows, isLoading: false, isError: false }),
}));

import TerminalText from './TerminalText';

function layout(container) {
  const pre = [...container.querySelectorAll('pre')];
  return {
    header: pre[0]?.textContent ?? '',
    footer: pre[pre.length - 1]?.textContent ?? '',
    scroller: container.querySelector('.overflow-y-auto'),
    rowLines: [...(container.querySelector('.overflow-y-auto')?.querySelector('div')?.children ?? [])].map(
      (el) => el.textContent
    ),
  };
}

beforeEach(() => {
  cleanup();
  useHistoryFilterStore.setState({
    confIndex: 0, minConfidence: 0,
    dateIndex: 0, dateFilter: 'all',
    timeIndex: 0, timeFilter: 'all',
    showClearConfirm: false,
  });
  useNavigationStore.setState({ mode: MODES.LIST, page: 1, currPage: 1, selectedItem: 0, results: null });
});

describe('TerminalText history table', () => {
  it('heads the columns in order: name, type, people, conf, time, timestamp', () => {
    const { container } = render(<TerminalText mode={MODES.LIST} page={1} results={null} />);
    const { header } = layout(container);

    const order = ['NAME', 'TYPE', 'PEOPLE', 'AVG CONF', 'INFERENCE TIME', 'TIMESTAMP'];
    const positions = order.map((label) => header.indexOf(label));

    positions.forEach((pos) => expect(pos).toBeGreaterThanOrEqual(0));
    for (let i = 1; i < positions.length; i += 1) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('renders media name and type for each row', () => {
    const { container } = render(<TerminalText mode={MODES.LIST} page={1} results={null} />);
    const { rowLines } = layout(container);

    expect(rowLines).toHaveLength(2);
    expect(rowLines[0]).toContain('crowd_essence.jpg');
    expect(rowLines[0]).toContain('video');
    expect(rowLines[0]).toContain('17');
    expect(rowLines[1]).toContain('small_group_columbia.jpg');
    expect(rowLines[1]).toContain('image');
    expect(rowLines[1]).toContain('3');
  });

  it('pins header and footer and only the body scrolls, scrollbar hidden', () => {
    const { container } = render(<TerminalText mode={MODES.LIST} page={1} results={null} />);
    const pre = [...container.querySelectorAll('pre')];
    const { scroller } = layout(container);

    expect(pre).toHaveLength(2); // header + footer only
    expect(scroller).not.toBeNull();
    expect(scroller.className).toContain('overflow-y-auto');
    expect(scroller.className).toContain('no-scrollbar');
    expect(scroller.className).toContain('overflow-x-hidden');
  });

  it('marks the selected row and scrolls it into view', () => {
    useNavigationStore.setState({ mode: MODES.LIST, page: 1, currPage: 1, selectedItem: 1, results: null });
    Element.prototype.scrollIntoView = vi.fn();

    const { container } = render(<TerminalText mode={MODES.LIST} page={1} results={null} />);
    const { rowLines } = layout(container);

    expect(rowLines[1].startsWith('> ')).toBe(true);
    expect(rowLines[0].startsWith('  ')).toBe(true);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('shows media name and type in the record detail view', () => {
    const { container } = render(
      <TerminalText mode={MODES.RESULT} page={1} results={{ type: 'history', data: rows[0] }} />
    );
    const text = container.textContent;

    expect(text).toContain('MEDIA NAME');
    expect(text).toContain('crowd_essence.jpg');
    expect(text).toContain('MEDIA TYPE');
    expect(text).toContain('video');
  });
});
