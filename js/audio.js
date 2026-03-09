/**
 * Web Audio API chime synthesis with multiple sound profiles.
 * Must call init() from a user gesture for iOS compliance.
 */

let ctx = null;

export function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() { return ctx ? ctx.currentTime : 0; }

function playOsc({ type = 'sine', freq, freqEnd, duration = 0.6, volume = 0.12, detune = 0, delay = 0 } = {}) {
  if (!ctx) return;
  const t = now() + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

function playNoise({ duration = 0.5, volume = 0.04, filterFreq = 800, filterQ = 1, delay = 0 } = {}) {
  if (!ctx) return;
  const t = now() + delay;
  const bufSize = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + duration);
}

// ─── Simple (original) ───────────────────────────────────────────────────────

const simple = {
  inhale()   { playOsc({ freq: 330, freqEnd: 660, duration: 0.5, volume: 0.12 }); },
  exhale()   { playOsc({ freq: 660, freqEnd: 330, duration: 0.5, volume: 0.12 }); },
  hold()     { playOsc({ freq: 528, freqEnd: 528, duration: 0.3, volume: 0.06 }); },
  complete() {
    playOsc({ freq: 440, freqEnd: 660, duration: 0.8, volume: 0.15 });
    playOsc({ freq: 550, freqEnd: 830, duration: 0.8, volume: 0.12, delay: 0.3 });
    playOsc({ freq: 660, freqEnd: 990, duration: 1.0, volume: 0.10, delay: 0.6 });
  },
};

// ─── Bowl — singing bowl with layered harmonics ──────────────────────────────

const bowl = {
  _ring(baseFreq, dur = 2.5, vol = 0.08, delay = 0) {
    // Fundamental + harmonics with slight detune for shimmer
    playOsc({ freq: baseFreq, duration: dur, volume: vol, delay });
    playOsc({ freq: baseFreq * 2, duration: dur * 0.8, volume: vol * 0.4, detune: 3, delay });
    playOsc({ freq: baseFreq * 3, duration: dur * 0.6, volume: vol * 0.2, detune: -5, delay });
    playOsc({ freq: baseFreq * 4.2, duration: dur * 0.4, volume: vol * 0.1, detune: 7, delay });
  },
  inhale()   { this._ring(280, 2.0, 0.07); },
  exhale()   { this._ring(210, 2.5, 0.06); },
  hold()     { this._ring(350, 1.2, 0.03); },
  complete() {
    this._ring(280, 3.5, 0.09);
    this._ring(350, 3.0, 0.07, 0.8);
    this._ring(420, 3.5, 0.06, 1.6);
  },
};

// ─── Warm — soft layered pads with triangle waves ────────────────────────────

const warm = {
  _pad(freqs, dur = 1.2, vol = 0.06, delay = 0) {
    for (const f of freqs) {
      playOsc({ type: 'triangle', freq: f, duration: dur, volume: vol, delay });
      playOsc({ type: 'triangle', freq: f, duration: dur, volume: vol * 0.5, detune: 8, delay });
    }
  },
  inhale()   { this._pad([262, 330, 392], 1.5, 0.05); },  // C major
  exhale()   { this._pad([220, 277, 330], 1.8, 0.05); },  // Am-ish
  hold()     { this._pad([330, 392], 0.8, 0.025); },
  complete() {
    this._pad([262, 330, 392], 2.5, 0.06);
    this._pad([294, 370, 440], 2.5, 0.05, 0.7);
    this._pad([330, 415, 494], 3.0, 0.05, 1.4);
  },
};

// ─── Rain — filtered noise bursts, organic feel ──────────────────────────────

const rain = {
  inhale() {
    playNoise({ duration: 0.8, volume: 0.05, filterFreq: 2000, filterQ: 0.5 });
    playOsc({ type: 'sine', freq: 440, freqEnd: 660, duration: 0.6, volume: 0.04 });
  },
  exhale() {
    playNoise({ duration: 1.0, volume: 0.05, filterFreq: 600, filterQ: 0.8 });
    playOsc({ type: 'sine', freq: 550, freqEnd: 330, duration: 0.8, volume: 0.04 });
  },
  hold() {
    playNoise({ duration: 0.4, volume: 0.02, filterFreq: 1200, filterQ: 2 });
  },
  complete() {
    playNoise({ duration: 2.0, volume: 0.06, filterFreq: 1500, filterQ: 0.3 });
    playOsc({ type: 'sine', freq: 396, duration: 3.0, volume: 0.06 });
    playOsc({ type: 'sine', freq: 528, duration: 3.0, volume: 0.04, delay: 0.5 });
    playOsc({ type: 'sine', freq: 639, duration: 3.0, volume: 0.03, delay: 1.0 });
  },
};

// ─── Registry ────────────────────────────────────────────────────────────────

const PROFILES = { simple, bowl, warm, rain };

export function getSoundProfiles() {
  return [
    { id: 'simple', label: 'Simple' },
    { id: 'bowl',   label: 'Singing Bowl' },
    { id: 'warm',   label: 'Warm Pad' },
    { id: 'rain',   label: 'Rain' },
  ];
}

let activeProfile = 'simple';

export function setProfile(id) {
  activeProfile = PROFILES[id] ? id : 'simple';
}

export function playForPhase(phase) {
  const p = PROFILES[activeProfile];
  switch (phase) {
    case 'inhale': p.inhale(); break;
    case 'exhale': p.exhale(); break;
    case 'holdIn':
    case 'holdOut': p.hold(); break;
  }
}

export function chimeComplete() {
  PROFILES[activeProfile].complete();
}
