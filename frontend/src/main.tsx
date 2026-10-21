import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 1. Importamos la función de registro del plugin de PWA
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateSW();
  },
  onOfflineReady() {},
});

void navigator.storage?.persist?.().catch((error: unknown) => {
  if (import.meta.env.DEV) {
    console.debug('[storage] persistent storage request failed', error);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
