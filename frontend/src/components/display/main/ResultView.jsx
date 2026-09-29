import BoundingBox from './BoundingBox';
import ResultCaption from '../ResultCaption';
import { formatConfidence, formatTime } from '../../../utils/format';

// Sized to the image's aspect ratio and fitted inside the screen ("contain"),
// so percentage-based boxes line up with the picture.
function ImageStage({ imageUrl, size, children }) {
  const ratio = size.width / size.height;
  return (
    <div
      className="image-stage"
      style={{
        width: `min(100cqw, calc(100cqh * ${ratio}))`,
        height: `min(100cqh, calc(100cqw / ${ratio}))`,
      }}
    >
      <img src={imageUrl} alt="" />
      {children}
    </div>
  );
}

function ResultView({ result }) {
  if (!result) return null;

  if (result.type === 'upload') {
    const d = result.data;
    const hasResolved = d && Array.isArray(d.detections);

    return (
      <div className="screen-image-layer" style={{ display: 'block' }}>
        {d?.imageUrl && d?.imageSize && (
          <ImageStage imageUrl={d.imageUrl} size={d.imageSize}>
            {hasResolved &&
              d.detections.map((det, i) => (
                <BoundingBox
                  key={i}
                  x1={det.x1}
                  y1={det.y1}
                  x2={det.x2}
                  y2={det.y2}
                  confidence={det.confidence}
                  index={i}
                  delayMs={i * 60}
                />
              ))}
          </ImageStage>
        )}
        {hasResolved ? (
          <ResultCaption>
            {`UPLOAD: ${d.filename ?? 'image'} · ${d.people} ${d.people === 1 ? 'PERSON' : 'PEOPLE'} · ${formatConfidence(d.avgConfidence)} AVG · ${formatTime(d.inferenceTimeMs)}`}
          </ResultCaption>
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
