import { useNavigationStore } from '../../../stores/NavigationStore';
import { usePowerStore } from '../../../stores/PowerStore';
import { MODE_NAMES } from '../../../data/modeText';

const PAGE_NAMES = ['DETECT', 'HISTORY'];

function StatePanel() {
  const mode = useNavigationStore((s) => s.mode);
  const currPage = useNavigationStore((s) => s.currPage);
  const isPowerOn = usePowerStore((s) => s.isPowerOn);
  const isShuttingDown = usePowerStore((s) => s.isShuttingDown);

  const powerClass = isShuttingDown
    ? 'mini-crt-power-off'
    : isPowerOn
      ? 'mini-crt-power-on'
      : '';

  return (
    <div className="mini-frame">
      <div className={`inset-panel glass-shine rounded-xl px-3 py-2 h-[54px] flex flex-col justify-center ${powerClass}`}>
        <div className="text-[11px] font-mono text-display-green font-semibold tracking-wide mb-1 min-h-[16px]">
          {isPowerOn && !isShuttingDown ? `▸ ${MODE_NAMES[mode]} MODE` : ''}
        </div>
        <div className="text-[10px] font-mono text-chassis-dim pt-1 border-t border-white/5 min-h-[16px]">
          {isPowerOn && !isShuttingDown ? (
            <>CURRENT: <span className="text-display-green">{PAGE_NAMES[currPage]}</span></>
          ) : ''}
        </div>
      </div>
    </div>
  );
}

export default StatePanel;
