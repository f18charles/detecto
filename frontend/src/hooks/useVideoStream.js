import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { detect, finalizeStream } from '../api/Client';
import { useDetectionStore } from '../stores/DetectionStore';
import { useNavigationStore } from '../stores/NavigationStore';
import { normalizeDetection } from '../utils/detection';
import { historyQueryKey } from './UseHistory';
import { useMovementTrail } from './useMovementTrail';

// Longest edge of the frame fed to the model. Ultralytics letterboxes to 640
// anyway, so uploading more than this only adds canvas/JPEG/CLAHE time without
// improving accuracy. Downscaling also shrinks the upload on every frame.
const MAX_FRAME_DIM = 640;

// Live webcam detection. Uploaded video files go through useVideoPrecompute
// instead, which analyses the clip up-front and then plays it in sync.
export function useVideoStream({ intervalMs = 500 } = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);
  const activeVideoRef = useRef(null);
  const isProcessingRef = useRef(false);
  const captureRef = useRef(null);
  const detachListenersRef = useRef(null);
  const sessionIdRef = useRef(null);

  const queryClient = useQueryClient();
  const { addSample, clear: clearTrail } = useMovementTrail();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Called with the <video> element. We only start a capture when nothing is in
  // flight and the video is genuinely playing, so pausing freezes the boxes.
  const handleVideoReady = useCallback(
    (videoElement) => {
      if (!videoElement) return;

      detachListenersRef.current?.();
      activeVideoRef.current = videoElement;

      const onPlaying = () => {
        if (!timerRef.current && !isProcessingRef.current) {
          captureRef.current?.();
        }
      };
      const onStopped = () => clearTimer();

      videoElement.addEventListener('playing', onPlaying);
      videoElement.addEventListener('pause', onStopped);
      videoElement.addEventListener('ended', onStopped);
      detachListenersRef.current = () => {
        videoElement.removeEventListener('playing', onPlaying);
        videoElement.removeEventListener('pause', onStopped);
        videoElement.removeEventListener('ended', onStopped);
      };

      if (!videoElement.paused && !videoElement.ended) {
        captureRef.current?.();
      }
    },
    [clearTimer]
  );

  // Schedule the next frame as soon as the previous detection has been applied,
  // rather than on a fixed wall-clock interval that wastes the tail of every
  // processing window.
  const scheduleNext = useCallback(() => {
    clearTimer();
    const video = activeVideoRef.current;
    if (!video || video.paused || video.ended) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      captureRef.current?.();
    }, intervalMs);
  }, [clearTimer, intervalMs]);

  const captureAndDetect = useCallback(async () => {
    const video = activeVideoRef.current;
    if (!video || isProcessingRef.current) return;
    if (video.paused || video.ended) return;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    isProcessingRef.current = true;

    try {
      const scale = Math.min(
        1,
        MAX_FRAME_DIM / Math.max(video.videoWidth, video.videoHeight)
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );

      if (!blob) return;
      const file = new File([blob], 'stream_frame.jpg', { type: 'image/jpeg' });
      // The backend returns boxes in the coordinates of the image we sent, so
      // normalize against the canvas size (same ratio as the video itself).
      const imageSize = { width: canvas.width, height: canvas.height };

      const data = await detect(file, { mediaType: 'stream', mediaName: sessionIdRef.current });
      const result = normalizeDetection(data, imageSize);
      const trail = addSample(result.detections);

      useDetectionStore.getState().setResult(result);
      useNavigationStore.getState().updateResult({
        type: 'stream',
        data: {
          imageSize,
          stream: mediaStreamRef.current,
          onVideoReady: handleVideoReady,
          people: result.people,
          avgConfidence: result.avgConfidence,
          inferenceTimeMs: result.inferenceTimeMs,
          detections: result.detections,
          trail,
        },
      });
    } catch (err) {
      console.error('Video stream frame detection error:', err);
    } finally {
      isProcessingRef.current = false;
      scheduleNext();
    }
  }, [scheduleNext, handleVideoReady, addSample]);

  useEffect(() => {
    captureRef.current = captureAndDetect;
  }, [captureAndDetect]);

  const stopStream = useCallback(() => {
    clearTimer();
    detachListenersRef.current?.();
    detachListenersRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (activeVideoRef.current) {
      activeVideoRef.current.srcObject = null;
      activeVideoRef.current = null;
    }
    setIsStreaming(false);
    isProcessingRef.current = false;
    clearTrail();

    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (sessionId) {
      finalizeStream(sessionId)
        .then(() => queryClient.invalidateQueries({ queryKey: historyQueryKey }))
        .catch((err) => console.error('Failed to finalize stream session:', err));
    }
  }, [clearTimer, queryClient, clearTrail]);

  const startWebcamStream = useCallback(async () => {
    stopStream();
    setStreamError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setIsStreaming(true);
      sessionIdRef.current = crypto.randomUUID();

      useNavigationStore.getState().enterResult({
        type: 'stream',
        data: {
          imageSize: { width: 640, height: 480 },
          stream,
          onVideoReady: handleVideoReady,
          people: 0,
          avgConfidence: 0,
          inferenceTimeMs: 0,
          detections: [],
          trail: [],
        },
      });
    } catch (err) {
      const msg = err?.message || 'CAMERA ACCESS DENIED OR NOT AVAILABLE';
      setStreamError(msg);
      useDetectionStore.getState().setStatus('error', msg);
      useNavigationStore.getState().popUp();
      stopStream();
    }
  }, [stopStream, handleVideoReady]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    isStreaming,
    streamError,
    startWebcamStream,
    stopStream,
  };
}
