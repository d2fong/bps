/**
 * Breathing animations.
 * Handles both the classic bar and the new full-screen visualizers.
 */

const $ = (sel) => document.querySelector(sel);

// SVG Namespace
const SVG_NS = "http://www.w3.org/2000/svg";

export function createAnimation() {
  let currentStyle = 'aurora'; // Default
  let container = null;

  const isExpanding = (phase) => phase === 'inhale' || phase === 'holdIn';

  const fillClassic = () => $('#breathing-bar-fill');
  const fillPreview = () => $('#preview-bar-fill');

  // Helper to create SVG elements
  function createSVG(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    return el;
  }

  // --- Visualizer Renderers ---

  const renderers = {
    tide: (parent) => {
      parent.innerHTML = `
        <div style="position: absolute; inset: 0;">
          <div class="tide-fill" style="position: absolute; bottom: 0; left: 0; right: 0; width: 100%; background: linear-gradient(to top, rgba(30, 58, 138, 0.9), rgba(59, 130, 246, 0.7)); height: 10%; transition: height 1s ease-in-out;">
            <svg class="animate-wave-slow" viewBox="0 0 800 100" fill="currentColor" preserveAspectRatio="none" style="position: absolute; bottom: 100%; width: 200%; left: 0; height: 8vh; color: rgba(59, 130, 246, 0.7); filter: drop-shadow(0 10px 8px rgba(0,0,0,0.3));">
              <path d="M0,50 C100,20 200,80 400,50 C600,20 700,80 800,50 L800,100 L0,100 Z" />
            </svg>
            <svg class="animate-wave-fast" viewBox="0 0 800 100" fill="currentColor" preserveAspectRatio="none" style="position: absolute; bottom: 100%; width: 200%; left: -50%; height: 12vh; margin-bottom: -3vh; color: rgba(96, 165, 250, 0.5);">
              <path d="M0,50 C100,80 200,20 400,50 C600,80 700,20 800,50 L800,100 L0,100 Z" />
            </svg>
          </div>
        </div>
      `;
    },
    breeze: (parent) => {
      parent.innerHTML = `
        <div style="position: absolute; inset: 0;">
          <div class="breeze-fill" style="position: absolute; top: 0; bottom: 0; left: 0; height: 100%; background: linear-gradient(to right, rgba(14, 116, 144, 0.8), rgba(93, 216, 203, 0.6)); width: 10%; transition: width 1s ease-in-out;">
            <svg class="animate-wave-vertical-slow" viewBox="0 0 100 800" fill="currentColor" preserveAspectRatio="none" style="position: absolute; top: 0; left: 100%; height: 200%; width: 8vw; color: rgba(93, 216, 203, 0.6); filter: drop-shadow(0 10px 8px rgba(0,0,0,0.3));">
              <path d="M50,0 C0,100 100,200 50,400 C0,600 100,700 50,800 L0,800 L0,0 Z" />
            </svg>
            <svg class="animate-wave-vertical-fast" viewBox="0 0 100 800" fill="currentColor" preserveAspectRatio="none" style="position: absolute; top: 0; left: 100%; height: 200%; width: 12vw; margin-left: -3vw; color: rgba(34, 211, 238, 0.4);">
              <path d="M50,0 C100,100 0,200 50,400 C100,600 0,700 50,800 L0,800 L0,0 Z" />
            </svg>
          </div>
        </div>
      `;
    },
    pulse: (parent) => {
      parent.innerHTML = `
        <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
            <div class="pulse-circle" style="position: relative; overflow: hidden; border-radius: 50%; background: rgba(76, 5, 25, 0.4); box-shadow: 0 0 80px rgba(225, 29, 72, 0.15); width: 95vmin; height: 95vmin; transform: scale(0.3); transition: transform 1s ease-in-out, box-shadow 1s ease-in-out;">
                <div class="tide-fill" style="position: absolute; bottom: 0; left: 0; right: 0; width: 100%; background: linear-gradient(to top, rgba(190, 18, 60, 0.9), rgba(251, 146, 60, 0.8)); height: 30%; transition: height 1s ease-in-out;">
                    <svg class="animate-wave-slow" viewBox="0 0 800 100" fill="currentColor" preserveAspectRatio="none" style="position: absolute; bottom: 100%; width: 200%; left: 0; height: 8vh; color: rgba(251, 146, 60, 0.8); filter: drop-shadow(0 10px 8px rgba(0,0,0,0.3));">
                        <path d="M0,50 C100,20 200,80 400,50 C600,20 700,80 800,50 L800,100 L0,100 Z" />
                    </svg>
                    <svg class="animate-wave-fast" viewBox="0 0 800 100" fill="currentColor" preserveAspectRatio="none" style="position: absolute; bottom: 100%; width: 200%; left: -50%; height: 12vh; margin-bottom: -3vh; color: rgba(244, 63, 94, 0.6);">
                        <path d="M0,50 C100,80 200,20 400,50 C600,80 700,20 800,50 L800,100 L0,100 Z" />
                    </svg>
                </div>
            </div>
        </div>
      `;
    },
    stack: (parent) => {
      const layers = [
        { id: 1, side: 'right', bg: '#67d5e8', shadow: '#4dbbd0' }, 
        { id: 2, side: 'left',  bg: '#4d82f3', shadow: '#3361cc' }, 
        { id: 3, side: 'right', bg: '#8a3ff0', shadow: '#6523c0' }, 
        { id: 4, side: 'left',  bg: '#f08443', shadow: '#d46520' }, 
      ];
      let html = '<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">';
      html += '<div style="position: relative; width: 100%; max-width: 672px; display: flex; flex-direction: column; align-items: center; gap: 2px;">';
      layers.forEach((layer) => {
        const sideClass = layer.side === 'left' ? 'justify-content: flex-end;' : 'justify-content: flex-start;';
        const originClass = layer.side === 'left' ? 'transform-origin: right;' : 'transform-origin: left;';
        const radiusStyle = layer.side === 'left' ? 'border-radius: 999px 0 0 999px;' : 'border-radius: 0 999px 999px 0;';
        const shadowStyle = layer.side === 'left' ? 'right: 0; transform: translateX(50%);' : 'left: 0; transform: translateX(-50%);';
        
        html += `
          <div style="position: relative; width: 100%; height: 12vh; max-height: 100px; display: flex; justify-content: center; filter: drop-shadow(0 20px 13px rgba(0, 0, 0, 0.08));">
            <div style="width: 50%; display: flex; ${sideClass}">
              <div class="stack-block" style="background: ${layer.bg}; height: 100%; overflow: hidden; position: relative; ${originClass} width: 100%; max-width: 280px; transform: scaleX(0.15); ${radiusStyle} transition: transform 1s ease-in-out;">
                <div style="position: absolute; top: 0; bottom: 0; width: 60px; background: ${layer.shadow}; border-radius: 999px; ${shadowStyle}"></div>
              </div>
            </div>
          </div>
        `;
      });
      html += '</div></div>';
      parent.innerHTML = html;
    },
    paper: (parent) => {
      parent.innerHTML = `
        <div style="position: absolute; inset: 0; background: linear-gradient(to bottom right, #6366f1, #9333ea); overflow: hidden;">
          <div class="paper-inner" style="position: absolute; inset: 0; transform: scale(1) translate(0, 0); transition: transform 1s ease-in-out;">
            <svg class="absolute animate-wave-slow" viewBox="0 0 800 600" preserveAspectRatio="none" style="position: absolute; width: 150%; height: 150%; left: -10%; top: -10%; filter: drop-shadow(0 25px 35px rgba(0,0,0,0.5));">
              <path d="M0,100 C200,300 300,0 800,200 L800,600 L0,600 Z" fill="#9333ea"/>
            </svg>
            <svg class="absolute animate-wave-fast" viewBox="0 0 800 600" preserveAspectRatio="none" style="position: absolute; width: 150%; height: 150%; left: -20%; top: -5%; filter: drop-shadow(0 25px 35px rgba(0,0,0,0.4));">
              <path d="M0,250 C250,500 450,100 800,350 L800,600 L0,600 Z" fill="#f97316"/>
            </svg>
            <svg class="absolute animate-wave-slow" viewBox="0 0 800 600" preserveAspectRatio="none" style="position: absolute; width: 150%; height: 150%; left: -15%; top: 10%; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.4)); animation-direction: reverse;">
              <path d="M0,400 C300,200 500,600 800,450 L800,600 L0,600 Z" fill="#ec4899"/>
            </svg>
            <svg class="absolute animate-wave-fast" viewBox="0 0 800 600" preserveAspectRatio="none" style="position: absolute; width: 150%; height: 150%; left: -25%; top: 25%; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.3));">
              <path d="M0,500 C400,700 600,300 800,550 L800,600 L0,600 Z" fill="#eab308"/>
            </svg>
          </div>
        </div>
      `;
    },
    burst: (parent) => {
      let rays = '';
      [0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        if (i % 2 === 0) {
          rays += `
            <div style="position: absolute; display: flex; align-items: center; justify-content: center; transform: rotate(${deg}deg)">
                <div class="ray-pill" style="width: 32px; height: 96px; border-radius: 999px; background: linear-gradient(to bottom, #4ade80, #facc15); transform: translateY(-5vmin); opacity: 0.3; transition: all 1s ease-in-out; box-shadow: 0 4px 15px rgba(0,0,0,0.3);"></div>
            </div>
          `;
        } else {
          rays += `
            <div style="position: absolute; display: flex; align-items: center; justify-content: center; transform: rotate(${deg}deg)">
                <div class="ray-icon" style="display: flex; flex-direction: column; align-items: center; gap: 24px; transform: translateY(-5vmin) scale(0.5); opacity: 0.3; transition: all 1s ease-in-out;">
                    <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
                    <div style="color: white; font-weight: bold; font-size: 20px; transform: rotate(45deg);">+</div>
                    <div style="width: 24px; height: 24px; border: 1px solid rgba(255,255,255,0.4); border-radius: 50%;"></div>
                </div>
            </div>
          `;
        }
      });
      parent.innerHTML = `
        <div style="position: absolute; inset: 0; background: #244288; overflow: hidden; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; top: 40px; left: 40px; width: 256px; height: 256px; background: rgba(234, 179, 8, 0.2); border-radius: 50%; filter: blur(64px);"></div>
          <div style="position: absolute; bottom: 40px; right: 40px; width: 320px; height: 320px; background: rgba(6, 182, 212, 0.2); border-radius: 50%; filter: blur(64px);"></div>
          <div class="burst-hub" style="position: relative; width: 100%; height: 100%; max-width: 512px; max-height: 512px; display: flex; align-items: center; justify-content: center;">
            <div class="ring-1" style="position: absolute; border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; width: 160px; height: 160px; transform: scale(0.5); opacity: 0.3; transition: all 1s ease-out;"></div>
            <div class="ring-2" style="position: absolute; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 256px; height: 256px; transform: scale(0.5); opacity: 0.15; transition: all 1s ease-out;"></div>
            <div class="rays-layer" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
              ${rays}
            </div>
            <div class="hub-overlay" style="position: absolute; width: 128px; height: 128px; border-radius: 50%; z-index: 10; opacity: 0.6; mix-blend-mode: overlay; background: repeating-linear-gradient(45deg, transparent, transparent 5px, white 5px, white 10px); transform: translate(40%, -40%) scale(0.8); transition: transform 1s ease-in-out;"></div>
            <div class="hub-core" style="position: relative; z-index: 20; width: 192px; height: 192px; background: #ff2a70; border-radius: 50%; box-shadow: 0 0 50px rgba(255,42,112,0.4); transform: scale(0.8); transition: transform 1s ease-in-out;"></div>
          </div>
        </div>
      `;
    },
    fractal: (parent) => {
      parent.innerHTML = `
        <div class="fractal-container" style="background: #020617;">
          <div class="fractal-glow" style="position: absolute; border-radius: 50%; filter: blur(64px); width: 30vw; height: 30vw; background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%); transition: all 1s ease-in-out;"></div>
          <svg viewBox="-300 -350 600 550" class="fractal-svg" style="width: 90vw; max-width: 640px; color: #6366f1; transition: color 1s ease-in-out; overflow: visible; filter: drop-shadow(0 0 8px currentColor);">
            <g class="tree-root" style="transform: translate(0, 150px) scale(0.85); transition: transform 1s ease-in-out;">
               <!-- Tree branches will be injected via FractalHelper -->
            </g>
          </svg>
        </div>
      `;
      const root = parent.querySelector('.tree-root');
      FractalHelper.render(root, 85, 15, 8, false, '#67e8f9');
    },
    geometry: (parent) => {
      const numShapes = 12;
      let shapesHtml = '';
      for (let i = 0; i < numShapes; i++) {
        const angle = (i * 360) / numShapes;
        const colorClass = i % 2 === 0 ? 'border: 2px solid #22d3ee' : 'border: 2px solid #d946ef';
        shapesHtml += `
          <div class="geo-shape" style="position: absolute; width: 28vmin; height: 28vmin; left: -14vmin; top: -14vmin; border-radius: 15%; mix-blend-mode: screen; transform: rotate(${angle}deg) translateY(0vmin) scale(0.15); transition: all 1s ease-in-out; opacity: 0.4; ${colorClass}"></div>
        `;
      }
      parent.innerHTML = `
        <div class="geometry-container" style="background: #020617;">
           <div class="geo-glow" style="position: absolute; border-radius: 50%; filter: blur(64px); width: 15vmin; height: 15vmin; left: 50%; top: 50%; transform: translate(-50%, -50%); background: rgba(217, 70, 239, 0.15); transition: all 1s ease-in-out;"></div>
           <div class="geo-master" style="position: relative; width: 0; height: 0; transition: transform 1s ease-in-out;">
             ${shapesHtml}
           </div>
        </div>
      `;
    }
  };

  // Fractal Branch Helper (Static for vanilla rendition)
  const FractalHelper = {
    render: (parent, len, spread, depth, isLeft, leafColor) => {
        parent.innerHTML = FractalHelper.generateBranch(len, spread, depth, isLeft, leafColor);
    },
    generateBranch: (len, spread, depth, isLeft, leafColor) => {
        if (depth === 0) return '';
        const rotation = depth === 8 ? 0 : (isLeft ? -spread : spread);
        const actualLen = depth === 8 ? len * 2.2 : len;
        const curveAmount = depth === 8 ? 0 : (isLeft ? -actualLen * 0.25 : actualLen * 0.25);
        const opacity = 0.3 + (depth / 8) * 0.7;

        let children = '';
        if (depth > 1) {
            children = `
                <g transform="translate(0, ${-actualLen})">
                    ${FractalHelper.generateBranch(len * 0.75, spread, depth - 1, true, leafColor)}
                    ${FractalHelper.generateBranch(len * 0.75, spread, depth - 1, false, leafColor)}
                </g>
            `;
        } else {
            children = `<circle cx="0" cy="${-actualLen}" r="4.5" style="fill: ${leafColor}; transition: fill 1s ease-in-out;" />`;
        }

        return `
            <g class="fractal-branch" data-depth="${depth}" data-is-left="${isLeft}" style="transform: rotate(${rotation}deg); transition: transform 0.3s ease-out; will-change: transform">
                <path d="M 0 0 Q ${curveAmount} ${-actualLen / 2} 0 ${-actualLen}" 
                      stroke="currentColor" stroke-width="${depth * 1.5}" stroke-linecap="round" fill="none"
                      style="opacity: ${opacity};" />
                ${children}
            </g>
        `;
    },
    update: (parent, spread, leafColor, durMs) => {
        const branches = parent.querySelectorAll('.fractal-branch');
        branches.forEach(b => {
             const depth = parseInt(b.dataset.depth, 10);
             const isLeft = b.dataset.isLeft === 'true';
             const rotation = depth === 8 ? 0 : (isLeft ? -spread : spread);
             b.style.transition = `transform ${durMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
             b.style.transform = `rotate(${rotation}deg)`;
        });
        const leaves = parent.querySelectorAll('circle');
        leaves.forEach(l => {
             l.style.transition = `fill ${durMs}ms ease-in-out`;
             l.style.fill = leafColor;
        });
    }

  };

  return {
    start() {
      currentStyle = $('#bar-style').value;
      const containers = [$('#preview-visualizer'), $('#session-visualizer')];
      
      const isClassicBar = ['aurora', 'gradient', 'phase', 'pulse_classic', 'classic'].includes(currentStyle);
      const previewBar = $('#preview-bar');
      const sessionBar = $('#breathing-bar');

      if (previewBar) previewBar.style.display = isClassicBar ? 'block' : 'none';
      if (sessionBar) sessionBar.style.display = isClassicBar ? 'block' : 'none';

      containers.forEach(c => {
        if (!c) return;
        c.innerHTML = '';
        if (renderers[currentStyle]) {
          renderers[currentStyle](c);
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });

      // Classic fills
      [fillClassic(), fillPreview()].forEach(el => {
        if (el) {
          el.style.transitionDuration = '0s';
          el.style.height = '0%';
        }
      });
    },

    animatePhase(phase, durationMs) {
      const expanding = isExpanding(phase);
      const durSec = (durationMs / 1000).toFixed(2);
      const durMs = durationMs;

      // 1. Classic Bar Implementation
      const fills = [fillClassic(), fillPreview()];
      fills.forEach(el => {
        if (!el) return;
        if (phase === 'inhale') {
          el.style.transitionDuration = `${durSec}s`;
          el.style.transitionTimingFunction = 'ease-in-out';
          el.style.height = '100%';
        } else if (phase === 'exhale') {
          el.style.transitionDuration = `${durSec}s`;
          el.style.transitionTimingFunction = 'ease-in-out';
          el.style.height = '0%';
        } else {
          el.style.transitionDuration = '0s';
        }
      });

      // 2. Visualizers Implementation
      const activeStyle = currentStyle;
      const activeContainers = [$('#preview-visualizer'), $('#session-visualizer')];

      activeContainers.forEach(container => {
        if (!container || !renderers[activeStyle]) return;

        if (activeStyle === 'tide') {
            const fill = container.querySelector('.tide-fill');
            fill.style.transition = `height ${durMs}ms ease-in-out`;
            fill.style.height = expanding ? '100%' : '10%';
        } else if (activeStyle === 'breeze') {
            const fill = container.querySelector('.breeze-fill');
            fill.style.transition = `width ${durMs}ms ease-in-out`;
            fill.style.width = expanding ? '100%' : '10%';
        } else if (activeStyle === 'pulse') {
            const circle = container.querySelector('.pulse-circle');
            const fill = container.querySelector('.tide-fill');
            circle.style.transition = `transform ${durMs}ms ease-in-out, box-shadow ${durMs}ms ease-in-out`;
            circle.style.transform = expanding ? 'scale(1)' : 'scale(0.3)';
            circle.style.boxShadow = expanding ? '0 0 100px 20px rgba(244,63,94,0.3)' : '0 0 0px 0px rgba(244,63,94,0)';
            fill.style.transition = `height ${durMs}ms ease-in-out`;
            fill.style.height = expanding ? '110%' : '30%';
        } else if (activeStyle === 'stack') {
            const blocks = container.querySelectorAll('.stack-block');
            blocks.forEach(b => {
                b.style.transition = `transform ${durMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                b.style.transform = `scaleX(${expanding ? 1 : 0.15})`;
            });

        } else if (activeStyle === 'paper') {
            const inner = container.querySelector('.paper-inner');
            inner.style.transition = `transform ${durMs}ms ease-in-out`;
            inner.style.transform = expanding ? 'scale(1.1) translate(-2%, 2%)' : 'scale(1) translate(0, 0)';
        } else if (activeStyle === 'burst') {
            const hub = container.querySelector('.burst-hub');
            const rings = [hub.querySelector('.ring-1'), hub.querySelector('.ring-2')];
            const core = hub.querySelector('.hub-core');
            const overlay = hub.querySelector('.hub-overlay');
            const pills = hub.querySelectorAll('.ray-pill');
            const icons = hub.querySelectorAll('.ray-icon');

            const scaleCore = expanding ? 'scale(1.4)' : 'scale(0.8)';
            const scaleRing = expanding ? 'scale(2.5)' : 'scale(0.5)';
            const rayTrans = expanding ? '20vmin' : '5vmin';
            const rayOpac = expanding ? '1' : '0.3';
            const spring = `transform ${durMs}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${durMs}ms ease-out`;
            const smooth = `transform ${durMs}ms ease-out, opacity ${durMs}ms ease-out`;

            rings.forEach((r, i) => {
                r.style.transition = smooth;
                r.style.transform = scaleRing;
                r.style.opacity = expanding ? (i === 0 ? '1' : '0.5') : (i === 0 ? '0.3' : '0.15');
            });
            core.style.transition = `transform ${durMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            core.style.transform = scaleCore;
            overlay.style.transition = `transform ${durMs}ms ease-in-out`;
            overlay.style.transform = `translate(40%, -40%) ${scaleCore}`;

            pills.forEach((p, i) => {
                p.style.transition = spring;
                p.style.transitionDelay = `${i * 20}ms`;
                p.style.transform = `translateY(-${rayTrans})`;
                p.style.opacity = rayOpac;
            });
            icons.forEach(icon => {
                icon.style.transition = `transform ${durMs}ms ease-out, opacity ${durMs}ms ease-out`;
                icon.style.transform = `translateY(-${rayTrans}) scale(${expanding ? 1.5 : 0.5})`;
                icon.style.opacity = rayOpac;
            });
        } else if (activeStyle === 'fractal') {
            const glow = container.querySelector('.fractal-glow');
            const svg = container.querySelector('.fractal-svg');
            const root = container.querySelector('.tree-root');
            
            glow.style.transition = `all ${durMs}ms ease-in-out`;
            glow.style.width = expanding ? '70vw' : '30vw';
            glow.style.height = expanding ? '70vw' : '30vw';
            glow.style.background = `radial-gradient(circle, ${expanding ? 'rgba(244, 114, 182, 0.15)' : 'rgba(99, 102, 241, 0.15)'} 0%, transparent 70%)`;
            
            svg.style.transition = `color ${durMs}ms ease-in-out`;
            svg.style.color = expanding ? '#f472b6' : '#6366f1';
            
            root.style.transition = `transform ${durMs}ms ease-in-out`;
            root.style.transform = `translate(0, 150px) ${expanding ? 'scale(1.15)' : 'scale(0.85)'}`;
            
            FractalHelper.update(root, expanding ? 70 : 15, expanding ? '#fde047' : '#67e8f9', durMs);

        } else if (activeStyle === 'geometry') {
            const glow = container.querySelector('.geo-glow');
            const master = container.querySelector('.geo-master');
            const shapes = container.querySelectorAll('.geo-shape');

            glow.style.transition = `all ${durMs}ms ease-in-out`;
            glow.style.width = expanding ? '45vmin' : '15vmin';
            glow.style.height = expanding ? '45vmin' : '15vmin';
            glow.style.background = expanding ? 'rgba(34, 211, 238, 0.15)' : 'rgba(217, 70, 239, 0.15)';

            master.style.transition = `transform ${durMs}ms ease-in-out`;
            master.style.transform = expanding ? 'rotate(45deg)' : 'rotate(0deg)';

            shapes.forEach((s, i) => {
                const angle = (i * 360) / shapes.length;
                s.style.transition = `all ${durMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                s.style.borderRadius = expanding ? '50%' : '15%';
                s.style.transform = `rotate(${angle}deg) translateY(${expanding ? '14vmin' : '0vmin'}) scale(${expanding ? 1 : 0.15}) rotate(${expanding ? '180deg' : '0deg'})`;
                s.style.opacity = expanding ? '0.8' : '0.4';
                const even = i % 2 === 0;
                const glowCol = even ? 'rgba(34, 211, 238, 0.4)' : 'rgba(217, 70, 239, 0.4)';
                s.style.boxShadow = expanding ? `0 0 15px ${glowCol}, inset 0 0 15px ${glowCol}` : 'none';
            });
        }
      });
    },

    reset() {
      const fills = [fillClassic(), fillPreview()];
      fills.forEach(el => {
        if (el) {
          el.style.transitionDuration = '0s';
          el.style.height = '0%';
        }
      });
      [$('#preview-visualizer'), $('#session-visualizer')].forEach(c => {
        if (c) c.innerHTML = '';
      });
    },

    destroy() {
      this.reset();
    },
  };
}

// Update the API shape for compatibility and provide the labels
export function getAnimationStyles() {
  return [
      { id: 'aurora', label: 'Aurora' },
      { id: 'gradient', label: 'Gradient' },
      { id: 'phase', label: 'Phase' },
      { id: 'pulse_classic', label: 'Pulse (Classic)' },
      { id: 'classic', label: 'Classic' },
      { id: 'tide', label: 'Ocean Tide' },
      { id: 'breeze', label: 'Breeze' },
      { id: 'pulse', label: 'Liquid Pulse' },
      { id: 'stack', label: 'Color Stack' },

      { id: 'paper', label: 'Paper Waves' },
      { id: 'burst', label: 'Abstract Burst' },
      { id: 'fractal', label: 'Fractal Tree' },
      { id: 'geometry', label: 'Sacred Geometry' }
  ];
}
