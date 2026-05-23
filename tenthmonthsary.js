/* ============================================================
   tenthmonthsary.js  —  ENHANCED CINEMATIC EDITION
   Mikhail & Chachie — 10 Months
   ============================================================ */

'use strict';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ── State ── */
const state = {
  loaderDone:     false,
  heroSlideIndex: 0,
  heroSlides:     [],
  heroSlideTimer: null,
  mouseX: 0,
  mouseY: 0,
  scrollY: 0,
};

/* ── Utility ── */
const qs    = (sel, root = document) => root.querySelector(sel);
const qsa   = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp  = (a, b, t) => a + (b - a) * t;

function formatTime(s) {
  if (!isFinite(s)) return '0:00';
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/* ── Inject ambient DOM elements (non-text) ── */
function injectAmbientElements() {
  /* Light leak layer */
  const leak = document.createElement('div');
  leak.className = 'light-leak';
  document.body.appendChild(leak);

  /* Ambient orbs */
  ['ambient-orb ambient-orb-1', 'ambient-orb ambient-orb-2'].forEach(cls => {
    const orb = document.createElement('div');
    orb.className = cls;
    document.body.appendChild(orb);
  });

  /* Hero cinematic vignette bars */
  const hero = qs('#hero');
  if (hero) {
    ['hero-vignette-left', 'hero-vignette-right', 'hero-scanlines'].forEach(cls => {
      const el = document.createElement('div');
      el.className = cls;
      hero.appendChild(el);
    });
  }

  /* Floating particles canvas */
  const pcv = document.createElement('canvas');
  pcv.id = 'particlesCanvas';
  document.body.appendChild(pcv);
  initFloatingParticles(pcv);
}

/* ================================================================
   FLOATING AMBIENT PARTICLES
   ================================================================ */
function initFloatingParticles(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* Very sparse, slow drifting motes */
  const motes = Array.from({ length: 30 }, () => ({
    x:     Math.random() * window.innerWidth,
    y:     Math.random() * window.innerHeight,
    r:     Math.random() * 1.2 + 0.3,
    vx:    (Math.random() - 0.5) * 0.18,
    vy:   -(Math.random() * 0.25 + 0.05),
    a:     Math.random() * 0.4 + 0.1,
    phase: Math.random() * Math.PI * 2,
    color: Math.random() > 0.6 ? '201,169,110' : '127,168,212',
  }));

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.008;
    motes.forEach(m => {
      m.x += m.vx;
      m.y += m.vy;

      /* subtle mouse attraction */
      const dx = state.mouseX - m.x;
      const dy = state.mouseY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        m.vx += dx * 0.00008;
        m.vy += dy * 0.00008;
      }

      /* dampen velocity */
      m.vx *= 0.998;
      m.vy *= 0.998;

      /* wrap */
      if (m.y < -10)                m.y = canvas.height + 10;
      if (m.y > canvas.height + 10) m.y = -10;
      if (m.x < -10)                m.x = canvas.width  + 10;
      if (m.x > canvas.width  + 10) m.x = -10;

      const alpha = (Math.sin(t + m.phase) * 0.4 + 0.6) * m.a;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${m.color},${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ================================================================
   1. LOADER
   ================================================================ */
function initLoader() {
  const loader      = qs('#loader');
  const loaderBar   = qs('#loaderBar');
  const loaderCount = qs('#loaderCount');
  const canvas      = qs('#loaderCanvas');
  const ctx         = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();

  /* Cinematic loader particles */
  const particles = Array.from({ length: 55 }, () => ({
    x:  Math.random() * canvas.width,
    y:  Math.random() * canvas.height,
    r:  Math.random() * 1.4 + 0.3,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    a:  Math.random() * 0.45 + 0.08,
    hue: Math.random() > 0.5 ? '127,168,212' : '201,169,110',
  }));

  let loaderRaf;
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},${p.a})`;
      ctx.fill();
    });
    loaderRaf = requestAnimationFrame(drawParticles);
  }
  drawParticles();

  /* Progress with eased timing */
  let progress = 0;
  const duration = 2800;
  const start    = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const raw     = elapsed / duration;
    /* ease-in-out for more cinematic feel */
    const eased   = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;
    progress = clamp(eased * 100, 0, 100);
    loaderBar.style.width    = progress + '%';
    loaderCount.textContent  = Math.floor(progress) + '%';

    if (progress < 100) {
      requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(loaderRaf);
      setTimeout(finishLoader, 250);
    }
  }
  requestAnimationFrame(tick);

  function finishLoader() {
    gsap.to(loader, {
      opacity: 0,
      duration: 1.2,
      ease: 'power3.inOut',
      onComplete: () => {
        loader.style.display = 'none';
        state.loaderDone     = true;
        startHeroAnimations();
        initMusicDock();
      },
    });
  }
}

/* ================================================================
   2. CUSTOM CURSOR — enhanced with magnetic effect
   ================================================================ */
function initCursor() {
  const cursor = qs('#cursor');
  const trail  = qs('#cursorTrail');
  if (!cursor || !trail) return;

  if (window.matchMedia('(hover: none)').matches) {
    cursor.style.display = 'none';
    trail.style.display  = 'none';
    document.body.style.cursor = 'auto';
    return;
  }

  let mx = -200, my = -200;
  let tx = -200, ty = -200;
  let isHover = false;

  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    state.mouseX = mx; state.mouseY = my;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  function animTrail() {
    const ease = isHover ? 0.08 : 0.11;
    tx = lerp(tx, mx, ease);
    ty = lerp(ty, my, ease);
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(animTrail);
  }
  animTrail();

  /* Hover states */
  const hoverSels = 'a, button, .hero-btn, .music-btn, .story-img-float, .quote-item blockquote';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverSels)) {
      isHover = true;
      gsap.to(cursor, { scale: 3, duration: 0.3, ease: 'power2.out' });
      gsap.to(trail,  { scale: 1.6, borderColor: 'rgba(127,168,212,0.6)', duration: 0.35 });
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverSels)) {
      isHover = false;
      gsap.to(cursor, { scale: 1, duration: 0.3 });
      gsap.to(trail,  { scale: 1, borderColor: 'rgba(240,236,228,0.35)', duration: 0.35 });
    }
  });

  /* Click ripple */
  document.addEventListener('click', () => {
    gsap.to(trail, { scale: 2.2, opacity: 0, duration: 0.35, ease: 'power2.out',
      onComplete: () => gsap.to(trail, { scale: 1, opacity: 1, duration: 0 }) });
  });
}

/* ================================================================
   3. STAR CANVAS — enhanced twinkle + parallax
   ================================================================ */
function initStars() {
  const canvas = qs('#starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const stars = Array.from({ length: 140 }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * canvas.height,
    r:     Math.random() * 1.1 + 0.15,
    a:     Math.random(),
    speed: Math.random() * 0.007 + 0.002,
    phase: Math.random() * Math.PI * 2,
    px:    (Math.random() - 0.5) * 0.06, /* parallax sensitivity */
    py:    (Math.random() - 0.5) * 0.04,
  }));

  let t = 0;
  function drawStars() {
    t += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mx = (state.mouseX / window.innerWidth  - 0.5);
    const my = (state.mouseY / window.innerHeight - 0.5);

    stars.forEach(s => {
      const alpha = (Math.sin(t * s.speed + s.phase) * 0.45 + 0.55) * s.a;
      const ox    = mx * s.px * canvas.width;
      const oy    = my * s.py * canvas.height;

      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);

      /* Occasionally render as a tiny cross for extra sparkle */
      if (s.r > 0.9 && alpha > 0.5) {
        ctx.fillStyle = `rgba(200,220,255,${alpha * 0.55})`;
        ctx.fill();
        /* cross arm */
        ctx.fillStyle = `rgba(240,236,228,${alpha * 0.3})`;
        ctx.fillRect(s.x + ox - s.r * 2, s.y + oy - 0.5, s.r * 4, 1);
        ctx.fillRect(s.x + ox - 0.5, s.y + oy - s.r * 2, 1, s.r * 4);
      } else {
        ctx.fillStyle = `rgba(200,220,255,${alpha * 0.5})`;
        ctx.fill();
      }
    });
    requestAnimationFrame(drawStars);
  }
  drawStars();
}

/* ================================================================
   4. RAIN EFFECT — with depth layers
   ================================================================ */
function initRain() {
  const container = qs('#rainContainer');
  if (!container) return;
  const COUNT = 45;

  for (let i = 0; i < COUNT; i++) {
    const drop   = document.createElement('div');
    drop.className = 'rain-drop';
    const depth    = Math.random();          /* 0 = far, 1 = near */
    const left     = Math.random() * 110 - 5;
    const duration = lerp(1.8, 0.7, depth);  /* near drops fall faster */
    const delay    = Math.random() * 4;
    const height   = lerp(20, 80, depth);
    const opacity  = lerp(0.1, 0.35, depth);

    drop.style.cssText = `
      left: ${left}%;
      height: ${height}px;
      animation-duration: ${duration}s;
      animation-delay: -${delay}s;
      opacity: ${opacity};
      width: ${depth < 0.5 ? '1px' : '1px'};
    `;
    container.appendChild(drop);
  }
}

/* ================================================================
   5. HERO SLIDE SHOW
   ================================================================ */
function initHeroSlides() {
  state.heroSlides = qsa('.hero-slide');
  if (!state.heroSlides.length) return;

  function nextSlide() {
    const current = state.heroSlides[state.heroSlideIndex];
    state.heroSlideIndex = (state.heroSlideIndex + 1) % state.heroSlides.length;
    const next = state.heroSlides[state.heroSlideIndex];

    gsap.to(current, { opacity: 0, duration: 2.5, ease: 'power2.inOut' });
    gsap.fromTo(next,
      { opacity: 0, scale: 1.06 },
      { opacity: 1, scale: 1.08, duration: 2.5, ease: 'power2.inOut',
        onStart: () => next.classList.add('active') }
    );
    current.classList.remove('active');
  }

  state.heroSlideTimer = setInterval(nextSlide, 6500);
}

/* ================================================================
   6. HERO ANIMATIONS
   ================================================================ */
function startHeroAnimations() {
  /* Ensure starting state */
  gsap.set(['.hero-eyebrow','.hero-title','.hero-subtitle','.hero-months','.hero-btn'], {
    y: 35, opacity: 0,
  });
  gsap.set('.scroll-indicator', { opacity: 0, y: 10 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to('.hero-eyebrow',   { opacity: 1, y: 0, duration: 1.1, delay: 0.15 })
    .to('.hero-title',     { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out' }, '-=0.65')
    .to('.hero-subtitle',  { opacity: 1, y: 0, duration: 1.1 }, '-=0.75')
    .to('.hero-months',    { opacity: 1, y: 0, duration: 1 },   '-=0.65')
    .to('.hero-btn',       { opacity: 1, y: 0, duration: 0.9 }, '-=0.55')
    .to('.scroll-indicator', { opacity: 1, y: 0, duration: 0.7 }, '-=0.3');
}

/* ================================================================
   7. HERO BUTTON
   ================================================================ */
function initHeroBtn() {
  const btn = qs('#heroBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    gsap.to(window, {
      duration: 1.6,
      scrollTo: '#videoSection',
      ease: 'power3.inOut',
    });
  });
}

/* ================================================================
   8. VIDEO SECTION — enhanced cinematic reveal
   ================================================================ */
function initVideoSection() {
  const section = qs('#videoSection');
  if (!section) return;

  gsap.set(['.video-quote', '.video-quote-b', '.video-caption'], { y: 35, opacity: 0 });
  gsap.set('.video-divider', { opacity: 0, scaleX: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 60%',
      toggleActions: 'play none none none',
    },
  });

  tl.to('.video-quote',   { opacity: 1, y: 0, duration: 1.3, ease: 'power3.out' })
    .to('.video-quote-b', { opacity: 1, y: 0, duration: 1.3, ease: 'power3.out' }, '-=0.85')
    .to('.video-divider', { opacity: 1, scaleX: 1, duration: 0.9, ease: 'expo.out' }, '-=0.5')
    .to('.video-caption', { opacity: 1, y: 0, duration: 0.9 }, '-=0.4');

  /* Subtle video scale on scroll */
  const video = qs('#memoryVideo');
  if (video) {
    video.muted = true;
    video.play().catch(() => {});

    gsap.to(video, {
      scale: 1.08,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
    });
  }
}

/* ================================================================
   9. STORY SECTIONS — enhanced parallax + cinematic reveals
   ================================================================ */
function initStorySections() {
  qsa('.story-section').forEach((section, i) => {
    const bg       = qs('.story-bg', section);
    const headline = qs('.story-headline', section);
    const body     = qs('.story-body', section);
    const imgFloat = qs('.story-img-float', section);
    const isAlt    = section.classList.contains('alt');

    /* Deep parallax on background */
    if (bg) {
      gsap.to(bg, {
        yPercent: 22,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.8,
        },
      });

      /* Subtle brightness increase as section enters view */
      gsap.to(bg, {
        filter: 'brightness(0.24) saturate(0.4)',
        scrollTrigger: {
          trigger: section,
          start: 'top 60%',
          end: 'center center',
          scrub: 1,
        },
      });
    }

    /* Add in-view class for accent line CSS */
    ScrollTrigger.create({
      trigger: section,
      start: 'top 65%',
      onEnter: () => section.classList.add('in-view'),
    });

    /* Headline reveal */
    if (headline) {
      gsap.fromTo(headline,
        { opacity: 0, y: 50, clipPath: 'inset(0 0 100% 0)' },
        {
          opacity: 1, y: 0,
          clipPath: 'inset(0 0 0% 0)',
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    /* Body text reveal */
    if (body) {
      gsap.fromTo(body,
        { opacity: 0, y: 35 },
        {
          opacity: 1, y: 0,
          duration: 1.1,
          ease: 'power3.out',
          delay: 0.18,
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    /* Image float reveal with 3D entry */
    if (imgFloat) {
      gsap.fromTo(imgFloat,
        {
          opacity: 0,
          x: isAlt ? -50 : 50,
          rotate: isAlt ? -2 : 2,
          scale: 0.95,
        },
        {
          opacity: 1, x: 0,
          rotate: isAlt ? -0.8 : 0.8,
          scale: 1,
          duration: 1.4,
          ease: 'expo.out',
          delay: 0.08,
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions: 'play none none none',
          },
        }
      );

      /* Subtle float animation after reveal */
      gsap.to(imgFloat, {
        y: -10,
        duration: 3.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.5 + i * 0.2,
      });

      /* 3D tilt on hover */
      imgFloat.addEventListener('mousemove', e => {
        const rect = imgFloat.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) / (rect.width  / 2);
        const dy   = (e.clientY - cy) / (rect.height / 2);
        gsap.to(imgFloat, {
          rotateX: -dy * 6,
          rotateY:  dx * 6,
          duration: 0.5,
          ease: 'power2.out',
          transformPerspective: 800,
        });
      });

      imgFloat.addEventListener('mouseleave', () => {
        gsap.to(imgFloat, {
          rotateX: 0,
          rotateY: isAlt ? -0.8 : 0.8,
          duration: 0.8,
          ease: 'elastic.out(1, 0.6)',
        });
      });
    }
  });
}

/* ================================================================
   10. QUOTES — cinematic reveals + drift
   ================================================================ */
function initQuotes() {
  qsa('.quote-item blockquote').forEach((quote, i) => {
    gsap.fromTo(quote,
      { opacity: 0, y: 50, scale: 0.97 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: quote,
          start: 'top 78%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

function initQuoteDrift() {
  qsa('.quote-item').forEach((item, i) => {
    const dir = i % 2 === 0 ? -1 : 1;
    gsap.to(item, {
      x: dir * 18,
      ease: 'none',
      scrollTrigger: {
        trigger: item,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.5,
      },
    });
  });
}

/* ================================================================
   11. FOOTER REVEAL
   ================================================================ */
function initFooter() {
  const footer = qs('#footer');
  if (!footer) return;

  gsap.fromTo(footer,
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0,
      duration: 1.4,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: footer,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    }
  );

  /* Footer names gentle glow pulse on enter */
  const footerNames = qs('.footer-names', footer);
  if (footerNames) {
    ScrollTrigger.create({
      trigger: footer,
      start: 'top 80%',
      onEnter: () => {
        gsap.fromTo(footerNames,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 }
        );
      },
    });
  }
}

/* ================================================================
   12. MUSIC PLAYER — enhanced with dock glow
   ================================================================ */
function initMusicDock() {
  const dock         = qs('#musicDock');
  const audio        = qs('#audioPlayer');
  const playPauseBtn = qs('#playPauseBtn');
  const playIcon     = qs('#playIcon');
  const pauseIcon    = qs('#pauseIcon');
  const progressBar  = qs('#progressBar');
  const progressFill = qs('#progressFill');
  const currentTime  = qs('#currentTime');
  const totalTime    = qs('#totalTime');
  const volumeSlider = qs('#volumeSlider');
  const visualizer   = qs('#visualizer');
  const vizSpans     = qsa('span', visualizer);

  if (!dock || !audio) return;

  /* Slide up with spring */
  setTimeout(() => dock.classList.add('visible'), 1400);

  function setPlaying(playing) {
    playIcon.style.display  = playing ? 'none'  : 'block';
    pauseIcon.style.display = playing ? 'block' : 'none';
    if (visualizer) visualizer.classList.toggle('playing', playing);
    dock.classList.toggle('is-playing', playing);

    if (playing) {
      startVizAnimation();
    } else {
      stopVizAnimation();
    }
  }

  playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play',  () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => setPlaying(false));

  audio.addEventListener('loadedmetadata', () => {
    totalTime.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    currentTime.textContent  = formatTime(audio.currentTime);
  });

  progressBar.addEventListener('click', e => {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const pct  = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    audio.currentTime = pct * audio.duration;
  });

  if (volumeSlider) {
    audio.volume = parseFloat(volumeSlider.value);
    volumeSlider.addEventListener('input', () => {
      audio.volume = parseFloat(volumeSlider.value);
    });
  }

  /* Organic visualizer animation */
  let vizRaf;
  const vizHeights = vizSpans.map(() => Math.random());
  const vizTargets = vizSpans.map(() => Math.random());

  function startVizAnimation() {
    if (vizRaf) return;
    function tick() {
      vizSpans.forEach((span, i) => {
        /* smoothly interpolate toward random targets */
        if (Math.random() < 0.04) vizTargets[i] = Math.random();
        vizHeights[i] = lerp(vizHeights[i], vizTargets[i], 0.08);
        const h = 2 + vizHeights[i] * 22;
        span.style.height  = h + 'px';
        span.style.opacity = (0.35 + vizHeights[i] * 0.65).toFixed(2);
      });
      vizRaf = requestAnimationFrame(tick);
    }
    tick();
  }

  function stopVizAnimation() {
    if (vizRaf) { cancelAnimationFrame(vizRaf); vizRaf = null; }
    vizSpans.forEach(span => {
      span.style.height  = '3px';
      span.style.opacity = '0.3';
    });
  }
}

/* ================================================================
   13. SCROLL PROGRESS BAR
   ================================================================ */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress-bar';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrolled  = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = clamp((scrolled / maxScroll) * 100, 0, 100) + '%';
    state.scrollY   = scrolled;
  }, { passive: true });
}

/* ================================================================
   14. HERO MOUSE PARALLAX — layered depth
   ================================================================ */
function initHeroMouseParallax() {
  const hero    = qs('#hero');
  const content = qs('.hero-content');
  if (!hero || !content) return;

  let ticking = false;
  let lx = 0, ly = 0;

  hero.addEventListener('mousemove', e => {
    lx = (e.clientX / window.innerWidth  - 0.5);
    ly = (e.clientY / window.innerHeight - 0.5);

    if (!ticking) {
      requestAnimationFrame(() => {
        /* Content counter-moves slightly for depth illusion */
        gsap.to(content, {
          x: -lx * 12,
          y: -ly * 8,
          rotateY: lx * 3,
          rotateX: -ly * 2,
          duration: 1.2,
          ease: 'power1.out',
          transformPerspective: 1000,
        });

        /* Slides parallax */
        gsap.to('.hero-slide', {
          x: lx * 20,
          y: ly * 12,
          duration: 1.8,
          ease: 'power1.out',
        });

        /* Stars subtle parallax */
        gsap.to('#starsCanvas', {
          x: lx * 8,
          y: ly * 5,
          duration: 2,
          ease: 'power1.out',
        });

        ticking = false;
      });
      ticking = true;
    }
  });

  hero.addEventListener('mouseleave', () => {
    gsap.to(content, {
      x: 0, y: 0, rotateY: 0, rotateX: 0,
      duration: 1.2, ease: 'power2.out',
    });
    gsap.to('.hero-slide', { x: 0, y: 0, duration: 1.8, ease: 'power2.out' });
    gsap.to('#starsCanvas', { x: 0, y: 0, duration: 2, ease: 'power2.out' });
  });
}

/* ================================================================
   15. SMOOTH SCROLL — internal links
   ================================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      gsap.to(window, {
        scrollTo: { y: target, autoKill: false },
        duration: 1.6,
        ease: 'power3.inOut',
      });
    });
  });
}

/* ================================================================
   16. SECTION ENTRANCE PULSES
   ================================================================ */
function initSectionPulse() {
  qsa('.story-section, .video-section').forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      onEnter: () => {
        gsap.fromTo(section,
          { '--pulse-opacity': 0 },
          { '--pulse-opacity': 1, duration: 0.7, ease: 'power2.out' }
        );
      },
    });
  });
}

/* ================================================================
   17. RESIZE HANDLING
   ================================================================ */
function initResizeHandler() {
  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => ScrollTrigger.refresh(), 260);
  }, { passive: true });
}

/* ================================================================
   18. INTERSECTION OBSERVER — lightweight section awareness
   ================================================================ */
function initSectionObserver() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.15 });

  qsa('.story-section, .quotes-section, .footer').forEach(el => io.observe(el));
}

/* ================================================================
   INIT — DOMContentLoaded
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  /* Inject atmospheric elements first */
  injectAmbientElements();

  /* Core init */
  initCursor();
  initStars();
  initRain();
  initHeroSlides();
  initHeroBtn();
  initScrollProgress();
  initResizeHandler();
  initSmoothScroll();
  initSectionObserver();

  /* Loader triggers hero animations + music dock internally */
  initLoader();

  /* Scroll-triggered systems */
  initVideoSection();
  initStorySections();
  initQuotes();
  initQuoteDrift();
  initFooter();
  initHeroMouseParallax();
  initSectionPulse();
});