import {create} from 'zustand'

export const MODES = {
    NAV: 'nav',
    LIST: 'list',
    RESULT: 'result'
}

export const useNavigationStore = create((set, get) => ({
    mode: MODES.NAV,
    page: 0, // 0 - Detect, 1 - History, 2 - Stats
    currPage: 0, // 0 - Detect, 1 - History, 2 - Stats
    selectedItem: 0,
    results: null, // {type: 'upload' | 'history', data: {...}}

    // NAV Mode
    movePage: (init) => {
        const {mode, page} = get()
        if (mode !== MODES.NAV) return
        const next = page + init
        if (next < 0 || next > 2) return
        set({page: next, currPage: next, selectedItem: 0})
    },

    // LIST Mode
    moveInList: (init, listLength) => {
        const {mode, selectedItem} = get()
        if (mode !== MODES.LIST) return
        const next = selectedItem + init
        if (next < 0 || next >= listLength) return
        set({selectedItem: next})
    },

    // Enter lists
    enterList: () => {
        if (get().mode !== MODES.NAV) return
        set({ mode: MODES.LIST, selectedItem: 0 })
    },

    // Enter results shows the results of the detections and the history
    enterResult: (results) => {
        if (get().mode !== MODES.LIST) return
        set({ mode: MODES.RESULT, results })
    },

    // Update result data in-place (e.g. when upload detection resolves)
    updateResult: (results) => {
        if (get().mode !== MODES.RESULT) return
        set({ results })
    },

    // Select Page directly via Nav buttons
    selectPage: (targetPage) => {
        if (targetPage < 0 || targetPage > 2) return;
        set({ mode: MODES.NAV, page: targetPage, currPage: targetPage, selectedItem: 0, results: null });
    },

    popUp: () => {
        const {mode} = get()
        if (mode === MODES.RESULT) {
            set({mode: MODES.LIST, results: null})
        } else if (mode === MODES.LIST) {
            set({mode:MODES.NAV, selectedItem: 0})
        }
    },
}))