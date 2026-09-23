import TerminalText from '../display/main/TerminalText';
import ResultView from '../display/main/ResultView';
import PowerOffDialog from './PowerOffDialog';
import { MODES, useNavigationStore } from '../../stores/NavigationStore';
import { usePowerStore } from '../../stores/PowerStore';
import { useScreenTransition } from '../../hooks/useScreenTransition';
import { useResetHistory } from '../../hooks/UseResetHistory';

function ScreenBezel() {
  const mode = useNavigationStore((s) => s.mode);
  const page = useNavigationStore((s) => s.currPage);
  const results = useNavigationStore((s) => s.results);
  const isPowerOn = usePowerStore((s) => s.isPowerOn);
  const isBooting = usePowerStore((s) => s.isBooting);
  const isShuttingDown = usePowerStore((s) => s.isShuttingDown);

  const { displayed, flicker, onFlickerEnd } = useScreenTransition({ mode, page, results });

  const showResultView =
    displayed.mode === MODES.RESULT && displayed.results?.type !== 'history';

  const powerClass = isShuttingDown
    ? 'crt-power-off-dot'
    : isPowerOn
      ? 'crt-power-on'
      : '';


    
  return (
    <div className="screen-frame">
      <div
        className={`screen-bezel flex flex-col items-center justify-center glass-shine crt-flicker ${flicker ? 'flicker-burst' : ''} ${powerClass}`}
        onAnimationEnd={(e) => {
          if (e.animationName === 'flickerBurst') onFlickerEnd();
        }}
      >
        {isPowerOn && !isShuttingDown && (
          <>
            {showResultView ? (
              <ResultView result={displayed.results} />
            ) : (
              <TerminalText mode={displayed.mode} page={displayed.page} results={displayed.results} />
            )}
          </>
        )}
        <PowerOffDialog />
        <div className="scanlines" />
        <div className="crt-vignette" />
        <div className="crt-glass-reflection" />
      </div>
    </div>
  );
}

export default ScreenBezel;
