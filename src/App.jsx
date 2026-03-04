import { useEffect, useRef, useState, useCallback } from "react";
import Spline from "@splinetool/react-spline";

const SECTION_COUNT = 4;
const AUTO_SCROLL_DELAY = 5000;

/* ── Floating Hearts Background ───────────────────── */
function FloatingHearts() {
  const hearts = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 6}s`,
    duration: `${6 + Math.random() * 6}s`,
    size: `${0.6 + Math.random() * 0.8}rem`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="floating-heart"
          style={{
            left: h.left,
            bottom: "-20px",
            animationDelay: h.delay,
            animationDuration: h.duration,
            fontSize: h.size,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}

/* ── SVG Line Path Decoration (edge-to-edge) ─────── */
function RedLinePath({ variant = 1, active }) {
  /* Paths span full viewBox width (0 → 1920) so they reach both edges */
  const paths = {
    1: "M-100,300 C200,150 480,500 720,350 C960,200 1200,450 1440,300 C1680,150 1850,350 2020,250",
    2: "M-100,500 C160,350 400,650 680,480 C960,310 1200,550 1440,400 C1680,250 1860,420 2020,350",
  };

  const secondPaths = {
    1: "M-100,500 C250,380 500,620 760,480 C1020,340 1260,540 1500,420 C1740,300 1880,460 2020,380",
    2: "M-100,350 C220,220 460,480 740,340 C1020,200 1260,400 1500,300 C1740,200 1870,340 2020,260",
  };

  if (!active) return null;

  return (
    <div className="line-path-bg">
      <svg viewBox="0 0 1920 800" preserveAspectRatio="none" fill="none">
        <path
          className="animated-path draw"
          d={paths[variant]}
          stroke="rgba(201, 76, 76, 0.12)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          className="animated-path draw"
          d={secondPaths[variant]}
          stroke="rgba(201, 76, 76, 0.07)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ animationDelay: "0.5s" }}
        />
      </svg>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────── */
export default function App() {
  const [isDesktop, setIsDesktop] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [isOutro, setIsOutro] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showIntro, setShowIntro] = useState(
    () => !localStorage.getItem("birthday-audio-ok"),
  );

  const autoScrollTimer = useRef(null);
  const audioRef = useRef(null);
  const splineApp = useRef(null);
  const pausedSection = useRef(0);

  // Desktop detection
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Audio setup ─────────────────────────────────── */
  useEffect(() => {
    const audio = new Audio("/birthday-song.mp3");
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = "auto";

    const onCanPlay = () => setAudioReady(true);
    const onError = () => {
      console.warn(
        "Audio file not found. Place birthday-song.mp3 in the /public folder.",
      );
      setAudioReady(false);
    };

    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("error", onError);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioReady) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setMusicPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }, [audioReady]);

  /* ── Trigger fade-ins for a section ──────────────── */
  const triggerFadeIn = useCallback((sectionIndex) => {
    setTimeout(() => {
      const sectionEl = document.querySelector(
        `[data-section="${sectionIndex}"]`,
      );
      if (sectionEl) {
        sectionEl.querySelectorAll(".fade-element").forEach((el) => {
          el.classList.add("visible");
        });
      }
    }, 300);
  }, []);

  /* ── Reset all fade elements ─────────────────────── */
  const resetAllFades = useCallback(() => {
    document.querySelectorAll(".fade-element.visible").forEach((el) => {
      el.classList.remove("visible");
    });
  }, []);

  /* ── Go to a specific section ────────────────────── */
  const goToSection = useCallback(
    (index) => {
      setActiveSection(index);
      triggerFadeIn(index);
    },
    [triggerFadeIn],
  );

  /* ── Start auto-scroll from section 0 ───────────── */
  const startAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);

    resetAllFades();
    goToSection(0);

    let current = 0;
    autoScrollTimer.current = setInterval(() => {
      current += 1;
      pausedSection.current = current;
      if (current >= SECTION_COUNT) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
        return;
      }
      goToSection(current);
    }, AUTO_SCROLL_DELAY);
  }, [goToSection, resetAllFades]);

  /* ── Resume auto-scroll from a specific section ─── */
  const resumeAutoScroll = useCallback(
    (fromSection) => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
      let current = fromSection;
      autoScrollTimer.current = setInterval(() => {
        current += 1;
        pausedSection.current = current;
        if (current >= SECTION_COUNT) {
          clearInterval(autoScrollTimer.current);
          autoScrollTimer.current = null;
          return;
        }
        goToSection(current);
      }, AUTO_SCROLL_DELAY);
    },
    [goToSection],
  );

  /* ── Pause / Resume toggle ───────────────────── */
  const togglePause = useCallback(() => {
    if (isPaused) {
      // Resume: immediately scroll to next section, then continue cycle
      setIsPaused(false);
      const next = pausedSection.current + 1;
      if (next < SECTION_COUNT) {
        pausedSection.current = next;
        goToSection(next);
        resumeAutoScroll(next);
      }
    } else {
      // Pause: clear the timer
      setIsPaused(true);
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    }
  }, [isPaused, goToSection, resumeAutoScroll]);

  // Start auto-scroll on mount (only after intro is dismissed)
  useEffect(() => {
    if (showIntro) return;
    const initTimeout = setTimeout(() => {
      startAutoScroll();
    }, 400);
    return () => {
      clearTimeout(initTimeout);
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, [startAutoScroll, showIntro]);

  // Auto-play audio on reload if permission was previously granted
  useEffect(() => {
    if (!showIntro && audioReady && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setMusicPlaying(true))
        .catch(() => {});
    }
  }, [showIntro, audioReady]);

  /* ── Dismiss intro & unlock audio ──────────────── */
  const handleEnter = useCallback(() => {
    localStorage.setItem("birthday-audio-ok", "1");
    // Start audio (user gesture unlocks autoplay)
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setMusicPlaying(true))
        .catch(() => {});
    }
    setShowIntro(false);
  }, []);

  /* ── Smooth outro: fade + audio ramp-down ─────── */
  const handleOutro = useCallback(() => {
    if (isOutro) return;
    setIsOutro(true);

    // Gently fade out audio volume over ~900ms
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      const startVol = audio.volume;
      const steps = 18;
      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        audio.volume = Math.max(0, startVol * (1 - step / steps));
        if (step >= steps) {
          clearInterval(fadeInterval);
          audio.pause();
        }
      }, 50);
    }

    // Reload after the fade-out completes
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  }, [isOutro]);

  /* ── Spline loaded — attach event listeners ──── */
  const handleSplineLoad = useCallback((app) => {
    setSplineLoaded(true);
    splineApp.current = app;
  }, []);

  /* ── Intro Screen (first visit only) ──────────── */
  if (showIntro) {
    return (
      <div className="intro-screen">
        <div className="intro-content">
          <p className="intro-heart">♥</p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
              fontWeight: 400,
              color: "var(--color-accent)",
              marginBottom: "0.5rem",
            }}
          >
            You have a surprise
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              color: "var(--color-text-muted)",
              fontWeight: 300,
              marginBottom: "2rem",
            }}
          >
            Best experienced with sound 🎵
          </p>
          <button className="intro-enter-btn" onClick={handleEnter}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  /* ── Desktop Gate ──────────────────────────────── */
  if (!isDesktop) {
    return (
      <div className="desktop-gate">
        <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>💻</p>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            marginBottom: "0.75rem",
            color: "var(--color-accent)",
          }}
        >
          Open on Desktop
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--color-text-muted)",
            maxWidth: "320px",
            lineHeight: 1.6,
          }}
        >
          This experience was crafted for a larger screen. Please open it on a
          desktop or laptop for the full magic. ✨
        </p>
      </div>
    );
  }

  /* ── Birthday Wishes Data ──────────────────────── */
  const wishes = [
    { emoji: "✨", text: "May every dream you chase become your reality." },
    { emoji: "🌸", text: "Wishing you endless laughter and joy this year." },
    { emoji: "💖", text: "You deserve all the love in the world and more." },
    { emoji: "🎂", text: "May this year bring you sweet surprises every day." },
    {
      emoji: "🌟",
      text: "Shine bright, because you light up everyone around you.",
    },
  ];

  /* Section 4 (Spline) is rendered OUTSIDE the slide track
     so the translateY transform doesn't break its mouse coordinates. */
  const showSpline = activeSection === 3;

  return (
    <div className="viewport">
      {/* ── Music Toggle Button ──────────────────────── */}
      <button
        className={`music-btn ${!audioReady ? "no-audio" : ""}`}
        onClick={toggleMusic}
        title={
          !audioReady
            ? "No audio file found"
            : musicPlaying
              ? "Pause music"
              : "Play music"
        }
        aria-label={musicPlaying ? "Pause music" : "Play music"}
      >
        {!audioReady ? "🔇" : musicPlaying ? "🔊" : "🔈"}
      </button>

      {/* ── Pause / Resume Button (hidden at section 4) ── */}
      {!showSpline && (
        <button
          className="pause-btn"
          onClick={togglePause}
          title={isPaused ? "Resume" : "Pause"}
          aria-label={isPaused ? "Resume scrolling" : "Pause scrolling"}
        >
          {isPaused ? "▶" : "❚❚"}
        </button>
      )}

      {/* ── Slide Track (sections 1–3, GPU-accelerated) ── */}
      <div
        className="slide-track"
        style={{
          position: "relative",
          zIndex: 10,
          transform: showSpline
            ? "translateY(-300vh)"
            : `translateY(-${activeSection * 100}vh)`,
          transition: "transform 1.6s cubic-bezier(0.45, 0, 0.55, 1)",
        }}
      >
        {/* ────────────── SECTION 1: HERO ────────────── */}
        <section
          data-section="0"
          className={`section ${activeSection === 0 ? "active" : ""}`}
          style={{ background: "var(--color-bg)" }}
        >
          <FloatingHearts />
          <div className="hero-glow" />

          <div className="text-center relative z-10 px-8">
            <p
              className="fade-element text-sm tracking-[0.3em] uppercase mb-4"
              style={{
                color: "var(--color-accent-light)",
                fontFamily: "var(--font-body)",
                fontWeight: 300,
              }}
            >
              A Special Day
            </p>

            <h1
              className="fade-element delay-1 mb-6"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.8rem, 6vw, 5rem)",
                fontWeight: 400,
                color: "var(--color-text)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              Happy Birthday
            </h1>

            <div className="fade-element delay-2 mb-6">
              <hr className="elegant-divider mx-auto" />
            </div>

            <p
              className="fade-element delay-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1rem, 2vw, 1.35rem)",
                color: "var(--color-text-muted)",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              To the one who makes my world beautiful
            </p>
          </div>

          <div
            className="absolute bottom-10 scroll-indicator"
            style={{ color: "var(--color-accent-light)" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 10l5 5 5-5" />
            </svg>
          </div>
        </section>

        {/* ────────────── SECTION 2: LOVE LETTER ─────── */}
        <section
          data-section="1"
          className={`section ${activeSection === 1 ? "active" : ""}`}
          style={{ background: "var(--color-bg-dark)" }}
        >
          <RedLinePath variant={1} active={activeSection === 1} />

          <div className="letter-card fade-element text-center">
            <p className="mb-6" style={{ fontSize: "2rem" }}>
              💌
            </p>

            <h2
              className="mb-5"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
                fontWeight: 400,
                color: "var(--color-accent)",
              }}
            >
              My Dearest
            </h2>

            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                lineHeight: 1.85,
                color: "var(--color-text-muted)",
                fontWeight: 300,
              }}
            >
              On this beautiful day, I want you to know how grateful I am to
              have you in my life. Your smile is the sun that warms my days, and
              your laughter is the melody that fills my heart. Every moment with
              you is a gift I will always treasure.
              <br />
              <br />
              Here&apos;s to another year of adventures, dreams, and endless
              love. Happy Birthday, my love. 🤍
            </p>
          </div>
        </section>

        {/* ────────────── SECTION 3: WISHES ──────────── */}
        <section
          data-section="2"
          className={`section ${activeSection === 2 ? "active" : ""}`}
          style={{ background: "var(--color-bg)" }}
        >
          <RedLinePath variant={2} active={activeSection === 2} />

          <div className="text-center mb-10 px-8 relative z-2">
            <h2
              className="fade-element mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                fontWeight: 400,
                color: "var(--color-text)",
              }}
            >
              Birthday Wishes
            </h2>
            <div className="fade-element delay-1">
              <hr className="elegant-divider mx-auto" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {wishes.map((wish, i) => (
              <div key={i} className={`wish-item fade-element delay-${i + 1}`}>
                <span className="text-xl shrink-0">{wish.emoji}</span>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    color: "var(--color-text-muted)",
                    fontWeight: 300,
                    lineHeight: 1.6,
                  }}
                >
                  {wish.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── SECTION 4: SPLINE (behind slide track, NO transform) ── */}
      <div
        data-section="3"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background: "var(--color-bg-dark)",
        }}
      >
        <div
          className="text-center"
          style={{
            position: "absolute",
            top: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            opacity: showSpline ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--color-accent-light)",
              fontWeight: 300,
            }}
          >
            A little something for you — interact with it! 💝
          </p>
        </div>

        {!splineLoaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
              background: "var(--color-bg-dark)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--color-text-muted)",
                fontSize: "0.9rem",
              }}
            >
              Loading your gift...
            </p>
          </div>
        )}

        <Spline
          scene="https://prod.spline.design/zqHOaHCqaTLeLJTi/scene.splinecode"
          onLoad={handleSplineLoad}
          style={{ width: "100%", height: "100%" }}
        />

        {/* Invisible HTML buttons over the Spline YES/NO area.
            Container has pointer-events:none so mouse passes through to 3D.
            Only the buttons themselves capture clicks. */}
        {showSpline && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            {/* YES button area */}
            <button
              onClick={handleOutro}
              style={{
                position: "absolute",
                bottom: "10%",
                left: "48%",
                transform: "translateX(-210px)",
                width: "160px",
                height: "60px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                pointerEvents: "auto",
                outline: "none",
              }}
              aria-label="Yes"
            />
            {/* NO button area */}
            <button
              onClick={handleOutro}
              style={{
                position: "absolute",
                bottom: "10%",
                left: "52%",
                transform: "translateX(20px)",
                width: "160px",
                height: "60px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                pointerEvents: "auto",
                outline: "none",
              }}
              aria-label="No"
            />
          </div>
        )}
      </div>

      {/* ── Outro fade overlay ─────────────────────── */}
      {isOutro && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "white",
            opacity: 0,
            animation: "outroFade 1.2s ease forwards",
            pointerEvents: "all",
          }}
        />
      )}
    </div>
  );
}
