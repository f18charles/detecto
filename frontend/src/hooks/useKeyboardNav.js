import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MODES, useNavigationStore } from '../stores/NavigationStore';
import { usePowerStore } from '../stores/PowerStore';
import { useDetection } from './UseDetection';
import { useFileUpload } from './useFileUpload';
import { SAMPLE_IMAGES } from '../data/mockData';
import { historyQueryKey } from './UseHistory';

const UPLOAD_INDEX = SAMPLE_IMAGES.length;

export function useKeyboardNav() {
  const queryClient = useQueryClient();
  const { openFilePicker } = useFileUpload({ accept: 'image/*' });
  const { mutate } = useDetection();

  const historyData = queryClient.getQueryData(historyQueryKey);

  function getListLength(page) {
    if (page === 0) return SAMPLE_IMAGES.length + 1;
    if (page === 1) return Array.isArray(historyData) ? historyData.length : 0;
    return 0;
  }

  useEffect(() => {
    function startUpload() {
      useNavigationStore.getState().enterResult({ type: 'upload', data: null });

      openFilePicker({
        onFile: (file, objectUrl) => {
          useNavigationStore.getState().updateResult({
            type: 'upload',
            data: {
              imageUrl: objectUrl,
              filename: file.name,
              people: null,
              avgConfidence: null,
              inferenceTimeMs: null,
              detections: null,
            },
          });

          const formData = new FormData();
          formData.append('image', file);

          mutate(formData, {
            onSuccess: (data) => {
              useNavigationStore.getState().updateResult({
                type: 'upload',
                data: {
                  imageUrl: objectUrl,
                  filename: file.name,
                  people: data.count,
                  avgConfidence: data.avg_confidence,
                  inferenceTimeMs: data.inference_time_ms,
                  detections: data.detections ?? [],
                },
              });
            },
            onError: () => {
              useNavigationStore.getState().popUp();
            },
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
        if (selectedItem === UPLOAD_INDEX) {
          startUpload();
        } else {
          store.enterResult({ type: 'sample', data: SAMPLE_IMAGES[selectedItem] });
        }
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

      // Block all nav when powered off, booting, or shutting down
      if (!power.isPowerOn || power.isBooting || power.isShuttingDown) return;

      const isUp = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
      const isDown = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      const isConfirm = e.key === 'Enter' || e.key === ' ';
      const isBack = e.key === 'Escape' || e.key === 'Backspace';
      if (!isUp && !isDown && !isConfirm && !isBack) return;

      e.preventDefault();
      const store = useNavigationStore.getState();
      const { mode, page, currPage, selectedItem } = store;

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
  }, [openFilePicker, mutate]);
}
