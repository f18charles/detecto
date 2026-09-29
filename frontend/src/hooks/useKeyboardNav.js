import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MODES, useNavigationStore } from '../stores/NavigationStore';
import { usePowerStore } from '../stores/PowerStore';
import { useDetectionStore } from '../stores/DetectionStore';
import { useDetection } from './UseDetection';
import { useFileUpload } from './useFileUpload';
import { historyQueryKey } from './UseHistory';
import { getImageSize } from '../utils/image';
import { normalizeDetection } from '../utils/detection';
import { useResetHistory } from './UseResetHistory';

// Detect page has a single entry: upload an image.
const DETECT_LIST_LENGTH = 1;

export function useKeyboardNav() {
  const queryClient = useQueryClient();
  const { openFilePicker } = useFileUpload({ accept: 'image/*' });
  const { mutate } = useDetection();
  
  const { mutate: resetHistory } = useResetHistory();

  useEffect(() => {
    function getListLength(page) {
      if (page === 0) return DETECT_LIST_LENGTH;
      if (page === 1) {
        const rows = queryClient.getQueryData(historyQueryKey);
        return Array.isArray(rows) ? rows.length : 0;
      }
      return 0;
    }

    function failDetection() {
      useDetectionStore.getState().setStatus('error');
      useNavigationStore.getState().popUp();
    }

    function startUpload() {
      useNavigationStore.getState().enterResult({ type: 'upload', data: null });

      openFilePicker({
        onFile: async (file, objectUrl) => {
          let imageSize;
          try {
            imageSize = await getImageSize(objectUrl);
          } catch {
            failDetection();
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
            onError: failDetection,
          });
        },
        onCancel: () => {
          useNavigationStore.getState().popUp();
        },
      });
    }

    function handleListConfirm(page, selectedItem) {
      const store = useNavigationStore.getState();
      if (page === 0) {
        startUpload();
      } else if (page === 1) {
        const historyRows = queryClient.getQueryData(historyQueryKey);
        if (Array.isArray(historyRows) && historyRows[selectedItem]) {
          store.enterResult({ type: 'history', data: historyRows[selectedItem] });
        }
      }
    }

    function handleKeyDown(e) {
      const power = usePowerStore.getState();

      // Power-off dialog shortcuts
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
        return; // Stop further navigation checks since we handled this input
      }

      // Block all nav when powered off, booting, or shutting down
      if (!power.isPowerOn || power.isBooting || power.isShuttingDown) return;

      const isUp = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
      const isDown = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      const isConfirm = e.key === 'Enter' || e.key === ' ';
      const isBack = e.key === 'Escape' || e.key === 'Backspace';
      if (!isUp && !isDown && !isConfirm && !isBack) return;

      e.preventDefault();
      const store = useNavigationStore.getState();
      const { mode, currPage, selectedItem } = store;

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
        if (isBack) store.popUp();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    
  }, [openFilePicker, mutate, queryClient, resetHistory]);
}
