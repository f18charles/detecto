import { usePowerStore } from '../../stores/PowerStore';

export default function PowerButton() {
  const isPowerOn = usePowerStore((s) => s.isPowerOn);
  const turnPowerOn = usePowerStore((s) => s.turnPowerOn);
  const requestPowerOff = usePowerStore((s) => s.requestPowerOff);

  const handleClick = () => {
    if (!isPowerOn) {
      turnPowerOn();
    } else {
      requestPowerOff();
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-[#2f3136] via-[#52555c] to-[#303236] px-3 py-1.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_2px_rgba(0,0,0,0.4),0_3px_8px_rgba(0,0,0,0.5)]">
      <button
        type="button"
        onClick={handleClick}
        className={`silver-btn rounded-full w-8 h-8 flex items-center justify-center cursor-pointer pointer-events-auto transition-all ${
          isPowerOn ? 'silver-btn-active' : ''
        }`}
        title={isPowerOn ? 'Power Off Console' : 'Power On Console'}
      >
        <svg
          className={`w-4 h-4 ${
            isPowerOn
              ? 'text-display-green drop-shadow-[0_0_6px_#3DDC97]'
              : 'text-[#3f4247]'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"
          />
        </svg>
      </button>
      <span className="text-[9px] font-mono font-semibold tracking-wider text-chassis-text select-none">
        {isPowerOn ? 'POWER ON' : 'POWER OFF'}
      </span>
    </div>
  );
}
