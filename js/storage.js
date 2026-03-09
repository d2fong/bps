/**
 * localStorage persistence for presets and last-used settings.
 */

const PRESETS_KEY = 'bps_presets';
const LAST_KEY = 'bps_last';

// Built-in presets (not stored in localStorage)
const BUILTIN = {
  box: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  relaxing: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  simple: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
};

export function getBuiltinPreset(id) {
  return BUILTIN[id] || null;
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
