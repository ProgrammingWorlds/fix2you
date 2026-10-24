/* ═══════════════════════════════════════════
   FIX2YOU — script.js  (corrected & complete)
   ═══════════════════════════════════════════ */
(() => { /* ✅ FIX 1: opening parenthesis restored */

  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* library guard — if a CDN fails, the site still works */
  const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  const RM    = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TOUCH = matchMedia("(hover: none), (pointer: coarse)").matches;
  const ANIM  = hasGSAP && !RM; // master switch for animation-only features

  /* if GSAP didn't load or reduced motion: un-hide everything */
  if (!ANIM) {
    const s = document.createElement("style");
    s.textContent = "#preloader{display:none!important}.hero-title .line-inner{transform:none!important}";
    document.head.appendChild(s);
    document.body.classList.remove("is-loading");
  }

  /* ─────────── smooth scroll ─────────── */
  let lenis = null;
  if (ANIM && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToTarget = t => {
    if (lenis) lenis.scrollTo(t, { offset: -70 });
    else $(t)?.scrollIntoView({ behavior: "smooth" });
  };

  /* ─────────── VIDEO SYSTEM (bulletproof) ───────────
     Tries multiple paths so files load no matter how the
     site is opened, and even fixes case (vip/VIP). */
  const pathCandidates = file => {
    const folders = ["../Videos/", "Videos/", "./Videos/", "../videos/", "videos/"];
    const names = file.toLowerCase() === "vip.mp4" ? ["vip.mp4", "VIP.mp4"] : [file];
    const list = [];
    folders.forEach(f => names.forEach(n => list.push(f + n)));
    return list;
  };

  function hardenVideo(video, file, onReady, onFail) {
    if (!video) return;
    const candidates = pathCandidates(file);
    let i = 0, settled = false;
    video.addEventListener("loadeddata", () => {
      if (settled) return;
      settled = true;
      video.parentElement?.classList.add("video-ready");
      onReady && onReady();
    });
    video.addEventListener("error", () => {
      if (settled) return;
      if (i >= candidates.length) { onFail && onFail(); return; }
      video.src = candidates[i++];
      video.load();
    });
    if (i < candidates.length) { video.src = candidates[i++]; video.load(); }
  }

  /* ─────────── video modal (with sound) ─────────── */
  const openModal = src => {
    const modal = $("#videoModal"), mv = $("#modalVideo");
    if (!modal || !mv || !src) return;
    mv.muted = false;
    mv.src = src;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-locked");
    lenis?.stop();
    if (ANIM) {
      gsap.fromTo(modal, { autoAlpha: 0 }, { autoAlpha: 1, duration: .35 });
      gsap.fromTo(mv, { scale: .92, y: 26 }, { scale: 1, y: 0, duration: .6, ease: "power3.out" });
    } else {
      modal.style.opacity = 1;
    }
    mv.play().catch(() => {});
  };

  const closeModal = () => {
    const modal = $("#videoModal"), mv = $("#modalVideo");
    if (!modal || !modal.classList.contains("open")) return;
    const finish = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      modal.style.opacity = "";
      mv.pause(); mv.removeAttribute("src"); mv.load();
    };
    if (ANIM) gsap.to(modal, { autoAlpha: 0, duration: .3, onComplete: finish });
    else finish();
    document.body.classList.remove("menu-locked");
    lenis?.start();
  };

  $(".modal-close")?.addEventListener("click", closeModal);
  $("#videoModal")?.addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(); });
  addEventListener("keydown", e => {
    if (e.key === "Escape") { closeModal(); if (menuOpen) toggleMenu(false); }
  });

  /* ─────────── hero video (vip.mp4) ─────────── */
  const heroVid = $("#heroVideo");
  if (heroVid) {
    hardenVideo(heroVid, "vip.mp4",
      () => { heroVid.classList.add("ready"); heroVid.play().catch(() => {}); },
      () => document.body.classList.add("no-hero-video"));
  }

  /* ─────────── showreel videos (1/2/3.mp4) ─────────── */
  $$(".vid-card").forEach(card => {
    const v = $("video", card);
    if (!v) return;
    hardenVideo(v, card.dataset.file || "1.mp4");

    // pause when offscreen → performance
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: .2 }).observe(card);

    // click → fullscreen modal WITH sound (reuse the path that works)
    card.addEventListener("click", () => openModal(v.currentSrc || v.src));
  });

  /* ✅ FIX 2: pointerdown listener — comma back inside the call */
  addEventListener("pointerdown", () => {
    $$("video").forEach(v => { if (v.paused && v.muted) v.play().catch(() => {}); });
  }, { once: true });

  /* ─────────── menu ─────────── */
  const burger = $(".burger"), overlay = $(".menu-overlay");
  let menuOpen = false;
  function toggleMenu(open) {
    menuOpen = open;
    burger?.classList.toggle("open", open);
    overlay?.classList.toggle("open", open);
    document.body.classList.toggle("menu-locked", open);
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && ANIM) gsap.fromTo(".menu-overlay .m-link, .menu-overlay .m-meta",
      { y: 44, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, stagger: .07, duration: .7, delay: .3, ease: "power3.out" });
  }
  burger?.addEventListener("click", () => toggleMenu(!menuOpen));

  /* ─────────── anchors ─────────── */
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if (id.length > 1 && $(id)) {
      e.preventDefault();
      if (menuOpen) toggleMenu(false);
      scrollToTarget(id);
    }
  }));

  /* ─────────── nav show/hide ─────────── */
  const nav = $(".nav");
  let lastY = 0;
  const onScroll = y => {
    nav?.classList.toggle("scrolled", y > 40);
    if (y > lastY && y > 320) nav?.classList.add("hide");
    else nav?.classList.remove("hide");
    lastY = y;
  };
  if (lenis) lenis.on("scroll", e => onScroll(e.scroll));
  else addEventListener("scroll", () => onScroll(scrollY), { passive: true });

  /* ─────────── preloader + hero intro ─────────── */
  const pre = $("#preloader");
  if (ANIM && pre) {
    const heroIntro = () => gsap.timeline({ defaults: { ease: "expo.out" } })
      .fromTo(".hero-title .line-inner", { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: .14 })
      .fromTo(".hero-eyebrow", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .8 }, .25)
      .fromTo(".hero-sub",     { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .9 }, .55)
      .fromTo(".hero-cta > *", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .8, stagger: .09 }, .7)
      .fromTo(".hero-chips .chip", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .7, stagger: .08 }, .85)
      .fromTo([".nav", ".hero-foot"], { autoAlpha: 0 }, { autoAlpha: 1, duration: .8 }, 1);

    const fill = $("#preFill"), count = $("#preCount"), status = $("#preStatus");
    const msgs = [[0, "POWERING ON…"], [34, "LOADING TOOLS…"], [68, "CALIBRATING…"], [90, "READY."]];
    const o = { v: 0 };
    gsap.to(o, {
      v: 100, duration: 1.9, ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.floor(o.v);
        if (count) count.textContent = v + "%";
        if (fill) fill.style.transform = `scaleX(${v / 100})`;
        const m = msgs.filter(x => v >= x[0]).pop();
        if (m && status) status.textContent = m[1];
      },
      onComplete: () => gsap.timeline()
        .to(".pre-inner,.pre-count,.pre-corner", { autoAlpha: 0, y: -24, duration: .4, ease: "power2.in" })
        .to(pre, { yPercent: -100, duration: .85, ease: "power4.inOut" }, "-=.05")
        .add(() => { pre.style.display = "none"; document.body.classList.remove("is-loading"); ScrollTrigger.refresh(); })
        .add(heroIntro, "-=.5")
    });
  } else {
    pre?.remove();
    document.body.classList.remove("is-loading");
  }

  /* ─────────── generic reveals ─────────── */
  if (ANIM) $$("[data-reveal]").forEach(el =>
    gsap.fromTo(el, { autoAlpha: 0, y: 42 },
      { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true } }));

  /* ─────────── hero parallax ─────────── */
  if (ANIM) {
    gsap.to(".hero-video", { yPercent: 16, scale: 1.1, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-content", { autoAlpha: .15, y: -70, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 30%", scrub: true } });
  }

  /* ─────────── steps + battery ─────────── */
  const STEPS = [
    { w: "25%",  label: "25% — BOOKED IN" },
    { w: "55%",  label: "55% — TECHNICIAN EN ROUTE" },
    { w: "85%",  label: "85% — REPAIR IN PROGRESS" },
    { w: "100%", label: "100% — HANDED BACK, LIKE NEW" }
  ];
  const idx = $("#stepIndex"), batFill = $("#batteryFill"), batLabel = $("#batteryLabel");
  const setStep = i => {
    $$(".step").forEach((x, j) => x.classList.toggle("active", j === i));
    if (idx)      idx.textContent = String(i + 1).padStart(2, "0");
    if (batFill)  batFill.style.width = STEPS[i].w;
    if (batLabel) batLabel.textContent = STEPS[i].label;
  };
  if (hasGSAP) {
    $$(".step").forEach((step, i) => ScrollTrigger.create({
      trigger: step, start: "top 62%", end: "bottom 38%",
      onToggle: self => { if (self.isActive) setStep(i); }
    }));
    if (ANIM) gsap.fromTo(".how-line", { scaleY: 0 }, { scaleY: 1, ease: "none",
      scrollTrigger: { trigger: ".how-steps", start: "top 60%", end: "bottom 60%", scrub: true } });
  } else {
    setStep(STEPS.length - 1);
  }

  /* ─────────── 3D exploded phone ─────────── */
  const phone = $("#phone3d");
  if (phone && hasGSAP) {
    const k = () => gsap.utils.clamp(.45, 1, innerWidth / 1250);
    const LAYERS = [
      [".ly-back", -340], [".ly-coil", -230], [".ly-battery", -140], [".ly-board", -40],
      [".ly-camera", 60], [".ly-frame", 180], [".ly-screen", 320]
    ];
    if (!ANIM) { // reduced motion → static exploded view
      gsap.set(phone, { rotationX: 58, rotationZ: -40 });
      LAYERS.forEach(([s, z]) => gsap.set(s, { z: z * .7 * k() }));
      gsap.set(".tag", { autoAlpha: 1 });
    } else {
      gsap.set(phone, { rotationX: 58, rotationZ: -40 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ".anatomy", start: "top top", end: "+=2200",
          scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
      });
      LAYERS.forEach(([sel, z]) => tl.to(sel, { z: () => z * k(), duration: .9, ease: "none" }, .1));
      tl.to(phone, { rotationZ: -30, duration: .9, ease: "none" }, .1);
      tl.fromTo(".tag", { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: .25, stagger: .05, ease: "power2.out" }, .45);

      if (!TOUCH) {
        const rX = gsap.quickTo(phone, "rotationX", { duration: .9, ease: "power3" });
        const rY = gsap.quickTo(phone, "rotationY", { duration: .9, ease: "power3" });
        addEventListener("mousemove", e => {
          const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
          rX(58 - ny * 10); rY(nx * 16);
        });
      }
    }
  }

  /* ─────────── services hover preview ─────────── */
  const svcList = $(".svc-list"), preview = $(".svc-preview");
  if (svcList && preview && ANIM && !TOUCH && matchMedia("(min-width:1001px)").matches) {
    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: .85 });
    const px = gsap.quickTo(preview, "x", { duration: .5, ease: "power3" });
    const py = gsap.quickTo(preview, "y", { duration: .5, ease: "power3" });
    svcList.addEventListener("mousemove", e => { px(e.clientX); py(e.clientY); });
    $$(".svc").forEach(r => {
      r.addEventListener("mouseenter", () => {
        preview.style.backgroundImage = `url('${r.dataset.img}')`;
        gsap.to(preview, { autoAlpha: 1, scale: 1, rotation: 3, duration: .4, ease: "power3.out" });
      });
      r.addEventListener("mouseleave", () =>
        gsap.to(preview, { autoAlpha: 0, scale: .85, rotation: 0, duration: .35 }));
    });
  }

  /* ─────────── counters ─────────── */
  $$(".stat-num").forEach(el => {
    const target = parseFloat(el.dataset.count) || 0;
    const fixed  = el.dataset.fixed;
    const write  = v => el.textContent = fixed ? v.toFixed(1)
                                               : Math.round(v).toLocaleString("en-US");
    if (!hasGSAP) { write(target); return; }
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true,
      onEnter: () => gsap.to(o, { v: target, duration: 2.2, ease: "power3.out",
        onUpdate: () => write(o.v) }) });
  });

  /* ─────────── footer fill ─────────── */
  if (ANIM) gsap.fromTo(".fg-fill", { clipPath: "inset(0 100% 0 0)" },
    { clipPath: "inset(0 -2% 0 0)", ease: "none",
      scrollTrigger: { trigger: ".footer-giant", start: "top 95%", end: "bottom 55%", scrub: true } });

  /* ─────────── cursor + magnetic ─────────── */
  if (ANIM && !TOUCH) {
    const dot = $(".cursor-dot"), ring = $(".cursor-ring"), label = $(".cursor-label");
    if (dot && ring) {
      gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
      const dx = gsap.quickTo(dot, "x", { duration: .1,  ease: "power3" });
      const dy = gsap.quickTo(dot, "y", { duration: .1,  ease: "power3" });
      const rx = gsap.quickTo(ring, "x", { duration: .45, ease: "power3" });
      const ry = gsap.quickTo(ring, "y", { duration: .45, ease: "power3" });
      addEventListener("mousemove", e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
      $$("a, button, .vid-card, [data-cursor]").forEach(el => {
        el.addEventListener("mouseenter", () => {
          ring.classList.add("is-active");
          label.textContent = el.dataset.cursor || "";
        });
        el.addEventListener("mouseleave", () => {
          ring.classList.remove("is-active");
          label.textContent = "";
        });
      });
    }
    $$("[data-magnetic]").forEach(el => {
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .35,
                      y: (e.clientY - r.top - r.height / 2) * .35,
                      duration: .4, ease: "power3" });
      });
      el.addEventListener("mouseleave", () =>
        gsap.to(el, { x: 0, y: 0, duration: .7, ease: "elastic.out(1,.45)" }));
    });
  }

  addEventListener("load", () => { if (hasGSAP) ScrollTrigger.refresh(); });

})(); /* ✅ FIX 3: closing restored */