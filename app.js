// Our Little Kailash — looping journey film, a map whose places are still locked, the reels and free wallpapers.
const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger, window.ScrollToPlugin);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const IG = "https://www.instagram.com/parvathi.diaries/";

/* ======================= content ======================= */
// pin = [x%, y%] on the painted map; img = picture + wallpaper in assets/olk/
const PLACES = [
  { n: "01", name: "The Kailash Entrance", pin: [50, 89], emoji: "🔔", img: "entrance" },
  { n: "02", name: "Parvati's Garden", pin: [29, 69], emoji: "🌸", img: "garden" },
  { n: "03", name: "The Couple's Corner", pin: [79, 51], emoji: "💞", img: "corner" },
  { n: "04", name: "The Kailash Temple", pin: [24, 38], emoji: "🪔", img: "temple" },
  { n: "05", name: "Shiva's Meditation Spot", pin: [68, 28], emoji: "🔱", img: "meditation" },
];
const REELS = [
  ["r_cook", "He Tried to Cook", "She had a cold. He had a wooden spoon and no idea.", "🔥 138K views"],
  ["r_silent", "He Woke Up for a Ladoo", "She tried everything. One ladoo did it.", "⭐ 43K views"],
  ["r_crying", "Why Is She Crying?", "He gave up his ladoo. Was it worth it?", "✨ New"],
  ["r_blanket", "The Blanket Thief", "It's freezing on Kailash. Someone took everything.", ""],
  ["r_help", "Just One Small Help", "He fell into deep meditation. Very convenient.", ""],
  ["r_snowball", "Snowball War", "He started it. She finished it. Nandi ended it.", ""],
  ["r_5min", "Just 5 Minutes", "She said five minutes. He grew a beard.", ""],
  ["r_forgot", "He Forgot", "Their special day. His blank face. A very messy bouquet.", ""],
];
// the film's places; times are seconds into hero_loop_*.mp4 (middle of each white dissolve, see gen/hero_loop.py)
const STOPS = [
  [0, "Kashi", "where the Ganga meets the dawn"],
  [5.27, "The Himalayas", "the long climb north"],
  [12.19, "Mount Kailash", "rising above the clouds"],
  [19.11, "The Gate of Kailash", "home of Mahadev & Parvati"],
  [24.95, "Kashi", "where the Ganga meets the dawn"],   // the loop dissolves back to the start
];

/* ======================= sound (made on the fly) ======================= */
let muted = false, ac = null;
const audio = () => (ac ||= new (window.AudioContext || window.webkitAudioContext)());
function tone(f, dur, type = "sine", vol = 0.15, when = 0) {
  if (muted) return null;
  const a = audio(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05); return o;
}
const sfx = { lock: () => { tone(330, 0.12, "triangle", 0.12); tone(247, 0.18, "triangle", 0.1, 0.1); } };
$(".sound").addEventListener("click", e => {
  muted = !muted; e.currentTarget.textContent = muted ? "🔕" : "🔔";
  e.currentTarget.setAttribute("aria-pressed", String(!muted)); e.currentTarget.setAttribute("aria-label", muted ? "Sound off" : "Sound on");
});

/* ======================= helpers ======================= */
function split(el) {
  el.innerHTML = el.textContent.trim().split(" ").map(w =>
    `<span class="w">${[...w].map(c => `<span class="ch">${c}</span>`).join("")}</span>`).join(" ");
  return $$(".ch", el);
}
// play a video when on screen, pause when not
const vio = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
}), { rootMargin: "250px 0px", threshold: 0.1 });

/* ======================= map: every place is still locked ======================= */
const pinsEl = $(".pins"), mapPath = $(".map-path path"), toast = $(".toast");
PLACES.forEach(p => {
  const b = document.createElement("button");
  b.className = "pin-btn"; b.style.left = p.pin[0] + "%"; b.style.top = p.pin[1] + "%";
  b.setAttribute("aria-label", `${p.name} (locked, under construction)`);
  b.innerHTML = `<span class="pin-dot">${p.emoji}<i class="pin-lock">🔒</i></span><span class="pin-label">${p.n} · ${p.name.replace(/^The /, "")}</span>`;
  b.addEventListener("click", () => locked(p, b));
  pinsEl.appendChild(b);
});
// smooth path through the pins (Catmull-Rom to Bezier), in a 100 x 185 box
(() => {
  const P = PLACES.map(p => [p.pin[0], p.pin[1] * 1.851]);
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  mapPath.setAttribute("d", d);
})();
let toastTimer = 0;
function locked(p, btn) {
  sfx.lock();
  gsap.fromTo($(".pin-dot", btn), { x: -6 }, { x: 0, duration: 0.6, ease: "elastic.out(1.6, 0.2)" });
  $(".toast-title", toast).textContent = `${p.emoji} ${p.name}`;
  gsap.killTweensOf(toast);
  gsap.fromTo(toast, { autoAlpha: 0, y: 24, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(2)" });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => gsap.to(toast, { autoAlpha: 0, y: 16, duration: 0.35 }), 3800);
}
$(".toast-x").addEventListener("click", () => gsap.to(toast, { autoAlpha: 0, y: 16, duration: 0.3 }));

/* ======================= GSAP scroll choreography ======================= */
const mm = gsap.matchMedia();
mm.add({ motion: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" }, ctx => {
  const { motion } = ctx.conditions;

  // film: title rises in, then lets the journey (and its place captions) speak
  gsap.from(split($(".film .mega")), { yPercent: 120, rotate: 12, opacity: 0, stagger: 0.035, duration: 1, ease: "back.out(1.8)", delay: 1.2 });
  gsap.from(".film .eyebrow, .film .hand", { y: 20, opacity: 0, duration: 1, stagger: 0.2, delay: 1.8 });
  gsap.to(".film-copy", { opacity: 0, y: -20, duration: 1.2, delay: 7 });

  // scroll: the film keeps looping while the map fades in on top of it; the path draws; pins pop in order
  const len = mapPath.getTotalLength();
  gsap.set(mapPath, { strokeDasharray: len, strokeDashoffset: len });
  gsap.timeline({ scrollTrigger: { id: "film", trigger: ".film", start: "top top", end: motion ? "+=180%" : "+=80%", scrub: 1, pin: ".film .pin" } })
    .to(".film-copy, .film-cue, .film-place", { opacity: 0, y: -24, ease: "power1.in", duration: 0.3 }, 0)
    .to(".film-scrim", { opacity: 1, ease: "none", duration: 0.45 }, 0.15)
    .to(".map-layer", { autoAlpha: 1, ease: "power1.out", duration: 0.35 }, 0.3)
    .from(".map-card", { y: 50, scale: 0.92, ease: "power2.out", duration: 0.5 }, 0.3)
    .from(".map-head > *", { y: 30, opacity: 0, stagger: 0.08, duration: 0.35 }, 0.35)
    .to(mapPath, { strokeDashoffset: 0, ease: "none", duration: 1.2 }, 0.7)
    .from(".pin-btn", { scale: 0, opacity: 0, stagger: 0.22, ease: "back.out(3)", duration: 0.35 }, 0.7)
    .to({}, { duration: 0.3 });   // hold the finished map for a moment before the page moves on

  // reels and wallpapers: staggered pop-in
  ScrollTrigger.batch(".reel, .wall", {
    start: "top 88%", once: true,
    onEnter: b => gsap.from(b, { y: 60, rotate: () => gsap.utils.random(-6, 6), opacity: 0, scale: 0.9, stagger: 0.08, duration: 0.8, ease: "back.out(1.6)" }),
  });
  $$(".block .big").forEach(h => {
    gsap.from(split(h), { scrollTrigger: { trigger: h, start: "top 85%" }, yPercent: 100, opacity: 0, stagger: 0.02, duration: 0.6, ease: "back.out(2)" });
  });
});

/* ======================= the landscape film (loops) ======================= */
(() => {
  const v = $(".film-vid"), blur = $(".film-blur");
  const big = innerWidth >= 900 && !matchMedia("(pointer: coarse)").matches;
  v.src = big ? "assets/olk/hero_loop_1080.mp4" : "assets/olk/hero_loop_720.mp4";
  if (getComputedStyle(blur).display !== "none") blur.src = "assets/olk/hero_loop_360.mp4";
  const play = () => { v.play().catch(() => {}); if (blur.src) blur.play().catch(() => {}); };
  const pause = () => { v.pause(); blur.pause(); };
  play();
  new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()), { threshold: 0.05 }).observe($(".film"));
  // keep the blurred fill in step, and swap the place caption when the film reaches the next place
  const name = $(".fp-name"), sub = $(".fp-sub"), steps = $$(".fp-steps li"), text = $(".fp-text");
  let cur = -1, lastSync = 0;
  const show = i => {
    cur = i; const [, n, d] = STOPS[i];
    steps.forEach((li, k) => li.classList.toggle("on", k === i % 4));
    gsap.timeline()
      .to(text, { opacity: 0, y: -10, duration: 0.25, ease: "power1.in" })
      .add(() => { name.textContent = n; sub.textContent = d; })
      .fromTo(text, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
  };
  gsap.ticker.add(time => {
    if (v.paused) return;
    let i = 0; STOPS.forEach((st, k) => { if (v.currentTime >= st[0]) i = k; });
    if (i !== cur) show(i);
    if (blur.src && time - lastSync > 2 && Math.abs(blur.currentTime - v.currentTime) > 0.25) { blur.currentTime = v.currentTime; lastSync = time; }
  });
  show(0);
})();
// "Map" in the top bar: scroll to where the map has fully opened
$('.nav a[href="#map"]').addEventListener("click", e => {
  const st = ScrollTrigger.getById("film"); if (!st) return;
  e.preventDefault(); gsap.to(window, { scrollTo: st.start + (st.end - st.start) * 0.92, duration: 1.2, ease: "power2.inOut" });
});

/* ======================= reels & wallpapers ======================= */
$(".shelf").innerHTML = REELS.map(([f, t, d, b], i) =>
  `<a class="reel${i === 0 ? " hero-reel" : ""}" href="${IG}reels/" target="_blank" rel="noopener">
     <video data-src="assets/vid/${f}.mp4" poster="assets/vid/${f}.jpg" muted loop playsinline preload="none"></video>
     ${b ? `<span class="badge">${b}</span>` : ""}<b>${t}</b><small>${d}</small></a>`).join("");
$(".walls").innerHTML = PLACES.map(p =>
  `<figure class="wall"><img src="assets/olk/${p.img}.webp" alt="${p.name} wallpaper" loading="lazy">
     <figcaption><b>${p.name}</b><a class="dl" href="assets/olk/${p.img}_wallpaper.jpg" download="kailash-${p.img}.jpg">⬇ Download</a></figcaption></figure>`).join("");
$$(".shelf video[data-src]").forEach(v => vio.observe(v));
// 3D tilt on cards under the pointer
$$(".wall, .reel").forEach(el => {
  const rx = gsap.quickTo(el, "rotateX", { duration: 0.4 }), ry = gsap.quickTo(el, "rotateY", { duration: 0.4 });
  el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 16); rx(-((e.clientY - r.top) / r.height - 0.5) * 16); });
  el.addEventListener("pointerleave", () => { rx(0); ry(0); });
});

/* ======================= snow ======================= */
const cv = $(".snow"), cx = cv.getContext("2d"); let flakes = [];
function sizeSnow() {
  const dpr = Math.min(devicePixelRatio || 1, 1.5); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  flakes = reduce ? [] : Array.from({ length: Math.round(Math.min(70, innerWidth * innerHeight / 16000)) }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 0.8 + Math.random() * 2.2, s: 0.3 + Math.random() * 0.8, d: Math.random() * 6 }));
}
sizeSnow(); addEventListener("resize", sizeSnow);
gsap.ticker.add(() => {
  cx.clearRect(0, 0, innerWidth, innerHeight); cx.fillStyle = "rgba(255,255,255,.85)";
  for (const f of flakes) { f.y += f.s; f.d += 0.01; f.x += Math.sin(f.d) * 0.4; if (f.y > innerHeight + 5) { f.y = -5; f.x = Math.random() * innerWidth; } cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.28); cx.fill(); }
});

/* ======================= loader ======================= */
(() => {
  const paths = $$(".ld");
  paths.forEach(p => { const l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); });
  const tl = gsap.timeline();
  tl.to(paths, { strokeDashoffset: 0, duration: 1.2, stagger: 0.25, ease: "power2.inOut" })
    .from(".loader-text", { opacity: 0, y: 10, duration: 0.5 }, "-=0.4");
  const done = () => gsap.to(".loader", { opacity: 0, duration: 0.7, delay: 0.3, onComplete: () => { $(".loader").remove(); ScrollTrigger.refresh(); } });
  Promise.race([new Promise(r => addEventListener("load", r)), new Promise(r => setTimeout(r, 3500))]).then(() => tl.then(done));
})();
