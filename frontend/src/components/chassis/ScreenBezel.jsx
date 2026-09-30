import TerminalText from '../display/main/TerminalText';
import ResultView from '../display/main/ResultView';
import PowerOffDialog from './PowerOffDialog';
import ResetHistoryDialog from './ResetHistoryDialog';
import { MODES, useNavigationStore } from '../../stores/NavigationStore';
import { usePowerStore } from '../../stores/PowerStore';
import { useScreenTransition } from '../../hooks/useScreenTransition';

// Only structural changes should trigger a screen transition. Live stream
// detections change every frame, so the key below deliberately ignores box
// counts/coordinates and only reacts to the result's identity.
function resultSignature(results) {
  if (!results) return '';
  const { type, data } = results;
  if (type === 'stream') return `stream:${data?.filename ?? 'live'}`;
  if (type === 'video') return `video:${data?.filename ?? ''}:${data?.status ?? ''}`;
  if (type === 'upload') {
    const resolved = Array.isArray(data?.detections) ? 'done' : 'pending';
    return `upload:${data?.filename ?? ''}:${resolved}`;
  }
  if (type === 'history') return `history:${data?.id ?? ''}`;
  return type;
}

function ScreenBezel() {
  const mode = useNavigationStore((s) => s.mode);
  const page = useNavigationStore((s) => s.currPage);
  const results = useNavigationStore((s) => s.results);
  const isPowerOn = usePowerStore((s) => s.isPowerOn);
  const isShuttingDown = usePowerStore((s) => s.isShuttingDown);

  const transitionKey = `${mode}|${page}|${resultSignature(results)}`;
  const { displayed, flicker, onFlickerEnd } = useScreenTransition(
    { mode, page, results },
    transitionKey,
  );

  // Render the live result so streaming boxes track the current frame, but
  // fall back to the last displayed one while a transition is settling.
  const activeResults = results ?? displayed.results;
  const showResultView =
    displayed.mode === MODES.RESULT && activeResults?.type !== 'history';

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
              <ResultView result={activeResults} />
            ) : (
              <TerminalText mode={displayed.mode} page={displayed.page} results={displayed.results} />
            )}
          </>
        )}
        <PowerOffDialog />
        <ResetHistoryDialog />
        <div className="scanlines" />
        <div className="crt-vignette" />
        <div className="crt-glass-reflection" />
      </div>
    </div>
  );
}

export default ScreenBezel;
