import { usePowerStore } from '../../stores/PowerStore';
import { useHistory } from '../../hooks/UseHistory';

const TopBar = () => {
  const isPowerOn = usePowerStore((s) => s.isPowerOn);
  const isShuttingDown = usePowerStore((s) => s.isShuttingDown);
  const historyQuery = useHistory();

  // Status Light color scheme:
  // Off state (system powered off or shutting down) -> no color / off gray / black
  // Connected state (powered on + backend connected) -> green
  // Not connected state (powered on + backend error) -> red
  const isSystemActive = isPowerOn && !isShuttingDown;
  const isBackendConnected = !historyQuery.isError;

  let lightStyle = 'bg-[#18191b] border border-white/15 shadow-none'; // off state (no color / off gray / black)
  if (isSystemActive) {
    if (isBackendConnected) {
      lightStyle = 'bg-display-green shadow-[0_0_8px_#3ddc97]'; // connected green
    } else {
      lightStyle = 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]'; // not connected red
    }
  }

  return (
    <div className="flex items-center w-full justify-between px-2 pb-4 mb-4 border-b border-black/25">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-[15px] font-semibold tracking-wide text-chassis-text leading-none">
            DETECTO
          </h1>
          <p className="text-[10px] font-mono text-chassis-muted mt-1">Station 01-072-073</p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${lightStyle}`} />
        <span className="text-[10px] font-mono text-chassis-muted select-none">
          System Online
        </span>
      </div>
    </div>
  );
};

export default TopBar;