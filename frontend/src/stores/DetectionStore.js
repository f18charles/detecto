import {create} from 'zustand'

export const useDetectionStore = create((set) => ({
    currentResult: null,
    status: 'idle', // 'idle' | 'analyzing' | 'done' | 'error'
    errorMessage: null,

    setResult: (result) => set({currentResult: result, status: "done", errorMessage: null}),
    setStatus: (status, errorMessage = null) => set({status, errorMessage}),
    clearResult: () => set({currentResult: null, status: 'idle', errorMessage: null})
}))