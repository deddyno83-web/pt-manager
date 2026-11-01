// scripts/demo.js — avvia l'app in modalità demo (senza Firebase), vedi src/core/demo.js
process.env.REACT_APP_DEMO = '1';
process.env.BROWSER = 'none';
process.env.PORT = process.env.PORT || '3100';
require('react-scripts/scripts/start');
