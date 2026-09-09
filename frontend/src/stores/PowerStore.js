import { create } from 'zustand';

export const usePowerStore = create((set, get) => ({
  isPowerOn: true,
  isBooting: false,
  isShuttingDown: false,
  showPowerOffDialog: false,

  turnPowerOn: () => {
    set({
      isPowerOn: true,
      isBooting: true,
      isShuttingDown: false,
      showPowerOffDialog: false,
    });
    setTimeout(() => {
      set({ isBooting: false });
    }, 1200);
  },

  requestPowerOff: () => {
    const { isPowerOn, isBooting, isShuttingDown } = get();
    if (!isPowerOn || isBooting || isShuttingDown) return;
    set({ showPowerOffDialog: true });
  },

  startShutdown: () => {
    set({ showPowerOffDialog: false, isShuttingDown: true });
    setTimeout(() => {
      set({ isPowerOn: false, isShuttingDown: false });
    }, 800);
  },

  cancelPowerOff: () => {
    set({ showPowerOffDialog: false });
  },
}));
