import { useState, useRef, useCallback, useEffect } from 'react';
import { useDetection } from './UseDetection';
import { useDetectionStore } from '../stores/DetectionStore';
import { useNavigationStore } from '../stores/NavigationStore';
import { normalizeDetection } from '../utils/detection';

export function useWebcamStream({ intervalMs = 800 } = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const timerRef = useRef(null);
  const isProcessingRef = useRef(false);

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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    isProcessingRef.current = false;
  }, []);

  const captureAndDetect = useCallback(async () => {
    if (!videoRef.current || isProcessingRef.current) return;
    const video = videoRef.current;
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
          videoRef,
          people: result.people,
          avgConfidence: result.avgConfidence,
          inferenceTimeMs: result.inferenceTimeMs,
          detections: result.detections,
        },
      });
    } catch (err) {
      console.error('Stream frame detection error:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [mutateAsync]);

  const startStream = useCallback(async () => {
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
          videoRef,
          people: 0,
          avgConfidence: 0,
          inferenceTimeMs: 0,
          detections: [],
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      timerRef.current = setInterval(captureAndDetect, intervalMs);
    } catch (err) {
      const msg = err?.message || 'CAMERA ACCESS DENIED OR NOT AVAILABLE';
      setStreamError(msg);
      useDetectionStore.getState().setStatus('error', msg);
      useNavigationStore.getState().popUp();
      stopStream();
    }
  }, [stopStream, captureAndDetect, intervalMs]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    videoRef,
    isStreaming,
    streamError,
    startStream,
    stopStream,
  };
}
