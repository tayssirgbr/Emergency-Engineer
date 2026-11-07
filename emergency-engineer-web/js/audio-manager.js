import { getSettings, updateSettings } from './player-data-store.js';

let context = null;
let musicOscillator = null;
let musicGain = null;
let activated = false;
let settings = getSettings();
let unavailable = false;
let errorReported = false;

function reportAudioError(error) {
  unavailable = true;
  stopMusic();
  if (!errorReported) {
    errorReported = true;
    console.warn('[audio-manager] Audio is unavailable; gameplay will continue without sound.', error);
  }
}

function getContext() {
  if (unavailable) return null;
  if (!context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      context = new AudioContextClass();
    } catch (error) {
      reportAudioError(error);
      return null;
    }
  }
  try {
    if (context.state === 'suspended') context.resume().catch(reportAudioError);
  } catch (error) {
    reportAudioError(error);
    return null;
  }
  return context;
}

function tone(frequency, duration = 0.09, type = 'sine', volume = 0.055) {
  if (!settings.soundEnabled || !activated) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    reportAudioError(error);
  }
}

function startMusic() {
  if (!settings.musicEnabled || !activated || musicOscillator) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    musicOscillator = ctx.createOscillator();
    musicGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    musicOscillator.type = 'triangle';
    musicOscillator.frequency.value = 110;
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    musicGain.gain.value = 0.012;
    musicOscillator.connect(filter).connect(musicGain).connect(ctx.destination);
    musicOscillator.start();
  } catch (error) {
    stopMusic();
    reportAudioError(error);
  }
}

function stopMusic() {
  const oscillator = musicOscillator;
  const gain = musicGain;
  musicOscillator = null;
  musicGain = null;
  if (!oscillator) return;
  try {
    oscillator.stop();
  } catch (error) {
    if (!errorReported) console.warn('[audio-manager] Could not stop ambient audio cleanly.', error);
  }
  try {
    oscillator.disconnect();
    gain?.disconnect();
  } catch (error) {
    reportAudioError(error);
  }
}

export function activateAudio() {
  activated = true;
  if (settings.musicEnabled) startMusic();
}
export function getAudioSettings() { return { ...settings }; }
export function setAudioSettings(patch) {
  settings = updateSettings(patch);
  if (settings.musicEnabled) startMusic(); else stopMusic();
  return { ...settings };
}
export const playUiSound = () => tone(620, 0.045, 'sine', 0.025);
export const playSelectSound = () => tone(470, 0.07, 'triangle', 0.04);
export const playSuccessSound = () => { tone(660, 0.12); setTimeout(() => tone(880, 0.14), 90); };
export const playErrorSound = () => { tone(210, 0.16, 'triangle', 0.05); };
export const playUnlockSound = () => { tone(520, 0.10); setTimeout(() => tone(780, 0.16), 100); };
export const playTransitionSound = () => tone(360, 0.12, 'sine', 0.03);

document.addEventListener('pointerdown', activateAudio, { once: true, passive: true });
document.addEventListener('keydown', activateAudio, { once: true });
document.addEventListener('click', (event) => {
  if (event.target?.closest?.('button, [role="button"], a')) playUiSound();
}, true);
