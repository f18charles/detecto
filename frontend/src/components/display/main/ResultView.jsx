import { useEffect, useRef, useState } from 'react';
import BoundingBox from './BoundingBox';
import ResultCaption from '../ResultCaption';
import VideoLoading from './VideoLoading';
import { formatConfidence, formatTime } from '../../../utils/format';
import { boxesAt } from '../../../utils/timeline';

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

function VideoStage({ stream, videoUrl, size, onVideoReady, children }) {
  const videoRef = useRef(null);
  const ratio = (size?.width || 16) / (size?.height || 9);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
    } else if (videoUrl) {
      video.src = videoUrl;
    }

    const playVideo = async () => {
      try {
        await video.play();
      } catch (err) {
        console.error('Video play error:', err);
      }
    };

    playVideo();
    if (onVideoReady) {
      onVideoReady(video);
    }
  }, [stream, videoUrl, onVideoReady]);

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
        loop={!!stream}
        controls={!stream}
        className="w-full h-full object-contain"
      />
      {children}
    </div>
  );
}

// Plays a precomputed video and draws the boxes for the frame currently on
// screen, interpolating between samples so the overlay stays locked to the
// picture instead of trailing it.
function VideoTimelineStage({ videoUrl, size, timeline }) {
  const videoRef = useRef(null);
  const timelineRef = useRef(timeline);
  const [boxes, setBoxes] = useState([]);
  const ratio = (size?.width || 16) / (size?.height || 9);

  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let frameCallbackId = null;

    const apply = (mediaTimeSeconds) => {
      setBoxes(boxesAt(timelineRef.current, mediaTimeSeconds * 1000));
    };

    const onFrame = (_now, metadata) => {
      apply(metadata.mediaTime);
      frameCallbackId = video.requestVideoFrameCallback(onFrame);
    };
    const onTimeUpdate = () => apply(video.currentTime);

    if (typeof video.requestVideoFrameCallback === 'function') {
      frameCallbackId = video.requestVideoFrameCallback(onFrame);
    } else {
      video.addEventListener('timeupdate', onTimeUpdate);
    }

    return () => {
      if (frameCallbackId !== null && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(frameCallbackId);
      }
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [videoUrl, timeline]);

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
        src={videoUrl}
        autoPlay
        playsInline
        muted
        controls
        className="w-full h-full object-contain"
      />
      {boxes.map((det, i) => (
        <BoundingBox
          key={det.id ?? i}
          x1={det.x1}
          y1={det.y1}
          x2={det.x2}
          y2={det.y2}
          confidence={det.confidence}
          index={i}
          delayMs={0}
        />
      ))}
    </div>
  );
}

function ResultView({ result }) {
  if (!result) return null;

  if (result.type === 'video') {
    const d = result.data;

    if (!d || d.status !== 'ready' || !Array.isArray(d.timeline)) {
      return <VideoLoading data={d} />;
    }

    const peakPeople = d.timeline.reduce(
      (max, sample) => Math.max(max, sample.detections.length),
      0
    );

    return (
      <div className="screen-image-layer" style={{ display: 'block' }}>
        <VideoTimelineStage
          videoUrl={d.videoUrl}
          size={d.imageSize}
          timeline={d.timeline}
        />
        <ResultCaption>
          {`VIDEO: ${d.filename ?? 'video'} · ${peakPeople} PEAK ${peakPeople === 1 ? 'PERSON' : 'PEOPLE'} · ${d.timeline.length} SAMPLES · ESC STOP`}
        </ResultCaption>
      </div>
    );
  }

  if (result.type === 'stream') {
    const d = result.data;
    const hasDetections = d && Array.isArray(d.detections);
    const label = d?.filename ? `VIDEO: ${d.filename}` : 'LIVE STREAM';

    return (
      <div className="screen-image-layer" style={{ display: 'block' }}>
        <VideoStage
          stream={d?.stream}
          videoUrl={d?.videoUrl}
          size={d?.imageSize}
          onVideoReady={d?.onVideoReady}
        >
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
          {`${label} · ${d?.people ?? 0} ${(d?.people ?? 0) === 1 ? 'PERSON' : 'PEOPLE'} · ${formatConfidence(d?.avgConfidence)} AVG · ${formatTime(d?.inferenceTimeMs)} · ESC STOP`}
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
