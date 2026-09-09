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
    <div className="flex items-center justify-center p-1.5 bg-gradient-to-r from-[#2f3136] via-[#52555c] to-[#303236] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_2px_rgba(0,0,0,0.45),0_4px_12px_rgba(0,0,0,0.6)]">
      <button
        type="button"
        tabIndex={-1}
        onClick={handleClick}
        className={`silver-btn rounded-full w-12 h-12 flex items-center justify-center cursor-pointer pointer-events-auto transition-all ${
          isPowerOn ? 'silver-btn-active' : ''
        }`}
        title={isPowerOn ? 'Power Off Console' : 'Power On Console'}
      >
        <svg
          className={`w-6 h-6 ${
            isPowerOn
              ? 'text-display-green drop-shadow-[0_0_8px_#3DDC97]'
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
    </div>
  );
}
