/**
 * AETHERIA — Core Interactive Experience Engine
 * Pure Vanilla JavaScript implementation with Web Audio API, Canvas Graphics, and 3D Parallax.
 */

(function () {
  'use strict';

  /* ==========================================================================
     Global State & Configuration
     ========================================================================== */
  const state = {
    userName: localStorage.getItem('aetheria_user_name') || 'Explorer',
    theme: localStorage.getItem('aetheria_theme') || 'nebula',
    audioEnabled: localStorage.getItem('aetheria_audio') === 'true',
    gravityMode: false,
    invertTilt: false,
    interactionsCount: 0,
    fps: 60,
    frameCount: 0,
    lastFpsUpdate: performance.now(),
    mouse: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      active: false,
      radius: 140
    }
  };

  /* Theme Color Palette Map for Canvas Particles */
  const THEME_PALETTES = {
    nebula: ['#00f5d4', '#7b2cbf', '#f72585', '#4361ee'],
    solar: ['#ffb703', '#fb8500', '#e63946', '#ffd166'],
    emerald: ['#10b981', '#06d6a0', '#059669', '#34d399'],
    cyber: ['#00ffff', '#d900ff', '#ff0055', '#7928ca']
  };

  /* ==========================================================================
     Web Audio API Procedural Synthesizer
     ========================================================================== */
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  /**
   * Synthesize a pure ethereal celestial chime tone
   * @param {number} freq Frequency in Hz
   * @param {number} duration Duration in seconds
   * @param {number} volume Amplitude (0 to 1)
   */
  function playChime(freq = 440, duration = 0.8, volume = 0.08) {
    if (!state.audioEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      // Warm mellow tone using triangle/sine blend
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      // Low-pass filter for crystal glass smoothness
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, audioCtx.currentTime);

      // Smooth exponential envelope
      const now = audioCtx.currentTime;
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (err) {
      console.warn('Audio synthesis note could not be rendered:', err);
    }
  }

  /**
   * Play a lush pentatonic chord
   */
  function playCelestialChord() {
    initAudio();
    const chordPitches = [329.63, 392.00, 493.88, 587.33, 783.99]; // E Minor Pentatonic / Celestial
    chordPitches.forEach((pitch, i) => {
      setTimeout(() => {
        playChime(pitch, 1.4, 0.06);
      }, i * 65);
    });
    incrementInteraction();
  }

  /* ==========================================================================
     Time Greeting & Real-time Live Clock
     ========================================================================== */
  function updateGreetingAndClock() {
    const greetingBadge = document.getElementById('greeting-badge');
    const liveClock = document.getElementById('live-clock');
    const now = new Date();
    const hours = now.getHours();

    let greetingText = 'Good Evening';
    if (hours >= 5 && hours < 12) {
      greetingText = 'Good Morning';
    } else if (hours >= 12 && hours < 17) {
      greetingText = 'Good Afternoon';
    } else if (hours >= 17 && hours < 22) {
      greetingText = 'Good Evening';
    } else {
      greetingText = 'Night Owl Mode';
    }

    if (greetingBadge) {
      greetingBadge.textContent = greetingText;
    }

    if (liveClock) {
      liveClock.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }

  /* ==========================================================================
     Personalization & User Profile
     ========================================================================== */
  function setupPersonalization() {
    const nameDisplay = document.getElementById('display-user-name');
    const nameInput = document.getElementById('user-name-input');
    const nameForm = document.getElementById('name-form');

    function applyName(name) {
      const cleanName = (name || '').trim();
      const finalName = cleanName.length > 0 ? cleanName : 'Explorer';
      state.userName = finalName;
      localStorage.setItem('aetheria_user_name', finalName);

      if (nameDisplay) {
        nameDisplay.style.opacity = '0';
        setTimeout(() => {
          nameDisplay.textContent = finalName;
          nameDisplay.style.opacity = '1';
        }, 150);
      }
      if (nameInput && nameInput.value !== finalName && finalName !== 'Explorer') {
        nameInput.value = finalName;
      }
    }

    applyName(state.userName);

    if (nameForm) {
      nameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (nameInput) {
          applyName(nameInput.value);
          playChime(587.33, 0.6, 0.1);
          incrementInteraction();
        }
      });
    }

    if (nameDisplay) {
      nameDisplay.addEventListener('click', () => {
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      });
    }
  }

  /* ==========================================================================
     Theme Switcher Logic
     ========================================================================== */
  function setupThemeSwitcher() {
    const themePills = document.querySelectorAll('.theme-pill');
    
    function applyTheme(themeKey) {
      state.theme = themeKey;
      document.documentElement.setAttribute('data-theme', themeKey);
      localStorage.setItem('aetheria_theme', themeKey);

      themePills.forEach(pill => {
        pill.classList.toggle('active', pill.dataset.set === themeKey);
      });

      // Subtle feedback chime
      playChime(440, 0.3, 0.05);
      incrementInteraction();
    }

    applyTheme(state.theme);

    themePills.forEach(pill => {
      pill.addEventListener('click', () => {
        applyTheme(pill.dataset.set);
      });
    });
  }

  /* ==========================================================================
     Audio Toggle
     ========================================================================== */
  function setupAudioToggle() {
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioBtnText = document.getElementById('audio-btn-text');

    function updateAudioUI() {
      if (!audioBtn) return;
      if (state.audioEnabled) {
        audioBtn.classList.add('playing');
        if (audioBtnText) audioBtnText.textContent = 'Audio On';
      } else {
        audioBtn.classList.remove('playing');
        if (audioBtnText) audioBtnText.textContent = 'Audio FX';
      }
    }

    updateAudioUI();

    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        initAudio();
        state.audioEnabled = !state.audioEnabled;
        localStorage.setItem('aetheria_audio', state.audioEnabled);
        updateAudioUI();

        if (state.audioEnabled) {
          playCelestialChord();
        }
      });
    }
  }

  /* ==========================================================================
     Interaction Tracker & Metrics
     ========================================================================== */
  function incrementInteraction() {
    state.interactionsCount++;
    const counterEl = document.getElementById('metric-interaction');
    if (counterEl) {
      counterEl.textContent = state.interactionsCount;
    }
  }

  /* ==========================================================================
     3D Card Tilt & Holographic Specular Glare
     ========================================================================== */
  function setupTiltCard() {
    const card = document.getElementById('hero-tilt-card');
    const glare = document.getElementById('specular-glare');
    if (!card) return;

    let bounds = card.getBoundingClientRect();

    window.addEventListener('resize', () => {
      bounds = card.getBoundingClientRect();
    });

    card.addEventListener('mousemove', (e) => {
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;

      const normX = (x / bounds.width - 0.5) * 2;
      const normY = (y / bounds.height - 0.5) * 2;

      const multiplier = state.invertTilt ? -18 : 18;
      const rotX = -normY * multiplier;
      const rotY = normX * multiplier;

      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

      if (glare) {
        const pctX = (x / bounds.width) * 100;
        const pctY = (y / bounds.height) * 100;
        card.style.setProperty('--glare-x', `${pctX}%`);
        card.style.setProperty('--glare-y', `${pctY}%`);
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });

    // Invert Tilt Widget Button
    const invertBtn = document.getElementById('btn-tilt-invert');
    const tiltStatus = document.getElementById('tilt-status');
    if (invertBtn) {
      invertBtn.addEventListener('click', () => {
        state.invertTilt = !state.invertTilt;
        if (tiltStatus) {
          tiltStatus.textContent = state.invertTilt ? 'Inverted (3D)' : 'Standard (3D)';
        }
        playChime(523.25, 0.4, 0.08);
        incrementInteraction();
      });
    }
  }

  /* ==========================================================================
     Canvas Particle Constellation Engine
     ========================================================================== */
  const canvas = document.getElementById('constellation-canvas');
  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const particles = [];
  const burstParticles = [];
  const PARTICLE_COUNT = 110;

  class StarParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = initial ? Math.random() * width : Math.random() * width;
      this.y = initial ? Math.random() * height : (Math.random() < 0.5 ? -10 : height + 10);
      this.radius = Math.random() * 2 + 1;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.baseAlpha = Math.random() * 0.6 + 0.2;
      this.alpha = this.baseAlpha;
      this.colorIndex = Math.floor(Math.random() * 4);
    }

    update() {
      if (state.gravityMode && state.mouse.active) {
        // Gravitational attraction towards cursor
        const dx = state.mouse.x - this.x;
        const dy = state.mouse.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 10 && dist < 350) {
          const force = (350 - dist) / 350 * 0.04;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
      } else if (state.mouse.active) {
        // Gentle repulsion
        const dx = this.x - state.mouse.x;
        const dy = this.y - state.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < state.mouse.radius && dist > 0) {
          const force = (state.mouse.radius - dist) / state.mouse.radius * 0.12;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
      }

      // Natural drag
      this.vx *= 0.985;
      this.vy *= 0.985;

      this.x += this.vx;
      this.y += this.vy;

      // Wrap-around screen bounds
      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20;
      if (this.y > height + 20) this.y = -20;
    }

    draw() {
      const palette = THEME_PALETTES[state.theme] || THEME_PALETTES.nebula;
      const color = palette[this.colorIndex % palette.length];

      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class BurstParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.radius = Math.random() * 3 + 1.5;
      this.life = 1;
      this.decay = Math.random() * 0.02 + 0.015;
      const palette = THEME_PALETTES[state.theme] || THEME_PALETTES.nebula;
      this.color = palette[Math.floor(Math.random() * palette.length)];
    }

    update() {
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
    }

    draw() {
      if (this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new StarParticle());
    }
  }

  function triggerNovaBurst(x, y, count = 45) {
    const burstX = x !== undefined ? x : width / 2;
    const burstY = y !== undefined ? y : height / 2;

    for (let i = 0; i < count; i++) {
      burstParticles.push(new BurstParticle(burstX, burstY));
    }

    playCelestialChord();
  }

  function renderLoop(timestamp) {
    // FPS tracking
    state.frameCount++;
    if (timestamp - state.lastFpsUpdate >= 1000) {
      state.fps = Math.round((state.frameCount * 1000) / (timestamp - state.lastFpsUpdate));
      state.frameCount = 0;
      state.lastFpsUpdate = timestamp;
      const fpsDisplay = document.getElementById('fps-display');
      if (fpsDisplay) {
        fpsDisplay.textContent = state.fps;
      }
    }

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Update & Draw Base Particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      // Proximity linking lines
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < 90) {
          const alpha = (1 - dist / 90) * 0.16;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Update & Draw Explosive Burst Particles
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      burstParticles[i].update();
      burstParticles[i].draw();
      if (burstParticles[i].life <= 0) {
        burstParticles.splice(i, 1);
      }
    }

    requestAnimationFrame(renderLoop);
  }

  /* ==========================================================================
     Mouse & Touch Tracking
     ========================================================================== */
  function setupMouseTracking() {
    const mouseGlow = document.getElementById('mouse-glow');

    window.addEventListener('mousemove', (e) => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
      state.mouse.active = true;

      if (mouseGlow) {
        mouseGlow.style.left = `${e.clientX}px`;
        mouseGlow.style.top = `${e.clientY}px`;
      }
    });

    window.addEventListener('mouseleave', () => {
      state.mouse.active = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        state.mouse.x = e.touches[0].clientX;
        state.mouse.y = e.touches[0].clientY;
        state.mouse.active = true;
      }
    }, { passive: true });
  }

  /* ==========================================================================
     Widgets and Button Triggers
     ========================================================================== */
  function setupActionButtons() {
    // Nova Pulse Hero Button
    const heroNovaBtn = document.getElementById('nova-pulse-hero-btn');
    if (heroNovaBtn) {
      heroNovaBtn.addEventListener('click', (e) => {
        const rect = heroNovaBtn.getBoundingClientRect();
        triggerNovaBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 50);
        incrementInteraction();
      });
    }

    // Master Playground Nova Trigger
    const masterBurstTrigger = document.getElementById('master-burst-trigger');
    if (masterBurstTrigger) {
      masterBurstTrigger.addEventListener('click', (e) => {
        const rect = masterBurstTrigger.getBoundingClientRect();
        triggerNovaBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 90);
        incrementInteraction();
      });
    }

    // Toggle Gravity Button
    const gravityBtn = document.getElementById('btn-toggle-gravity');
    const gravityStatus = document.getElementById('gravity-status');
    if (gravityBtn) {
      gravityBtn.addEventListener('click', () => {
        state.gravityMode = !state.gravityMode;
        if (gravityStatus) {
          gravityStatus.textContent = state.gravityMode ? 'Gravity Well Active' : 'Float Mode';
        }
        playChime(state.gravityMode ? 659.25 : 392.00, 0.4, 0.08);
        incrementInteraction();
      });
    }

    // Harmonic Chord Button
    const chordBtn = document.getElementById('btn-play-harmonic-chord');
    if (chordBtn) {
      chordBtn.addEventListener('click', () => {
        playCelestialChord();
      });
    }

    // Subtle audio chime on hover for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, idx) => {
      card.addEventListener('mouseenter', () => {
        const frequencies = [329.63, 392.00, 493.88];
        playChime(frequencies[idx % frequencies.length], 0.3, 0.03);
      });
    });
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    resizeCanvas();
    initParticles();
    requestAnimationFrame(renderLoop);

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });

    updateGreetingAndClock();
    setInterval(updateGreetingAndClock, 1000);

    setupPersonalization();
    setupThemeSwitcher();
    setupAudioToggle();
    setupTiltCard();
    setupMouseTracking();
    setupActionButtons();

    // Unlock Web Audio on first user gesture
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    console.log('%c✦ AETHERIA ENGINE INITIALIZED ✦', 'color: #00f5d4; font-weight: bold; font-size: 14px;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
