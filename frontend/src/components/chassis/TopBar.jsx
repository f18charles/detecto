import { usePowerStore } from '../../stores/PowerStore';
import { useHistory } from '../../hooks/UseHistory';

const TopBar = () => {
  const isPowerOn = usePowerStore((s) => s.isPowerOn);
  const isShuttingDown = usePowerStore((s) => s.isShuttingDown);
  const historyQuery = useHistory();

  // Determine 2-light state:
  // Off state (system powered off) -> gray/black
  // On state + backend error -> red
  // On state + backend ok -> green
  const isSystemActive = isPowerOn && !isShuttingDown;
  const isBackendConnected = !historyQuery.isError;

  let lightStyle = 'bg-black/60 border border-white/10 shadow-none'; // off state (gray/black)
  if (isSystemActive) {
    if (isBackendConnected) {
      lightStyle = 'bg-display-green shadow-[0_0_8px_#3ddc97]'; // connected green
    } else {
      lightStyle = 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]'; // error red
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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${lightStyle}`} />
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${lightStyle}`} />
        </div>
        <span className="text-[10px] font-mono text-chassis-muted select-none">
          System Online
        </span>
      </div>
    </div>
  );
};

export default TopBar;