import { useEffect, useRef, useState } from 'react';
import { useNavigationStore } from '../../../stores/NavigationStore';
import { useDetectionStore } from '../../../stores/DetectionStore';
import { usePowerStore } from '../../../stores/PowerStore';
import { formatConfidence, formatTime } from '../../../utils/format';

function ToastScreen() {
  const currPage = useNavigationStore((s) => s.currPage);
  const status = useDetectionStore((s) => s.status);
  const errorMessage = useDetectionStore((s) => s.errorMessage);
  const currentResult = useDetectionStore((s) => s.currentResult);
  const isPowerOn = usePowerStore((s) => s.isPowerOn);
  const isShuttingDown = usePowerStore((s) => s.isShuttingDown);

  const [message, setMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const trackRef = useRef(null);
  const isFirstPageRender = useRef(true);

  const powerClass = isShuttingDown
    ? 'mini-crt-power-off'
    : isPowerOn
      ? 'mini-crt-power-on'
      : '';

  // Page-switch toast — skipped on initial mount
  useEffect(() => {
    if (isFirstPageRender.current) {
      isFirstPageRender.current = false;
      return;
    }
    setMessage(currPage === 0 ? 'SWITCHED TO DETECT.SYS' : 'SWITCHED TO HISTORY.LOG');
    setToastKey((k) => k + 1);
  }, [currPage]);

  // Detection-complete / detection-failed toast
  useEffect(() => {
    if (status === 'done' && currentResult) {
      setMessage(
        `DETECTION COMPLETE · ${currentResult.people} PEOPLE FOUND · ${formatConfidence(currentResult.avgConfidence)} AVG CONFIDENCE · ${formatTime(currentResult.inferenceTimeMs)}`
      );
      setToastKey((k) => k + 1);
    } else if (status === 'error') {
      const detail = errorMessage ? errorMessage.toUpperCase() : 'BACKEND UNREACHABLE OR REQUEST ERROR';
      setMessage(`DETECTION FAILED · ${detail}`);
      setToastKey((k) => k + 1);
    }
  }, [status, currentResult, errorMessage]);

  // Play the message: scroll if it overflows the panel, fade if it fits
  useEffect(() => {
    if (!message) return;
    const track = trackRef.current;
    if (!track) return;

    track.classList.remove('scrolling', 'static');
    void track.offsetWidth;

    const container = track.parentElement;
    const overflowing = track.scrollWidth > container.clientWidth;
    track.classList.add(overflowing ? 'scrolling' : 'static');

    const clear = () => {
      setMessage('');
      track.classList.remove('scrolling', 'static');
    };
    track.addEventListener('animationend', clear, { once: true });
    return () => track.removeEventListener('animationend', clear);
  }, [message, toastKey]);

  return (
    <div className="mini-frame">
      <div className={`inset-panel glass-shine rounded-lg h-[26px] px-2.5 flex items-center overflow-hidden relative ${powerClass}`}>
        <div ref={trackRef} key={toastKey} className="toast-track">
          {isPowerOn && !isShuttingDown ? message : ''}
        </div>
      </div>
    </div>
  );
}

export default ToastScreen;
