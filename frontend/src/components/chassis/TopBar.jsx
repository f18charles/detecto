import { usePowerStore } from '../../stores/PowerStore';
import PowerButton from './PowerButton';

const TopBar = () => {
  const isPowerOn = usePowerStore((s) => s.isPowerOn);
  const isBooting = usePowerStore((s) => s.isBooting);
  const isShuttingDown = usePowerStore((s) => s.isShuttingDown);

  const online = isPowerOn && !isBooting && !isShuttingDown;

  return (
    <div className="flex items-center w-full justify-between px-2 pb-4 mb-4 border-b border-black/25">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-[15px] font-semibold tracking-wide text-chassis-text leading-none">
            LOOKOUT
          </h1>
          <p className="text-[10px] font-mono text-chassis-muted mt-1">Station 01-072-073</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              online
                ? 'bg-display-green shadow-[0_0_8px_#3ddc97]'
                : 'bg-red-500/80 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
            }`}
          />
          <span className="text-[10px] font-mono text-chassis-muted">
            {online ? 'System Online' : isBooting ? 'Booting...' : 'System Offline'}
          </span>
        </div>
        <PowerButton />
      </div>
    </div>
  );
};

export default TopBar;