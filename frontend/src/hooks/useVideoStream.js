import { useState, useRef, useCallback, useEffect } from 'react';
import { useDetection } from './UseDetection';
import { useDetectionStore } from '../stores/DetectionStore';
import { useNavigationStore } from '../stores/NavigationStore';
import { normalizeDetection } from '../utils/detection';

export function useVideoStream({ intervalMs = 800 } = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);
  const activeVideoRef = useRef(null);
  const isProcessingRef = useRef(false);
  const videoUrlRef = useRef(null);

  const { mutateAsync } = useDetection();

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
  }, []);

  const captureAndDetect = useCallback(async () => {
    const video = activeVideoRef.current;
    if (!video || isProcessingRef.current) return;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    isProcessingRef.current = true;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );

      if (!blob) return;
      const file = new File([blob], 'stream_frame.jpg', { type: 'image/jpeg' });
      const imageSize = { width: video.videoWidth, height: video.videoHeight };

      const data = await mutateAsync(file);
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
    }
  }, [mutateAsync]);

  const handleVideoReady = useCallback(
    (videoElement) => {
      if (!videoElement) return;
      activeVideoRef.current = videoElement;

      if (!timerRef.current) {
        // Immediate first capture, then interval loop
        captureAndDetect();
        timerRef.current = setInterval(captureAndDetect, intervalMs);
      }
    },
    [captureAndDetect, intervalMs]
  );

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
