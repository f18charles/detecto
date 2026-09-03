import {create} from 'zustand'

export const useDetectionStore = create((set) => ({
    currentResult: null,
    status: 'idle', // 'idle' | 'analyzing' | 'done' | 'error'

    setResult: (result) => set({currentResult: result, status:"done"}),
    setStatus: (status) => set({status}),
    clearResult: () => set({currentResult: null, status: 'idle'})
}))