import * as THREE from "three";

/* ════════════════════════════════════════════════════════════════
   Snoball — scroll-driven scene
   A snowball of light that gathers particles (conversations) as the
   page scrolls. Native vertical scroll only; the scene just reads it.
   ════════════════════════════════════════════════════════════════ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = () => window.innerWidth < 820;

document.getElementById("year").textContent = new Date().getFullYear();

/* ───────────────────────── Scene keyframes ─────────────────────────
   One keyframe per section, applied when that section is centred in
   the viewport. Values between sections are interpolated by scroll. */
const K = (o) => ({ dim: 1, mx: 1.0, my: -2.35, ms: 0.75, mdim: 0.5, ...o });
const KEYS = {
  hero:     K({ x:  1.75, y:  0.05, s: 0.78, accrete: 0.10, rings: 0.00, burst: 0.0, tilt: 0.00, mx: 0.35, my: 2.45, ms: 0.62, mdim: 0.9 }),
  belief:   K({ x: -2.60, y: -1.65, s: 0.55, accrete: 0.28, rings: 1.00, burst: 0.0, tilt: 0.35 }),
  model:    K({ x:  3.30, y: -0.70, s: 0.70, accrete: 0.45, rings: 0.25, burst: 0.0, tilt: 0.10 }),
  pillars:  K({ x: -2.90, y: -1.00, s: 0.85, accrete: 0.60, rings: 0.00, burst: 0.0, tilt: -0.1 }),
  channels: K({ x:  3.10, y:  1.45, s: 0.60, accrete: 0.74, rings: 0.55, burst: 0.0, tilt: 0.20, dim: 0.7 }),
  voice:    K({ x:  3.50, y:  1.45, s: 0.75, accrete: 0.88, rings: 0.00, burst: 0.0, tilt: 0.00 }),
  scale:    K({ x:  2.90, y:  1.55, s: 0.80, accrete: 1.00, rings: 0.00, burst: 1.0, tilt: 0.00, dim: 0.85 }),
  owled:    K({ x:  0.60, y: -2.30, s: 0.75, accrete: 1.00, rings: 0.35, burst: 0.2, tilt: 0.15 }),
  cta:      K({ x:  0.00, y: -4.00, s: 1.90, accrete: 1.00, rings: 0.00, burst: 0.0, tilt: 0.00, mx: 0, my: -2.6, ms: 1.25, mdim: 0.85 }),
};
const KEY_FIELDS = Object.keys(KEYS.hero);

/* ───────────────────────── Renderer ───────────────────────── */
const canvas = document.getElementById("scene");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
} catch (e) {
  document.documentElement.classList.add("no-webgl");
}

if (renderer) initScene();
initDom();

/* ════════════════════════════ 3D ════════════════════════════ */
function initScene() {
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x04060b, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04060b, 0.035);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0, 0, 9);

  const root = new THREE.Group();   // follows the scroll keyframes
  const ball = new THREE.Group();   // spins
  root.add(ball);
  scene.add(root);

  const uniforms = {
    uTime: { value: 0 },
    uAccrete: { value: KEYS.hero.accrete },
    uBurst: { value: 0 },
    uPixelRatio: { value: DPR },
    uDim: { value: 1 },
  };

  /* Core: frosted icy sphere with fresnel rim */
  const coreMat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uGlow: { value: 0.4 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vN; varying vec3 vView; varying vec3 vPos;
      void main(){
        vec3 p = position;
        float d = sin(p.x*5.0 + uTime*0.6) * sin(p.y*6.0 - uTime*0.4) * sin(p.z*4.0 + uTime*0.5);
        p += normal * d * 0.025;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        vPos = p;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uGlow; uniform float uAccrete; uniform float uDim;
      varying vec3 vN; varying vec3 vView; varying vec3 vPos;
      void main(){
        float f = pow(1.0 - max(dot(vN, vView), 0.0), 2.4);
        vec3 deep = vec3(0.03, 0.06, 0.12);
        vec3 ice  = vec3(0.62, 0.85, 1.0);
        float bands = 0.5 + 0.5*sin(vPos.y*18.0 + uTime*0.8 + vPos.x*6.0);
        vec3 col = mix(deep, ice*0.35, 0.25 + 0.2*bands*uAccrete);
        col += ice * f * (0.9 + uGlow);
        float key = pow(max(dot(vN, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 18.0);
        col += vec3(1.0) * key * 0.35;
        gl_FragColor = vec4(col * mix(0.35, 1.0, uDim), 1.0);
      }`,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 48), coreMat);
  ball.add(core);

  /* Halo sprite behind the ball */
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: { uStrength: { value: 0.6 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `varying vec2 vUv; uniform float uStrength;
        void main(){ float d = length(vUv-0.5)*2.0; float a = smoothstep(1.0, 0.0, d); a = pow(a, 3.0);
          gl_FragColor = vec4(vec3(0.45,0.7,1.0)*a*uStrength, 1.0); }`,
    })
  );
  halo.scale.setScalar(7);
  halo.position.z = -1.2;
  root.add(halo);

  /* Accreting particles: each has a far start and a home on the shell */
  const COUNT = isSmall() ? 7000 : 16000;
  const home = new Float32Array(COUNT * 3);
  const start = new Float32Array(COUNT * 3);
  const delay = new Float32Array(COUNT);
  const size = new Float32Array(COUNT);
  const seed = new Float32Array(COUNT);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const rad = 1.02 + Math.pow(Math.random(), 4) * 0.22;
    const jx = (Math.random() - 0.5) * 0.02, jy = (Math.random() - 0.5) * 0.02;
    home[i * 3] = Math.cos(th) * r * rad + jx;
    home[i * 3 + 1] = y * rad + jy;
    home[i * 3 + 2] = Math.sin(th) * r * rad;

    // starts: a wide flattened spiral disc, like debris drawn in
    const sr = 3.5 + Math.random() * 11;
    const sa = Math.random() * Math.PI * 2;
    start[i * 3] = Math.cos(sa) * sr;
    start[i * 3 + 1] = (Math.random() - 0.5) * 3.5 * (sr / 10);
    start[i * 3 + 2] = Math.sin(sa) * sr;

    delay[i] = Math.random();
    size[i] = 0.6 + Math.pow(Math.random(), 3) * 2.4;
    seed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(home, 3));
  pGeo.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
  pGeo.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

  const pMat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aStart; attribute float aDelay; attribute float aSize; attribute float aSeed;
      uniform float uTime, uAccrete, uBurst, uPixelRatio, uDim;
      varying float vAlpha; varying float vT;
      void main(){
        float d = aDelay * 0.92;
        float t = smoothstep(d, d + 0.08, uAccrete);
        float e = t*t*(3.0-2.0*t);
        // orbit while unattached, tighten as it falls in
        float ang = (1.0 - e) * (2.5 + aSeed*2.0) + uTime * (0.04 + aSeed*0.05) * (1.0 - e);
        vec3 s = aStart;
        float c = cos(ang), sn = sin(ang);
        s.xz = mat2(c, -sn, sn, c) * s.xz;
        vec3 h = position * (1.0 + 0.025*sin(uTime*1.3 + aSeed*40.0));
        vec3 p = mix(s, h, e);
        // burst: lift attached particles off the shell into a corona
        p += normalize(position) * uBurst * e * (0.15 + pow(aSeed, 2.0) * 2.6);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio * (mix(0.7, 1.0, e)) * (22.0 / -mv.z);
        vAlpha = mix(0.18, 0.95, e) * (0.6 + 0.4*sin(uTime*2.0 + aSeed*30.0)*0.5 + 0.2);
        vAlpha *= uDim;
        vT = e;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha; varying float vT;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        vec3 col = mix(vec3(0.55, 0.78, 1.0), vec3(0.92, 0.97, 1.0), vT);
        gl_FragColor = vec4(col * a * vAlpha, 1.0);
      }`,
  });
  const particles = new THREE.Points(pGeo, pMat);
  particles.frustumCulled = false;
  ball.add(particles);

  /* Orbit rings: one per channel, X innermost */
  const rings = new THREE.Group();
  root.add(rings);
  const ringData = [];
  for (let i = 0; i < 7; i++) {
    const R = 1.55 + i * 0.32;
    const N = 320;
    const pts = new Float32Array(N * 3);
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2;
      pts[k * 3] = Math.cos(a) * R;
      pts[k * 3 + 1] = 0;
      pts[k * 3 + 2] = Math.sin(a) * R;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const m = new THREE.LineBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const line = new THREE.LineLoop(g, m);
    const pivot = new THREE.Group();
    pivot.rotation.set(1.15 + (i % 2 ? 0.22 : -0.18) + i * 0.03, 0, (i - 3) * 0.13);
    pivot.add(line);

    const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    const sat = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? 0.07 : 0.045, 16, 16), satMat);
    pivot.add(sat);
    rings.add(pivot);
    ringData.push({ R, line, sat, pivot, speed: 0.35 / (1 + i * 0.35), phase: Math.random() * 6.28, hl: 0 });
  }

  /* Background dust for depth */
  const DUST = isSmall() ? 700 : 1600;
  const dpos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dpos[i * 3] = (Math.random() - 0.5) * 40;
    dpos[i * 3 + 1] = (Math.random() - 0.5) * 60;
    dpos[i * 3 + 2] = -4 - Math.random() * 30;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
    color: 0x8fb8e0, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false,
  }));
  scene.add(dust);

  /* ───────── Scroll → state ───────── */
  const sections = [...document.querySelectorAll("[data-scene]")];
  let anchors = [];
  const measure = () => {
    anchors = sections.map((el) => {
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      // anchor = scroll position where the section's centre meets the viewport centre
      const centre = top + Math.min(r.height, window.innerHeight * 1.6) / 2 - window.innerHeight / 2;
      return { key: KEYS[el.dataset.scene], at: Math.max(0, centre) };
    });
    anchors[0].at = 0;
    anchors[anchors.length - 1].at = Math.min(anchors[anchors.length - 1].at, document.documentElement.scrollHeight - window.innerHeight);
  };

  const target = { ...KEYS.hero };
  const state = { ...KEYS.hero };
  const sampleScroll = () => {
    const y = window.scrollY;
    let i = 0;
    while (i < anchors.length - 1 && y > anchors[i + 1].at) i++;
    const a = anchors[i], b = anchors[Math.min(i + 1, anchors.length - 1)];
    const span = Math.max(1, b.at - a.at);
    let t = a === b ? 0 : THREE.MathUtils.clamp((y - a.at) / span, 0, 1);
    t = t * t * (3 - 2 * t);
    for (const f of KEY_FIELDS) target[f] = a.key[f] + (b.key[f] - a.key[f]) * t;
  };

  /* Ring highlight follows the active channel in the belief list */
  window.addEventListener("snoball:ring", (e) => {
    ringData.forEach((r, i) => (r.hlTarget = i === e.detail ? 1 : 0));
  });

  /* Pointer parallax (desktop only) */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ───────── Resize ───────── */
  let viewW = 1;
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // width of the visible plane at z=0, used to keep x offsets proportional
    viewW = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    measure();
  };
  window.addEventListener("resize", resize);
  // fonts + images change layout height
  document.fonts?.ready.then(measure);
  window.addEventListener("load", measure);
  resize();
  sampleScroll();
  Object.assign(state, target);

  /* ───────── Loop ───────── */
  const clock = new THREE.Clock();
  let rot = 0, lastY = window.scrollY, velocity = 0, visible = true;
  document.addEventListener("visibilitychange", () => (visible = !document.hidden));

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    sampleScroll();
    const k = 1 - Math.pow(0.0025, dt); // frame-rate independent easing
    for (const f of KEY_FIELDS) state[f] += (target[f] - state[f]) * k;

    // scroll velocity → rolling speed (it's a snowball, it rolls)
    const sy = window.scrollY;
    const v = (sy - lastY) / Math.max(dt, 1e-3);
    lastY = sy;
    velocity += (THREE.MathUtils.clamp(v / 1500, -2, 2) - velocity) * 0.08;

    rot += dt * (reduceMotion ? 0.03 : 0.12 + Math.abs(velocity) * 1.4);
    ball.rotation.y = rot;
    ball.rotation.x = rot * 0.35 + velocity * 0.15;

    const small = isSmall();
    const xScale = viewW / 11.5;
    root.position.x = small ? state.mx : state.x * xScale;
    root.position.y = small ? state.my : state.y;
    const dim = small ? state.mdim : state.dim;
    uniforms.uDim.value = dim;
    const s = (small ? state.ms : state.s) * (0.92 + state.accrete * 0.16);
    ball.scale.setScalar(s);
    halo.scale.setScalar(s * (5.5 + state.burst * 2.5));
    halo.material.uniforms.uStrength.value = (0.32 + state.accrete * 0.35 + state.burst * 0.25) * dim;
    core.scale.setScalar(0.62 + state.accrete * 0.3);
    coreMat.uniforms.uGlow.value = state.accrete * 0.6 + state.burst * 0.4;

    uniforms.uTime.value = time;
    uniforms.uAccrete.value = state.accrete;
    uniforms.uBurst.value = state.burst;

    rings.rotation.x = state.tilt;
    rings.scale.setScalar(s / 0.7);
    ringData.forEach((r, i) => {
      r.hl += ((r.hlTarget ?? 0) - r.hl) * 0.08;
      const base = state.rings * (i === 0 ? 0.55 : 0.28 - i * 0.02);
      r.line.material.opacity = (base + r.hl * state.rings * 0.6) * dim;
      const a = r.phase + time * r.speed;
      r.sat.position.set(Math.cos(a) * r.R, 0, Math.sin(a) * r.R);
      r.sat.material.opacity = state.rings * (0.5 + r.hl * 0.5) * dim;
      r.sat.scale.setScalar(1 + r.hl * 0.8);
      r.pivot.rotation.y = time * 0.02 * (i % 2 ? 1 : -1);
    });

    dust.position.y = (sy / window.innerHeight) * 1.2;
    dust.rotation.y = time * 0.01;

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    camera.position.x = pointer.x * 0.35;
    camera.position.y = -pointer.y * 0.25;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };
  tick();
}

/* ════════════════════════════ DOM ════════════════════════════ */
function initDom() {
  /* Split headings into masked words */
  document.querySelectorAll(".split").forEach((el) => {
    let n = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(" ");
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.textContent = part;
            inner.style.setProperty("--d", `${n++ * 0.06}s`);
            w.append(inner);
            frag.append(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(el);
  });

  /* Stagger siblings */
  document.querySelectorAll(".channel-grid, .pillar-stack, .principles, .stats, .flow, .hero-actions").forEach((g) => {
    [...g.querySelectorAll(".reveal")].forEach((el, i) => el.style.setProperty("--d", `${i * 0.08}s`));
  });

  /* Reveal on enter */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.querySelector("[data-count]")) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  document.querySelectorAll(".reveal, .split").forEach((el) => io.observe(el));

  /* Count-up stats */
  function countUp(el) {
    el.querySelectorAll("[data-count]").forEach((n) => {
      const end = parseFloat(n.dataset.count);
      const dec = parseInt(n.dataset.decimals || "0", 10);
      if (reduceMotion) return (n.textContent = end.toFixed(dec));
      const t0 = performance.now(), dur = 1800;
      const step = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 4);
        n.textContent = (end * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* Active channel in the belief list → highlight its 3D ring */
  const items = [...document.querySelectorAll(".orbit-item")];
  let active = -1;
  const updateActive = () => {
    const mid = window.innerHeight * 0.5;
    let best = -1, bestD = Infinity;
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD && r.bottom > 0 && r.top < window.innerHeight) { bestD = d; best = i; }
    });
    if (bestD > window.innerHeight * 0.35) best = -1;
    if (best !== active) {
      active = best;
      items.forEach((el, i) => {
        el.classList.toggle("active", i === best);
        el.classList.toggle("seen", best >= 0 && i < best);
      });
      window.dispatchEvent(new CustomEvent("snoball:ring", { detail: best }));
    }
  };

  /* Nav + momentum rail */
  const nav = document.querySelector(".nav");
  const fill = document.querySelector(".rail-fill");
  const dot = document.querySelector(".rail-ball");
  const num = document.getElementById("momentum");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    nav.classList.toggle("scrolled", window.scrollY > 40);
    fill.style.height = `${p * 100}%`;
    dot.style.top = `${p * 100}%`;
    const size = 6 + p * 10;
    dot.style.width = dot.style.height = `${size}px`;
    num.textContent = String(Math.round(p * 100)).padStart(3, "0");
    updateActive();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* Glass cards: light follows the pointer */
  document.querySelectorAll(".glass").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}
