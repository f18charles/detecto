import { useState, useRef, useCallback, useEffect } from 'react';
import { useDetection } from './UseDetection';
import { useDetectionStore } from '../stores/DetectionStore';
import { useNavigationStore } from '../stores/NavigationStore';
import { normalizeDetection } from '../utils/detection';

// Longest edge of the frame fed to the model. Ultralytics letterboxes to 640
// anyway, so uploading more than this only adds canvas/JPEG/CLAHE time without
// improving accuracy. Downscaling also shrinks the upload on every frame.
const MAX_FRAME_DIM = 640;

export function useVideoStream({ intervalMs = 500 } = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);
  const activeVideoRef = useRef(null);
  const isProcessingRef = useRef(false);
  const videoUrlRef = useRef(null);
  const captureRef = useRef(null);
  const detachListenersRef = useRef(null);
  // Bumped whenever a stream is stopped/started so an in-flight detection from
  // a previous video cannot paint its boxes onto a new one.
  const sessionRef = useRef(0);

  const { mutateAsync } = useDetection();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Called on every frame the video actually renders. We only start a capture
  // when nothing is in flight and the video is genuinely playing, so pausing
  // freezes the last boxes instead of re-uploading the same frozen frame.
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

      // If playback already started before the listener was attached (e.g. a
      // webcam stream), kick off the loop now.
      if (!videoElement.paused && !videoElement.ended) {
        captureRef.current?.();
      }
    },
    [clearTimer]
  );

  // Schedule the next frame as soon as the previous detection has been applied,
  // rather than on a fixed wall-clock interval that wastes the tail of every
  // processing window. Stops scheduling once the video is paused or ended.
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

    const session = sessionRef.current;
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

      const data = await mutateAsync(file);
      if (session !== sessionRef.current) return;
      const result = normalizeDetection(data, imageSize);

      useDetectionStore.getState().setResult(result);
      useNavigationStore.getState().updateResult({
        type: 'stream',
        data: {
          imageSize,
          stream: mediaStreamRef.current,
          videoUrl: videoUrlRef.current,
          onVideoReady: handleVideoReady,
          people: result.people,
          avgConfidence: result.avgConfidence,
          inferenceTimeMs: result.inferenceTimeMs,
          detections: result.detections,
        },
      });
    } catch (err) {
      console.error('Video stream frame detection error:', err);
    } finally {
      isProcessingRef.current = false;
      scheduleNext();
    }
  }, [mutateAsync, scheduleNext, handleVideoReady]);

  useEffect(() => {
    captureRef.current = captureAndDetect;
  }, [captureAndDetect]);

  const stopStream = useCallback(() => {
    clearTimer();
    sessionRef.current += 1;
    detachListenersRef.current?.();
    detachListenersRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }
    if (activeVideoRef.current) {
      activeVideoRef.current.srcObject = null;
      activeVideoRef.current.src = '';
      activeVideoRef.current = null;
    }
    setIsStreaming(false);
    isProcessingRef.current = false;
  }, [clearTimer]);

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

      useNavigationStore.getState().enterResult({
        type: 'stream',
        data: {
          imageSize: { width: 640, height: 480 },
          stream,
          videoUrl: null,
          onVideoReady: handleVideoReady,
          people: 0,
          avgConfidence: 0,
          inferenceTimeMs: 0,
          detections: [],
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

  const startVideoFileStream = useCallback(
    (file, objectUrl) => {
      stopStream();
      setStreamError(null);

      videoUrlRef.current = objectUrl;
      setIsStreaming(true);

      useNavigationStore.getState().enterResult({
        type: 'stream',
        data: {
          imageSize: { width: 640, height: 480 },
          stream: null,
          videoUrl: objectUrl,
          filename: file.name,
          onVideoReady: handleVideoReady,
          people: 0,
          avgConfidence: 0,
          inferenceTimeMs: 0,
          detections: [],
        },
      });
    },
    [stopStream, handleVideoReady]
  );

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    isStreaming,
    streamError,
    startWebcamStream,
    startVideoFileStream,
    stopStream,
  };
}
