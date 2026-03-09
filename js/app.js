/**
 * Entry point — wires modules together, manages state.
 */

import { createTimer } from './timer.js';
import * as audio from './audio.js';
import * as ui from './ui.js';
import * as storage from './storage.js';
import { createAnimation } from './animations.js';

let timer = null;
let animation = null;
let wakeLock = null;
let sessionStartedAt = 0;

// --- Setup ---

ui.bindSlider('inhale', 'inhale-val');
ui.bindSlider('hold-in', 'hold-in-val');
ui.bindSlider('exhale', 'exhale-val');
ui.bindSlider('hold-out', 'hold-out-val');

// Load last-used settings
const last = storage.loadLastUsed();
if (last) ui.setSetupValues(last);

// Preset selector
const presetSelect = document.getElementById('preset-select');
const deletePresetBtn = document.getElementById('delete-preset-btn');

function refreshPresetOptions() {
  presetSelect.querySelectorAll('option[data-user]').forEach(o => o.remove());
  const userPresets = storage.getUserPresets();
  for (const name of Object.keys(userPresets)) {
    const opt = document.createElement('option');
    opt.value = `user:${name}`;
    opt.textContent = name;
    opt.dataset.user = '1';
    presetSelect.appendChild(opt);
  }
}

refreshPresetOptions();

presetSelect.addEventListener('change', () => {
  const val = presetSelect.value;
  deletePresetBtn.hidden = !val.startsWith('user:');

  if (val === 'custom') return;

  let settings;
  if (val.startsWith('user:')) {
    const name = val.slice(5);
    settings = storage.getUserPresets()[name];
  } else {
    settings = storage.getBuiltinPreset(val);
  }
  if (settings) ui.setSetupValues(settings);
});

document.getElementById('save-preset-btn').addEventListener('click', () => {
  const name = prompt('Preset name:');
  if (!name || !name.trim()) return;
  const vals = ui.getSetupValues();
  storage.saveUserPreset(name.trim(), {
    inhale: vals.inhale,
    holdIn: vals.holdIn,
    exhale: vals.exhale,
    holdOut: vals.holdOut,
    totalSeconds: vals.totalSeconds,
  });
  refreshPresetOptions();
  presetSelect.value = `user:${name.trim()}`;
  deletePresetBtn.hidden = false;
});

deletePresetBtn.addEventListener('click', () => {
  const val = presetSelect.value;
  if (!val.startsWith('user:')) return;
  const name = val.slice(5);
  storage.deleteUserPreset(name);
  presetSelect.value = 'custom';
  deletePresetBtn.hidden = true;
  refreshPresetOptions();
});

document.querySelectorAll('#setup input[type="range"]').forEach(slider => {
  slider.addEventListener('input', () => {
    presetSelect.value = 'custom';
    deletePresetBtn.hidden = true;
  });
});

// --- Begin Session ---

document.getElementById('begin-btn').addEventListener('click', () => {
  const vals = ui.getSetupValues();

  // Save settings
  storage.saveLastUsed(vals);

  // Init audio on user gesture (iOS requirement)
  audio.init();
  audio.setProfile(vals.soundStyle);

  // Set up mantras
  ui.setMantras(vals.mantras, vals.mantraMode);

  // Set up animation
  if (animation) animation.destroy();
  animation = createAnimation(vals.animStyle);
  ui.resetCircle();
  animation.start();

  // Request wake lock
  requestWakeLock();

  // Create timer
  sessionStartedAt = performance.now();

  timer = createTimer(
    {
      inhale: vals.inhale,
      holdIn: vals.holdIn,
      exhale: vals.exhale,
      holdOut: vals.holdOut,
      totalSeconds: vals.totalSeconds,
    },
    {
      onPhaseChange(phase, label, duration) {
        ui.setPhaseLabel(label);
        animation.animatePhase(phase, duration);
        audio.playForPhase(phase);
      },
      onTick(remainingMs) {
        ui.updateTimerDisplay(remainingMs);
      },
      onCycleComplete() {
        ui.advanceMantra();
      },
      onComplete() {
        completeSession();
      },
    }
  );

  ui.setPauseButton(false);
  ui.showView('session');
  timer.start();
});

// --- Session Controls ---

document.getElementById('pause-btn').addEventListener('click', () => {
  if (!timer) return;
  if (timer.isPaused()) {
    timer.resume();
    ui.setPauseButton(false);
  } else {
    timer.pause();
    ui.setPauseButton(true);
  }
});

document.getElementById('end-btn').addEventListener('click', () => {
  if (timer) {
    timer.stop();
    completeSession();
  }
});

function completeSession() {
  const elapsed = (performance.now() - sessionStartedAt) / 1000;
  const cycles = timer ? timer.getCycleCount() : 0;
  audio.chimeComplete();
  ui.showSummary(elapsed, cycles);
  if (animation) { animation.destroy(); animation = null; }
  ui.resetCircle();
  ui.showView('complete');
  releaseWakeLock();
  timer = null;
}

// --- Complete Controls ---

document.getElementById('restart-btn').addEventListener('click', () => {
  document.getElementById('begin-btn').click();
});

document.getElementById('adjust-btn').addEventListener('click', () => {
  ui.showView('setup');
});

// --- Wake Lock ---

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch (e) { /* not critical */ }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && timer && timer.isRunning()) {
    requestWakeLock();
  }
});
