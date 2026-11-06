// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

// Altezza realmente visibile (esclude la barra del browser su iPhone/Android): evita che
// le barre in basso (Salva, menu) finiscano sotto la toolbar del browser.
const setVisibleHeight = () => {
  const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  const top = (window.visualViewport && window.visualViewport.offsetTop) || 0;
  document.documentElement.style.setProperty('--app-h', `${Math.round(h)}px`);
  document.documentElement.style.setProperty('--app-top', `${Math.round(top)}px`);
};
setVisibleHeight();
window.addEventListener('resize', setVisibleHeight);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setVisibleHeight);
  window.visualViewport.addEventListener('scroll', setVisibleHeight);
}
// Blocca anche lo zoom a pizzico su iOS (ignora user-scalable=no).
['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault()));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
