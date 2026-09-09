import { useEffect, useRef, useState } from 'react';
import { useNavigationStore } from '../../../stores/NavigationStore';
import { useDetectionStore } from '../../../stores/DetectionStore';
import { formatConfidence, formatTime } from '../../../utils/format';

// Watches store transitions and derives its own toast text, rather than
// needing some other piece of code to imperatively "call showToast()" —
// keeps toast triggering declarative instead of adding a message-passing
// store just to shuttle strings around.
//
// The scroll-vs-fade decision genuinely can't live in a store: it depends
// on measuring the rendered text's scrollWidth against the panel's
// clientWidth, which only exists once something is actually on screen.
function ToastScreen() {
  const currPage = useNavigationStore((s) => s.currPage);
  const status = useDetectionStore((s) => s.status);
  const currentResult = useDetectionStore((s) => s.currentResult);

  const [message, setMessage] = useState('');
  const trackRef = useRef(null);
  const isFirstPageRender = useRef(true);

  // Page-switch toast — skipped on initial mount
  useEffect(() => {
    if (isFirstPageRender.current) {
      isFirstPageRender.current = false;
      return;
    }
    setMessage(currPage === 0 ? 'SWITCHED TO DETECT.SYS' : 'SWITCHED TO HISTORY.LOG');
  }, [currPage]);

  // Detection-complete / detection-failed toast
  useEffect(() => {
    if (status === 'done' && currentResult) {
      setMessage(
        `DETECTION COMPLETE · ${currentResult.people} PEOPLE FOUND · ${formatConfidence(currentResult.avgConfidence)} AVG CONFIDENCE · ${formatTime(currentResult.inferenceTimeMs)}`
      );
    } else if (status === 'error') {
      setMessage('DETECTION FAILED · BACKEND UNREACHABLE OR REQUEST ERROR');
    }
  }, [status, currentResult]);

  // Play the message: scroll if it overflows the panel, fade if it fits,
  // then self-clear — five marquee passes if scrolling, per spec.
  useEffect(() => {
    if (!message) return;
    const track = trackRef.current;
    if (!track) return;

    track.classList.remove('scrolling', 'static');
    void track.offsetWidth; // reflow before re-measuring

    const container = track.parentElement;
    const overflowing = track.scrollWidth > container.clientWidth;
    track.classList.add(overflowing ? 'scrolling' : 'static');

    const clear = () => {
      setMessage('');
      track.classList.remove('scrolling', 'static');
    };
    track.addEventListener('animationend', clear, { once: true });
    return () => track.removeEventListener('animationend', clear);
  }, [message]);

  return (
    <div className="mini-frame">
      <div className="inset-panel rounded-lg h-[26px] px-2.5 flex items-center overflow-hidden relative">
        <div ref={trackRef} className="toast-track">
          {message}
        </div>
      </div>
    </div>
  );
}

export default ToastScreen;
