import { useEffect } from 'react';
import { MODES, useNavigationStore } from '../stores/NavigationStore';
import { useDetection } from './UseDetection';
import { useFileUpload } from './useFileUpload';
import { SAMPLE_IMAGES, MOCK_HISTORY_ROWS } from '../data/mockData';

const UPLOAD_INDEX = SAMPLE_IMAGES.length; // the "+ upload your own image..." row

function getListLength(page) {
  return page === 0 ? SAMPLE_IMAGES.length + 1 : MOCK_HISTORY_ROWS.length;
}

// The one keydown listener for the whole console. NavigationStore stays
// agnostic to what's actually in a list (see its own notes) — this is the
// layer that resolves "selectedItem 2 on the Detect page" into an actual
// sample/upload/history item, since it's the thing that has both the
// store and the mock data in scope.
//
// Reads store state via getState() rather than the reactive hook — this
// component renders nothing, it just holds a listener, so subscribing
// reactively would tear down and rebuild that listener on every
// navigation keystroke for no reason.
export function useKeyboardNav() {
  const { openFilePicker } = useFileUpload({ accept: 'image/*' });
  const { mutate } = useDetection();

  useEffect(() => {
    function startUpload() {
      useNavigationStore.getState().enterResult({ type: 'upload', data: null });

      openFilePicker({
        onFile: (file, objectUrl) => {
          // Show the real photo immediately — boxes/stats arrive once
          // /detect resolves. Staying in 'upload' type, not jumping to a
          // resolved shape yet, since detections is still absent.
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
              // Nothing meaningful left to show on the result screen —
              // back out to the list. ToastScreen already surfaces the
              // failure via detectionStore's status, so this doesn't
              // need its own error message.
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
      } else {
        store.enterResult({ type: 'history', data: MOCK_HISTORY_ROWS[selectedItem] });
      }
    }

    function handleKeyDown(e) {
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
        // Arrows/confirm intentionally do nothing here — only ESC works,
        // matching HELP_TEXT for RESULT mode.
        if (isBack) store.popUp();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFilePicker, mutate]);
}
