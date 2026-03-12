/**
 * localStorage persistence for presets, settings, mantra text, and options.
 */

const PRESETS_KEY = 'bps_presets';
const LAST_KEY = 'bps_last';
const MANTRA_KEY = 'bps_mantra';
const OPTIONS_KEY = 'bps_options';

// Built-in presets (not stored in localStorage)
const BUILTIN = {
  box: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, totalSeconds: 300 },
  relaxing: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0, totalSeconds: 300 },
  simple: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0, totalSeconds: 300 },
  beginner: { inhale: 5, holdIn: 0, exhale: 7, holdOut: 0, totalSeconds: 300 },
  intermediate: { inhale: 7, holdIn: 0, exhale: 9, holdOut: 0, totalSeconds: 300 },
  advanced: { inhale: 12, holdIn: 0, exhale: 14, holdOut: 0, totalSeconds: 300 },
  sleep: { inhale: 4, holdIn: 0, exhale: 8, holdOut: 0, totalSeconds: 300 },
};

export function getBuiltinPreset(id) {
  return BUILTIN[id] || null;
}

export function getBuiltinPresets() {
  return { ...BUILTIN };
}

export function saveLastUsed(settings) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(settings));
  } catch (e) { /* quota exceeded — ignore */ }
}

export function loadLastUsed() {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getUserPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveUserPreset(name, settings) {
  const presets = getUserPresets();
  presets[name] = settings;
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (e) { /* ignore */ }
}

export function deleteUserPreset(name) {
  const presets = getUserPresets();
  delete presets[name];
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (e) { /* ignore */ }
}

// Mantra text
export function saveMantraText(text) {
  try {
    localStorage.setItem(MANTRA_KEY, text);
  } catch (e) { /* ignore */ }
}

export function loadMantraText() {
  try {
    return localStorage.getItem(MANTRA_KEY) || '';
  } catch (e) {
    return '';
  }
}

// Options (sound profile, etc.)
export function saveOptions(opts) {
  try {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(opts));
  } catch (e) { /* ignore */ }
}

export function loadOptions() {
  try {
    const raw = localStorage.getItem(OPTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
