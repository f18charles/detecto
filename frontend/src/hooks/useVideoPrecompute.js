import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { detect } from '../api/Client';
import { useDetectionStore } from '../stores/DetectionStore';
import { useNavigationStore } from '../stores/NavigationStore';
import { normalizeDetection } from '../utils/detection';
import { assignTrackIds } from '../utils/timeline';
import { historyQueryKey } from './UseHistory';

// How many frames per second of video we send to the detector. The backend
// cannot batch (one HTTP call per image), so this is the main cost knob:
// a longer clip costs `duration * sampleFps` requests. 8 Hz plus interpolation
// on playback is enough to follow normal motion.
const DEFAULT_SAMPLE_FPS = 8;
// Largest edge sent per frame; Ultralytics letterboxes to 640 anyway.
const MAX_FRAME_DIM = 640;
const SEEK_TIMEOUT_MS = 4000;
const METADATA_TIMEOUT_MS = 10000;

// Seek a detached <video> to `time` and resolve once the frame is ready.
// Falls back to a timeout so a stubborn decoder cannot hang the loading screen.
function seekTo(video, time) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('seeked', finish);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, SEEK_TIMEOUT_MS);
    video.addEventListener('seeked', finish);
    try {
      video.currentTime = time;
    } catch {
      finish();
    }
  });
}

function waitFor(eventName, video, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(timeoutMessage));
    }, timeoutMs);
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Could not read video file'));
    };
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(eventName, onEvent);
      video.removeEventListener('error', onError);
    };
    video.addEventListener(eventName, onEvent);
    video.addEventListener('error', onError);
  });
}

function toErrorMessage(err) {
  if (typeof err === 'string') return err;
  if (err?.response?.data?.detail) {
    const detail = err.response.data.detail;
    return typeof detail === 'string' ? detail : JSON.stringify(detail);
  }
  return err?.message || 'UNSPECIFIED ERROR';
}

export function useVideoPrecompute({ sampleFps = DEFAULT_SAMPLE_FPS } = {}) {
  const queryClient = useQueryClient();
  const [isPrecomputing, setIsPrecomputing] = useState(false);
  const cancelRef = useRef(false);
  const controllerRef = useRef(null);
  const videoRef = useRef(null);

  const teardown = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        // ignore teardown errors
      }
      video.remove();
      videoRef.current = null;
    }
    setIsPrecomputing(false);
  }, []);

  const cancelPrecompute = useCallback(() => {
    cancelRef.current = true;
    teardown();
    useNavigationStore.getState().popUp();
  }, [teardown]);

  const startVideoPrecompute = useCallback(
    async (file, objectUrl) => {
      useDetectionStore.getState().clearResult();

      useNavigationStore.getState().enterResult({
        type: 'video',
        data: {
          videoUrl: objectUrl,
          filename: file.name,
          status: 'processing',
          progress: 0,
          processed: 0,
          total: 0,
          etaMs: null,
          imageSize: null,
          timeline: null,
        },
      });

      setIsPrecomputing(true);
      cancelRef.current = false;

      // Detached, off-screen element used only for seeking/decoding frames.
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.style.cssText =
        'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none;';
      document.body.appendChild(video);
      videoRef.current = video;

      try {
        const metadataReady = waitFor(
          'loadedmetadata',
          video,
          METADATA_TIMEOUT_MS,
          'Timed out reading video metadata'
        );
        video.src = objectUrl;
        await metadataReady;

        if (video.readyState < 2) {
          await waitFor('loadeddata', video, METADATA_TIMEOUT_MS, 'Timed out decoding video');
        }

        const { duration, videoWidth: width, videoHeight: height } = video;
        if (!Number.isFinite(duration) || duration <= 0 || !width || !height) {
          throw new Error('Invalid or unsupported video file');
        }

        const total = Math.max(1, Math.round(duration * sampleFps));
        const step = duration / total;
        const imageSize = { width, height };
        const controller = new AbortController();
        controllerRef.current = controller;

        const startedAt = performance.now();
        const raw = [];

        for (let i = 0; i < total; i += 1) {
          if (cancelRef.current) break;

          // Sample the middle of each interval so the first seek is a real one.
          const t = Math.min((i + 0.5) * step, Math.max(0, duration - 0.001));
          await seekTo(video, t);
          if (cancelRef.current) break;

          const scale = Math.min(
            1,
            MAX_FRAME_DIM / Math.max(video.videoWidth, video.videoHeight)
          );
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
          canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

          const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', 0.85)
          );
          if (!blob) continue;

          const frameFile = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
          const data = await detect(frameFile, {
            signal: controller.signal,
            mediaType: 'video',
            mediaName: file.name,
            frameIndex: i,
            totalFrames: total,
          });
          const detections = normalizeDetection(data, {
            width: canvas.width,
            height: canvas.height,
          }).detections;

          raw.push({ tMs: t * 1000, detections });

          const processed = i + 1;
          const elapsed = performance.now() - startedAt;
          const etaMs = (elapsed / processed) * (total - processed);

          useNavigationStore.getState().updateResult({
            type: 'video',
            data: {
              videoUrl: objectUrl,
              filename: file.name,
              status: 'processing',
              progress: processed / total,
              processed,
              total,
              etaMs,
              imageSize,
              timeline: null,
            },
          });
        }

        if (cancelRef.current) return;

        const timeline = assignTrackIds(raw);
        useNavigationStore.getState().updateResult({
          type: 'video',
          data: {
            videoUrl: objectUrl,
            filename: file.name,
            status: 'ready',
            progress: 1,
            processed: total,
            total,
            etaMs: 0,
            imageSize,
            timeline,
          },
        });
        // The backend compiles all of this video's frames into one history row,
        // written when the last frame is sent; refresh the list to pick it up.
        queryClient.invalidateQueries({ queryKey: historyQueryKey });
      } catch (err) {
        if (!cancelRef.current) {
          const message = toErrorMessage(err).toUpperCase();
          useDetectionStore.getState().setStatus('error', message);
          useNavigationStore.getState().popUp();
        }
      } finally {
        teardown();
      }
    },
    [queryClient, sampleFps, teardown]
  );

  return { isPrecomputing, startVideoPrecompute, cancelPrecompute };
}
