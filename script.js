(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function isSmallDevice() { return window.innerWidth < 480; }

  /* =========================================================
     1. OPENING / SURPRISE LOCK
     ========================================================= */
  var body = document.body;
  var openingScreen = document.getElementById("opening-screen");
  var mainContent = document.getElementById("main-content");
  var openBtn = document.getElementById("open-surprise-btn");
  var replayBtn = document.getElementById("replay-btn");

  function lockExperience() {
    body.classList.add("locked");
    openingScreen.classList.remove("closing", "hidden-fully");
    openingScreen.removeAttribute("aria-hidden");
    mainContent.classList.remove("unlocked");
    mainContent.setAttribute("aria-hidden", "true");
    window.scrollTo(0, 0);
  }

  function unlockExperience() {
    // 1. cinematic fade/scale of the opening screen
    openingScreen.classList.add("closing");
    body.classList.remove("locked");
    mainContent.classList.add("unlocked");
    mainContent.removeAttribute("aria-hidden");

    // 2. after the transition finishes, fully hide the opening screen
    var delay = reducedMotion ? 0 : 900;
    window.setTimeout(function () {
      openingScreen.classList.add("hidden-fully");
      openingScreen.setAttribute("aria-hidden", "true");
    }, delay);

    // 3. smooth scroll to Hero once content is unlocked
    window.setTimeout(function () {
      var hero = document.getElementById("hero");
      hero.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    }, reducedMotion ? 0 : 150);
  }

  openBtn.addEventListener("click", unlockExperience);

  /* =========================================================
     2. SCROLL REVEAL
     ========================================================= */
  var revealEls = document.querySelectorAll(".reveal");

  function setupRevealObserver() {
    if (!("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }
  setupRevealObserver();

  function resetReveals() {
    revealEls.forEach(function (el) { el.classList.remove("in"); });
    setupRevealObserver();
  }

  /* =========================================================
     3. BACKGROUND STARS (lightweight canvas)
     ========================================================= */
  var starsCanvas = document.getElementById("stars-canvas");
  var sctx = starsCanvas.getContext("2d");
  var stars = [];
  var starsRafId = null;

  function sizeStarsCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    starsCanvas.width = window.innerWidth * dpr;
    starsCanvas.height = window.innerHeight * dpr;
    starsCanvas.style.width = window.innerWidth + "px";
    starsCanvas.style.height = window.innerHeight + "px";
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeStars() {
    // Reduce workload automatically on small mobile devices.
    var count = window.innerWidth < 480 ? 40 : window.innerWidth < 800 ? 65 : 100;
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random(),
        speed: Math.random() * 0.015 + 0.004,
        dir: Math.random() > 0.5 ? 1 : -1
      });
    }
  }

  function drawStars() {
    sctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.a += s.speed * s.dir;
      if (s.a <= 0.08 || s.a >= 1) s.dir *= -1;
      sctx.beginPath();
      sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      sctx.fillStyle = "rgba(216,205,242," + s.a.toFixed(2) + ")";
      sctx.fill();
    }
    if (!reducedMotion) {
      starsRafId = requestAnimationFrame(drawStars);
    }
  }

  sizeStarsCanvas();
  makeStars();
  drawStars();
  window.addEventListener("resize", function () {
    sizeStarsCanvas();
    makeStars();
  });

  /* =========================================================
     4. PHOTO GALLERY
     ========================================================= */
  // Replace these demo URLs with K's actual photo URLs.
  var photos = [
    { url: "01.jpg" },
    { url: "02.jpg" },
    { url: "03.jpg" },
    { url: "04.jpg" },
    { url: "05.jpg" },
    { url: "06.jpg" },
    { url: "07.jpg" },
    { url: "08.jpg" },
    { url: "09.jpg" },
    { url: "10.jpg" },
    { url: "11.jpg" },
    { url: "12.jpg" },
    { url: "13.jpg" },
    { url: "14.jpg" },
    { url: "15.jpg" },
    { url: "16.jpg" },
    { url: "17.jpg" },
    { url: "18.jpg" },
    { url: "19.jpg" },
    { url: "20.jpg" }
  ];

  var track = document.getElementById("gallery-track");
  var filmstrip = document.getElementById("filmstrip");
  var counterEl = document.getElementById("gallery-counter");
  var progressFill = document.getElementById("progress-fill");
  var galleryWrap = document.getElementById("gallery-wrap");
  var current = 0;

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function buildGallery() {
    photos.forEach(function (p, i) {
      var altText = "Photo " + (i + 1) + " of K";

      var slide = document.createElement("div");
      slide.className = "gallery-slide";

      var bg = document.createElement("div");
      bg.className = "slide-bg";
      bg.style.backgroundImage = "url('" + p.url + "')";

      var img = document.createElement("img");
      img.src = p.url;
      img.loading = "lazy";
      img.alt = altText;
      img.draggable = false;

      slide.appendChild(bg);
      slide.appendChild(img);
      track.appendChild(slide);

      var thumb = document.createElement("button");
      thumb.className = "filmstrip-item";
      thumb.type = "button";
      thumb.dataset.index = i;
      thumb.setAttribute("aria-label", "View photo " + (i + 1) + " of " + photos.length);
      var timg = document.createElement("img");
      timg.src = p.url;
      timg.loading = "lazy";
      timg.alt = "";
      thumb.appendChild(timg);
      thumb.addEventListener("click", function () { goTo(i); });
      filmstrip.appendChild(thumb);
    });
  }

  function updateGallery(animate) {
    track.style.transition = animate && !reducedMotion ? "transform 0.5s cubic-bezier(.22,.68,.32,1)" : "none";
    track.style.transform = "translateX(-" + current * 100 + "%)";
    counterEl.textContent = pad(current + 1) + " / " + pad(photos.length);
    progressFill.style.width = ((current + 1) / photos.length) * 100 + "%";

    var thumbs = filmstrip.querySelectorAll(".filmstrip-item");
    thumbs.forEach(function (t, i) {
      t.classList.toggle("active", i === current);
    });
    var activeThumb = thumbs[current];
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        inline: "center",
        block: "nearest"
      });
    }
  }

  function goTo(i) {
    current = (i + photos.length) % photos.length;
    updateGallery(true);
  }

  function resetGallery() {
    current = 0;
    updateGallery(false);
  }

  buildGallery();

  document.getElementById("prev-btn").addEventListener("click", function () { goTo(current - 1); });
  document.getElementById("next-btn").addEventListener("click", function () { goTo(current + 1); });

  document.addEventListener("keydown", function (e) {
    var rect = document.getElementById("gallery").getBoundingClientRect();
    var galleryVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!galleryVisible || body.classList.contains("locked")) return;
    if (e.key === "ArrowLeft") goTo(current - 1);
    if (e.key === "ArrowRight") goTo(current + 1);
  });

  // Touch / mouse drag swipe
  var startX = 0, deltaX = 0, dragging = false;

  function dragStart(x) {
    dragging = true;
    startX = x;
    track.style.transition = "none";
  }
  function dragMove(x) {
    if (!dragging) return;
    deltaX = x - startX;
    var pct = (deltaX / galleryWrap.offsetWidth) * 100;
    track.style.transform = "translateX(calc(-" + current * 100 + "% + " + pct + "%))";
  }
  function dragEnd() {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(deltaX) > galleryWrap.offsetWidth * 0.16) {
      if (deltaX < 0) goTo(current + 1); else goTo(current - 1);
    } else {
      updateGallery(true);
    }
    deltaX = 0;
  }

  galleryWrap.addEventListener("touchstart", function (e) { dragStart(e.touches[0].clientX); }, { passive: true });
  galleryWrap.addEventListener("touchmove", function (e) { dragMove(e.touches[0].clientX); }, { passive: true });
  galleryWrap.addEventListener("touchend", dragEnd);

  galleryWrap.addEventListener("mousedown", function (e) { dragStart(e.clientX); e.preventDefault(); });
  window.addEventListener("mousemove", function (e) { if (dragging) dragMove(e.clientX); });
  window.addEventListener("mouseup", dragEnd);

  updateGallery(false);

  /* =========================================================
     5. FILMSTRIP
     (thumbnail creation lives inside buildGallery() above;
      syncing to the active photo happens in updateGallery())
     ========================================================= */

  /* =========================================================
     6. LIGHTBOX (fullscreen viewer)
     ========================================================= */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");

  function openLightbox() {
    lightboxImg.src = photos[current].url;
    lightboxImg.alt = "Photo " + (current + 1) + " of K";
    lightbox.classList.add("open");
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
  }

  document.getElementById("expand-btn").addEventListener("click", openLightbox);
  galleryWrap.addEventListener("dblclick", openLightbox);
  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLightbox(); });

  /* =========================================================
     7. FRIENDSHIP MODE TOGGLE
     ========================================================= */
  var mode1 = document.getElementById("mode-1-text");
  var mode2 = document.getElementById("mode-2-text");
  var modeLabel = document.getElementById("mode-label");
  var showingMode1 = true;

  function setMode(toMode1) {
    showingMode1 = toMode1;
    mode1.classList.toggle("hidden", !showingMode1);
    mode2.classList.toggle("hidden", showingMode1);
    modeLabel.textContent = showingMode1 ? "MODE 1" : "MODE 2";
  }

  document.getElementById("switch-mode-btn").addEventListener("click", function () {
    setMode(!showingMode1);
  });

  /* =========================================================
     8. "OPEN WHEN..." CARDS
     ========================================================= */
  var envelopeEls = document.querySelectorAll(".envelope");

  envelopeEls.forEach(function (env) {
    env.addEventListener("click", function () {
      if (env.classList.contains("opened")) return;
      env.querySelector(".envelope-msg").textContent = env.dataset.msg;
      env.classList.add("opened");
    });
  });

  function resetEnvelopeCards() {
    envelopeEls.forEach(function (env) {
      env.classList.remove("opened");
      env.querySelector(".envelope-msg").textContent = "";
    });
  }

  /* =========================================================
     9. FINAL ENVELOPE
     ========================================================= */
  var envBox = document.getElementById("env-box");
  var finalMessage = document.getElementById("final-message");
  var envHint = document.getElementById("env-hint");
  var finalOpened = false;

  function openFinalEnvelope() {
    if (finalOpened) return;
    finalOpened = true;
    envBox.classList.add("opened");
    envHint.style.opacity = "0";
    window.setTimeout(function () {
      finalMessage.classList.add("show");
      launchConfetti();
    }, reducedMotion ? 0 : 500);
  }

  envBox.addEventListener("click", openFinalEnvelope);

  function resetFinalEnvelope() {
    finalOpened = false;
    envBox.classList.remove("opened");
    envHint.style.opacity = "1";
    finalMessage.classList.remove("show");
  }

  /* =========================================================
     10. CONFETTI
     ========================================================= */
  var confettiCanvas = document.getElementById("confetti-canvas");
  var cctx = confettiCanvas.getContext("2d");
  var confettiPieces = [];
  var confettiRafId = null;
  var confettiColors = ["#b9a8e8", "#e3b5ab", "#f6f1e8", "#d8cdf2"];

  function sizeConfettiCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = window.innerWidth * dpr;
    confettiCanvas.height = window.innerHeight * dpr;
    confettiCanvas.style.width = window.innerWidth + "px";
    confettiCanvas.style.height = window.innerHeight + "px";
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeConfettiCanvas();
  window.addEventListener("resize", sizeConfettiCanvas);

  function launchConfetti() {
    if (reducedMotion) return;
    var rect = envBox.getBoundingClientRect();
    var originX = rect.left + rect.width / 2;
    var originY = rect.top;
    var count = isSmallDevice() ? 46 : 70;

    confettiPieces = [];
    for (var i = 0; i < count; i++) {
      confettiPieces.push({
        x: originX,
        y: originY,
        vx: (Math.random() - 0.5) * 6,
        vy: -(Math.random() * 5 + 3),
        size: Math.random() * 6 + 4,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        life: 0
      });
    }
    if (confettiRafId) cancelAnimationFrame(confettiRafId);
    confettiRafId = requestAnimationFrame(tickConfetti);
  }

  function tickConfetti() {
    cctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    var alive = false;
    confettiPieces.forEach(function (p) {
      p.life++;
      p.vy += 0.16;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.life < 150) {
        alive = true;
        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate((p.rot * Math.PI) / 180);
        cctx.fillStyle = p.color;
        cctx.globalAlpha = Math.max(0, 1 - p.life / 150);
        cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        cctx.restore();
      }
    });
    if (alive) {
      confettiRafId = requestAnimationFrame(tickConfetti);
    } else {
      cctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      confettiRafId = null;
    }
  }

  function resetConfetti() {
    if (confettiRafId) {
      cancelAnimationFrame(confettiRafId);
      confettiRafId = null;
    }
    confettiPieces = [];
    cctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  /* =========================================================
     11. REPLAY / FULL RESET
     ========================================================= */
  function replayExperience() {
    // Jump to top instantly, then re-lock the experience.
    window.scrollTo(0, 0);

    lockExperience();

    resetEnvelopeCards();
    setMode(true);
    resetFinalEnvelope();
    resetConfetti();
    resetGallery();
    resetReveals();
    closeLightbox();
  }

  replayBtn.addEventListener("click", replayExperience);

  /* Initial state on page load */
  lockExperience();
})();
