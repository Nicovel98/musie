import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 1. Importamos la función de registro del plugin de PWA
import { registerSW } from 'virtual:pwa-register';

// 2. Registramos el Service Worker para que la app funcione Offline y sea instalable
// Esto es vital para que aparezca el botón "Instalar App" en Chrome/Safari
registerSW({
  immediate: true,
  onNeedRefresh() {
    // Opcional: Aquí podrías mostrar un aviso de "Nueva versión disponible"
    console.log('Nueva versión de Musie disponible');
  },
  onOfflineReady() {
    console.log('Musie está lista para usarse sin internet');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
