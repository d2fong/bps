/**
 * DOM manipulation, view/tab switching, session UI.
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── Tab Navigation ──────────────────────────────────────────────────────────

export function showTab(tabId) {
  const tab = $(`#${tabId}`);
  const isAlreadyActive = tab && tab.classList.contains('active');

  if (isAlreadyActive) {
    // Toggle minimized if already active
    tab.classList.toggle('minimized');
    return;
  }

  $$('.tab-view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('minimized'); // New tabs start minimized? No, let's make them expanded when switching.
  });
  $$('.nav-tab').forEach(t => t.classList.remove('active'));

  if (tab) {
    tab.classList.add('active');
    tab.classList.remove('minimized');
  }

  const navBtn = $(`.nav-tab[data-tab="${tabId}"]`);
  if (navBtn) navBtn.classList.add('active');
}

export function toggleTab(tabId) {
  const tab = $(`#${tabId}`);
  if (tab) tab.classList.toggle('minimized');
}


// ─── Overlays ────────────────────────────────────────────────────────────────

export function showOverlay(id) {
  $(`#${id}`).classList.add('active');
  $('#bottom-nav').style.display = 'none';
}

export function hideOverlay(id) {
  $(`#${id}`).classList.remove('active');
  $('#bottom-nav').style.display = '';
}

export function showSession() {
  showOverlay('session');
}

export function hideSession() {
  hideOverlay('session');
}

export function showComplete() {
  showOverlay('complete');
}

export function hideComplete() {
  hideOverlay('complete');
}

// ─── Session Display ─────────────────────────────────────────────────────────

export function setPhaseLabel(text) {
  $('#phase-label').textContent = text;
}

export function setFocusText(text) {
  const el = $('#focus-text');
  el.textContent = text || '';
}

export function updateTimerDisplay(remainingMs) {
  const totalSec = Math.ceil(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  $('#session-timer').textContent = `${min}:${sec.toString().padStart(2, '0')}`;
}

export function setPauseButton(isPaused) {
  $('#pause-icon').style.display = isPaused ? 'none' : '';
  $('#play-icon').style.display = isPaused ? '' : 'none';
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function showSummary(durationSec, cycles) {
  const min = Math.floor(durationSec / 60);
  const sec = Math.round(durationSec % 60);
  $('#summary-duration').textContent = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
  $('#summary-cycles').textContent = cycles;
}

// ─── Visualizer Settings ─────────────────────────────────────────────────────

export function updateVisualizerUI() {
  const type = $('input[name="viz-type"]:checked').value;
  const barRow = $('#bar-styles-row');
  const immersiveRow = $('#immersive-styles-row');
  const barSelect = $('#bar-style-select');
  const immersiveSelect = $('#immersive-style-select');
  const hiddenInput = $('#bar-style');

  if (type === 'bar') {
    barRow.style.display = '';
    immersiveRow.style.display = 'none';
    hiddenInput.value = barSelect.value;
  } else {
    barRow.style.display = 'none';
    immersiveRow.style.display = '';
    hiddenInput.value = immersiveSelect.value;
  }
  
  // Dispatch event so app.js listeners catch the change
  hiddenInput.dispatchEvent(new Event('change'));
}

export function bindVisualizerSettings() {
  const typeRadios = $$('input[name="viz-type"]');
  const barSelect = $('#bar-style-select');
  const immersiveSelect = $('#immersive-style-select');

  typeRadios.forEach(r => r.addEventListener('change', updateVisualizerUI));
  barSelect.addEventListener('change', updateVisualizerUI);
  immersiveSelect.addEventListener('change', updateVisualizerUI);

  updateVisualizerUI();
}

// ─── Slider Display ──────────────────────────────────────────────────────────

export function bindSlider(id, displayId) {
  const slider = $(`#${id}`);
  const display = $(`#${displayId}`);
  slider.addEventListener('input', () => {
    display.textContent = slider.value;
  });
}

// ─── Rate Summary ────────────────────────────────────────────────────────────

export function updateRateSummary() {
  const inhale = $(`#inhale`).value;
  const holdIn = $(`#hold-in`).value;
  const exhale = $(`#exhale`).value;
  const holdOut = $(`#hold-out`).value;
  const dur = $(`#duration`);
  const durText = dur.options[dur.selectedIndex].text;
  $('#rate-summary').textContent = `${inhale}/${holdIn}/${exhale}/${holdOut} · ${durText}`;
}

// ─── Rate Form ───────────────────────────────────────────────────────────────

export function getSetupValues() {
  return {
    inhale: parseFloat($('#inhale').value),
    holdIn: parseFloat($('#hold-in').value),
    exhale: parseFloat($('#exhale').value),
    holdOut: parseFloat($('#hold-out').value),
    totalSeconds: parseInt($('#duration').value, 10),
    soundStyle: $('#sound-style').value,
    barStyle: $('#bar-style').value,
  };
}

export function setSetupValues(vals) {
  if (vals.inhale != null) { $('#inhale').value = vals.inhale; $('#inhale-val').textContent = vals.inhale; }
  if (vals.holdIn != null) { $('#hold-in').value = vals.holdIn; $('#hold-in-val').textContent = vals.holdIn; }
  if (vals.exhale != null) { $('#exhale').value = vals.exhale; $('#exhale-val').textContent = vals.exhale; }
  if (vals.holdOut != null) { $('#hold-out').value = vals.holdOut; $('#hold-out-val').textContent = vals.holdOut; }
  if (vals.totalSeconds != null) $('#duration').value = vals.totalSeconds;
  if (vals.soundStyle != null) $('#sound-style').value = vals.soundStyle;
  
  if (vals.barStyle != null) {
      const immersiveStyles = ['tide', 'breeze', 'pulse', 'stack', 'paper', 'burst', 'fractal', 'geometry'];
      const isImmersive = immersiveStyles.includes(vals.barStyle);
      $(`input[name="viz-type"][value="${isImmersive ? 'immersive' : 'bar'}"]`).checked = true;
      if (isImmersive) {
          $('#immersive-style-select').value = vals.barStyle;
      } else {
          $('#bar-style-select').value = vals.barStyle;
      }
      $('#bar-style').value = vals.barStyle;
  }
  
  updateVisualizerUI();
  updateRateSummary();
}

// ─── Exercise List ───────────────────────────────────────────────────────────

export function renderExercises(exercises, { onStart, onMantraChange }) {
  const list = $('#exercise-list');
  list.innerHTML = '';

  for (const ex of exercises) {
    const card = document.createElement('div');
    card.className = `exercise-card${ex.isMantra ? ' mantra-card' : ''}`;
    card.id = `exercise-${ex.id}`;

    if (ex.isMantra) {
      card.innerHTML = `
        <div class="exercise-card-name">${ex.name}</div>
        <div class="exercise-card-desc">${ex.description}</div>
        <div class="mantra-input-wrapper">
          <textarea class="mantra-textarea" placeholder="Type your mantra or focus text here…">${ex.focusText && ex.focusText !== 'Enter your mantra in the exercises tab…' ? ex.focusText : ''}</textarea>
          <button class="mantra-start-btn">Start with mantra</button>
        </div>
      `;

      const textarea = card.querySelector('.mantra-textarea');
      const startBtn = card.querySelector('.mantra-start-btn');

      // Stop card click from firing when interacting with textarea
      textarea.addEventListener('click', e => e.stopPropagation());
      textarea.addEventListener('input', () => {
        onMantraChange(textarea.value);
      });

      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onStart(ex.id, textarea.value);
      });
    } else {
      card.innerHTML = `
        <div class="exercise-card-name">${ex.name}</div>
        <div class="exercise-card-desc">${ex.description}</div>
      `;
      card.addEventListener('click', () => onStart(ex.id, ex.focusText));
    }

    list.appendChild(card);
  }
}
