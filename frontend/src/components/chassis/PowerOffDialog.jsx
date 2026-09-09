import { usePowerStore } from '../../stores/PowerStore';

export default function PowerOffDialog() {
  const showPowerOffDialog = usePowerStore((s) => s.showPowerOffDialog);

  if (!showPowerOffDialog) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#030402]/95 p-4 font-mono text-display-green pointer-events-none select-none">
      <div className="border border-display-green/40 bg-[#101113]/90 rounded-lg p-5 max-w-xs w-full text-center shadow-[0_0_20px_rgba(74,255,138,0.15)]">
        <div className="text-xs font-bold tracking-wider mb-2 text-display-green uppercase">
          ▸ SHUTDOWN CONSOLE?
        </div>
        <div className="text-[10px] text-chassis-muted mb-4 border-b border-white/10 pb-2">
          System services will be powered down.
        </div>
        <div className="text-xs font-semibold text-display-green space-x-4 mb-2">
          <span className="px-2 py-1 bg-display-green/20 border border-display-green/40 rounded">[Y] YES</span>
          <span className="px-2 py-1 bg-white/5 border border-white/20 rounded text-chassis-muted">[N] NO</span>
        </div>
        <div className="text-[9px] text-chassis-dim mt-3">
          Press [Y] or ENTER to shutdown<br />Press [N] or ESC to cancel
        </div>
      </div>
    </div>
  );
}

