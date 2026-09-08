import SceneCanvas from './SceneCanvas';
import BoundingBox from './BoundingBox';
import ResultCaption from '../ResultCaption';
import { formatConfidence, formatTime } from '../../../utils/format';

function ResultView({ result }) {
  if (!result) return null;

  if (result.type === 'sample') {
    const d = result.data;
    return (
      <div className="screen-image-layer" style={{ display: 'block' }}>
        <SceneCanvas people={d.people} seed={d.label} confidence={d.avgConfidence} />
        <ResultCaption>{`${d.label} · MOCK DETECTION`}</ResultCaption>
      </div>
    );
  }

  if (result.type === 'upload') {
    const d = result.data;
    const hasResolved = d && Array.isArray(d.detections);

    return (
      <div className="screen-image-layer" style={{ display: 'block' }}>
        {d?.imageUrl && <img src={d.imageUrl} alt="" />}
        {hasResolved ? (
          <>
            {d.detections.map((det, i) => (
              <BoundingBox
                key={i}
                x1={det.bbox[0]}
                y1={det.bbox[1]}
                x2={det.bbox[2]}
                y2={det.bbox[3]}
                confidence={det.confidence}
                index={i}
                delayMs={i * 60}
              />
            ))}
            <ResultCaption>
              {`UPLOAD: ${d.filename ?? 'image'} · ${d.people} PEOPLE · ${formatConfidence(d.avgConfidence)} AVG · ${formatTime(d.inferenceTimeMs)}`}
            </ResultCaption>
          </>
        ) : (
          <ResultCaption>ANALYZING…</ResultCaption>
        )}
      </div>
    );
  }

  // type === 'history' never reaches here — ScreenBezel routes that to
  // TerminalText instead, since it's a text detail view, not an image.
  return null;
}

export default ResultView;
