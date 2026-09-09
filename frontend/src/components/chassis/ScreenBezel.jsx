import TerminalText from '../display/main/TerminalText';
import ResultView from '../display/main/ResultView';
import { MODES, useNavigationStore } from '../../stores/NavigationStore';
import { useScreenTransition } from '../../hooks/useScreenTransition';

function ScreenBezel() {
  const mode = useNavigationStore((s) => s.mode);
  const page = useNavigationStore((s) => s.currPage);
  const results = useNavigationStore((s) => s.results);

  const { displayed, flicker, onFlickerEnd } = useScreenTransition({ mode, page, results });

  // History-record detail is text, not an image 
  const showResultView =
    displayed.mode === MODES.RESULT && displayed.results?.type !== 'history';

  return (
    <div className="screen-frame">
      <div
        className={`screen-bezel glass-shine crt-flicker ${flicker ? 'flicker-burst' : ''}`}
        onAnimationEnd={(e) => {
          if (e.animationName === 'flickerBurst') onFlickerEnd();
        }}
      >
        {showResultView ? (
          <ResultView result={displayed.results} />
        ) : (
          <TerminalText mode={displayed.mode} page={displayed.page} results={displayed.results} />
        )}
        <div className="scanlines" />
      </div>
    </div>
  );
}

export default ScreenBezel;
