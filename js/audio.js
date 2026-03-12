/**
 * Web Audio API synthesis — realistic meditation sounds.
 * Profiles: Tibetan Bowl, Crystal Bell, Deep Calm, Simple.
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

/**
 * Play a single oscillator with full ADSR envelope and optional vibrato.
 */
function playTone({
  type = 'sine',
  freq,
  duration = 2.0,
  volume = 0.08,
  detune = 0,
  delay = 0,
  attack = 0.01,
  decay = 0.3,
  sustain = 0.4,    // ratio of volume
  release = 0.5,    // release time at end
  vibratoRate = 0,
  vibratoDepth = 0, // in cents
  filterFreq = 0,   // 0 = no filter
  filterQ = 1,
} = {}) {
  if (!ctx) return;
  const t = now() + delay;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.detune.setValueAtTime(detune, t);

  // Vibrato (LFO modulating pitch)
  if (vibratoRate > 0 && vibratoDepth > 0) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(vibratoRate, t);
    lfoGain.gain.setValueAtTime(vibratoDepth, t);
    lfo.connect(lfoGain).connect(osc.detune);
    lfo.start(t);
    lfo.stop(t + duration);
  }

  // Gain envelope: attack → peak → decay → sustain → release
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(volume, t + attack);
  gain.gain.linearRampToValueAtTime(volume * sustain, t + attack + decay);
  // Hold at sustain level, then release
  const releaseStart = t + duration - release;
  if (releaseStart > t + attack + decay) {
    gain.gain.setValueAtTime(volume * sustain, releaseStart);
  }
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  // Optional lowpass filter for warmth
  let output = gain;
  if (filterFreq > 0) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.Q.setValueAtTime(filterQ, t);
    osc.connect(gain).connect(filter).connect(ctx.destination);
    output = filter;
  } else {
    osc.connect(gain).connect(ctx.destination);
  }

  osc.start(t);
  osc.stop(t + duration);
}

/**
 * Tibetan singing bowl partial — inharmonic with beating.
 * Real bowls have partials at non-integer ratios with slight frequency splits.
 */
function playBowlPartial({ freq, duration = 4.0, volume = 0.06, delay = 0, beatHz = 0.8 }) {
  if (!ctx) return;
  const t = now() + delay;

  // Two slightly detuned oscillators for beating
  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Split frequency by half the beat rate
    osc.frequency.setValueAtTime(freq + (i === 0 ? -beatHz / 2 : beatHz / 2), t);

    // Smooth fade-in to avoid pop, then long exponential decay
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(volume * 0.6, t + duration * 0.15);
    gain.gain.exponentialRampToValueAtTime(volume * 0.2, t + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }
}

/**
 * Full tibetan bowl strike — multiple inharmonic partials.
 * Real bowls have partials roughly at 1 : 2.71 : 4.53 : 6.59 : 8.41
 */
function playBowlStrike({ baseFreq = 220, duration = 5.0, volume = 0.05, delay = 0 }) {
  const partialRatios = [1, 2.71, 4.53, 6.59, 8.41];
  const partialVolumes = [1.0, 0.45, 0.25, 0.12, 0.06];
  const partialDurations = [1.0, 0.75, 0.55, 0.4, 0.25];
  const beatRates = [0.5, 0.8, 1.2, 1.5, 2.0];

  for (let i = 0; i < partialRatios.length; i++) {
    playBowlPartial({
      freq: baseFreq * partialRatios[i],
      duration: duration * partialDurations[i],
      volume: volume * partialVolumes[i],
      delay,
      beatHz: beatRates[i],
    });
  }

  // Metallic attack transient — short burst of filtered noise
  playAttackTransient({ duration: 0.08, volume: volume * 0.3, filterFreq: baseFreq * 6, delay });
}

/**
 * Short noise burst for metallic attack character.
 */
function playAttackTransient({ duration = 0.06, volume = 0.03, filterFreq = 2000, delay = 0 }) {
  if (!ctx) return;
  const t = now() + delay;

  const bufSize = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(filterFreq, t);
  filter.Q.setValueAtTime(3, t);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + duration);
}

/**
 * String bass drone — warm, low tone with harmonics.
 */
function playBassDrone({ freq = 55, duration = 3.0, volume = 0.06, delay = 0 }) {
  // Fundamental (triangle for warmth)
  playTone({
    type: 'triangle',
    freq,
    duration,
    volume,
    delay,
    attack: 0.3,
    decay: 0.5,
    sustain: 0.7,
    release: 0.8,
    filterFreq: freq * 4,
    filterQ: 0.7,
    vibratoRate: 4.5,
    vibratoDepth: 3,
  });
  // Soft octave
  playTone({
    type: 'sine',
    freq: freq * 2,
    duration: duration * 0.8,
    volume: volume * 0.3,
    delay,
    attack: 0.4,
    decay: 0.5,
    sustain: 0.5,
    release: 0.6,
  });
  // Very subtle fifth
  playTone({
    type: 'sine',
    freq: freq * 3,
    duration: duration * 0.5,
    volume: volume * 0.1,
    delay,
    attack: 0.3,
    decay: 0.3,
    sustain: 0.3,
    release: 0.4,
  });
}

/**
 * Crystal bell — clear, bright, shimmering.
 */
function playBell({ freq = 880, duration = 3.0, volume = 0.04, delay = 0 }) {
  // Bell partials (approximately): 1 : 2 : 3 : 4.2 : 5.4
  const partials = [
    { ratio: 1, vol: 1.0, dur: 1.0 },
    { ratio: 2, vol: 0.5, dur: 0.8 },
    { ratio: 3, vol: 0.25, dur: 0.6 },
    { ratio: 4.2, vol: 0.12, dur: 0.4 },
    { ratio: 5.4, vol: 0.06, dur: 0.3 },
  ];

  for (const p of partials) {
    playTone({
      type: 'sine',
      freq: freq * p.ratio,
      duration: duration * p.dur,
      volume: volume * p.vol,
      delay,
      attack: 0.003,
      decay: 0.15,
      sustain: 0.2,
      release: duration * p.dur * 0.5,
      detune: (Math.random() - 0.5) * 4, // slight shimmer
    });
  }

  // Tiny attack transient
  playAttackTransient({ duration: 0.04, volume: volume * 0.4, filterFreq: freq * 3, delay });
}

/**
 * Tuning fork — pure sine with long sustain and gentle beating.
 */
function playFork({ freq = 432, duration = 4.0, volume = 0.06, delay = 0 }) {
  // Two very close sines for subtle beating
  playTone({
    type: 'sine',
    freq,
    duration,
    volume,
    delay,
    attack: 0.005,
    decay: 0.2,
    sustain: 0.6,
    release: duration * 0.4,
  });
  playTone({
    type: 'sine',
    freq: freq + 0.5, // very gentle beat
    duration,
    volume: volume * 0.8,
    delay,
    attack: 0.005,
    decay: 0.2,
    sustain: 0.6,
    release: duration * 0.4,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sound Profiles
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Tibetan Bowl — authentic singing bowl with bass undertones ──────────────

const tibetan = {
  inhale() {
    playBowlStrike({ baseFreq: 220, duration: 2.45, volume: 0.045 });
    playBassDrone({ freq: 55, duration: 1.96, volume: 0.03 });
  },
  exhale() {
    playBowlStrike({ baseFreq: 165, duration: 2.94, volume: 0.04 });
    playBassDrone({ freq: 55, duration: 2.45, volume: 0.025 });
  },
  hold() {
    playFork({ freq: 264, duration: 1.26, volume: 0.02 });
  },
  complete() {
    playBowlStrike({ baseFreq: 220, duration: 3.5, volume: 0.05 });
    playBowlStrike({ baseFreq: 330, duration: 2.94, volume: 0.04, delay: 0.49 });
    playBowlStrike({ baseFreq: 440, duration: 3.5, volume: 0.035, delay: 0.98 });
    playBassDrone({ freq: 55, duration: 3.92, volume: 0.04 });
  },
};

// ─── Crystal — bright bells with warm bass pad ───────────────────────────────

const crystal = {
  inhale() {
    playBell({ freq: 880, duration: 1.72, volume: 0.035 });
    playBassDrone({ freq: 110, duration: 1.47, volume: 0.025 });
  },
  exhale() {
    playBell({ freq: 660, duration: 1.96, volume: 0.03 });
    playBassDrone({ freq: 82.5, duration: 1.72, volume: 0.02 });
  },
  hold() {
    playBell({ freq: 1320, duration: 0.98, volume: 0.015 });
  },
  complete() {
    playBell({ freq: 880, duration: 2.45, volume: 0.04 });
    playBell({ freq: 1100, duration: 2.2, volume: 0.03, delay: 0.29 });
    playBell({ freq: 1320, duration: 2.45, volume: 0.025, delay: 0.59 });
    playBassDrone({ freq: 110, duration: 2.94, volume: 0.035 });
  },
};

// ─── Deep Calm — low bass drones with gentle fork tones ──────────────────────

const deepcalm = {
  inhale() {
    playBassDrone({ freq: 55, duration: 2.45, volume: 0.05 });
    playFork({ freq: 396, duration: 1.96, volume: 0.025 });
  },
  exhale() {
    playBassDrone({ freq: 73.4, duration: 2.94, volume: 0.045 });
    playFork({ freq: 528, duration: 2.45, volume: 0.02 });
  },
  hold() {
    playFork({ freq: 432, duration: 1.23, volume: 0.015 });
  },
  complete() {
    playBassDrone({ freq: 55, duration: 3.92, volume: 0.06 });
    playFork({ freq: 396, duration: 2.94, volume: 0.03 });
    playFork({ freq: 528, duration: 2.94, volume: 0.025, delay: 0.49 });
    playFork({ freq: 639, duration: 2.94, volume: 0.02, delay: 0.98 });
  },
};

// ─── Simple (original, kept as fallback) ─────────────────────────────────────

const simple = {
  inhale() {
    playTone({ freq: 330, duration: 0.25, volume: 0.10, attack: 0.015, decay: 0.05, sustain: 0.3, release: 0.1 });
  },
  exhale() {
    playTone({ freq: 262, duration: 0.25, volume: 0.10, attack: 0.015, decay: 0.05, sustain: 0.3, release: 0.1 });
  },
  hold() {
    playTone({ freq: 296, duration: 0.15, volume: 0.05, attack: 0.015, decay: 0.05, sustain: 0.2, release: 0.05 });
  },
  complete() {
    playTone({ freq: 440, duration: 0.39, volume: 0.12, attack: 0.01, decay: 0.07, sustain: 0.3, release: 0.15 });
    playTone({ freq: 550, duration: 0.39, volume: 0.10, delay: 0.15, attack: 0.01, decay: 0.07, sustain: 0.3, release: 0.15 });
    playTone({ freq: 660, duration: 0.49, volume: 0.08, delay: 0.29, attack: 0.01, decay: 0.07, sustain: 0.3, release: 0.2 });
  },
};

// ─── Registry ────────────────────────────────────────────────────────────────

const PROFILES = { tibetan, crystal, deepcalm, simple };

export function getSoundProfiles() {
  return [
    { id: 'tibetan',  label: 'Tibetan Bowl' },
    { id: 'crystal',  label: 'Crystal Bell' },
    { id: 'deepcalm', label: 'Deep Calm' },
    { id: 'simple',   label: 'Simple' },
  ];
}

let activeProfile = 'tibetan';

export function setProfile(id) {
  activeProfile = PROFILES[id] ? id : 'tibetan';
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
