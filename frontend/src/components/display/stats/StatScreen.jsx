import { usePowerStore } from '../../../stores/PowerStore';

const StatScreen = ({ label, value, muted = false }) => {
  const isPowerOn = usePowerStore((s) => s.isPowerOn);
  const isShuttingDown = usePowerStore((s) => s.isShuttingDown);

  const powerClass = isShuttingDown
    ? 'mini-crt-power-off'
    : isPowerOn
      ? 'mini-crt-power-on'
      : '';

  return (
    <div className="mini-frame">
      <div className={`inset-panel glass-shine rounded-xl px-3.5 py-2.5 ${powerClass}`}>
        <div className="text-[9px] font-mono text-chassis-dim tracking-wide mb-1">{label}</div>
        <div className={`font-mono font-semibold text-xl ${muted ? 'text-[#c8cace]' : 'text-display-green'}`}>
          {isPowerOn ? value : '—'}
        </div>
      </div>
    </div>
  );
};

export default StatScreen;
