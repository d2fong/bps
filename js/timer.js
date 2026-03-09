/**
 * Breathing timer engine — rAF-based with 4-phase box breathing.
 * Resilient to background tabs via performance.now() deltas.
 */

const PHASES = ['inhale', 'holdIn', 'exhale', 'holdOut'];
const PHASE_LABELS = {
  inhale: 'Breathe In',
  holdIn: 'Hold',
  exhale: 'Breathe Out',
  holdOut: 'Hold',
};

export function createTimer(config, callbacks) {
  // config: { inhale, holdIn, exhale, holdOut, totalSeconds }
  // callbacks: { onPhaseChange(phase, label, duration), onTick(remaining), onCycleComplete(count), onComplete() }

  let running = false;
  let paused = false;
  let rafId = null;

  // Absolute timestamps (ms)
  let sessionStartTime = 0;
  let phaseStartTime = 0;
  let pauseStartTime = 0;
  let totalPausedMs = 0;

  let currentPhaseIndex = 0;
  let cycleCount = 0;

  const phaseDurations = {
    inhale: config.inhale * 1000,
    holdIn: config.holdIn * 1000,
    exhale: config.exhale * 1000,
    holdOut: config.holdOut * 1000,
  };

  // Skip phases with 0 duration
  function getActivePhases() {
    return PHASES.filter(p => phaseDurations[p] > 0);
  }

  const activePhases = getActivePhases();
  if (activePhases.length === 0) return null; // invalid config

  function currentPhase() {
    return activePhases[currentPhaseIndex];
  }

  function currentPhaseDuration() {
    return phaseDurations[currentPhase()];
  }

  function elapsedSession() {
    return performance.now() - sessionStartTime - totalPausedMs;
  }

  function elapsedInPhase() {
    return performance.now() - phaseStartTime - totalPausedMs;
  }

  function remainingSession() {
    return Math.max(0, config.totalSeconds * 1000 - elapsedSession());
  }

  function advancePhase() {
    currentPhaseIndex++;
    if (currentPhaseIndex >= activePhases.length) {
      currentPhaseIndex = 0;
      cycleCount++;
      callbacks.onCycleComplete?.(cycleCount);
    }
    totalPausedMs = 0; // reset per-phase pause tracking
    phaseStartTime = performance.now();
    callbacks.onPhaseChange?.(currentPhase(), PHASE_LABELS[currentPhase()], currentPhaseDuration());
  }

  function tick() {
    if (!running || paused) return;

    const sessionRemaining = remainingSession();
    callbacks.onTick?.(sessionRemaining);

    if (sessionRemaining <= 0) {
      stop();
      callbacks.onComplete?.();
      return;
    }

    // Check if current phase is done
    const phaseElapsed = performance.now() - phaseStartTime;
    if (phaseElapsed >= currentPhaseDuration()) {
      advancePhase();
    }

    rafId = requestAnimationFrame(tick);
  }

  // Handle visibility change — recalculate on return from background
  function handleVisibility() {
    if (document.hidden) {
      // Tab went to background — rAF will stop, but our timestamps still work
      return;
    }
    // Tab is visible again — restart rAF loop
    if (running && !paused) {
      // Catch up: check if phases have elapsed while backgrounded
      catchUp();
      rafId = requestAnimationFrame(tick);
    }
  }

  function catchUp() {
    // Fast-forward through any phases that completed while backgrounded
    while (running) {
      const phaseElapsed = performance.now() - phaseStartTime;
      if (phaseElapsed >= currentPhaseDuration()) {
        const sessionRemaining = remainingSession();
        if (sessionRemaining <= 0) {
          stop();
          callbacks.onComplete?.();
          return;
        }
        advancePhase();
      } else {
        break;
      }
    }
  }

  function start() {
    running = true;
    paused = false;
    sessionStartTime = performance.now();
    phaseStartTime = performance.now();
    totalPausedMs = 0;
    currentPhaseIndex = 0;
    cycleCount = 0;

    callbacks.onPhaseChange?.(currentPhase(), PHASE_LABELS[currentPhase()], currentPhaseDuration());
    callbacks.onTick?.(config.totalSeconds * 1000);

    document.addEventListener('visibilitychange', handleVisibility);
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    if (!running || paused) return;
    paused = true;
    pauseStartTime = performance.now();
    if (rafId) cancelAnimationFrame(rafId);
  }

  function resume() {
    if (!running || !paused) return;
    const pausedDuration = performance.now() - pauseStartTime;
    // Shift start times forward by the paused duration
    sessionStartTime += pausedDuration;
    phaseStartTime += pausedDuration;
    paused = false;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    paused = false;
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', handleVisibility);
  }

  function getCycleCount() {
    return cycleCount;
  }

  function isRunning() {
    return running;
  }

  function isPaused() {
    return paused;
  }

  return { start, pause, resume, stop, getCycleCount, isRunning, isPaused };
}
