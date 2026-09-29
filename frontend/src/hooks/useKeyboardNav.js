import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MODES, useNavigationStore } from '../stores/NavigationStore';
import { usePowerStore } from '../stores/PowerStore';
import { useDetectionStore } from '../stores/DetectionStore';
import { useHistoryFilterStore } from '../stores/HistoryFilterStore';
import { useDetection } from './UseDetection';
import { useFileUpload } from './useFileUpload';
import { useVideoStream } from './useVideoStream';
import { historyQueryKey, getCachedHistory } from './UseHistory';
import { getImageSize } from '../utils/image';
import { normalizeDetection } from '../utils/detection';
import { useResetHistory } from './UseResetHistory';

const DETECT_LIST_LENGTH = 3;

export function useKeyboardNav() {
  const queryClient = useQueryClient();
  const { openFilePicker: openImagePicker } = useFileUpload({ accept: 'image/jpeg,image/png,.jpg,.jpeg,.png' });
  const { openFilePicker: openVideoPicker } = useFileUpload({ accept: 'video/*' });
  const { mutate } = useDetection();
  const { startWebcamStream, startVideoFileStream, stopStream, isStreaming } = useVideoStream();
  
  const { mutate: resetHistory } = useResetHistory();

  useEffect(() => {
    function getFilteredHistoryRows() {
      const queryRows = queryClient.getQueryData(historyQueryKey);
      const rawRows = Array.isArray(queryRows) ? queryRows : getCachedHistory();
      return useHistoryFilterStore.getState().filterRows(rawRows);
    }

    function getListLength(page) {
      if (page === 0) return DETECT_LIST_LENGTH;
      if (page === 1) {
        return getFilteredHistoryRows().length;
      }
      return 0;
    }

    function failDetection(err) {
      let message = 'UNSPECIFIED ERROR';
      if (typeof err === 'string') {
        message = err;
      } else if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        message = typeof detail === 'string' ? detail : JSON.stringify(detail);
      } else if (err?.message) {
        message = err.message;
      }
      useDetectionStore.getState().setStatus('error', message);
      useNavigationStore.getState().popUp();
    }

    function startUploadImage() {
      useNavigationStore.getState().enterResult({ type: 'upload', data: null });

      openImagePicker({
        onFile: async (file, objectUrl) => {
          const isImage = file.type
            ? ['image/jpeg', 'image/png'].includes(file.type)
            : /\.(jpe?g|png)$/i.test(file.name);
          if (!isImage) {
            failDetection('INVALID FILE FORMAT · PLEASE UPLOAD AN IMAGE (JPG/PNG)');
            return;
          }

          let imageSize;
          try {
            imageSize = await getImageSize(objectUrl);
          } catch {
            failDetection('CORRUPTED OR UNREADABLE IMAGE FILE');
            return;
          }

          const detection = useDetectionStore.getState();
          detection.clearResult();
          detection.setStatus('analyzing');

          useNavigationStore.getState().updateResult({
            type: 'upload',
            data: {
              imageUrl: objectUrl,
              imageSize,
              filename: file.name,
              people: null,
              avgConfidence: null,
              inferenceTimeMs: null,
              detections: null,
            },
          });

          mutate(file, {
            onSuccess: (data) => {
              const result = normalizeDetection(data, imageSize);
              useDetectionStore.getState().setResult(result);
              useNavigationStore.getState().updateResult({
                type: 'upload',
                data: { imageUrl: objectUrl, imageSize, filename: file.name, ...result },
              });
            },
            onError: (err) => failDetection(err),
          });
        },
        onCancel: () => {
          useNavigationStore.getState().popUp();
        },
      });
    }

    function startUploadVideo() {
      openVideoPicker({
        onFile: (file, objectUrl) => {
          const isVideo = file.type ? file.type.startsWith('video/') : /\.(mp4|webm|mov|m4v|avi)$/i.test(file.name);
          if (!isVideo) {
            failDetection('INVALID FILE FORMAT · PLEASE UPLOAD A VIDEO (MP4/WEBM/MOV)');
            return;
          }
          startVideoFileStream(file, objectUrl);
        },
        onCancel: () => {
          useNavigationStore.getState().popUp();
        },
      });
    }

    function handleListConfirm(page, selectedItem) {
      const store = useNavigationStore.getState();
      if (page === 0) {
        if (selectedItem === 0) {
          startUploadImage();
        } else if (selectedItem === 1) {
          startUploadVideo();
        } else if (selectedItem === 2) {
          startWebcamStream();
        }
      } else if (page === 1) {
        const filteredRows = getFilteredHistoryRows();
        if (filteredRows[selectedItem]) {
          store.enterResult({ type: 'history', data: filteredRows[selectedItem] });
        }
      }
    }

    function handleKeyDown(e) {
      const power = usePowerStore.getState();

      if (power.showPowerOffDialog) {
        if (e.key === 'Enter' || e.key.toLowerCase() === 'y') {
          e.preventDefault();
          power.startShutdown();
        } else if (e.key === 'Escape' || e.key.toLowerCase() === 'n') {
          e.preventDefault();
          power.cancelPowerOff();
        }
        return;
      }

      if (e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetHistory();
        return;
      }

      if (!power.isPowerOn || power.isBooting || power.isShuttingDown) return;

      const store = useNavigationStore.getState();
      const { mode, currPage, selectedItem } = store;

      // Filter controls in History mode (page === 1)
      if (mode === MODES.LIST && currPage === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        const filterStore = useHistoryFilterStore.getState();

        if (key === 'c') {
          e.preventDefault();
          filterStore.cycleConfidence();
          return;
        } else if (key === 'd') {
          e.preventDefault();
          filterStore.cycleDate();
          return;
        } else if (key === 't') {
          e.preventDefault();
          filterStore.cycleTime();
          return;
        } else if (key === 'x') {
          e.preventDefault();
          filterStore.resetAllFilters();
          return;
        }
      }

      const isUp = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
      const isDown = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      const isConfirm = e.key === 'Enter' || e.key === ' ';
      const isBack = e.key === 'Escape' || e.key === 'Backspace';
      if (!isUp && !isDown && !isConfirm && !isBack) return;

      e.preventDefault();

      if (mode === MODES.NAV) {
        if (isUp) store.movePage(-1);
        else if (isDown) store.movePage(1);
        else if (isConfirm) store.enterList();
        return;
      }

      if (mode === MODES.LIST) {
        if (isUp) store.moveInList(-1, getListLength(currPage));
        else if (isDown) store.moveInList(1, getListLength(currPage));
        else if (isConfirm) handleListConfirm(currPage, selectedItem);
        else if (isBack) store.popUp();
        return;
      }

      if (mode === MODES.RESULT) {
        if (isBack) {
          if (isStreaming) stopStream();
          store.popUp();
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    
  }, [openImagePicker, openVideoPicker, mutate, queryClient, resetHistory, startWebcamStream, startVideoFileStream, stopStream, isStreaming]);
}
