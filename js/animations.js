/**
 * Bar-based breathing animation.
 * Controls the vertical breathing bar fill height via CSS transitions.
 */

const $ = (sel) => document.querySelector(sel);

export function createAnimation() {
  const fill = () => $('#breathing-bar-fill');

  return {
    start() {
      const el = fill();
      if (el) {
        el.style.transitionDuration = '0s';
        el.style.height = '0%';
      }
    },

    animatePhase(phase, durationMs) {
      const el = fill();
      if (!el) return;

      const dur = (durationMs / 1000).toFixed(2);

      if (phase === 'inhale') {
        el.style.transitionDuration = `${dur}s`;
        el.style.transitionTimingFunction = 'ease-in-out';
        el.style.height = '100%';
      } else if (phase === 'exhale') {
        el.style.transitionDuration = `${dur}s`;
        el.style.transitionTimingFunction = 'ease-in-out';
        el.style.height = '0%';
      } else if (phase === 'holdIn' || phase === 'holdOut') {
        // Keep current height, freeze transition
        el.style.transitionDuration = '0s';
      }
    },

    reset() {
      const el = fill();
      if (el) {
        el.style.transitionDuration = '0s';
        el.style.height = '0%';
      }
    },

    destroy() {
      this.reset();
    },
  };
}

// Keep the API shape for compatibility
export function getAnimationStyles() {
  return [{ id: 'bar', label: 'Bar' }];
}
