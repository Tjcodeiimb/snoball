import * as THREE from "three";

/* ════════════════════════════════════════════════════════════════
   Snoball: one fixed WebGL scene behind the page. A small cartoon
   snowball gathers flakes and grows section by section until it fills
   the bottom of the screen. Native vertical scroll only.
   ════════════════════════════════════════════════════════════════ */

const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isNarrow = () => innerWidth / innerHeight < 0.85 || innerWidth < 640;
document.getElementById("year").textContent = new Date().getFullYear();

/* ───────── Scene keyframes, one per section ─────────
   x, y: ball centre as a fraction of the half-viewport (−1 left/bottom … 1 right/top)
   s:    ball radius as a fraction of the half-viewport height (grows all the way down)
   acc:  how many loose flakes have been absorbed (0 … 1)
   rings: channel orbit rings (belief section)
   mx, my: optional overrides for narrow screens */
const KEYS = {
  hero:     { x:  0.52, y:  0.04, s: 0.15, acc: 0.00, rings: 0, mx: 0.42, my: 0.6 },
  clients:  { x:  0.80, y:  0.55, s: 0.17, acc: 0.08, rings: 0 },
  belief:   { x: -0.55, y: -0.50, s: 0.20, acc: 0.18, rings: 1 },
  model:    { x:  0.80, y:  0.45, s: 0.24, acc: 0.28, rings: 0 },
  pillars:  { x: -0.72, y: -0.35, s: 0.28, acc: 0.38, rings: 0 },
  channels: { x:  0.88, y:  0.58, s: 0.31, acc: 0.46, rings: 0 },
  work:     { x: -1.00, y: -0.20, s: 0.34, acc: 0.54, rings: 0 },
  cases:    { x:  0.95, y: -0.45, s: 0.38, acc: 0.62, rings: 0 },
  voice:    { x:  0.92, y:  0.55, s: 0.42, acc: 0.70, rings: 0 },
  scale:    { x:  0.88, y:  0.60, s: 0.47, acc: 0.80, rings: 0 },
  owled:    { x:  0.90, y:  0.62, s: 0.53, acc: 0.90, rings: 0 },
  cta:      { x:  0.00, y: -1.42, s: 1.02, acc: 1.00, rings: 0, mx: 0, my: -1.25 },
};
const FIELDS = ["x", "y", "s", "acc", "rings"];

/* ════════════════ Logos ════════════════ */
const TOP = ["apple", "emergent", "wisprflow", "openai", "replit", "gamma"];
const TALL = new Set(["esteelauder", "hdfclife", "warnermusic", "hotstar", "cred", "tatacommunications"]);
const slugOf = (f) => f.file.replace(/\.(svg|png|webp)$/, "");

function logoEl(f) {
  const span = document.createElement("span");
  span.className = `logo tone-${f.tone || "dark"} ${f.kind === "symbol" ? "symbol" : ""} ${TALL.has(slugOf(f)) ? "tall" : ""}`;
  const img = new Image();
  img.src = `assets/logos/${f.file}`;
  img.alt = f.name;
  img.decoding = "async";
  span.append(img);
  return span;
}

async function renderLogos() {
  let list = [];
  try {
    const res = await fetch("assets/logos/manifest.json", { cache: "no-cache" });
    if (res.ok) list = await res.json();
  } catch (e) { /* leave the rows empty rather than show fake marks */ }
  const bySlug = new Map(list.map((f) => [slugOf(f), f]));

  const top = document.getElementById("logo-top");
  TOP.forEach((slug) => {
    const f = bySlug.get(slug);
    if (!f) return;
    const li = document.createElement("li");
    li.append(logoEl(f));
    top.append(li);
  });

  const rest = list.filter((f) => !TOP.includes(slugOf(f)));
  const half = Math.ceil(rest.length / 2);
  [["logo-row-a", rest.slice(0, half)], ["logo-row-b", rest.slice(half)]].forEach(([id, items]) => {
    const row = document.getElementById(id);
    [0, 1].forEach((copy) => items.forEach((f) => {
      const li = document.createElement("li");
      if (copy) li.setAttribute("aria-hidden", "true");
      li.append(logoEl(f));
      row.append(li);
    }));
  });

  document.querySelectorAll("[data-logo]").forEach((li) => {
    const f = bySlug.get(li.dataset.logo);
    if (!f) return;
    li.textContent = "";
    li.append(logoEl(f));
  });
}
renderLogos();

/* ════════════════ Text motion ════════════════ */
document.querySelectorAll(".split").forEach((el) => {
  let n = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(" "); return; }
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

document.querySelectorAll(".channel-grid, .pillar-stack, .principles, .stats, .flow, .reel-grid, .case-grid, .ai-more").forEach((g) => {
  [...g.querySelectorAll(".reveal")].forEach((el, i) => el.style.setProperty("--d", `${Math.min(i, 6) * 0.08}s`));
});

function countUp(el) {
  const end = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.decimals || "0", 10);
  if (reduceMotion) return;
  const t0 = performance.now(), dur = 1800;
  const step = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = (end * (1 - Math.pow(1 - p, 4))).toFixed(dec);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    e.target.querySelectorAll("[data-count]").forEach(countUp);
    io.unobserve(e.target);
  });
}, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
document.querySelectorAll(".reveal, .split:not(.display)").forEach((el) => io.observe(el));

/* Intro: nav drops, headline words rise, the rest follows, the ball pops in */
let introStart = Infinity;
document.querySelectorAll(".intro-item").forEach((el, i) => el.style.setProperty("--d", `${0.55 + i * 0.12}s`));
const begin = () => {
  root.classList.add("loaded");
  document.querySelector(".display")?.classList.add("in");
  introStart = performance.now() + 350;
};
Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(() => requestAnimationFrame(begin));

/* ════════════════ Scroll UI ════════════════ */
const nav = document.getElementById("nav");
const railFill = document.querySelector(".rail-fill");
const railBall = document.querySelector(".rail-ball");
const momentum = document.getElementById("momentum");
const orbitItems = [...document.querySelectorAll(".orbit-item")];
const bgSections = [...document.querySelectorAll("[data-bg]")];
let activeRing = -1;

function onScroll() {
  const max = root.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(scrollY / max, 1) : 0;
  nav.classList.toggle("scrolled", scrollY > 30);
  railFill.style.height = `${p * 100}%`;
  railBall.style.top = `${p * 100}%`;
  const size = 7 + p * 11;
  railBall.style.width = railBall.style.height = `${size}px`;
  momentum.textContent = String(Math.round(p * 100)).padStart(3, "0");

  // page colour follows whichever themed section holds the viewport centre
  const mid = innerHeight / 2;
  let bg = "";
  bgSections.forEach((s) => { const r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) bg = s.dataset.bg; });
  if ((root.dataset.bg || "") !== bg) { if (bg) root.dataset.bg = bg; else delete root.dataset.bg; }

  // active channel in the belief list → its orbit ring lights up
  let best = -1, bestD = Infinity;
  orbitItems.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - mid);
    if (d < bestD && r.bottom > 0 && r.top < innerHeight) { bestD = d; best = i; }
  });
  if (bestD > innerHeight * 0.35) best = -1;
  if (best !== activeRing) {
    activeRing = best;
    orbitItems.forEach((el, i) => { el.classList.toggle("active", i === best); el.classList.toggle("seen", best >= 0 && i < best); });
  }
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
onScroll();

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

/* ════════════════ 3D scene ════════════════ */
const canvas = document.getElementById("scene");
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (e) { renderer = null; }
if (renderer) initScene();

function lumpyBall() {
  const geo = new THREE.IcosahedronGeometry(1, 7);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const n = Math.sin(v.x * 5.1 + 1.3) * Math.sin(v.y * 4.3 + 0.7) * Math.sin(v.z * 5.7 + 2.1)
            + 0.5 * Math.sin(v.x * 11.0 + v.z * 7.0) * Math.sin(v.y * 9.0);
    v.multiplyScalar(1 + n * 0.018);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function initScene() {
  const DPR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 12);
  const HALF_H = Math.tan(THREE.MathUtils.degToRad(15)) * 12;

  const INK = new THREE.Color(0x0a1330);
  const BLUE = new THREE.Color(0x3462fc);

  /* Ball: toon-shaded snow with an ink outline */
  const geo = lumpyBall();
  const ballMat = new THREE.ShaderMaterial({
    uniforms: { uLight: { value: new THREE.Vector3(-0.55, 0.75, 0.6).normalize() } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vObj; varying vec3 vView;
      void main() {
        vObj = position;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vView = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uLight;
      varying vec3 vN; varying vec3 vObj; varying vec3 vView;
      void main() {
        vec3 n = normalize(vN);
        float d = dot(n, uLight);
        vec3 col = d > 0.42 ? vec3(1.0) : (d > -0.12 ? vec3(0.886, 0.918, 1.0) : vec3(0.737, 0.800, 0.973));
        float clump = sin(vObj.x * 6.0) * sin(vObj.y * 5.0 + 1.0) * sin(vObj.z * 6.5 + 2.0);
        col = mix(col, col * vec3(0.93, 0.95, 1.0), step(0.28, clump));
        float spec = pow(max(dot(n, normalize(uLight + vView)), 0.0), 60.0);
        col = mix(col, vec3(1.0), step(0.6, spec));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const root3 = new THREE.Group();        // follows the keyframes
  const ball = new THREE.Group();         // scaled to the ball radius
  const spinner = new THREE.Group();      // rolls
  const body = new THREE.Mesh(geo, ballMat);
  const outline = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
  spinner.add(body, outline);
  ball.add(spinner);
  root3.add(ball);
  scene.add(root3);

  /* Soft contact shadow */
  const sc = document.createElement("canvas");
  sc.width = sc.height = 128;
  const g = sc.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(31,59,179,0.28)");
  grd.addColorStop(0.6, "rgba(31,59,179,0.08)");
  grd.addColorStop(1, "rgba(31,59,179,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.renderOrder = -1;
  root3.add(shadow);

  /* Channel orbit rings (lit by the belief list) */
  const rings = new THREE.Group();
  root3.add(rings);
  const ringData = [];
  for (let i = 0; i < 7; i++) {
    const R = 1.55 + i * 0.3;
    const mat = new THREE.MeshBasicMaterial({ color: INK.clone(), transparent: true, opacity: 0, depthWrite: false });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(R, i === 0 ? 0.016 : 0.011, 6, 180), mat);
    const pivot = new THREE.Group();
    pivot.rotation.set(1.2 + (i % 2 ? 0.2 : -0.16) + i * 0.03, 0, (i - 3) * 0.12);
    pivot.add(torus);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const satLine = new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0, side: THREE.BackSide });
    const satGeo = new THREE.SphereGeometry(i === 0 ? 0.11 : 0.08, 16, 12);
    const sat = new THREE.Group();
    const satOut = new THREE.Mesh(satGeo, satLine);
    satOut.scale.setScalar(1.3);
    sat.add(new THREE.Mesh(satGeo, satMat), satOut);
    pivot.add(sat);
    rings.add(pivot);
    ringData.push({ R, mat, satMat, satLine, sat, pivot, speed: 0.4 / (1 + i * 0.35), phase: Math.random() * 6.28, hl: 0 });
  }

  /* Loose flakes that drift around and get absorbed as the ball grows */
  const COUNT = isNarrow() ? 34 : 56;
  const start = new Float32Array(COUNT * 3);
  const dir = new Float32Array(COUNT * 3);
  const delay = new Float32Array(COUNT);
  const size = new Float32Array(COUNT);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    // start positions in ball radii, so the flakes hug the ball at any size
    const r = 1.5 + Math.random() * 1.6;
    const a = Math.random() * Math.PI * 2;
    start[i * 3] = Math.cos(a) * r;
    start[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
    start[i * 3 + 2] = Math.sin(a) * r * 0.5;
    const v = new THREE.Vector3().randomDirection();
    dir.set([v.x, v.y, v.z], i * 3);
    delay[i] = Math.random();
    size[i] = 7 + Math.pow(Math.random(), 2) * 7;
    seed[i] = Math.random();
  }
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute("position", new THREE.BufferAttribute(start, 3));
  fGeo.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
  fGeo.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
  fGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  fGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const fUniforms = {
    uTime: { value: 0 }, uAcc: { value: 0 }, uR: { value: 1 }, uPR: { value: DPR },
    uFade: { value: 0 }, uSpin: { value: new THREE.Matrix3() },
  };
  const flakes = new THREE.Points(fGeo, new THREE.ShaderMaterial({
    uniforms: fUniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec3 aDir; attribute float aDelay; attribute float aSize; attribute float aSeed;
      uniform float uTime, uAcc, uR, uPR, uFade; uniform mat3 uSpin;
      varying float vAlpha;
      void main() {
        float d = aDelay * 0.62;
        float t = smoothstep(d, d + 0.1, uAcc);
        float e = t * t * (3.0 - 2.0 * t);
        float ang = uTime * (0.05 + aSeed * 0.07) + aSeed * 6.28;
        vec3 s = position * uR;
        float c = cos(ang), sn = sin(ang);
        s.xz = mat2(c, -sn, sn, c) * s.xz;
        s.y += sin(uTime * (0.6 + aSeed) + aSeed * 12.0) * 0.12 * uR;
        vec3 home = uSpin * aDir * uR;
        vec3 p = mix(s, home, e);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPR * (1.0 - e * 0.6);
        vAlpha = (1.0 - smoothstep(0.8, 1.0, e)) * uFade;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        vec3 col = r > 0.36 ? vec3(0.039, 0.075, 0.188) : vec3(1.0);
        float edge = smoothstep(0.5, 0.46, r);
        gl_FragColor = vec4(col, vAlpha * edge);
      }`,
  }));
  flakes.frustumCulled = false;
  root3.add(flakes);

  /* ───────── Scroll → keyframe state ───────── */
  const sections = [...document.querySelectorAll("[data-scene]")];
  let anchors = [];
  const keyFor = (name) => {
    const k = { ...KEYS[name] };
    if (isNarrow()) {
      // phones: tuck the ball into a top corner, half off-screen, clear of the text
      k.x = k.mx ?? (k.x >= 0 ? 0.95 : -0.95);
      k.y = k.my ?? 0.64;
      k.s = name === "cta" ? k.s : Math.min(k.s * 0.95, 0.34);
    }
    return k;
  };
  const measure = () => {
    anchors = sections.map((el) => {
      const r = el.getBoundingClientRect();
      const top = r.top + scrollY;
      const at = top + Math.min(r.height, innerHeight * 1.6) / 2 - innerHeight / 2;
      return { key: keyFor(el.dataset.scene), at: Math.max(0, at) };
    });
    anchors[0].at = 0;
    const last = anchors[anchors.length - 1];
    last.at = Math.min(last.at, root.scrollHeight - innerHeight);
  };
  const target = {}, state = {};
  const sample = () => {
    const y = scrollY;
    let i = 0;
    while (i < anchors.length - 1 && y > anchors[i + 1].at) i++;
    const a = anchors[i], b = anchors[Math.min(i + 1, anchors.length - 1)];
    let t = a === b ? 0 : THREE.MathUtils.clamp((y - a.at) / Math.max(1, b.at - a.at), 0, 1);
    t = t * t * (3 - 2 * t);
    for (const f of FIELDS) target[f] = a.key[f] + (b.key[f] - a.key[f]) * t;
  };

  let halfW = 1;
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    halfW = HALF_H * camera.aspect;
    measure();
  };
  addEventListener("resize", resize);
  document.fonts?.ready.then(measure);
  addEventListener("load", measure);
  new ResizeObserver(measure).observe(document.body);
  resize();
  sample();
  Object.assign(state, target);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  const tag = document.getElementById("ball-tag");
  const tmp = new THREE.Vector3();
  const clock = new THREE.Clock();
  let roll = 0, lastY = scrollY, vel = 0, visible = true;
  document.addEventListener("visibilitychange", () => (visible = !document.hidden));

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    sample();
    const k = 1 - Math.pow(0.002, dt);
    for (const f of FIELDS) state[f] += (target[f] - state[f]) * k;

    // intro pop: elastic scale-in once the page has loaded
    const it = THREE.MathUtils.clamp((performance.now() - introStart) / 1100, 0, 1);
    const pop = reduceMotion ? (it > 0 ? 1 : 0) : (it === 0 ? 0 : 1 - Math.pow(2, -9 * it) * Math.cos(it * 9.5));

    const sy = scrollY;
    vel += (THREE.MathUtils.clamp((sy - lastY) / 30, -2, 2) - vel) * 0.1;
    lastY = sy;
    roll += dt * (reduceMotion ? 0.12 : 0.45) + vel * 0.06;

    const unit = Math.min(HALF_H, halfW * 1.25);
    const R = Math.max(0.0001, state.s * unit * pop);
    const bob = reduceMotion ? 0 : Math.sin(time * 1.6) * 0.04 * R;
    root3.position.set(state.x * halfW, state.y * HALF_H + bob, 0);
    ball.scale.setScalar(R);
    outline.scale.setScalar(1 + 0.045 / Math.max(R, 0.05));
    spinner.rotation.z = -roll;
    spinner.rotation.x = roll * 0.35;

    shadow.position.set(0, -R * 1.18 - bob, -R);
    shadow.scale.set(R * 2.4, R * 0.55, 1);
    shadow.material.opacity = root.dataset.bg ? 0 : 1;

    fUniforms.uTime.value = time;
    fUniforms.uAcc.value = state.acc;
    fUniforms.uR.value = R;
    fUniforms.uFade.value = Math.min(pop, 1);
    spinner.updateMatrixWorld();
    fUniforms.uSpin.value.setFromMatrix4(spinner.matrixWorld).multiplyScalar(1 / R);

    rings.scale.setScalar(R);
    rings.rotation.x = 0.3;
    ringData.forEach((r, i) => {
      r.hl += ((i === activeRing ? 1 : 0) - r.hl) * 0.08;
      const base = state.rings * (i === 0 ? 0.55 : 0.3);
      r.mat.opacity = base + r.hl * state.rings * 0.45;
      r.mat.color.copy(INK).lerp(BLUE, r.hl);
      const a = r.phase + time * r.speed;
      r.sat.position.set(Math.cos(a) * r.R, Math.sin(a) * r.R, 0);
      r.satMat.opacity = r.satLine.opacity = state.rings;
      r.sat.scale.setScalar(1 + r.hl * 0.8);
      r.pivot.rotation.y = time * 0.02 * (i % 2 ? 1 : -1);
    });

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    camera.position.x = pointer.x * 0.25;
    camera.position.y = -pointer.y * 0.18;
    camera.lookAt(0, 0, 0);

    // label that rides next to the ball while it is still small
    const heroP = THREE.MathUtils.clamp(1 - sy / (innerHeight * 0.45), 0, 1);
    tmp.copy(root3.position).project(camera);
    const px = (tmp.x * 0.5 + 0.5) * innerWidth;
    const py = (-tmp.y * 0.5 + 0.5) * innerHeight;
    const rpx = (R / HALF_H) * (innerHeight / 2);
    const tx = isNarrow() ? px - tag.offsetWidth - rpx * 0.6 : px + rpx * 0.75;
    tag.style.transform = `translate(${Math.round(tx)}px, ${Math.round(py - rpx * 1.35)}px)`;
    tag.style.opacity = String(heroP * (it >= 1 ? 1 : 0));

    renderer.render(scene, camera);
  };
  tick();
}
