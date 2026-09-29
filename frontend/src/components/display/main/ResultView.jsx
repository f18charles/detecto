import BoundingBox from './BoundingBox';
import ResultCaption from '../ResultCaption';
import { formatConfidence, formatTime } from '../../../utils/format';

function ImageStage({ imageUrl, size, children }) {
  const ratio = (size?.width || 4) / (size?.height || 3);
  return (
    <div
      className="image-stage relative"
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

function VideoStage({ videoRef, size, children }) {
  const ratio = (size?.width || 16) / (size?.height || 9);
  return (
    <div
      className="image-stage relative"
      style={{
        width: `min(100cqw, calc(100cqh * ${ratio}))`,
        height: `min(100cqh, calc(100cqw / ${ratio}))`,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />
      {children}
    </div>
  );
}

function ResultView({ result }) {
  if (!result) return null;

  if (result.type === 'stream') {
    const d = result.data;
    const hasDetections = d && Array.isArray(d.detections);

    return (
      <div className="screen-image-layer" style={{ display: 'block' }}>
        <VideoStage videoRef={d?.videoRef} size={d?.imageSize}>
          {hasDetections &&
            d.detections.map((det, i) => (
              <BoundingBox
                key={i}
                x1={det.x1}
                y1={det.y1}
                x2={det.x2}
                y2={det.y2}
                confidence={det.confidence}
                index={i}
                delayMs={0}
              />
            ))}
        </VideoStage>
        <ResultCaption>
          {`LIVE STREAM · ${d?.people ?? 0} ${(d?.people ?? 0) === 1 ? 'PERSON' : 'PEOPLE'} · ${formatConfidence(d?.avgConfidence)} AVG · ${formatTime(d?.inferenceTimeMs)} · ESC STOP`}
        </ResultCaption>
      </div>
    );
  }

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

  return null;
}

export default ResultView;
