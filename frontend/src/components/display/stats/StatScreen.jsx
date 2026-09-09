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
      <div className={`inset-panel glass-shine rounded-xl px-3.5 py-2 h-[54px] flex flex-col justify-center ${powerClass}`}>
        <div className="text-[9px] font-mono text-chassis-dim tracking-wide mb-0.5">{label}</div>
        <div className={`font-mono font-semibold text-xl min-h-[28px] leading-tight ${muted ? 'text-[#c8cace]' : 'text-display-green'}`}>
          {isPowerOn && !isShuttingDown ? value : ''}
        </div>
      </div>
    </div>
  );
};

export default StatScreen;