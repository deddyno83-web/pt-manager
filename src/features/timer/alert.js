// src/features/timer/alert.js
// Suono e vibrazione a fine recupero. L'AudioContext va "sbloccato" con un tocco dell'utente
// (lo facciamo quando parte il timer), altrimenti i browser mobile lo bloccano.
let ctx = null;

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* audio non disponibile */ }
}

function beep(at, freq = 880, dur = 0.18) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.5, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

export function alertRestOver({ sound, vibrate }) {
  if (sound && ctx) {
    const t = ctx.currentTime;
    beep(t, 880);
    beep(t + 0.28, 880);
    beep(t + 0.56, 1175, 0.35);
  }
  if (vibrate && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
}
