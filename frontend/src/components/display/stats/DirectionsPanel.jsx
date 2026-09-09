import { useNavigationStore } from '../../../stores/NavigationStore';
import { HELP_TEXT } from '../../../data/modeText';
import { useClock } from '../../../hooks/useClock';

function DirectionsPanel() {
  const mode = useNavigationStore((s) => s.mode);
  const { time } = useClock();
  const help = HELP_TEXT[mode]?.help ?? HELP_TEXT.nav.help;

  return (
    <div className="mini-frame">
      <div className="inset-panel rounded-xl px-3 py-2.5">
        <div className="text-[8px] font-mono text-chassis-dim tracking-wide uppercase mb-1.5">
          Directions
        </div>
        <div className="text-[9px] font-mono text-[#a8b0b8] leading-relaxed">{help}</div>
        <div className="text-[10px] font-mono text-display-green mt-1.5 pt-1.5 border-t border-white/5">
          ⏱ {time}
        </div>
      </div>
    </div>
  );
}

export default DirectionsPanel;
