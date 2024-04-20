import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface CounterargState {
    saveToModal: boolean
    selectedCounterarg: any
    savedCounterargs: any
    unsaveModal: boolean
    unsaveDataBody: any
}

const initialState: CounterargState = {
    saveToModal: false,
    selectedCounterarg: null,
    savedCounterargs: [],
    unsaveModal: false,
    unsaveDataBody: {}
}

const counterargSlice = createSlice({
    name: 'counterarg',
    initialState,
    reducers: {
        showSaveToModal: state => {
            state.saveToModal = true
        },
        hideSaveToModal: state => {
            state.saveToModal = false
        },
        setSelectedCounterarg: (state, action: PayloadAction<any>) => {
            state.selectedCounterarg = action.payload
        },
        addToSavedCounterargs: (state, action: PayloadAction<any>) => {
            if (Array.isArray(state.savedCounterargs)) {
                if (!state.savedCounterargs.includes(action.payload)) {
                    state.savedCounterargs.push(action.payload)
                }
            } else {
                state.savedCounterargs = [action.payload]
            }
        },
        removeFromSavedCounterargs: (state, action: PayloadAction<any>) => {
            if (Array.isArray(state.savedCounterargs)) {
                let index = state.savedCounterargs.indexOf(action.payload)
                if (index !== -1) {
                    state.savedCounterargs.splice(index, 1)
                }
            }
        },
        resetSavedCounterargs: state => {
            state.savedCounterargs = []
        },
        showUnsaveModal: state => {
            state.unsaveModal = true
        },
        hideUnsaveModal: state => {
            state.unsaveModal = false
        },
        setUnsaveDataBody: (state, action: PayloadAction<any>) => {
            state.unsaveDataBody = action.payload
        }
    }
})

export const {
    showSaveToModal,
    hideSaveToModal,
    setSelectedCounterarg,
    addToSavedCounterargs,
    removeFromSavedCounterargs,
    resetSavedCounterargs,
    showUnsaveModal,
    hideUnsaveModal,
    setUnsaveDataBody
} = counterargSlice.actions

export default counterargSlice.reducer
