import { usePowerStore } from '../../stores/PowerStore';

export default function PowerOffDialog() {
  const showPowerOffDialog = usePowerStore((s) => s.showPowerOffDialog);
  const startShutdown = usePowerStore((s) => s.startShutdown);
  const cancelPowerOff = usePowerStore((s) => s.cancelPowerOff);

  if (!showPowerOffDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs">
      <div className="bg-[#101113] border border-display-green/30 rounded-xl p-6 max-w-sm w-full shadow-[0_0_30px_rgba(74,255,138,0.2)] text-center font-mono">
        <h3 className="text-display-green text-sm font-semibold tracking-wider mb-2 uppercase">
          SHUTDOWN CONSOLE?
        </h3>
        <p className="text-chassis-muted text-xs mb-6">
          System services will be powered down.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={startShutdown}
            className="px-4 py-2 bg-display-green/20 hover:bg-display-green/30 text-display-green border border-display-green/50 rounded text-xs font-bold transition-colors cursor-pointer"
          >
            [Y] YES
          </button>
          <button
            type="button"
            onClick={cancelPowerOff}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-chassis-muted border border-white/20 rounded text-xs font-bold transition-colors cursor-pointer"
          >
            [N] NO
          </button>
        </div>
      </div>
    </div>
  );
}
