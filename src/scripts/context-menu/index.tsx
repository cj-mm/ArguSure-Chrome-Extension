import '@/styles/index.css'
import { createRoot } from 'react-dom/client'
import WindowPopup from './WindowPopup'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { persistor, store } from '../../redux/store.js'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

const container = document.getElementById('window-popup-root')
const root = createRoot(container!)

root.render(
    <PersistGate persistor={persistor}>
        <Provider store={store}>
            <BrowserRouter>
                <WindowPopup />
            </BrowserRouter>
        </Provider>
    </PersistGate>
)
