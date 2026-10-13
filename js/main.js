import * as THREE from "three";

const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.getElementById("year").textContent = new Date().getFullYear();

/* ════════════════ Intro (same choreography as upforgeconsulting.com) ════════════════
   The headline card starts centred and scaled up, settles with a small wobble,
   glides back into its bento slot, then the nav drops and the other cards rise. */
(function intro() {
  const headline = document.querySelector(".card-headline");
  const finish = () => { root.classList.add("intro-done", "nav-in", "hero-in"); root.classList.remove("intro-lock"); };
  if (root.classList.contains("intro-lock")) window.scrollTo(0, 0);

  function start() {
    if (!root.classList.contains("hero-anim") || !headline || !headline.animate || root.classList.contains("hero-in")) { finish(); return; }
    const r = headline.getBoundingClientRect();
    const vw = innerWidth, vh = innerHeight;
    const dx = vw / 2 - (r.left + r.width / 2);
    const dy = vh / 2 - (r.top + r.height / 2);
    const big = vw <= 768
      ? Math.max(1, Math.min(1.1, (vw - 8) / r.width, (vh * 0.8) / r.height))
      : Math.min(1.5, (vw * 0.92) / r.width, (vh * 0.86) / r.height);
    const at = (x, y, s, rot) => `translate(${x}px,${y}px) scale(${s}) rotate(${rot}deg)`;
    const glide = "cubic-bezier(0.16, 1, 0.3, 1)";
    const soft = "cubic-bezier(0.45, 0, 0.55, 1)";
    const anim = headline.animate([
      { offset: 0, opacity: 0, transform: at(dx, dy + 34, big * 0.95, -2), easing: glide },
      { offset: 0.2, opacity: 1, transform: at(dx, dy - 5, big, 0.9), easing: soft },
      { offset: 0.27, transform: at(dx, dy + 2, big, -0.4), easing: soft },
      { offset: 0.33, transform: at(dx, dy, big, 0), easing: "cubic-bezier(0.7, 0, 0.2, 1)" },
      { offset: 0.52, transform: at(dx, dy, 0.97, -0.7), easing: soft },
      { offset: 0.58, transform: at(dx, dy, 1.012, 0.35), easing: soft },
      { offset: 0.63, transform: at(dx, dy, 1, 0), easing: "cubic-bezier(0.65, 0, 0.25, 1)" },
      { offset: 0.9, transform: at(-3, 4, 1, -0.5), easing: soft },
      { offset: 0.96, transform: at(1, -1, 1, 0.15), easing: soft },
      { offset: 1, opacity: 1, transform: at(0, 0, 1, 0) },
    ], { duration: 3000, fill: "forwards" });
    setTimeout(() => root.classList.add("nav-in"), 2000);
    anim.onfinish = () => { root.classList.add("intro-done"); anim.cancel(); root.classList.add("hero-in"); root.classList.remove("intro-lock"); };
  }
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).then(start);
  else start();
})();

/* ════════════════ Client logos ════════════════ */
const TOP = [
  ["Apple", "apple"], ["Emergent", "emergent"], ["Wispr Flow", "wisprflow"],
  ["OpenAI", "openai"], ["Replit", "replit"], ["Gamma", "gamma"],
];
const ROW_A = [
  ["Higgsfield", "higgsfield"], ["Amazon", "amazon"], ["Disney+ Hotstar", "hotstar"], ["Swiggy", "swiggy"],
  ["Zomato", "zomato"], ["Zepto", "zepto"], ["Flipkart", "flipkart"], ["Air India", "airindia"],
  ["HP", "hp"], ["Paytm", "paytm"], ["PhonePe", "phonepe"], ["Razorpay", "razorpay"], ["CRED", "cred"],
  ["MakeMyTrip", "makemytrip"], ["Groww", "groww"], ["Rephrase.ai", "rephraseai"],
];
const ROW_B = [
  ["Estée Lauder", "esteelauder"], ["Clinique", "clinique"], ["M·A·C", "mac"], ["The Ordinary", "theordinary"],
  ["Warner Music Group", "warnermusic"], ["Tata Communications", "tatacommunications"], ["boAt", "boat"],
  ["ACKO", "acko"], ["Godrej Properties", "godrej"], ["HDFC Life", "hdfclife"], ["Unacademy", "unacademy"],
  ["InMobi", "inmobi"], ["ShareChat", "sharechat"], ["Licious", "licious"], ["Manyavar", "manyavar"],
  ["Buy Me a Coffee", "buymeacoffee"], ["Quizizz", "quizizz"], ["smallcase", "smallcase"], ["Glance", "glance"],
];

function logoEl([name, slug], files) {
  const span = document.createElement("span");
  const f = files.get(slug);
  if (!f) {
    span.className = "logo";
    span.innerHTML = `<span class="logo-name"></span>`;
    span.firstChild.textContent = name;
    return span;
  }
  span.className = `logo ${f.kind === "symbol" ? "symbol" : ""}`;
  const img = new Image();
  img.src = `assets/logos/${f.file}`;
  img.alt = name;
  img.loading = "lazy";
  img.decoding = "async";
  img.onerror = () => { span.innerHTML = ""; const t = document.createElement("span"); t.className = "logo-name"; t.textContent = name; span.append(t); };
  span.append(img);
  // a bare symbol isn't recognisable for every brand, so name it alongside
  if (f.kind === "symbol" && !["apple", "openai"].includes(slug)) {
    const t = document.createElement("span"); t.className = "logo-name"; t.textContent = name; span.append(t);
  }
  return span;
}

async function renderLogos() {
  let files = new Map();
  try {
    const res = await fetch("assets/logos/manifest.json", { cache: "no-cache" });
    if (res.ok) (await res.json()).forEach((f) => files.set(f.file.replace(/\.svg$/, ""), f));
  } catch (e) { /* fall back to typeset names */ }

  const top = document.getElementById("logo-top");
  TOP.forEach((b) => { const li = document.createElement("li"); li.append(logoEl(b, files)); top.append(li); });

  for (const [id, list] of [["logo-row-a", ROW_A], ["logo-row-b", ROW_B]]) {
    const row = document.getElementById(id);
    // two copies so the loop is seamless; the copy is hidden from screen readers
    [0, 1].forEach((copy) => list.forEach((b) => {
      const li = document.createElement("li");
      if (copy) li.setAttribute("aria-hidden", "true");
      li.append(logoEl(b, files));
      row.append(li);
    }));
  }

  document.querySelectorAll("[data-logo]").forEach((li) => {
    const slug = li.dataset.logo;
    const name = li.textContent.trim();
    li.textContent = "";
    li.append(logoEl([name, slug], files));
  });
}
renderLogos();

/* ════════════════ Reveal + counters ════════════════ */
document.querySelectorAll(".service-grid, .reel-grid, .case-grid, .steps, .principles, .stats, .order-list").forEach((g) => {
  [...g.querySelectorAll(".reveal")].forEach((el, i) => el.style.setProperty("--rd", `${Math.min(i, 6) * 0.07}s`));
});

function countUp(el) {
  const end = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.decimals || "0", 10);
  if (reduceMotion) return;
  const t0 = performance.now(), dur = 1600;
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
    e.target.querySelectorAll?.("[data-count]").forEach(countUp);
    io.unobserve(e.target);
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ════════════════ Cartoon snowball ════════════════ */
function lumpyBall() {
  const geo = new THREE.IcosahedronGeometry(1, 7);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const n = Math.sin(v.x * 5.1 + 1.3) * Math.sin(v.y * 4.3 + 0.7) * Math.sin(v.z * 5.7 + 2.1)
            + 0.5 * Math.sin(v.x * 11.0 + v.z * 7.0) * Math.sin(v.y * 9.0);
    v.multiplyScalar(1 + n * 0.028);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

const toonMaterial = () => new THREE.ShaderMaterial({
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
      float d = dot(normalize(vN), uLight);
      vec3 white = vec3(1.0);
      vec3 mid   = vec3(0.886, 0.918, 1.0);   // #e2eaff
      vec3 shade = vec3(0.737, 0.800, 0.973); // #bcccf8
      vec3 col = d > 0.42 ? white : (d > -0.12 ? mid : shade);
      // a few soft snow clumps, fixed to the ball so you can see it roll
      float clump = sin(vObj.x * 6.0) * sin(vObj.y * 5.0 + 1.0) * sin(vObj.z * 6.5 + 2.0);
      col = mix(col, col * vec3(0.93, 0.95, 1.0), step(0.28, clump));
      // glossy cartoon highlight
      vec3 h = normalize(uLight + vView);
      float spec = pow(max(dot(normalize(vN), h), 0.0), 60.0);
      col = mix(col, vec3(1.0), step(0.6, spec));
      gl_FragColor = vec4(col, 1.0);
    }`,
});

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(29,53,147,0.32)");
  grd.addColorStop(0.55, "rgba(29,53,147,0.12)");
  grd.addColorStop(1, "rgba(29,53,147,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/**
 * mode "hero": the ball hops and rolls in place and grows as you scroll the page.
 * mode "cta":  a big ball rises from the bottom of the closing section.
 */
function createSnowball(canvas, mode) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.4, 8);
  camera.lookAt(0, 0, 0);

  const geo = lumpyBall();
  const ball = new THREE.Group();
  const body = new THREE.Mesh(geo, toonMaterial());
  const outline = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0a1330, side: THREE.BackSide }));
  outline.scale.setScalar(1.04);
  const spinner = new THREE.Group();
  spinner.add(body, outline);
  ball.add(spinner);
  scene.add(ball);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  // a few loose flakes that orbit lazily
  const flakes = [];
  const flakeGeo = new THREE.CircleGeometry(0.05, 16);
  const flakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const flakeLine = new THREE.MeshBasicMaterial({ color: 0x0a1330 });
  if (mode === "hero") {
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Group();
      const dot = new THREE.Mesh(flakeGeo, flakeMat);
      const ring = new THREE.Mesh(new THREE.CircleGeometry(0.068, 16), flakeLine);
      ring.position.z = -0.001;
      f.add(ring, dot);
      f.userData = { a: (i / 5) * Math.PI * 2, r: 1.55 + (i % 2) * 0.35, y: -0.2 + i * 0.22, s: 0.6 + i * 0.12 };
      scene.add(f);
      flakes.push(f);
    }
  }

  let visible = true, w = 1, h = 1;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const pointer = { x: 0, tx: 0 };
  addEventListener("pointermove", (e) => { pointer.tx = (e.clientX / innerWidth - 0.5) * 2; }, { passive: true });

  let lastY = scrollY, roll = 0, vel = 0;
  const clock = new THREE.Clock();

  const tick = () => {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    const t = clock.elapsedTime;

    const sy = scrollY;
    const dy = sy - lastY;
    lastY = sy;
    vel += (THREE.MathUtils.clamp(dy / 40, -1.5, 1.5) - vel) * 0.12;
    roll += dt * (reduceMotion ? 0.15 : 0.6) + vel * 0.18;
    pointer.x += (pointer.tx - pointer.x) * 0.05;

    const narrow = w / h < 1.1;
    if (mode === "hero") {
      const doc = document.documentElement.scrollHeight - innerHeight;
      const grow = 1 + Math.min(sy / Math.max(doc, 1), 1) * 0.35;
      const base = (narrow ? 0.72 : 1.05) * grow;
      const floor = narrow ? 0.3 : -0.15;
      // cartoon hop: |sin| bounce with squash on landing
      const hop = reduceMotion ? 0 : Math.abs(Math.sin(t * 2.4));
      const squash = reduceMotion ? 1 : 1 - Math.pow(1 - hop, 6) * 0.12;
      const lift = hop * 0.28;
      ball.position.set(narrow ? 0.4 : 0.35 + pointer.x * 0.12, floor + lift * base, 0);
      ball.scale.set(base * (2 - squash), base * squash, base * (2 - squash));
      shadow.position.set(ball.position.x, floor - base * 1.02, 0);
      shadow.scale.set(base * 2.6 * (1.1 - hop * 0.25), base * 1.1, 1);
      flakes.forEach((f) => {
        const u = f.userData;
        const a = u.a + t * 0.35 * u.s;
        f.position.set(ball.position.x + Math.cos(a) * u.r * base, u.y + Math.sin(t * u.s + u.a) * 0.15, Math.sin(a) * u.r * 0.6);
        f.scale.setScalar(Math.sin(a) > 0 ? 1 : 0.7);
        f.lookAt(camera.position);
      });
    } else {
      const base = narrow ? 1.25 : 1.9;
      ball.position.set(pointer.x * 0.15, -2.2, 0);
      ball.scale.setScalar(base);
      shadow.visible = false;
    }
    spinner.rotation.z = -roll;
    spinner.rotation.x = roll * 0.35;
    renderer.render(scene, camera);
  };
  tick();
}

const heroCanvas = document.getElementById("snow-hero");
const ctaCanvas = document.getElementById("snow-cta");
if (heroCanvas) createSnowball(heroCanvas, "hero");
if (ctaCanvas) createSnowball(ctaCanvas, "cta");
