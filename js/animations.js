/**
 * Animation styles for the breathing circle.
 * Each style exports: start(container), animatePhase(phase, durationMs), reset(), destroy()
 */

const $ = (sel) => document.querySelector(sel);

// ─── Minimal (original) ───────────────────────────────────────────────────────

function createMinimal() {
  return {
    start() {},
    animatePhase(phase, durationMs) {
      const el = $('#breathing-circle');
      const dur = (durationMs / 1000).toFixed(2);
      el.style.transitionDuration = `${dur}s`;
      el.style.transitionTimingFunction = 'ease-in-out';

      if (phase === 'inhale') el.classList.add('expanded');
      else if (phase === 'exhale') el.classList.remove('expanded');

      if (phase === 'holdIn' || phase === 'holdOut') {
        el.style.transitionDuration = '0s';
      }
    },
    reset() {
      const el = $('#breathing-circle');
      el.style.transitionDuration = '0s';
      el.classList.remove('expanded');
      el.style.background = '';
      el.style.boxShadow = '';
    },
    destroy() { this.reset(); },
  };
}

// ─── Ripple — expanding rings emanate from the circle ─────────────────────────

function createRipple() {
  let rings = [];
  let ringInterval = null;

  function spawnRing() {
    const container = $('.circle-container');
    const ring = document.createElement('div');
    ring.className = 'ripple-ring';
    container.appendChild(ring);
    rings.push(ring);

    // Animate via rAF — ring expands and fades
    let start = performance.now();
    const duration = 2000;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const scale = 0.6 + t * 1.4;
      ring.style.transform = `scale(${scale})`;
      ring.style.opacity = (1 - t) * 0.5;
      if (t < 1) requestAnimationFrame(step);
      else { ring.remove(); rings = rings.filter(r => r !== ring); }
    }
    requestAnimationFrame(step);
  }

  return {
    start() {
      ringInterval = setInterval(spawnRing, 800);
    },
    animatePhase(phase, durationMs) {
      const el = $('#breathing-circle');
      const dur = (durationMs / 1000).toFixed(2);
      el.style.transitionDuration = `${dur}s`;
      el.style.transitionTimingFunction = 'ease-in-out';

      if (phase === 'inhale') el.classList.add('expanded');
      else if (phase === 'exhale') el.classList.remove('expanded');
      if (phase === 'holdIn' || phase === 'holdOut') el.style.transitionDuration = '0s';
    },
    reset() {
      const el = $('#breathing-circle');
      el.style.transitionDuration = '0s';
      el.classList.remove('expanded');
    },
    destroy() {
      this.reset();
      if (ringInterval) clearInterval(ringInterval);
      rings.forEach(r => r.remove());
      rings = [];
    },
  };
}

// ─── Orb — color-shifting gradient with pulsing glow ──────────────────────────

function createOrb() {
  let hue = 170; // start teal
  let rafId = null;

  function colorLoop() {
    hue = (hue + 0.15) % 360;
    const el = $('#breathing-circle');
    if (!el) return;
    const c1 = `hsl(${hue}, 65%, 55%)`;
    const c2 = `hsla(${(hue + 30) % 360}, 50%, 30%, 0.2)`;
    el.style.background = `radial-gradient(circle, ${c1} 0%, ${c2} 70%)`;

    const glowAlpha = 0.25 + 0.15 * Math.sin(performance.now() / 1200);
    el.style.boxShadow = `0 0 50px hsla(${hue}, 65%, 55%, ${glowAlpha}), 0 0 100px hsla(${hue}, 50%, 40%, ${glowAlpha * 0.4})`;

    rafId = requestAnimationFrame(colorLoop);
  }

  return {
    start() {
      hue = 170;
      colorLoop();
    },
    animatePhase(phase, durationMs) {
      const el = $('#breathing-circle');
      const dur = (durationMs / 1000).toFixed(2);
      el.style.transitionDuration = `${dur}s`;
      el.style.transitionTimingFunction = 'cubic-bezier(0.4, 0, 0.2, 1)';

      if (phase === 'inhale') el.classList.add('expanded');
      else if (phase === 'exhale') el.classList.remove('expanded');
      if (phase === 'holdIn' || phase === 'holdOut') el.style.transitionDuration = '0s';
    },
    reset() {
      const el = $('#breathing-circle');
      el.style.transitionDuration = '0s';
      el.classList.remove('expanded');
      el.style.background = '';
      el.style.boxShadow = '';
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      this.reset();
    },
  };
}

// ─── Particles — canvas-based floating dots ───────────────────────────────────

function createParticles() {
  let canvas = null;
  let ctx = null;
  let rafId = null;
  let particles = [];
  let expanding = false;
  let targetScale = 0.6;

  const PARTICLE_COUNT = 60;

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 30 + Math.random() * 60,
        speed: 0.002 + Math.random() * 0.004,
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.5,
        drift: 0.3 + Math.random() * 0.7,
      });
    }
  }

  function draw() {
    if (!canvas || !ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    const t = performance.now() / 1000;
    const spread = expanding ? 1.3 : 0.6;

    for (const p of particles) {
      p.angle += p.speed;
      const r = p.radius * spread + Math.sin(t * p.drift) * 15;
      const x = cx + Math.cos(p.angle) * r;
      const y = cy + Math.sin(p.angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(78, 205, 196, ${p.alpha * (0.6 + 0.4 * Math.sin(t + p.angle))})`;
      ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  }

  return {
    start() {
      const container = $('.circle-container');
      canvas = document.createElement('canvas');
      canvas.className = 'particle-canvas';
      canvas.width = 260;
      canvas.height = 260;
      container.insertBefore(canvas, container.firstChild);
      ctx = canvas.getContext('2d');
      initParticles();
      draw();
    },
    animatePhase(phase, durationMs) {
      expanding = (phase === 'inhale' || phase === 'holdIn');

      const el = $('#breathing-circle');
      const dur = (durationMs / 1000).toFixed(2);
      el.style.transitionDuration = `${dur}s`;
      el.style.transitionTimingFunction = 'ease-in-out';

      if (phase === 'inhale') el.classList.add('expanded');
      else if (phase === 'exhale') el.classList.remove('expanded');
      if (phase === 'holdIn' || phase === 'holdOut') el.style.transitionDuration = '0s';
    },
    reset() {
      const el = $('#breathing-circle');
      el.style.transitionDuration = '0s';
      el.classList.remove('expanded');
      expanding = false;
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      if (canvas) canvas.remove();
      canvas = null;
      ctx = null;
      this.reset();
    },
  };
}

// ─── Lotus — petals that open/close with breathing ────────────────────────────

function createLotus() {
  let petalEls = [];
  const PETAL_COUNT = 8;

  function buildPetals() {
    const container = $('.circle-container');
    for (let i = 0; i < PETAL_COUNT; i++) {
      const petal = document.createElement('div');
      petal.className = 'lotus-petal';
      const angle = (360 / PETAL_COUNT) * i;
      petal.style.transform = `rotate(${angle}deg) translateY(-20px) scaleY(0.5)`;
      petal.dataset.angle = angle;
      container.appendChild(petal);
      petalEls.push(petal);
    }
  }

  function setPetals(open, durationMs) {
    const dur = (durationMs / 1000).toFixed(2);
    petalEls.forEach(p => {
      const angle = parseFloat(p.dataset.angle);
      p.style.transition = `transform ${dur}s ease-in-out, opacity ${dur}s`;
      if (open) {
        p.style.transform = `rotate(${angle}deg) translateY(-55px) scaleY(1)`;
        p.style.opacity = '0.8';
      } else {
        p.style.transform = `rotate(${angle}deg) translateY(-20px) scaleY(0.5)`;
        p.style.opacity = '0.4';
      }
    });
  }

  return {
    start() {
      buildPetals();
    },
    animatePhase(phase, durationMs) {
      const el = $('#breathing-circle');
      const dur = (durationMs / 1000).toFixed(2);
      el.style.transitionDuration = `${dur}s`;
      el.style.transitionTimingFunction = 'ease-in-out';

      if (phase === 'inhale') {
        el.classList.add('expanded');
        setPetals(true, durationMs);
      } else if (phase === 'exhale') {
        el.classList.remove('expanded');
        setPetals(false, durationMs);
      }
      if (phase === 'holdIn' || phase === 'holdOut') {
        el.style.transitionDuration = '0s';
        petalEls.forEach(p => p.style.transition = 'none');
      }
    },
    reset() {
      const el = $('#breathing-circle');
      el.style.transitionDuration = '0s';
      el.classList.remove('expanded');
    },
    destroy() {
      this.reset();
      petalEls.forEach(p => p.remove());
      petalEls = [];
    },
  };
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const STYLES = {
  minimal: { label: 'Minimal', create: createMinimal },
  ripple: { label: 'Ripple', create: createRipple },
  orb: { label: 'Color Orb', create: createOrb },
  particles: { label: 'Particles', create: createParticles },
  lotus: { label: 'Lotus', create: createLotus },
};

export function getAnimationStyles() {
  return Object.entries(STYLES).map(([id, s]) => ({ id, label: s.label }));
}

export function createAnimation(styleId) {
  const entry = STYLES[styleId] || STYLES.minimal;
  return entry.create();
}
