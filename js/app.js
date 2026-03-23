/**
 * Entry point — wires modules together, manages state.
 */

import { createTimer } from './timer.js';
import * as audio from './audio.js';
import * as ui from './ui.js';
import * as storage from './storage.js';
import { createAnimation } from './animations.js';
import { getExercises, setMantraText } from './exercises.js';

let timer = null;
let animation = null;
let wakeLock = null;
let sessionStartedAt = 0;
let activeExerciseText = '';

// Preview state
let previewTimeouts = [];
let previewRunning = false;
let previewAnimation = null;

// ─── Init ────────────────────────────────────────────────────────────────────
// One-time gesture to unlock audio for Safari iOS
window.addEventListener('click', () => {
  audio.unlock();
}, { once: true });

// Bind sliders
ui.bindSlider('inhale', 'inhale-val');
ui.bindSlider('hold-in', 'hold-in-val');
ui.bindSlider('exhale', 'exhale-val');
ui.bindSlider('hold-out', 'hold-out-val');

// Restore last-used settings
const last = storage.loadLastUsed();
if (last) ui.setSetupValues(last);

// Restore options
const opts = storage.loadOptions();
ui.setSetupValues(opts);

// Bind the new segmented visualizer controls
ui.bindVisualizerSettings();

// ─── Bar Style ───────────────────────────────────────────────────────────────

const BAR_STYLE_CLASSES = ['bar-aurora', 'bar-gradient', 'bar-phase', 'bar-pulse_classic'];

function applyBarStyle(style) {
  const fills = [
    document.getElementById('preview-bar-fill'),
    document.getElementById('breathing-bar-fill'),
  ];
  for (const fill of fills) {
    if (!fill) continue;
    fill.classList.remove(...BAR_STYLE_CLASSES);
    if (style && style !== 'classic') {
      const cls = style === 'pulse' ? 'bar-pulse' : `bar-${style}`;
      // Only add class if it's one of the classic CSS-only styles
      if (BAR_STYLE_CLASSES.includes(cls)) {
        fill.classList.add(cls);
      }
    }
  }
  // If we are in the middle of a preview, restart it to reflect the new visualizer
  if (previewRunning) restartPreviewBar();
}

// Apply bar style on load (default: aurora)
applyBarStyle(opts.barStyle || 'aurora');

document.getElementById('bar-style').addEventListener('change', (e) => {
  applyBarStyle(e.target.value);
  storage.saveOptions({
    soundStyle: document.getElementById('sound-style').value,
    barStyle: e.target.value,
  });
});

// Update rate summary on any slider/duration change
document.querySelectorAll('#tab-rate input[type="range"]').forEach(slider => {
  slider.addEventListener('input', () => {
    ui.updateRateSummary();
    restartPreviewBar();
  });
});
document.getElementById('duration').addEventListener('change', () => ui.updateRateSummary());

// Initial summary
ui.updateRateSummary();

// ─── Preview Breathing Bar (Exercises Tab) ───────────────────────────────────

function getPreviewPhases() {
  const inhale = parseFloat(document.getElementById('inhale').value);
  const holdIn = parseFloat(document.getElementById('hold-in').value);
  const exhale = parseFloat(document.getElementById('exhale').value);
  const holdOut = parseFloat(document.getElementById('hold-out').value);
  // Build phase sequence, skip 0-duration phases
  const phases = [];
  if (inhale > 0) phases.push({ type: 'inhale', duration: inhale });
  if (holdIn > 0) phases.push({ type: 'holdIn', duration: holdIn });
  if (exhale > 0) phases.push({ type: 'exhale', duration: exhale });
  if (holdOut > 0) phases.push({ type: 'holdOut', duration: holdOut });
  return phases;
}

function animatePreviewBar(phases) {
  if (!previewRunning || phases.length === 0) return;
  const fill = document.getElementById('preview-bar-fill');
  if (!fill) return;

  if (!previewAnimation) previewAnimation = createAnimation();

  let delay = 0;

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const tid = setTimeout(() => {
      if (!previewRunning) return;
      const dur = phase.duration;
      // Play sound for this phase
      audio.init();
      audio.setProfile(document.getElementById('sound-style').value);
      audio.playForPhase(phase.type);
      // Set phase data attribute for phase-color style
      fill.dataset.phase = phase.type;
      
      previewAnimation.animatePhase(phase.type, dur * 1000);
    }, delay * 1000);
    previewTimeouts.push(tid);
    delay += phase.duration;
  }

  // Loop: schedule next cycle after all phases complete
  const loopTid = setTimeout(() => {
    if (previewRunning) animatePreviewBar(phases);
  }, delay * 1000);
  previewTimeouts.push(loopTid);
}

function startPreviewBar() {
  stopPreviewBar();
  previewRunning = true;
  
  if (!previewAnimation) previewAnimation = createAnimation();
  previewAnimation.start();

  const phases = getPreviewPhases();
  // Small delay to let the reset apply before starting animation
  const tid = setTimeout(() => animatePreviewBar(phases), 50);
  previewTimeouts.push(tid);
}

function stopPreviewBar() {
  previewRunning = false;
  previewTimeouts.forEach(tid => clearTimeout(tid));
  previewTimeouts = [];
  if (previewAnimation) previewAnimation.reset();
}

function restartPreviewBar() {
  startPreviewBar();
}

// Start preview on load
startPreviewBar();

// ─── Tab Navigation ──────────────────────────────────────────────────────────

document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    ui.showTab(tabId);
  });
});

document.querySelectorAll('.toggle-header').forEach(header => {
  header.addEventListener('click', () => {
    const tabId = header.dataset.toggle;
    ui.toggleTab(tabId);
  });
});


// ─── Exercises ───────────────────────────────────────────────────────────────

function renderExerciseList() {
  const exercises = getExercises();
  ui.renderExercises(exercises, {
    onStart(exerciseId, focusText) {
      activeExerciseText = focusText || '';
      startSession(activeExerciseText);
    },
    onMantraChange(text) {
      setMantraText(text);
    },
  });
}

renderExerciseList();

// ─── Presets ─────────────────────────────────────────────────────────────────

const BUILTIN_PRESETS = [
  { id: 'box', name: 'Box Breathing', pattern: '4/4/4/4' },
  { id: 'relaxing', name: 'Relaxing', pattern: '4/7/8/0' },
  { id: 'simple', name: 'Simple', pattern: '4/0/6/0' },
  { id: 'beginner', name: 'Beginner', pattern: '5/0/7/0' },
  { id: 'intermediate', name: 'Intermediate', pattern: '7/0/9/0' },
  { id: 'advanced', name: 'Advanced', pattern: '12/0/14/0' },
  { id: 'sleep', name: 'Before Sleep', pattern: '4/0/8/0' },
];

let activePresetId = null;

function renderPresets() {
  const grid = document.getElementById('preset-grid');
  grid.innerHTML = '';

  // Built-in presets
  for (const preset of BUILTIN_PRESETS) {
    const chip = document.createElement('button');
    chip.className = `preset-chip${activePresetId === preset.id ? ' active' : ''}`;
    chip.innerHTML = `
      <div class="preset-chip-name">${preset.name}</div>
      <div class="preset-chip-pattern">${preset.pattern}</div>
    `;
    chip.addEventListener('click', () => {
      const settings = storage.getBuiltinPreset(preset.id);
      if (settings) {
        ui.setSetupValues(settings);
        activePresetId = preset.id;
        renderPresets();
      }
    });
    grid.appendChild(chip);
  }

  // User presets
  const userPresets = storage.getUserPresets();
  for (const [name, settings] of Object.entries(userPresets)) {
    const chip = document.createElement('button');
    const key = `user:${name}`;
    chip.className = `preset-chip preset-chip-user${activePresetId === key ? ' active' : ''}`;
    const pattern = `${settings.inhale}/${settings.holdIn}/${settings.exhale}/${settings.holdOut}`;
    chip.innerHTML = `
      <div class="preset-chip-name">${name}</div>
      <div class="preset-chip-pattern">${pattern}</div>
      <button class="preset-delete" title="Delete preset">✕</button>
    `;

    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('preset-delete')) return;
      ui.setSetupValues(settings);
      activePresetId = key;
      renderPresets();
    });

    chip.querySelector('.preset-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      storage.deleteUserPreset(name);
      if (activePresetId === key) activePresetId = null;
      renderPresets();
    });

    grid.appendChild(chip);
  }
}

renderPresets();

// Clear active preset when sliders are manually adjusted
document.querySelectorAll('#tab-rate input[type="range"]').forEach(slider => {
  slider.addEventListener('input', () => {
    activePresetId = null;
    renderPresets();
  });
});

// Save preset
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
  activePresetId = `user:${name.trim()}`;
  renderPresets();
});

// ─── Options ─────────────────────────────────────────────────────────────────

document.getElementById('sound-style').addEventListener('change', () => {
  storage.saveOptions({
    soundStyle: document.getElementById('sound-style').value,
    barStyle: document.getElementById('bar-style').value,
  });
});

document.getElementById('reset-options-btn').addEventListener('click', () => {
  if (!confirm('Reset all settings to defaults?')) return;
  localStorage.clear();
  location.reload();
});

// ─── Begin Session ───────────────────────────────────────────────────────────

document.getElementById('begin-btn').addEventListener('click', () => {
  startSession('');
});

function startSession(focusText) {
  stopPreviewBar();
  const vals = ui.getSetupValues();

  // Save settings
  storage.saveLastUsed(vals);

  // Init audio
  audio.unlock();
  audio.setProfile(vals.soundStyle);

  // Set focus text
  ui.setFocusText(focusText);

  // Set up bar animation
  if (animation) animation.destroy();
  animation = createAnimation();
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
        // Update phase data attribute for phase-color bar style
        const sessionFill = document.getElementById('breathing-bar-fill');
        if (sessionFill) sessionFill.dataset.phase = phase;
      },
      onTick(remainingMs) {
        ui.updateTimerDisplay(remainingMs);
      },
      onCycleComplete() {},
      onComplete() {
        completeSession();
      },
    }
  );

  ui.setPauseButton(false);
  ui.showSession();
  // Delay start so the browser paints the bar at 0% before inhale begins
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      timer.start();
    });
  });
}

// ─── Session Controls ────────────────────────────────────────────────────────

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
  ui.hideSession();
  ui.showComplete();
  releaseWakeLock();
  timer = null;
}

// ─── Complete Controls ───────────────────────────────────────────────────────

document.getElementById('restart-btn').addEventListener('click', () => {
  ui.hideComplete();
  startSession(activeExerciseText);
});

document.getElementById('back-btn').addEventListener('click', () => {
  ui.hideComplete();
  restartPreviewBar();
});

// ─── Wake Lock ───────────────────────────────────────────────────────────────

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
