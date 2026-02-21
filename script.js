// ===== Utilities =====
function $(id) {
  return document.getElementById(id);
}

function scrollToSection(id) {
  const el = $(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Tour (auto-scroll sequence) =====
const tour = {
  active: false,
  timers: [],
  cancelBound: false
};

function clearTourTimers() {
  while (tour.timers.length) {
    clearTimeout(tour.timers.pop());
  }
}

function cancelTour() {
  tour.active = false;
  clearTourTimers();
}

function schedule(fn, ms) {
  const id = setTimeout(fn, ms);
  tour.timers.push(id);
  return id;
}

function bindCancelOnUserIntent() {
  if (tour.cancelBound) return;
  tour.cancelBound = true;

  const cancel = () => {
    if (!tour.active) return;
    cancelTour();
  };

  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', (e) => {
    const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
    if (keys.includes(e.key)) cancel();
  });
}

// ===== Typewriter =====
let typewriterInterval = null;
let currentText = '';

// Change this message anytime ❤️
const fullText =
  "Happy Birthday Calyahita Mardiana Putri [:D] Semoga selalu sehat, panjang umur, dimudahkan semua urusannya, dilancarkan rezekinya, dan makin bahagia setiap hari. Semoga semua mimpi dan rencana baiknya satu per satu jadi nyata. Tetap jadi Calya yang hangat, kuat, dan penuh senyum ya. <3";

function resetTypewriter() {
  if (typewriterInterval) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }
  currentText = '';
  const el = $('typewriter-text');
  if (el) el.textContent = '';
}

function startTypewriter(onDone) {
  resetTypewriter();

  const el = $('typewriter-text');
  if (!el) return;

  let index = 0;
  typewriterInterval = setInterval(() => {
    if (index < fullText.length) {
      currentText += fullText[index];
      el.textContent = currentText;
      index++;
    } else {
      clearInterval(typewriterInterval);
      typewriterInterval = null;
      if (typeof onDone === 'function') onDone();
    }
  }, 45);
}

// ===== Global Music =====
let bgMusic = null;
let musicToggle = null;
let musicOn = false;

function initMusic() {
  bgMusic = $('bg-music');
  musicToggle = $('music-toggle');

  if (bgMusic) {
    bgMusic.volume = 0.7;
    bgMusic.addEventListener('play', () => {
      musicOn = true;
      updateMusicButton();
    });
    bgMusic.addEventListener('pause', () => {
      musicOn = false;
      updateMusicButton();
    });
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      toggleMusic();
      playSound('select');
    });
  }

  updateMusicButton();
}

function updateMusicButton() {
  if (!musicToggle) return;

  musicToggle.textContent = musicOn ? 'MUSIC: ON' : 'MUSIC: OFF';
  musicToggle.classList.toggle('is-success', musicOn);
  musicToggle.classList.toggle('is-error', !musicOn);
}

function startMusic() {
  if (!bgMusic) initMusic();
  if (!bgMusic) return;

  if (!musicOn) {
    bgMusic.play().catch(() => {
    });
  }
}

function toggleMusic() {
  if (!bgMusic) initMusic();
  if (!bgMusic) return;

  if (musicOn) {
    bgMusic.pause();
  } else {
    bgMusic.play().catch(() => {});
  }
}

// ===== Buttons: START + BACK =====
function startGame() {
  playSound('start');
  startMusic();

  bindCancelOnUserIntent();
  cancelTour();
  tour.active = true;

  // Speech
  scrollToSection('speech-section');
  startTypewriter(() => {
    if (!tour.active) return;

    // After message typed, go to Photos
    schedule(() => {
      if (!tour.active) return;
      playSound('select');
      scrollToSection('gallery-section');

      // After a while on gallery, go to Letter
      schedule(() => {
        if (!tour.active) return;
        tryGoToMessage();
      }, 12000);
    }, 900);
  });
}

function backToStart() {
  playSound('back');
  cancelTour();
  scrollToSection('start-screen');
}

function tryGoToMessage() {
  const modal = $('photo-modal');
  if (modal && modal.classList.contains('active')) {
    // If the photo modal is open, wait a bit and try again.
    schedule(() => {
      if (!tour.active) return;
      tryGoToMessage();
    }, 1500);
    return;
  }

  playSound('select');
  scrollToSection('message-section');
  tour.active = false;
}

// ===== Photo Modal =====
function openPhoto(photoId) {
  const modal = $('photo-modal');
  const title = $('modal-title');

  if (modal && title) {
    title.textContent = `PHOTO ${photoId}`;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeModal() {
  const modal = $('photo-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
}

document.addEventListener('click', (e) => {
  const modal = $('photo-modal');
  if (modal && e.target === modal) {
    closeModal();
  }
});

// ===== Sound Effects (tiny retro beeps) =====
let sfxContext = null;
function getSfxContext() {
  if (!sfxContext) {
    sfxContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sfxContext;
}

async function playSound(type) {
  try {
    const ac = getSfxContext();
    if (ac.state === 'suspended') await ac.resume();

    const now = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.connect(gain);
    gain.connect(ac.destination);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    if (type === 'start') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.05); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.10); // G5
    } else if (type === 'select') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(659.25, now); // E5
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392.0, now); // G4
    }

    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // ignore
  }
}

// ===== Pixel Balloon Intro (finite; ends when all balloons are gone) =====
let introRunning = false;
let introAudioContext = null;
let introSfxPlayed = false;

function getIntroAudioContext() {
  if (!introAudioContext) {
    introAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return introAudioContext;
}

async function tryPlayIntroSfx() {
  if (introSfxPlayed) return;
  try {
    const ac = getIntroAudioContext();
    if (ac.state === 'suspended') await ac.resume();

    const now = ac.currentTime;

    const master = ac.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.60);
    master.connect(ac.destination);

    // Little sparkle
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      const osc = ac.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + i * 0.06);

      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, now + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.08, now + i * 0.06 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.08);

      osc.connect(g);
      g.connect(master);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.09);
    });

    introSfxPlayed = true;
  } catch {
    // ignore
  }
}

function initBalloonIntro() {
  const overlay = $('balloon-intro');
  const canvas = $('balloon-canvas');
  const skipBtn = $('skip-intro');
  if (!overlay || !canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;

  const palette = [
    { base: '#ff7aa2', hi: '#ffd1dc' },
    { base: '#7cf0d6', hi: '#d6fff6' },
    { base: '#ffd166', hi: '#fff0c2' },
    { base: '#9b8cff', hi: '#e3ddff' },
    { base: '#ff9f80', hi: '#ffe0d6' },
    { base: '#8be28b', hi: '#ddffdd' },
    { base: '#77b6ff', hi: '#d7ebff' }
  ];

  // Pixel balloon sprite (12x14). 0 empty, 1 fill, 2 highlight.
  const sprite = [
    '000111100000',
    '001111111000',
    '011111111100',
    '111111111110',
    '111112211110',
    '111111111110',
    '111111111110',
    '011111111100',
    '001111111000',
    '000111100000',
    '000011000000', // knot
    '000001000000', // string
    '000001000000',
    '000001000000'
  ];
  const sw = sprite[0].length;
  const sh = sprite.length;

  let w = window.innerWidth;
  let h = window.innerHeight;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  resize();
  window.addEventListener('resize', resize);

  function drawPixelBalloon(x, y, px, base, hi) {
    const outline = new Set();
    const filled = new Set();
    const key = (cx, cy) => cx + ',' + cy;

    for (let r = 0; r < sh; r++) {
      const row = sprite[r];
      for (let c = 0; c < sw; c++) {
        if (row[c] !== '0') filled.add(key(c, r));
      }
    }

    const dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    filled.forEach((k) => {
      const [c, r] = k.split(',').map((v) => parseInt(v, 10));
      dirs.forEach(([dc, dr]) => {
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= sw || nr >= sh) return;
        const nk = key(nc, nr);
        if (!filled.has(nk)) outline.add(nk);
      });
    });

    // Outline
    ctx.fillStyle = '#111';
    outline.forEach((k) => {
      const [c, r] = k.split(',').map((v) => parseInt(v, 10));
      ctx.fillRect(Math.round(x + c * px), Math.round(y + r * px), px, px);
    });

    // Fill + highlight
    for (let r = 0; r < sh; r++) {
      const row = sprite[r];
      for (let c = 0; c < sw; c++) {
        const v = row[c];
        if (v === '0') continue;
        ctx.fillStyle = v === '2' ? hi : base;
        ctx.fillRect(Math.round(x + c * px), Math.round(y + r * px), px, px);
      }
    }

    // String (subtle)
    ctx.fillStyle = '#c7c7c7';
    const stringX = x + 5 * px;
    const stringY = y + 11 * px;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(Math.round(stringX), Math.round(stringY + i * px), px, px);
    }
  }

  function makeBalloon(seedY) {
    const p = palette[Math.floor(Math.random() * palette.length)];
    const px = 4 + Math.floor(Math.random() * 4); // 4..7
    const bw = sw * px;
    const bh = sh * px;

    const baseX = Math.random() * (w - bw);
    return {
      baseX,
      x: baseX,
      y: seedY,
      px,
      bw,
      bh,
      // px/ms (tuned so the intro lasts a few seconds)
      speed: (0.12 + Math.random() * 0.10) * (px / 5),
      drift: 6 + Math.random() * 14,
      wobble: 0.8 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      base: p.base,
      hi: p.hi
    };
  }

  // Enough balloons to feel "full screen"
  const count = Math.min(90, Math.max(42, Math.floor((w * h) / 16000)));
  const balloons = [];
  for (let i = 0; i < count; i++) {
    // Spread them across the screen (and a little below)
    const seedY = (i / count) * (h * 1.15) + Math.random() * 18;
    balloons.push(makeBalloon(seedY));
  }

  introRunning = true;
  let lastT = performance.now();

  function endIntro() {
    introRunning = false;
    overlay.classList.add('hidden');
    document.body.classList.remove('intro-active');

    setTimeout(() => {
      overlay.style.display = 'none';
    }, 700);
  }

  function frame(t) {
    if (!introRunning) return;

    const dt = Math.min(32, t - lastT);
    lastT = t;

    ctx.clearRect(0, 0, w, h);

    const tt = t * 0.001;
    let alive = 0;

    for (let i = 0; i < balloons.length; i++) {
      const b = balloons[i];
      if (b.y + b.bh < -40) continue;

      b.y -= b.speed * dt;
      b.x = b.baseX + Math.sin(tt * b.wobble + b.phase) * b.drift;

      drawPixelBalloon(b.x, b.y, b.px, b.base, b.hi);
      alive++;
    }

    if (alive <= 0) {
      endIntro();
      return;
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  // Try playing SFX on first user gesture (autoplay safe)
  const onFirstGesture = () => {
    tryPlayIntroSfx();
  };
  window.addEventListener('pointerdown', onFirstGesture, { once: true });
  window.addEventListener('keydown', onFirstGesture, { once: true });

  // Skip button
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tryPlayIntroSfx();
      endIntro();
    });
  }
}

// ===== Keyboard shortcuts =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // Enter starts only when user is at the start section.
    const start = $('start-screen');
    if (start) {
      const top = start.getBoundingClientRect().top;
      if (Math.abs(top) < 60) startGame();
    }
  }

  if (e.key === 'Escape') {
    backToStart();
  }
});

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initMusic();
  initBalloonIntro();

  // Click sounds (avoid double-trigger on START & music toggle)
  document.querySelectorAll('.back-btn, .photo-slot, .intro-skip').forEach((el) => {
    el.addEventListener('click', () => playSound('select'));
  });

  // Mobile nicety
  document.addEventListener('touchstart', function () {}, { passive: true });

  console.log('%c HAPPY BIRTHDAY! ', 'background: #ff1493; color: #fff; font-size: 20px; font-family: monospace;');
});
