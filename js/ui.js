/**
 * DOM manipulation, view switching, breathing circle animation, mantra display.
 */

const $ = (sel) => document.querySelector(sel);

// View switching
export function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(`#${viewId}`).classList.add('active');
}

// Breathing circle
const circle = () => $('#breathing-circle');
const phaseLabel = () => $('#phase-label');

export function animatePhase(phase, durationMs) {
  const el = circle();
  const dur = (durationMs / 1000).toFixed(2);

  // Set transition duration to match phase
  el.style.transitionDuration = `${dur}s`;

  if (phase === 'inhale') {
    el.classList.add('expanded');
  } else if (phase === 'exhale') {
    el.classList.remove('expanded');
  }
  // hold phases: keep current state, but make transition instant so it doesn't drift
  if (phase === 'holdIn' || phase === 'holdOut') {
    el.style.transitionDuration = '0s';
  }
}

export function setPhaseLabel(text) {
  phaseLabel().textContent = text;
}

export function resetCircle() {
  const el = circle();
  el.style.transitionDuration = '0s';
  el.classList.remove('expanded');
}

// Timer display
export function updateTimerDisplay(remainingMs) {
  const totalSec = Math.ceil(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  $('#session-timer').textContent = `${min}:${sec.toString().padStart(2, '0')}`;
}

// Mantra
let mantras = [];
let mantraMode = 'static';
let mantraIndex = 0;

export function setMantras(lines, mode) {
  mantras = lines.filter(l => l.trim());
  mantraMode = mode;
  mantraIndex = 0;
  renderMantra();
}

export function advanceMantra() {
  if (mantraMode !== 'cycle' || mantras.length <= 1) return;
  const el = $('#mantra-display');
  el.classList.add('fading');
  setTimeout(() => {
    mantraIndex = (mantraIndex + 1) % mantras.length;
    renderMantra();
    el.classList.remove('fading');
  }, 300);
}

function renderMantra() {
  const el = $('#mantra-display');
  if (mantras.length === 0) {
    el.textContent = '';
    return;
  }
  if (mantraMode === 'static') {
    el.textContent = mantras.join('\n');
  } else {
    el.textContent = mantras[mantraIndex] || '';
  }
}

// Summary
export function showSummary(durationSec, cycles) {
  const min = Math.floor(durationSec / 60);
  const sec = Math.round(durationSec % 60);
  $('#summary-duration').textContent = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
  $('#summary-cycles').textContent = cycles;
}

// Slider display values
export function bindSlider(id, displayId) {
  const slider = $(`#${id}`);
  const display = $(`#${displayId}`);
  slider.addEventListener('input', () => {
    display.textContent = slider.value;
  });
}

// Read setup form values
export function getSetupValues() {
  return {
    inhale: parseFloat($('#inhale').value),
    holdIn: parseFloat($('#hold-in').value),
    exhale: parseFloat($('#exhale').value),
    holdOut: parseFloat($('#hold-out').value),
    totalSeconds: parseInt($('#duration').value, 10),
    mantras: $('#mantra-input').value.split('\n'),
    mantraMode: document.querySelector('input[name="mantra-mode"]:checked').value,
    animStyle: $('#anim-style').value,
    soundStyle: $('#sound-style').value,
  };
}

export function setSetupValues(vals) {
  if (vals.inhale != null) { $('#inhale').value = vals.inhale; $('#inhale-val').textContent = vals.inhale; }
  if (vals.holdIn != null) { $('#hold-in').value = vals.holdIn; $('#hold-in-val').textContent = vals.holdIn; }
  if (vals.exhale != null) { $('#exhale').value = vals.exhale; $('#exhale-val').textContent = vals.exhale; }
  if (vals.holdOut != null) { $('#hold-out').value = vals.holdOut; $('#hold-out-val').textContent = vals.holdOut; }
  if (vals.totalSeconds != null) $('#duration').value = vals.totalSeconds;
  if (vals.mantras != null) $('#mantra-input').value = Array.isArray(vals.mantras) ? vals.mantras.join('\n') : vals.mantras;
  if (vals.mantraMode != null) {
    const radio = document.querySelector(`input[name="mantra-mode"][value="${vals.mantraMode}"]`);
    if (radio) radio.checked = true;
  }
  if (vals.animStyle != null) $('#anim-style').value = vals.animStyle;
  if (vals.soundStyle != null) $('#sound-style').value = vals.soundStyle;
}

// Pause button text
export function setPauseButton(isPaused) {
  $('#pause-btn').textContent = isPaused ? 'Resume' : 'Pause';
}
