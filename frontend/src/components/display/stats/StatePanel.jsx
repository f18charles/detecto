import { useNavigationStore } from '../../../stores/NavigationStore';
import { MODE_NAMES } from '../../../data/modeText';

const PAGE_NAMES = ['DETECT', 'HISTORY'];

function StatePanel() {
  const mode = useNavigationStore((s) => s.mode);
  const currPage = useNavigationStore((s) => s.currPage);

  return (
    <div className="mini-frame">
      <div className="inset-panel rounded-xl px-3 py-2.5">
        <div className="text-[11px] font-mono text-display-green font-semibold tracking-wide mb-1.5">
          ▸ {MODE_NAMES[mode]} MODE
        </div>
        <div className="text-[10px] font-mono text-chassis-dim pt-1.5 border-t border-white/5">
          CURRENT: <span className="text-display-green">{PAGE_NAMES[currPage]}</span>
        </div>
      </div>
    </div>
  );
}

export default StatePanel;
