// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

// Altezza realmente visibile (esclude la barra del browser su iPhone/Android): evita che
// le barre in basso (Salva, menu) finiscano sotto la toolbar del browser.
const setVisibleHeight = () => {
  const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  document.documentElement.style.setProperty('--app-h', `${Math.round(h)}px`);
};
setVisibleHeight();
window.addEventListener('resize', setVisibleHeight);
if (window.visualViewport) window.visualViewport.addEventListener('resize', setVisibleHeight);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
