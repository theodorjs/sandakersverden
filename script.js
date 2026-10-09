/* «Sandakers verden» – stjernehimmel og 3D-jordklode */

/* ---------- Stjernehimmel (inspirert av giana/qbWNYy, men i rolig tempo) ---------- */
(function makeStars() {
  const holder = document.getElementById('stars');
  if (!holder) return;
  const FIELD = 2000;   // høyden på stjernefeltet før det gjentas
  const WIDTH = 2600;
  const layers = [
    { count: 140, size: 1, duration: 540 },
    { count: 60,  size: 2, duration: 400 },
    { count: 28,  size: 3, duration: 280 },
  ];
  for (const layer of layers) {
    const el = document.createElement('div');
    el.className = 'star-layer';
    const shadows = [];
    for (let i = 0; i < layer.count; i++) {
      const x = Math.floor(Math.random() * WIDTH);
      const y = Math.floor(Math.random() * FIELD);
      // hver stjerne dubleres ett felt lenger ned, så driften kan gjentas sømløst
      shadows.push(`${x}px ${y}px #fff`, `${x}px ${y + FIELD}px #fff`);
    }
    el.style.width = el.style.height = layer.size + 'px';
    el.style.boxShadow = shadows.join(',');
    el.style.animationDuration = layer.duration + 's';
    holder.appendChild(el);
  }
})();

/* ---------- Temafilter over ressurskortene ---------- */
(function makeThemeFilter() {
  const row = document.getElementById('tema-filter');
  const status = document.getElementById('filter-status');
  const cards = [...document.querySelectorAll('.grid > .card')];
  if (!row || !cards.length) return;

  // Knappene bygges fra temamerkelappene på kortene, så de aldri kan gli fra hverandre.
  const themes = new Map();      // tema-id -> navn, i den rekkefølgen de først dukker opp
  const cardThemes = new Map();  // kort -> tema-id-ene på kortet
  for (const card of cards) {
    const ids = new Set();
    for (const chip of card.querySelectorAll('.chip.tema')) {
      const id = chip.dataset.tema;
      ids.add(id);
      if (!themes.has(id)) themes.set(id, chip.textContent.trim());
    }
    cardThemes.set(card, ids);
  }

  let active = null;  // null betyr «Alle»

  function makeButton(id, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tema-pille';
    if (id) button.dataset.tema = id;
    button.textContent = label;
    button.addEventListener('click', () => select(active === id ? null : id, true));
    row.appendChild(button);
    return button;
  }

  const buttons = [makeButton(null, 'Alle')];
  for (const [id, label] of themes) buttons.push(makeButton(id, label));

  function select(id, animate) {
    active = id;
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String((button.dataset.tema || null) === id));
    }

    let shown = 0;
    for (const card of cards) {
      const visible = id === null || cardThemes.get(card).has(id);
      card.hidden = !visible;
      if (!visible || !animate) continue;
      card.classList.remove('kort-inn');
      void card.offsetWidth;  // starter animasjonen på nytt
      card.style.animationDelay = `${shown * 45}ms`;
      card.classList.add('kort-inn');
      shown++;
    }

    if (animate) {
      const count = cards.filter((card) => !card.hidden).length;
      status.textContent = id === null
        ? `Viser alle ${count} ressursene`
        : `Viser ${count} ${count === 1 ? 'ressurs' : 'ressurser'} i temaet ${themes.get(id)}`;
    }
  }

  for (const card of cards) {
    card.addEventListener('animationend', (event) => {
      if (event.target !== card) return;
      card.classList.remove('kort-inn');
      card.style.animationDelay = '';
    });
  }

  select(null, false);
  row.hidden = false;
})();

/* ---------- 3D-jordklode ---------- */

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;

init3D().catch((err) => {
  console.warn('3D-jordkloden kunne ikke lastes – viser enkel klode i stedet.', err);
  const fallback = document.getElementById('globe-fallback');
  const canvas = document.getElementById('globe-canvas');
  if (fallback) fallback.hidden = false;
  if (canvas) canvas.remove();
});

async function init3D() {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js');

  const canvas = document.getElementById('globe-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  camera.position.set(0, 0, 5.8);

  // Ved avstand 5.8 og 36° synsfelt dekker bildehøyden 3.769 verdensenheter.
  // Forholdet holder kloden like stor i forhold til klodeboksen uansett lerretsform.
  const VIEW_UNITS = 2 * 5.8 * Math.tan(THREE.MathUtils.degToRad(18));

  // Synlig område ved z = 0, i verdensenheter, med kloden i origo. Fylles i resize().
  const view = { left: -2, right: 2, top: 2, bottom: -2, pxPerUnit: 100 };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  /* --- Teksturer tegnes på canvas, i samme flate stil som resten av siden --- */

  const CONTINENTS = [
    'M55 105 C85 70 175 60 215 90 C255 118 240 150 205 165 C230 175 235 205 205 225 C180 242 150 235 135 215 C110 230 70 220 58 190 C40 160 35 130 55 105 Z',
    'M160 250 C200 240 235 260 238 300 C240 340 215 380 185 392 C160 400 145 380 148 345 C150 310 140 265 160 250 Z',
    'M300 55 C330 42 370 50 375 75 C378 98 350 112 320 108 C295 105 280 70 300 55 Z',
    'M430 100 C460 82 515 84 528 110 C540 132 520 152 488 156 C455 160 415 130 430 100 Z',
    'M425 180 C470 160 545 172 560 215 C575 255 550 310 520 345 C495 373 460 370 445 335 C430 300 400 210 425 180 Z',
    'M565 90 C630 60 760 62 820 100 C865 128 855 175 810 195 C760 215 640 210 595 185 C555 162 535 108 565 90 Z',
    'M630 215 C660 205 690 218 692 250 C694 282 675 310 655 315 C635 318 620 295 622 265 C623 240 615 222 630 215 Z',
    'M820 305 C855 288 905 296 915 325 C925 352 895 372 858 370 C825 368 795 320 820 305 Z',
  ];
  const ISLANDS = [[762, 262, 16], [800, 292, 12], [945, 355, 9], [358, 215, 11]];

  function makeEarthTexture() {
    const c = document.createElement('canvas');
    c.width = 2048; c.height = 1024;
    const g = c.getContext('2d');

    g.fillStyle = '#2a8fe0';
    g.fillRect(0, 0, 2048, 1024);

    g.save();
    g.scale(2.048, 2.048);

    // lyse virvler i havet
    g.fillStyle = 'rgba(140,205,245,.4)';
    const swirls = [
      [330, 335, 48, 9, 0.15], [90, 300, 40, 8, -0.1], [905, 175, 44, 8, 0.12],
      [620, 425, 50, 9, -0.08], [270, 75, 36, 7, 0.1], [760, 395, 36, 7, 0.2],
    ];
    for (const [x, y, rx, ry, rot] of swirls) {
      g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); g.fill();
    }

    // kontinenter
    g.fillStyle = '#57b96b';
    for (const d of CONTINENTS) g.fill(new Path2D(d));
    for (const [x, y, r] of ISLANDS) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }

    // lyse mintfargede høydedrag
    g.fillStyle = 'rgba(190,235,195,.75)';
    const mints = [
      [150, 120, 34, 14], [700, 120, 52, 16], [500, 240, 26, 11],
      [190, 150, 26, 10], [660, 160, 30, 11], [850, 330, 20, 8],
    ];
    for (const [x, y, rx, ry] of mints) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }

    // ørken
    g.fillStyle = 'rgba(232,193,104,.9)';
    g.beginPath(); g.ellipse(480, 215, 34, 16, 0, 0, 7); g.fill();

    g.restore();

    // polare iskapper – tegnes i full bredde så teksturen kan gjentas sømløst
    g.fillStyle = '#eef7ff';
    g.fillRect(0, 0, 2048, 46);
    g.fillRect(0, 978, 2048, 46);
    for (let x = 0; x <= 2048; x += 128) {
      g.beginPath(); g.arc(x, 46, 34, 0, 7); g.fill();
      g.beginPath(); g.arc(x + 64, 978, 34, 0, 7); g.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeCloudTexture() {
    const c = document.createElement('canvas');
    c.width = 2048; c.height = 1024;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,.94)';

    const LOBES = [
      [0, 0, 1], [0.95, -0.18, 0.78], [1.8, 0.08, 0.62],
      [-0.95, -0.15, 0.75], [-1.75, 0.1, 0.6], [0.45, 0.32, 0.85], [-0.5, 0.35, 0.8],
    ];
    function puff(cx, cy, s) {
      g.beginPath();
      for (const [dx, dy, r] of LOBES) {
        g.moveTo(cx + dx * s + r * s, cy + dy * s);
        g.arc(cx + dx * s, cy + dy * s, r * s, 0, 7);
      }
      g.fill();
    }

    const clusters = [
      [280, 300, 58], [760, 210, 50], [1180, 360, 64], [1560, 240, 52],
      [1880, 470, 44], [480, 560, 54], [940, 680, 58], [1380, 800, 52],
      [1750, 600, 44], [200, 780, 46], [640, 880, 38], [150, 430, 40],
    ];
    for (const [x, y, s] of clusters) puff(x, y, s);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeMoonTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#ece2c0';
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#cdbf98';
    const craters = [
      [90, 60, 16], [160, 150, 20], [300, 90, 13], [380, 180, 15],
      [240, 200, 11], [430, 70, 10], [60, 190, 9], [330, 40, 8],
    ];
    for (const [x, y, r] of craters) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeGlowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(128, 128, 86, 128, 128, 122);
    grad.addColorStop(0, 'rgba(105,175,255,.38)');
    grad.addColorStop(1, 'rgba(105,175,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  function makeShadeTexture() {
    // kuleformet skyggelegging som legges som et stille lag foran kloden
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    g.beginPath(); g.arc(256, 256, 254, 0, 7); g.clip();

    const dark = g.createRadialGradient(198, 190, 150, 256, 256, 262);
    dark.addColorStop(0, 'rgba(6,10,36,0)');
    dark.addColorStop(0.55, 'rgba(6,10,36,.05)');
    dark.addColorStop(1, 'rgba(6,10,36,.5)');
    g.fillStyle = dark;
    g.fillRect(0, 0, 512, 512);

    const light = g.createRadialGradient(170, 160, 10, 170, 160, 210);
    light.addColorStop(0, 'rgba(255,255,255,.2)');
    light.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = light;
    g.fillRect(0, 0, 512, 512);

    return new THREE.CanvasTexture(c);
  }

  /* --- Scenen bygges --- */

  // glød bak kloden
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(), transparent: true, depthWrite: false, depthTest: false,
  }));
  glow.scale.set(2.9, 2.9, 1);
  glow.position.set(0, 0, -0.1);
  glow.renderOrder = -1;
  scene.add(glow);

  // jordklode med svak aksehelning
  const earthGroup = new THREE.Group();
  earthGroup.rotation.z = -0.09;
  scene.add(earthGroup);

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshBasicMaterial({ map: makeEarthTexture() })
  );
  earth.rotation.y = 1.2;
  earthGroup.add(earth);

  // skylag som svever et stykke over overflaten
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.07, 48, 48),
    new THREE.MeshBasicMaterial({ map: makeCloudTexture(), transparent: true, depthWrite: false })
  );
  clouds.rotation.y = 2.4;
  clouds.rotation.x = 0.04;
  earthGroup.add(clouds);

  // skyggelegging foran kloden (gir den kuleform uten ekte lyssetting)
  const shade = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeShadeTexture(), transparent: true, depthWrite: false,
  }));
  shade.scale.set(2.16, 2.16, 1);
  shade.position.set(0, 0, 1.2);
  scene.add(shade);

  // månen: går i bane rundt jorda og snurrer samtidig rundt seg selv
  const moonPivot = new THREE.Group();
  moonPivot.rotation.set(0.52, 0, 0.42);
  scene.add(moonPivot);
  const moonAnchor = new THREE.Group();
  moonAnchor.rotation.y = -1.2;
  moonPivot.add(moonAnchor);
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 32, 32),
    new THREE.MeshBasicMaterial({ map: makeMoonTexture() })
  );
  moon.position.set(1.62, 0, 0);
  moonAnchor.add(moon);

  // rakettbane med synlig ring
  const rocketPivot = new THREE.Group();
  rocketPivot.rotation.set(-0.42, 0, -0.3);
  scene.add(rocketPivot);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.008, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;
  rocketPivot.add(ring);

  const rocketAnchor = new THREE.Group();
  rocketAnchor.rotation.y = 2.0;
  rocketPivot.add(rocketAnchor);

  const rocketCanvas = document.createElement('canvas');
  rocketCanvas.width = 160; rocketCanvas.height = 320;
  const rctx = rocketCanvas.getContext('2d');
  const rocketTex = new THREE.CanvasTexture(rocketCanvas);
  rocketTex.colorSpace = THREE.SRGBColorSpace;
  const rocketMat = new THREE.SpriteMaterial({ map: rocketTex, transparent: true });
  const rocket = new THREE.Sprite(rocketMat);
  rocket.scale.set(0.3, 0.6, 1);
  rocket.position.set(1.35, 0, 0);
  rocketAnchor.add(rocket);

  function drawRocket(t) {
    const g = rctx;
    g.clearRect(0, 0, 160, 320);

    // flamme som blafrer (inspirert av krystalcampioni/XKxgoq)
    const len = 58 + 14 * Math.sin(t * 7.3) + 6 * Math.sin(t * 23 + 1.1);
    const wid = 26 + 5 * Math.sin(t * 11 + 1.7);
    const sway = 4 * Math.sin(t * 17);
    g.fillStyle = '#ff9a3d';
    g.beginPath();
    g.moveTo(80 - wid, 192);
    g.quadraticCurveTo(80 - wid * 0.75, 192 + len * 0.6, 80 + sway, 192 + len);
    g.quadraticCurveTo(80 + wid * 0.75, 192 + len * 0.6, 80 + wid, 192);
    g.closePath(); g.fill();
    g.fillStyle = '#ffd257';
    const w2 = wid * 0.55, l2 = len * 0.62;
    g.beginPath();
    g.moveTo(80 - w2, 192);
    g.quadraticCurveTo(80 - w2 * 0.75, 192 + l2 * 0.6, 80 + sway * 0.7, 192 + l2);
    g.quadraticCurveTo(80 + w2 * 0.75, 192 + l2 * 0.6, 80 + w2, 192);
    g.closePath(); g.fill();

    // dyse
    g.fillStyle = '#3d3357';
    g.beginPath();
    g.moveTo(62, 176); g.lineTo(98, 176); g.lineTo(90, 196); g.lineTo(70, 196);
    g.closePath(); g.fill();

    // finner
    g.fillStyle = '#ff6b6b';
    g.beginPath(); g.moveTo(58, 132); g.lineTo(24, 204); g.lineTo(58, 184); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(102, 132); g.lineTo(136, 204); g.lineTo(102, 184); g.closePath(); g.fill();

    // kropp
    g.fillStyle = '#eef2ff';
    g.beginPath();
    g.moveTo(80, 16);
    g.bezierCurveTo(106, 42, 112, 92, 106, 138);
    g.bezierCurveTo(103, 162, 99, 176, 95, 182);
    g.lineTo(65, 182);
    g.bezierCurveTo(61, 176, 57, 162, 54, 138);
    g.bezierCurveTo(48, 92, 54, 42, 80, 16);
    g.closePath(); g.fill();

    // nesekjegle
    g.fillStyle = '#ff6b6b';
    g.beginPath();
    g.moveTo(80, 16);
    g.bezierCurveTo(96, 33, 103, 54, 104, 72);
    g.lineTo(56, 72);
    g.bezierCurveTo(57, 54, 64, 33, 80, 16);
    g.closePath(); g.fill();

    // vindu
    g.fillStyle = '#bcd2e8'; g.beginPath(); g.arc(80, 116, 21, 0, 7); g.fill();
    g.fillStyle = '#29d3c6'; g.beginPath(); g.arc(80, 116, 15, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(74, 110, 4.5, 0, 7); g.fill();
  }

  // raketten roteres så nesen alltid peker dit den flyr (målt i skjermplan)
  const _p1 = new THREE.Vector3();
  const _p2 = new THREE.Vector3();
  function aimRocket() {
    rocket.getWorldPosition(_p1).project(camera);
    const a = rocketAnchor.rotation.y;
    rocketAnchor.rotation.y = a + 0.03;
    rocket.getWorldPosition(_p2).project(camera);
    rocketAnchor.rotation.y = a;
    rocketAnchor.updateWorldMatrix(true, true);
    const dx = _p2.x - _p1.x, dy = _p2.y - _p1.y;
    if (dx * dx + dy * dy > 1e-12) rocketMat.rotation = Math.atan2(dy, dx) - Math.PI / 2;
  }

  /* --- UFO med liten grønn alien --- */

  const ufoCanvas = document.createElement('canvas');
  ufoCanvas.width = 256; ufoCanvas.height = 160;
  const uctx = ufoCanvas.getContext('2d');
  const ufoTex = new THREE.CanvasTexture(ufoCanvas);
  ufoTex.colorSpace = THREE.SRGBColorSpace;
  const ufoMat = new THREE.SpriteMaterial({ map: ufoTex, transparent: true });
  const ufo = new THREE.Sprite(ufoMat);
  ufo.scale.set(0.42, 0.2625, 1);
  ufo.position.set(-2.8, 1.6, 0.8);
  scene.add(ufo);

  function drawUfo(t) {
    const g = uctx;
    g.clearRect(0, 0, 256, 160);

    // glasskuppel
    g.fillStyle = '#aee0f7';
    g.beginPath(); g.arc(128, 80, 46, Math.PI, 0); g.closePath(); g.fill();

    // romvesenet dupper rolig opp og ned
    const bob = 2 * Math.sin(t * 2.2);
    g.strokeStyle = '#57b96b'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(128, 46 + bob); g.lineTo(128, 41 + bob); g.stroke();
    g.fillStyle = '#6fce6f';
    g.beginPath(); g.arc(128, 38 + bob, 4, 0, 7); g.fill();
    g.beginPath(); g.ellipse(128, 58 + bob, 15, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#163021';
    g.beginPath(); g.ellipse(121.5, 57 + bob, 3.6, 5.4, -0.15, 0, 7); g.fill();
    g.beginPath(); g.ellipse(134.5, 57 + bob, 3.6, 5.4, 0.15, 0, 7); g.fill();

    // glans i glasset
    g.fillStyle = 'rgba(255,255,255,.35)';
    g.beginPath(); g.ellipse(108, 52, 14, 8, -0.5, 0, 7); g.fill();

    // rød antenne
    g.strokeStyle = '#8f979f'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(163, 49); g.lineTo(172, 26); g.stroke();
    g.fillStyle = '#e6483d';
    g.beginPath(); g.arc(173, 22, 5.5, 0, 7); g.fill();

    // underside og topp-tallerken
    g.fillStyle = '#8b939c';
    g.beginPath(); g.ellipse(128, 108, 112, 30, 0, 0, 7); g.fill();
    g.fillStyle = '#c6cbd2';
    g.beginPath(); g.ellipse(128, 94, 112, 30, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.beginPath(); g.ellipse(84, 84, 52, 12, -0.12, 0, 7); g.fill();

    // lys langs kanten som blinker etter tur
    const lights = [[36, 111], [80, 121], [128, 124], [176, 121], [220, 111]];
    const on = ((Math.floor(t * 3.5) % lights.length) + lights.length) % lights.length;
    lights.forEach(([x, y], i) => {
      if (i === on) {
        g.fillStyle = 'rgba(255,220,120,.45)';
        g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill();
      }
      g.fillStyle = i === on ? '#ffd257' : '#e09c32';
      g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
    });
  }

  // UFO-en veksler mellom å sirkle rundt jorda, sirkle rundt månen,
  // og stikke av ut av bildet for så å komme tilbake fra en annen kant.
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function newUfoMode(noLeave) {
    const roll = Math.random();
    if (!noLeave && roll > 0.68) {
      // fly ut forbi den virkelige vinduskanten
      const toLeft = Math.random() < 0.5;
      return {
        name: 'leave', t: 0,
        exit: new THREE.Vector3(
          toLeft ? view.left - 1.6 : view.right + 1.6,
          rnd(view.bottom * 0.5, view.top * 0.8),
          rnd(0.4, 1.2)
        ),
      };
    }
    if (roll < 0.5) {
      return {
        name: 'orbitEarth', t: 0, until: rnd(7, 14),
        dir: pick([-1, 1]), r: rnd(1.42, 1.6), phase: rnd(0, 6.28), lift: rnd(0.25, 0.5),
      };
    }
    return {
      name: 'orbitMoon', t: 0, until: rnd(6, 11),
      dir: pick([-1, 1]), r: rnd(0.32, 0.42), phase: rnd(0, 6.28),
    };
  }

  let ufoMode = newUfoMode(true);
  const ufoVel = new THREE.Vector3();
  const ufoTarget = new THREE.Vector3();
  const _steer = new THREE.Vector3();
  const _moonPos = new THREE.Vector3();
  const _ufoNdc = new THREE.Vector3();

  function stepUfo(dt, t) {
    const m = ufoMode;
    m.t += dt;

    if (m.name === 'orbitEarth') {
      const a = m.phase + m.dir * 0.55 * m.t;
      ufoTarget.set(
        m.r * Math.cos(a),
        m.lift * Math.sin(a * 1.7 + m.phase),
        m.r * Math.sin(a)
      );
      if (m.t > m.until) ufoMode = newUfoMode(false);
    } else if (m.name === 'orbitMoon') {
      moon.getWorldPosition(_moonPos);
      const a = m.phase + m.dir * 1.7 * m.t;
      ufoTarget.set(
        _moonPos.x + m.r * Math.cos(a),
        _moonPos.y + m.r * 0.6 * Math.sin(a * 1.3),
        _moonPos.z + m.r * Math.sin(a)
      );
      if (m.t > m.until) ufoMode = newUfoMode(false);
    } else if (m.name === 'leave') {
      ufoTarget.copy(m.exit);
      _ufoNdc.copy(ufo.position).project(camera);
      if (Math.abs(_ufoNdc.x) > 1.12 || Math.abs(_ufoNdc.y) > 1.12 || m.t > 16) {
        // vent litt utenfor vinduet, og kom inn igjen fra en annen kant
        const side = Math.floor(rnd(0, 3));
        const px = side === 0 ? view.left - 1.2
                 : side === 1 ? view.right + 1.2
                 : rnd(view.left * 0.5, view.right * 0.5);
        const py = side === 2 ? view.top + 1.2 : rnd(view.bottom * 0.4, view.top * 0.7);
        ufo.position.set(px, py, rnd(0.4, 1.4));
        ufoVel.set(0, 0, 0);
        ufoMode = { name: 'hidden', t: 0, until: rnd(1.5, 4) };
      }
    } else { // hidden
      ufoTarget.copy(ufo.position);
      if (m.t > m.until) ufoMode = newUfoMode(true);
    }

    // levende småbevegelser oppå banen
    ufoTarget.x += 0.1 * Math.sin(t * 2.9);
    ufoTarget.y += 0.08 * Math.sin(t * 3.7 + 1);

    // myk styring mot målet – litt mer fart når den stikker av
    const K = 3.2, DAMP = 2.4, MAX = m.name === 'leave' ? 2.8 : 1.7;
    _steer.subVectors(ufoTarget, ufo.position);
    ufoVel.addScaledVector(_steer, K * dt);
    ufoVel.multiplyScalar(Math.max(0, 1 - DAMP * dt));
    if (ufoVel.length() > MAX) ufoVel.setLength(MAX);
    ufo.position.addScaledVector(ufoVel, dt);

    // kreng i fartsretningen, med et lite vipp
    ufoMat.rotation = Math.max(-0.4, Math.min(0.4, -ufoVel.x * 0.18)) + 0.05 * Math.sin(t * 4.6);

    // ton ut helt ytterst ved vinduskanten i stedet for å klippes brått
    _ufoNdc.copy(ufo.position).project(camera);
    const edge = Math.max(Math.abs(_ufoNdc.x), Math.abs(_ufoNdc.y));
    ufoMat.opacity = Math.max(0, Math.min(1, (1.08 - edge) / 0.14));
  }

  /* --- Størrelse, synlighet og animasjon --- */

  const stage = canvas.parentElement;                      // dekker hele heroen
  const globeBox = document.querySelector('.globe-scene'); // der kloden skal stå

  function resize() {
    const W = Math.max(1, stage.clientWidth);
    const H = Math.max(1, stage.clientHeight);
    const stageRect = stage.getBoundingClientRect();
    const boxRect = globeBox.getBoundingClientRect();
    const S = Math.max(1, boxRect.width);
    const cx = boxRect.left - stageRect.left + boxRect.width / 2;
    const cy = boxRect.top - stageRect.top + boxRect.height / 2;

    // Lerretet er et utsnitt av et større, klode-sentrert bilde. Da blir kloden
    // stående midt i klodeboksen og helt rund, mens scenen rundt dekker hele heroen.
    const fullW = 2 * Math.max(cx, W - cx);
    const fullH = 2 * Math.max(cy, H - cy);

    camera.aspect = fullW / fullH;
    camera.position.z = 5.8 * fullH / S;
    camera.setViewOffset(fullW, fullH, fullW / 2 - cx, fullH / 2 - cy, W, H);
    camera.updateProjectionMatrix();

    renderer.setSize(W, H, false);

    view.pxPerUnit = S / VIEW_UNITS;
    view.left = -cx / view.pxPerUnit;
    view.right = (W - cx) / view.pxPerUnit;
    view.top = cy / view.pxPerUnit;
    view.bottom = -(H - cy) / view.pxPerUnit;

    if (REDUCED_MOTION) renderOnce();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resizeObserver.observe(globeBox);
  resize();

  function renderOnce() {
    drawRocket(0);
    rocketTex.needsUpdate = true;
    aimRocket();
    ufo.position.set(-1.5, 1.05, 0.6);
    ufoMat.opacity = 1;
    drawUfo(0);
    ufoTex.needsUpdate = true;
    renderer.render(scene, camera);
  }

  // lite håndtak for feilsøking i konsollen
  window.__sv = { earth, clouds, moon, moonAnchor, rocketAnchor, drawRocket, rocketTex, aimRocket, ufo, ufoMat, ufoTex, drawUfo, stepUfo, view, camera, render: () => renderer.render(scene, camera) };

  if (REDUCED_MOTION) {
    renderOnce();
    return;
  }

  let inView = true;
  new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; }).observe(stage);

  const clock = new THREE.Clock();
  const SPEED = {
    earth: 0.075,   // ca. 84 s per omdreining
    clouds: 0.115,  // skyene driver litt raskere enn kloden
    moonOrbit: 0.16,
    moonSpin: 0.55,
    rocket: 0.22,   // ca. 29 s per runde
  };

  function frame() {
    requestAnimationFrame(frame);
    if (!inView) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    earth.rotation.y += SPEED.earth * dt;
    clouds.rotation.y += SPEED.clouds * dt;
    moonAnchor.rotation.y += SPEED.moonOrbit * dt;
    moon.rotation.y += SPEED.moonSpin * dt;
    rocketAnchor.rotation.y += SPEED.rocket * dt;

    stepUfo(dt, t);

    drawRocket(t);
    rocketTex.needsUpdate = true;
    drawUfo(t);
    ufoTex.needsUpdate = true;
    aimRocket();

    renderer.render(scene, camera);
  }
  frame();
}
